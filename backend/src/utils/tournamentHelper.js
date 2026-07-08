const prisma = require('../prismaClient');

/**
 * Đồng bộ trạng thái thực tế của các giải đấu:
 * 1. Nếu đã qua ngày kết thúc (ngayketthuc < today) -> Kết thúc
 * 2. Nếu đã thi đấu tới chung kết và có kết quả (Khối KnockOut / KnockOut sau vòng tròn) -> Kết thúc
 * 3. Nếu thi đấu vòng tròn (RoundRobin) và tất cả trận đấu đã xong -> Kết thúc
 * 4. Nếu tới ngày bắt đầu -> Đang diễn ra
 */
async function syncTournamentStatuses() {
  try {
    const activeTournaments = await prisma.giaiDau.findMany({
      where: {
        trangthai: { notIn: ['Kết thúc', 'Đã hủy'] },
      },
      include: {
        ketQuas: true,
      },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const t of activeTournaments) {
      let nextStatus = t.trangthai;

      // 1. Kiểm tra ngày hết hạn (ngayketthuc < today)
      if (t.ngayketthuc) {
        const end = new Date(t.ngayketthuc);
        const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        if (today > endDay) {
          nextStatus = 'Kết thúc';
        }
      }

      // 2. Nếu chưa hết hạn theo ngày, kiểm tra tiến trình thi đấu
      if (nextStatus !== 'Kết thúc' && t.ketQuas && t.ketQuas.length > 0) {
        const hinhThuc = t.hinhthuc || 'KnockOut';

        if (hinhThuc === 'RoundRobin') {
          // Thi đấu vòng tròn thuần: Tất cả trận đã có kết quả thì kết thúc giải
          if (t.ketQuas.every(m => m.id_thang !== null)) {
            nextStatus = 'Kết thúc';
          }
        } else {
          // KnockOut hoặc RoundRobinAndKnockout: Vòng cuối cùng chỉ có 1 trận (Chung kết) và đã có người thắng -> Kết thúc
          const roundNums = t.ketQuas
            .map(m => parseInt(m.vong, 10))
            .filter(n => !isNaN(n));

          if (roundNums.length > 0) {
            const maxRound = Math.max(...roundNums);
            const latestMatches = t.ketQuas.filter(m => parseInt(m.vong, 10) === maxRound);

            if (latestMatches.length === 1 && latestMatches[0].id_thang !== null) {
              nextStatus = 'Kết thúc';
            }
          }
        }
      }

      // 3. Nếu giải chưa kết thúc, kiểm tra ngày bắt đầu để cập nhật từ Sắp diễn ra -> Đang diễn ra
      if (nextStatus !== 'Kết thúc') {
        if (t.ngaybatdau) {
          const start = new Date(t.ngaybatdau);
          const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          if (today < startDay) {
            // Nếu chưa tới ngày mà đã tạo lịch thi đấu thì vẫn là Đang diễn ra
            if (t.ketQuas && t.ketQuas.length > 0) {
              nextStatus = 'Đang diễn ra';
            } else {
              nextStatus = 'Sắp diễn ra';
            }
          } else {
            // Đã tới hoặc qua ngày bắt đầu -> Đang diễn ra
            nextStatus = 'Đang diễn ra';
          }
        } else if (t.ketQuas && t.ketQuas.length > 0) {
          nextStatus = 'Đang diễn ra';
        }
      }

      // 4. Cập nhật vào DB nếu có sự thay đổi
      if (nextStatus !== t.trangthai) {
        await prisma.giaiDau.update({
          where: { id_giaidau: t.id_giaidau },
          data: { trangthai: nextStatus },
        });
        console.log(`[TournamentSync] Đồng bộ giải đấu "${t.tengiai}" (${t.id_giaidau}): ${t.trangthai} -> ${nextStatus}`);
      }
    }
  } catch (err) {
    console.error('[TournamentSync] Lỗi đồng bộ trạng thái giải đấu:', err);
  }
}

module.exports = {
  syncTournamentStatuses,
};

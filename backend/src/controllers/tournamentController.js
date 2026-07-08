const prisma = require('../prismaClient');
const {
  mapGiaiDau,
  mapDangKyGiai,
  mapKetQuaAsTran,
  mapTrangThaiGiaiToDb,
} = require('../utils/csdlMapper');
const { sendEmail } = require('../utils/emailService');
const { syncTournamentStatuses } = require('../utils/tournamentHelper');

exports.getAll = async (req, res) => {
  try {
    await syncTournamentStatuses();
    const { status } = req.query;
    const where = status ? { trangthai: mapTrangThaiGiaiToDb(status) } : {};
    const data = await prisma.giaiDau.findMany({
      where,
      include: {
        dangKys: { include: { vanDongVien: true } },
      },
      orderBy: { ngaybatdau: 'desc' },
    });
    res.json(data.map(mapGiaiDau));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.create = async (req, res) => {
  try {
    const { TenGiaiDau, NgayBatDau, NgayKetThuc, LePhi, MoTa, SoLuongToiDa, HinhThuc, SoVaoDauKnockOut } = req.body;
    if (!TenGiaiDau || !NgayBatDau || !NgayKetThuc) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    const data = await prisma.giaiDau.create({
      data: {
        tengiai: TenGiaiDau,
        ngaybatdau: new Date(NgayBatDau),
        ngayketthuc: new Date(NgayKetThuc),
        lephi: parseFloat(LePhi) || 0,
        thele: MoTa || null,
        soluongtoida: parseInt(SoLuongToiDa) || 32,
        hinhthuc: HinhThuc || 'KnockOut',
        sovaodauknockout: parseInt(SoVaoDauKnockOut) || 4,
        trangthai: 'Sắp diễn ra',
        id_nguoitochuc: req.user?.userId || null,
      },
    });

    await prisma.thongBao.create({
      data: {
        tieude: 'Giải đấu mới',
        noidung: `Ban tổ chức vừa tạo giải đấu mới: "${TenGiaiDau}". Hãy nhanh tay đăng ký!`,
        loai: 'global',
        link: '/tournaments'
      }
    });

    res.status(201).json(mapGiaiDau({ ...data, dangKys: [] }));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo giải đấu' });
  }
};

exports.update = async (req, res) => {
  try {
    const { TenGiaiDau, NgayBatDau, NgayKetThuc, LePhi, MoTa, TrangThai, SoLuongToiDa, HinhThuc, SoVaoDauKnockOut } = req.body;
    const data = await prisma.giaiDau.update({
      where: { id_giaidau: req.params.id },
      data: {
        ...(TenGiaiDau && { tengiai: TenGiaiDau }),
        ...(NgayBatDau && { ngaybatdau: new Date(NgayBatDau) }),
        ...(NgayKetThuc && { ngayketthuc: new Date(NgayKetThuc) }),
        ...(LePhi !== undefined && { lephi: parseFloat(LePhi) }),
        ...(MoTa !== undefined && { thele: MoTa }),
        ...(SoLuongToiDa !== undefined && { soluongtoida: parseInt(SoLuongToiDa) }),
        ...(HinhThuc !== undefined && { hinhthuc: HinhThuc }),
        ...(SoVaoDauKnockOut !== undefined && { sovaodauknockout: parseInt(SoVaoDauKnockOut) }),
        ...(TrangThai && { trangthai: mapTrangThaiGiaiToDb(TrangThai) }),
      },
      include: { dangKys: { include: { vanDongVien: true } } },
    });
    res.json(mapGiaiDau(data));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật' });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.ketQuaTd.deleteMany({ where: { id_giaidau: req.params.id } });
    await prisma.dkGiaiDau.deleteMany({ where: { id_giaidau: req.params.id } });
    await prisma.giaiDau.delete({ where: { id_giaidau: req.params.id } });
    res.json({ message: 'Đã xóa giải đấu' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa giải đấu' });
  }
};

exports.register = async (req, res) => {
  try {
    const tournament = await prisma.giaiDau.findUnique({
      where: { id_giaidau: req.params.id },
      include: { dangKys: true },
    });
    if (!tournament) return res.status(404).json({ error: 'Không tìm thấy giải đấu' });
    if (tournament.trangthai === 'Kết thúc') {
      return res.status(400).json({ error: 'Giải đấu đã kết thúc' });
    }

    const existing = await prisma.dkGiaiDau.findFirst({
      where: {
        id_vadv: req.user.userId,
        id_giaidau: req.params.id,
        trangthai: { not: 'Đã hủy' },
      },
    });
    if (existing) return res.status(409).json({ error: 'Bạn đã đăng ký giải đấu này rồi' });

    const dk = await prisma.dkGiaiDau.create({
      data: { id_vadv: req.user.userId, id_giaidau: req.params.id },
      include: { vanDongVien: true },
    });
    
    await prisma.thongBao.create({
      data: {
        tieude: 'Đăng ký giải đấu mới',
        noidung: `${req.user.hoTen || 'Một thành viên'} vừa đăng ký giải ${tournament.tengiai}`,
        loai: 'tournament',
        id_lienket: tournament.id_giaidau,
        link: '/admin/tournaments'
      }
    });

    if (req.user.email) {
      sendEmail(
        req.user.email, 
        'Đăng ký giải đấu thành công - Cầu Lông 84', 
        `<h3>Xin chào ${req.user.hoTen || 'bạn'},</h3><p>Bạn đã gửi yêu cầu đăng ký tham gia giải đấu <strong>${tournament.tengiai}</strong>.</p><p>Trạng thái hiện tại: <strong>Chờ xác nhận</strong>.</p><p>Vui lòng chờ Ban tổ chức duyệt yêu cầu của bạn!</p>`
      );
    }

    res.status(201).json(mapDangKyGiai(dk));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi đăng ký' });
  }
};

exports.unregister = async (req, res) => {
  try {
    await prisma.dkGiaiDau.updateMany({
      where: { id_vadv: req.user.userId, id_giaidau: req.params.id },
      data: { trangthai: 'Đã hủy' },
    });

    const tournament = await prisma.giaiDau.findUnique({ where: { id_giaidau: req.params.id } });
    if (tournament) {
      await prisma.thongBao.create({
        data: {
          tieude: 'Hủy đăng ký giải đấu',
          noidung: `${req.user.hoTen || 'Một thành viên'} vừa hủy đăng ký giải ${tournament.tengiai}`,
          loai: 'tournament_cancel',
          id_lienket: tournament.id_giaidau,
          link: '/admin/tournaments'
        }
      });
    }

    res.json({ message: 'Đã hủy đăng ký' });
  } catch (err) {
    console.error('Error in unregister:', err);
    res.status(500).json({ error: 'Lỗi hủy đăng ký' });
  }
};

exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { trangthai } = req.body;
    const dbTrangThai = trangthai === 'DaXacNhan' ? 'Đã xác nhận' : trangthai === 'DaHuy' ? 'Đã hủy' : 'Chờ xác nhận';
    const dk = await prisma.dkGiaiDau.update({
      where: { id_dkgiai: req.params.regId },
      data: { trangthai: dbTrangThai },
      include: { vanDongVien: true }
    });

    if (dk.vanDongVien && dk.vanDongVien.email) {
      sendEmail(
        dk.vanDongVien.email,
        'Cập nhật trạng thái đăng ký giải đấu',
        `<p>Xin chào ${dk.vanDongVien.hoten},</p><p>Yêu cầu đăng ký giải đấu của bạn đã được cập nhật thành: <strong>${dbTrangThai}</strong>.</p>`
      );
    }

    res.json(mapDangKyGiai(dk));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái đăng ký' });
  }
};

exports.getMatches = async (req, res) => {
  try {
    await syncTournamentStatuses();
    const data = await prisma.ketQuaTd.findMany({
      where: { id_giaidau: req.params.id },
      include: {
        vanDongVien1: { include: { vanDongVien: true } },
        vanDongVien2: { include: { vanDongVien: true } },
        nguoiThang: { include: { vanDongVien: true } },
      },
      orderBy: [{ vong: 'asc' }, { ngaythi: 'asc' }],
    });
    res.json(data.map(mapKetQuaAsTran));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách trận đấu' });
  }
};

exports.updateMatch = async (req, res) => {
  try {
    const { DiemDoi1, DiemDoi2, TrangThai } = req.body;
    const match = await prisma.ketQuaTd.findUnique({ where: { id_ketquatd: req.params.matchId } });
    if (!match) return res.status(404).json({ error: 'Không tìm thấy trận đấu' });

    const d1 = parseInt(DiemDoi1 || 0, 10);
    const d2 = parseInt(DiemDoi2 || 0, 10);
    let id_thang = null;
    if (TrangThai === 'KetThuc' || TrangThai === 'Kết thúc') {
      if (d1 === d2) return res.status(400).json({ error: 'Điểm số không thể hòa' });
      id_thang = d1 > d2 ? match.id_vadv1 : match.id_vadv2;
    }

    await prisma.ketQuaTd.update({
      where: { id_ketquatd: req.params.matchId },
      data: {
        diemso: `${d1}-${d2}`,
        id_thang,
        ngaythi: new Date(),
      },
    });

    await syncTournamentStatuses();

    res.json({ message: 'Cập nhật trận đấu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi cập nhật trận đấu' });
  }
};

async function createPairMatches(tournamentId, registrations, vongLabel) {
  const shuffled = [...registrations].sort(() => Math.random() - 0.5);
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const p1 = shuffled[i];
    const p2 = shuffled[i + 1];
    if (!p2) continue;
    matches.push({
      id_giaidau: tournamentId,
      id_vadv1: p1.id_dkgiai,
      id_vadv2: p2.id_dkgiai,
      vong: vongLabel,
    });
  }
  for (const m of matches) {
    await prisma.ketQuaTd.create({ data: m });
  }
}

exports.generateBracket = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const existing = await prisma.ketQuaTd.findFirst({ where: { id_giaidau: tournamentId } });
    if (existing) return res.status(400).json({ error: 'Sơ đồ thi đấu đã được tạo' });

    const registrations = await prisma.dkGiaiDau.findMany({
      where: { id_giaidau: tournamentId, trangthai: 'Đã xác nhận' },
    });
    if (registrations.length < 2) {
      return res.status(400).json({ error: 'Cần ít nhất 2 VĐV đã xác nhận' });
    }

    await createPairMatches(tournamentId, registrations, '1');
    await prisma.giaiDau.update({
      where: { id_giaidau: tournamentId },
      data: { trangthai: 'Đang diễn ra' },
    });

    // Gửi email cho tất cả VĐV
    const tournament = await prisma.giaiDau.findUnique({ where: { id_giaidau: tournamentId } });
    for (const reg of registrations) {
      if (reg.vanDongVien && reg.vanDongVien.email) {
        sendEmail(
          reg.vanDongVien.email,
          'Lịch thi đấu đã có!',
          `<p>Xin chào,</p><p>Lịch thi đấu (Sơ đồ thi đấu) cho giải <strong>${tournament?.tengiai || ''}</strong> đã được tạo.</p><p>Vui lòng đăng nhập hệ thống để xem chi tiết.</p>`
        );
      }
    }

    res.json({ message: 'Tạo sơ đồ thi đấu thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi sinh sơ đồ vòng đấu' });
  }
};

exports.generateRoundRobin = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const existing = await prisma.ketQuaTd.findFirst({ where: { id_giaidau: tournamentId } });
    if (existing) return res.status(400).json({ error: 'Lịch đấu đã được tạo' });

    const registrations = await prisma.dkGiaiDau.findMany({
      where: { id_giaidau: tournamentId, trangthai: 'Đã xác nhận' },
    });
    if (registrations.length < 2) {
      return res.status(400).json({ error: 'Cần ít nhất 2 VĐV đã xác nhận' });
    }

    let vong = 1;
    for (let i = 0; i < registrations.length; i++) {
      for (let j = i + 1; j < registrations.length; j++) {
        await prisma.ketQuaTd.create({
          data: {
            id_giaidau: tournamentId,
            id_vadv1: registrations[i].id_dkgiai,
            id_vadv2: registrations[j].id_dkgiai,
            vong: String(vong++),
          },
        });
      }
    }

    await prisma.giaiDau.update({
      where: { id_giaidau: tournamentId },
      data: { trangthai: 'Đang diễn ra' },
    });

    // Gửi email cho tất cả VĐV
    const tournament = await prisma.giaiDau.findUnique({ where: { id_giaidau: tournamentId } });
    for (const reg of registrations) {
      if (reg.vanDongVien && reg.vanDongVien.email) {
        sendEmail(
          reg.vanDongVien.email,
          'Lịch thi đấu vòng tròn đã có!',
          `<p>Xin chào,</p><p>Lịch thi đấu vòng tròn cho giải <strong>${tournament?.tengiai || ''}</strong> đã được tạo.</p><p>Vui lòng đăng nhập hệ thống để xem chi tiết.</p>`
        );
      }
    }

    res.json({ message: 'Đã tạo lịch đấu vòng tròn thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi sinh lịch đấu vòng tròn' });
  }
};

exports.advanceToKnockout = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const finished = await prisma.ketQuaTd.findMany({
      where: { id_giaidau: tournamentId, id_thang: { not: null } },
    });
    if (!finished.length) {
      return res.status(400).json({ error: 'Chưa có trận vòng tròn kết thúc' });
    }

    const wins = {};
    for (const m of finished) {
      if (m.id_thang) wins[m.id_thang] = (wins[m.id_thang] || 0) + 1;
    }
    const top = Object.entries(wins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => ({ id_dkgiai: id }));

    // Start knockout after round robin with round '101' so frontend can differentiate
    await createPairMatches(tournamentId, top, '101');
    res.json({ message: 'Đã chuyển sang giai đoạn Knockout', soVdvVaoKnockout: top.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi chuyển sang knockout' });
  }
};

exports.advanceKnockoutRound = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    
    const matches = await prisma.ketQuaTd.findMany({
      where: { id_giaidau: tournamentId },
    });
    if (matches.length === 0) return res.status(400).json({ error: 'Chưa có sơ đồ thi đấu' });

    let roundNums = matches.map(m => parseInt(m.vong, 10)).filter(n => !isNaN(n));
    if (roundNums.length === 0) return res.status(400).json({ error: 'Định dạng vòng không hợp lệ' });
    
    let maxRound = Math.max(...roundNums);
    const latestRoundMatches = matches.filter(m => m.vong === String(maxRound));

    const unfinished = latestRoundMatches.filter(m => m.id_thang === null);
    if (unfinished.length > 0) {
      return res.status(400).json({ error: 'Bạn cần nhập điểm và cập nhật kết quả tất cả các trận ở vòng hiện tại trước khi đi tiếp!' });
    }

    if (latestRoundMatches.length === 1) {
      return res.status(400).json({ error: 'Giải đấu đã tới trận Chung Kết, không thể đi tiếp!' });
    }

    const winners = latestRoundMatches.sort((a,b)=>a.id_ketquatd - b.id_ketquatd).map(m => ({ id_dkgiai: m.id_thang }));
    const nextRoundStr = String(maxRound + 1);

    await createPairMatches(tournamentId, winners, nextRoundStr);

    res.json({ message: 'Đã tạo vòng đấu tiếp theo với những người chiến thắng!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tạo vòng tiếp theo' });
  }
};

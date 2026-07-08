const prisma = require('../prismaClient');
const { mapDatSan, mapSan, dec } = require('../utils/csdlMapper');
const { syncTournamentStatuses } = require('../utils/tournamentHelper');

exports.getDashboard = async (req, res) => {
  try {
    await syncTournamentStatuses();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      tongThanhVien,
      tongDatHomNay,
      sanTrong,
      giaiDauSapDen,
      doanhThuSanAgg,
      doanhThuDungCuAgg,
      datGanDay,
      sanTrangThai,
      todayBookings,
    ] = await Promise.all([
      prisma.thanhVienClb.count({ where: { trangthai: 'Hoạt động' } }),
      prisma.datSan.count({ where: { ngaydat: today } }),
      prisma.san.count({ where: { trangthai: 'Sẵn sàng' } }),
      prisma.giaiDau.count({ where: { trangthai: { in: ['Sắp diễn ra', 'Đang diễn ra'] } } }),
      // Doanh thu từ đặt sân (hoá đơn đã thanh toán trong tháng)
      prisma.hoaDon.aggregate({
        where: {
          trangthai: 'Đã thanh toán',
          ngaythanhtoan: { gte: startOfMonth },
        },
        _sum: { sotien: true },
      }),
      // Doanh thu từ thuê dụng cụ (đơn đã duyệt hoặc đã trả trong tháng)
      prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(CAST(tongtien AS DECIMAL)), 0) as total
         FROM donthue
         WHERE trangthai IN ('DangThue','DaTraHang')
           AND ngaytao >= $1`,
        startOfMonth
      ),
      prisma.datSan.findMany({
        take: 10,
        orderBy: { ngaydat: 'desc' },
        include: { san: true, nguoiDung: true, hoaDon: true },
      }),
      prisma.san.findMany(),
      // Fetch today's confirmed/completed bookings for real-time court status
      prisma.datSan.findMany({
        where: {
          ngaydat: today,
          trangthai: { in: ['Đã xác nhận', 'Hoàn thành', 'Chờ xác nhận'] },
        },
        include: { san: true, nguoiDung: true },
      }),
    ]);

    const doanhThuSan = dec(doanhThuSanAgg._sum.sotien) || 0;
    const doanhThuDungCu = Number(doanhThuDungCuAgg[0]?.total) || 0;

    // Build real-time court status with booking info
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const LOCKED = ['Đã xác nhận', 'Hoàn thành'];

    const sanLive = sanTrangThai.map(s => {
      const mapped = mapSan(s);
      const courtBookings = todayBookings.filter(b => b.id_san === s.id_san);

      // Build time slots info for this court
      const slots = courtBookings.map(b => {
        const startH = b.giobatdau ? new Date(b.giobatdau).getUTCHours() : 0;
        const startM = b.giobatdau ? new Date(b.giobatdau).getUTCMinutes() : 0;
        const endH = b.gioketthuc ? new Date(b.gioketthuc).getUTCHours() : 0;
        const endM = b.gioketthuc ? new Date(b.gioketthuc).getUTCMinutes() : 0;
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;
        return {
          start: startMin,
          end: endMin,
          startStr: `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`,
          endStr: `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`,
          status: b.trangthai,
          isLocked: LOCKED.includes(b.trangthai),
          khachHang: b.nguoiDung?.hoten || b.nguoiDung?.tendangnhap || 'Khách',
        };
      });

      // Is someone using this court right now?
      const isInUse = slots.some(sl => sl.isLocked && currentMinutes >= sl.start && currentMinutes < sl.end);

      // Count booked hours today (locked bookings only)
      const bookedHours = new Set();
      slots.filter(sl => sl.isLocked).forEach(sl => {
        for (let h = Math.floor(sl.start / 60); h < Math.ceil(sl.end / 60); h++) {
          bookedHours.add(h);
        }
      });

      // Determine live status
      let liveStatus = mapped.TrangThai; // from DB
      if (s.trangthai === 'Bảo trì') liveStatus = 'BaoTri';
      else if (isInUse) liveStatus = 'DangDung';
      else liveStatus = 'Trong';

      return {
        ...mapped,
        LiveStatus: liveStatus,
        BookedHours: bookedHours.size,
        TotalSlots: slots.length,
        Slots: slots.map(sl => ({
          Gio: `${sl.startStr} - ${sl.endStr}`,
          TrangThai: sl.status,
          KhachHang: sl.khachHang,
        })),
      };
    });

    // Detect booking conflicts (overlapping time on same court, same day)
    // Group by court for today
    const conflicts = [];
    const courtGrouped = {};
    todayBookings.forEach(b => {
      if (!LOCKED.includes(b.trangthai)) return;
      if (!courtGrouped[b.id_san]) courtGrouped[b.id_san] = [];
      courtGrouped[b.id_san].push(b);
    });
    Object.entries(courtGrouped).forEach(([courtId, bookings]) => {
      for (let i = 0; i < bookings.length; i++) {
        for (let j = i + 1; j < bookings.length; j++) {
          const a = bookings[i];
          const aStart = new Date(a.giobatdau).getUTCHours() * 60 + new Date(a.giobatdau).getUTCMinutes();
          const aEnd = new Date(a.gioketthuc).getUTCHours() * 60 + new Date(a.gioketthuc).getUTCMinutes();
          const bStart = new Date(bookings[j].giobatdau).getUTCHours() * 60 + new Date(bookings[j].giobatdau).getUTCMinutes();
          const bEnd = new Date(bookings[j].gioketthuc).getUTCHours() * 60 + new Date(bookings[j].gioketthuc).getUTCMinutes();
          if (aStart < bEnd && aEnd > bStart) {
            const court = sanTrangThai.find(s => s.id_san === courtId);
            conflicts.push({
              San: court?.tensan || courtId,
              Gio1: `${String(Math.floor(aStart/60)).padStart(2,'0')}:${String(aStart%60).padStart(2,'0')} - ${String(Math.floor(aEnd/60)).padStart(2,'0')}:${String(aEnd%60).padStart(2,'0')}`,
              Gio2: `${String(Math.floor(bStart/60)).padStart(2,'0')}:${String(bStart%60).padStart(2,'0')} - ${String(Math.floor(bEnd/60)).padStart(2,'0')}:${String(bEnd%60).padStart(2,'0')}`,
              Khach1: a.nguoiDung?.hoten || a.nguoiDung?.tendangnhap || 'Khách',
              Khach2: bookings[j].nguoiDung?.hoten || bookings[j].nguoiDung?.tendangnhap || 'Khách',
            });
          }
        }
      }
    });

    res.json({
      stats: {
        tongThanhVien,
        tongDatHomNay,
        sanTrong,
        giaiDauSapDen,
        doanhThuThang: doanhThuSan + doanhThuDungCu,
      },
      datGanDay: datGanDay.map((d) => mapDatSan(d, d.san, d.nguoiDung)),
      sanTrangThai: sanLive,
      conflicts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1));
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    // Doanh thu từ đặt sân (hoá đơn)
    const payments = await prisma.hoaDon.findMany({
      where: {
        trangthai: 'Đã thanh toán',
        ngaythanhtoan: { gte: fromDate, lte: toDate },
      },
      include: { datSan: { include: { san: true } } },
      orderBy: { ngaythanhtoan: 'asc' },
    });

    // Doanh thu từ thuê dụng cụ
    const rentals = await prisma.$queryRawUnsafe(
      `SELECT ngaytao, tongtien FROM donthue
       WHERE trangthai IN ('DangThue','DaTraHang')
         AND ngaytao >= $1 AND ngaytao <= $2
       ORDER BY ngaytao ASC`,
      fromDate, toDate
    );

    const byDay = {};

    for (const p of payments) {
      const day = p.ngaythanhtoan.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + dec(p.sotien);
    }
    for (const r of rentals) {
      const day = new Date(r.ngaytao).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + (Number(r.tongtien) || 0);
    }

    const totalSan    = payments.reduce((s, p) => s + dec(p.sotien), 0);
    const totalRental = rentals.reduce((s, r) => s + (Number(r.tongtien) || 0), 0);
    const total       = totalSan + totalRental;

    res.json({ total, byDay, payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.getCourtUsage = async (req, res) => {
  try {
    const courts = await prisma.san.findMany({
      include: {
        datSans: { where: { trangthai: { in: ['Đã xác nhận', 'Hoàn thành'] } } },
      },
    });
    res.json(
      courts.map((c) => ({
        MaSan: c.id_san,
        TenSan: c.tensan,
        LoaiSan: c.loaisan,
        TrangThai: c.trangthai,
        SoLuotDat: c.datSans.length,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.getCourtStats = async (req, res) => {
  try {
    const courts = await prisma.san.findMany({
      include: {
        datSans: {
          where: { trangthai: { in: ['Đã xác nhận', 'Hoàn thành'] } },
          include: { hoaDon: true },
        },
      },
    });

    const data = courts.map((court) => {
      const doanhThu = court.datSans.reduce((sum, lich) => {
        if (lich.hoaDon?.trangthai === 'Đã thanh toán') return sum + dec(lich.hoaDon.sotien);
        return sum;
      }, 0);
      return {
        MaSan: court.id_san,
        TenSan: court.tensan,
        LoaiSan: court.loaisan,
        TrangThai: court.trangthai,
        SoLuotDat: court.datSans.length,
        DoanhThu: doanhThu,
      };
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lấy thống kê sân' });
  }
};

exports.getRevenueBreakdown = async (req, res) => {
  try {
    const [sanAgg, dungCuAgg, giaiDauRegs] = await Promise.all([
      prisma.hoaDon.aggregate({
        where: { trangthai: 'Đã thanh toán' },
        _sum: { sotien: true },
      }),
      // Doanh thu thuê dụng cụ: các đơn đã được duyệt (DangThue) hoặc đã trả (DaTraHang)
      prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(CAST(tongtien AS DECIMAL)), 0) as total
         FROM donthue
         WHERE trangthai IN ('DangThue','DaTraHang')`
      ),
      prisma.dkGiaiDau.findMany({
        where: { trangthai: { not: 'Đã hủy' } },
        include: { giaiDau: true },
      }),
    ]);

    const sanBaoCau = dec(sanAgg._sum.sotien) || 0;
    const dungCu = Number(dungCuAgg[0]?.total) || 0;
    const giaiDau = giaiDauRegs.reduce((sum, dk) => sum + dec(dk.giaiDau?.lephi), 0);

    res.json({
      sanBaoCau,
      dungCu,
      giaiDau,
      tongDoanhThu: sanBaoCau + dungCu + giaiDau,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lấy phân bổ doanh thu' });
  }
};

const xlsx = require('xlsx');
exports.exportExcel = async (req, res) => {
  try {
    const { type } = req.query;
    let data = [];
    let sheetName = 'Sheet1';
    if (type === 'revenue') {
      const revData = await prisma.hoaDon.findMany({
        include: { datSan: { include: { san: true } } },
        orderBy: { ngaythanhtoan: 'desc' }
      });
      data = revData.map(r => ({
        'Mã HĐ': r.id_hoadon,
        'Số tiền': dec(r.sotien),
        'Phương thức': r.phuongthuc,
        'Trạng thái': r.trangthai,
        'Sân': r.datSan?.san?.tensan,
        'Ngày thanh toán': r.ngaythanhtoan?.toISOString()
      }));
      sheetName = 'DoanhThu';
    } else {
      const datsan = await prisma.datSan.findMany({
        include: { nguoiDung: true, san: true },
        orderBy: { ngaydat: 'desc' }
      });
      data = datsan.map(d => ({
        'Ngày': d.ngaydat?.toISOString().split('T')[0],
        'Sân': d.san?.tensan,
        'Khách': d.nguoiDung?.hoten || d.nguoiDung?.tendangnhap,
        'Trạng thái': d.trangthai
      }));
      sheetName = 'DatSan';
    }
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi xuất excel' });
  }
};

exports.getAdvancedStats = async (req, res) => {
  try {
    await syncTournamentStatuses();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Thống kê hội viên theo kỳ (Tháng hiện tại)
    const newMembersThisMonth = await prisma.thanhVienClb.count({
      where: {
        ngaythamgia: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    const expiredMembersThisMonth = await prisma.thanhVienClb.count({
      where: {
        ngayhethan: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    // 2. Thống kê số lượng lượt đặt sân và dịch vụ thuê (Tháng hiện tại)
    const bookingsThisMonth = await prisma.datSan.count({
      where: {
        ngaydat: { gte: startOfMonth, lte: endOfMonth },
        trangthai: { in: ['Đã xác nhận', 'Hoàn thành'] }
      }
    });

    const rentalsThisMonth = await prisma.donThue.count({
      where: {
        ngaytao: { gte: startOfMonth, lte: endOfMonth },
        trangthai: { in: ['DangThue', 'DaTraHang'] }
      }
    });

    // 3. Thống kê giải đấu và số VĐV tham gia (5 giải gần nhất)
    const recentTournaments = await prisma.giaiDau.findMany({
      take: 5,
      orderBy: { ngaybatdau: 'desc' },
      include: {
        _count: {
          select: { dangKys: true }
        },
        ketQuas: {
          include: {
            vanDongVien1: { include: { vanDongVien: true } },
            vanDongVien2: { include: { vanDongVien: true } },
            nguoiThang: { include: { vanDongVien: true } }
          },
          orderBy: { ngaythi: 'desc' }
        }
      }
    });

    const formattedTournaments = recentTournaments.map(t => ({
      id_giaidau: t.id_giaidau,
      tengiai: t.tengiai,
      ngaybatdau: t.ngaybatdau,
      trangthai: t.trangthai,
      soLuongVdv: t._count.dangKys,
      soluongtoida: t.soluongtoida,
      tranDaus: t.ketQuas.map(kq => ({
        id_ketquatd: kq.id_ketquatd,
        vong: kq.vong,
        diemso: kq.diemso,
        ngaythi: kq.ngaythi,
        vdv1: kq.vanDongVien1?.vanDongVien?.hoten || kq.vanDongVien1?.vanDongVien?.tendangnhap || 'Trống',
        vdv2: kq.vanDongVien2?.vanDongVien?.hoten || kq.vanDongVien2?.vanDongVien?.tendangnhap || 'Trống',
        nguoiThang: kq.nguoiThang?.vanDongVien?.hoten || kq.nguoiThang?.vanDongVien?.tendangnhap || 'Chưa rõ'
      }))
    }));

    res.json({
      members: {
        newThisMonth: newMembersThisMonth,
        expiredThisMonth: expiredMembersThisMonth
      },
      services: {
        bookingsThisMonth,
        rentalsThisMonth
      },
      tournaments: formattedTournaments
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lấy thống kê nâng cao' });
  }
};

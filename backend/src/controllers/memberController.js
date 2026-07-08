const prisma = require('../prismaClient');
const { mapNguoiDung, mapDatSan, STATUS_MAP_TO_API, STATUS_MAP_TO_DB, dec } = require('../utils/csdlMapper');
const bcrypt = require('bcrypt');
const { getConfig, saveConfig } = require('../configStore');

exports.getAllMembers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query;
    const skip = (page - 1) * limit;
    const where = {
      vaitro: 'KhachHang',
      ...(search
        ? {
            OR: [
              { hoten: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { sdt: { contains: search } },
              { tendangnhap: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    if (status) {
      where.thanhVienClb = {
        trangthai: STATUS_MAP_TO_DB[status] || status,
      };
    }

    const [rows, total] = await Promise.all([
      prisma.nguoiDung.findMany({
        where,
        skip: parseInt(skip, 10),
        take: parseInt(limit, 10),
        include: { thanhVienClb: true },
        orderBy: { ngaytao: 'desc' },
      }),
      prisma.nguoiDung.count({ where }),
    ]);

    res.json({
      data: rows.map(mapNguoiDung),
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.createMember = async (req, res) => {
  try {
    const { HoTen, Email, SoDienThoai, MatKhau } = req.body;
    if (!HoTen || !Email) return res.status(400).json({ error: 'Thiếu tên hoặc email' });
    
    const existing = await prisma.nguoiDung.findFirst({ where: { OR: [{ email: Email }, { sdt: SoDienThoai || '' }] } });
    if (existing) return res.status(400).json({ error: 'Email hoặc SĐT đã tồn tại' });
    
    const hashedPassword = await bcrypt.hash(MatKhau || '123456', 10);
    const tendangnhap = Email.split('@')[0] + Math.floor(Math.random() * 1000);
    
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.nguoiDung.create({
        data: {
          tendangnhap,
          hoten: HoTen,
          email: Email,
          sdt: SoDienThoai || null,
          matkhau: hashedPassword,
          vaitro: 'KhachHang',
        },
      });
      await tx.thanhVienClb.create({
        data: {
          id_nguoidung: u.id_nguoidung,
          capbac: 'Thành viên',
          trangthai: 'Hoạt động',
        },
      });
      return u;
    });
    res.status(201).json(mapNguoiDung(newUser));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tạo thành viên' });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const id = req.params.id;
    await prisma.$transaction([
      prisma.thanhVienClb.deleteMany({ where: { id_nguoidung: id } }),
      prisma.nguoiDung.delete({ where: { id_nguoidung: id } })
    ]);
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Không thể xóa thành viên này vì đã có dữ liệu liên quan (lịch đặt sân, giải đấu...)' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.nguoiDung.findUnique({
      where: { id_nguoidung: req.user.userId },
      include: {
        thanhVienClb: true,
        datSans: {
          take: 5,
          orderBy: { ngaydat: 'desc' },
          include: { san: true, hoaDon: true },
        },
        donThues: {
          take: 5,
          orderBy: { ngaytao: 'desc' },
          include: { dichVu: true },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    const mapped = mapNguoiDung(user);
    if (mapped.KhachHang) {
      mapped.KhachHang.LichDatSans = user.datSans.map((d) => mapDatSan(d, d.san));
    }
    mapped.DonThues = user.donThues.map((d) => ({
      MaDonThue: d.id_donthue,
      TenSanPham: d.dichVu?.tendichvu || 'Dịch vụ',
      SoLuong: d.soluong || 1,
      SoGio: dec(d.sogio),
      TongTien: dec(d.tongtien) || 0,
      TrangThai: d.trangthai || 'DangThue',
      NgayTao: d.ngaytao,
    }));
    const { MatKhau, ...safeUser } = mapped;
    res.json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { HoTen, SoDienThoai } = req.body;
    const normalizedPhone = SoDienThoai !== undefined
      ? String(SoDienThoai).replace(/\D/g, '').trim()
      : undefined;
    if (normalizedPhone !== undefined && normalizedPhone.length > 15) {
      return res.status(400).json({ error: 'Số điện thoại tối đa 15 chữ số' });
    }

    const updated = await prisma.nguoiDung.update({
      where: { id_nguoidung: req.user.userId },
      data: {
        ...(HoTen !== undefined && { hoten: String(HoTen).trim() }),
        ...(normalizedPhone !== undefined && { sdt: normalizedPhone || null }),
      },
      include: { thanhVienClb: true },
    });
    const mapped = mapNguoiDung(updated);
    const { MatKhau, ...safeUser } = mapped;
    res.json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi cập nhật hồ sơ' });
  }
};

exports.uploadAvatar = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Không có file nào được tải lên.' });
      }
      
      const avatarUrl = `/uploads/${req.file.filename}`;
      
      const updated = await prisma.nguoiDung.update({
        where: { id_nguoidung: req.user.userId },
        data: { avatar: avatarUrl },
        include: { thanhVienClb: true },
      });
      
      const mapped = mapNguoiDung(updated);
      const { MatKhau, ...safeUser } = mapped;
      res.json({ message: 'Tải ảnh đại diện thành công', user: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi tải ảnh đại diện' });
    }
  };

exports.updateMemberStatus = async (req, res) => {
  try {
    const { TrangThai } = req.body;
    const dbStatus = STATUS_MAP_TO_DB[TrangThai] || TrangThai;
    const updated = await prisma.thanhVienClb.update({
      where: { id_nguoidung: req.params.id },
      data: { trangthai: dbStatus },
    });
    res.json({
      MaKhachHang: updated.id_nguoidung,
      TrangThai: STATUS_MAP_TO_API[updated.trangthai] || updated.trangthai,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái' });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const user = await prisma.nguoiDung.findUnique({
      where: { id_nguoidung: req.params.id },
      include: {
        thanhVienClb: true,
        datSans: {
          include: { san: true },
          orderBy: { ngaydat: 'desc' },
          take: 10,
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy' });

    const mapped = mapNguoiDung(user);
    if (mapped.KhachHang) {
      mapped.KhachHang.LichDatSans = user.datSans.map((d) => mapDatSan(d, d.san));
    }
    const { MatKhau, ...safeUser } = mapped;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.upgradeMembership = async (req, res) => {
  try {
    const { capbac, sdt } = req.body;
    if (!capbac) return res.status(400).json({ error: 'Thiếu thông tin gói hội viên' });

    if (sdt && sdt.trim() !== '') {
      await prisma.nguoiDung.update({
        where: { id_nguoidung: req.user.userId },
        data: { sdt: sdt.trim() },
      });
    }

    const config = getConfig() || {};
    const fees = {
      'Khách lẻ': 80000,
      'Hội viên tháng': config.fee1 || 200000,
      'CLB / Đội nhóm': config.fee2 || 400000,
    };
    const fee = fees[capbac] || 0;

    const expiryDate = new Date();
    if (capbac === 'Khách lẻ') {
      expiryDate.setDate(expiryDate.getDate() + 1);
    } else if (capbac === 'Hội viên tháng') {
      expiryDate.setDate(expiryDate.getDate() + 30);
    } else if (capbac === 'CLB / Đội nhóm') {
      expiryDate.setDate(expiryDate.getDate() + 365); // 1 năm
    }

    const updated = await prisma.thanhVienClb.upsert({
      where: { id_nguoidung: req.user.userId },
      update: {
        capbac,
        phihoivien: fee,
        trangthai: 'Hoạt động',
        ngayhethan: expiryDate,
      },
      create: {
        id_nguoidung: req.user.userId,
        capbac,
        phihoivien: fee,
        trangthai: 'Hoạt động',
        ngayhethan: expiryDate,
      }
    });

    res.json({
      message: `Đăng ký thành viên gói "${capbac}" thành công!`,
      data: updated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi đăng ký hội viên' });
  }
};

exports.getMembershipConfig = (req, res) => {
  res.json(getConfig());
};

exports.updateMembershipConfig = async (req, res) => {
  try {
    const { fee1, fee2, discountBooking, discountRental, discountTournament } = req.body;
    const current = getConfig();
    const newConfig = {
      ...current,
      fee1: fee1 !== undefined ? fee1 : current.fee1,
      fee2: fee2 !== undefined ? fee2 : current.fee2,
      discountBooking: discountBooking !== undefined ? discountBooking : current.discountBooking,
      discountRental: discountRental !== undefined ? discountRental : current.discountRental,
      discountTournament: discountTournament !== undefined ? discountTournament : current.discountTournament,
    };
    await saveConfig(newConfig);
    res.json(newConfig);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lưu cấu hình' });
  }
};

exports.updateMemberByAdmin = async (req, res) => {
  try {
    const { HoTen, SoDienThoai, capbac, phihoivien, TrangThai } = req.body;
    const userId = req.params.id;

    // 1. Update NguoiDung
    await prisma.nguoiDung.update({
      where: { id_nguoidung: userId },
      data: {
        ...(HoTen && { hoten: HoTen }),
        ...(SoDienThoai !== undefined && { sdt: SoDienThoai }),
      },
    });

    // 2. Upsert ThanhVienClb
    const dbStatus = TrangThai ? (STATUS_MAP_TO_DB[TrangThai] || TrangThai) : undefined;
    const feeVal = phihoivien !== undefined ? Number(phihoivien) : undefined;

    if (capbac !== undefined || feeVal !== undefined || dbStatus !== undefined) {
      await prisma.thanhVienClb.upsert({
        where: { id_nguoidung: userId },
        update: {
          capbac: capbac || null,
          ...(feeVal !== undefined && { phihoivien: feeVal }),
          ...(dbStatus !== undefined && { trangthai: dbStatus }),
        },
        create: {
          id_nguoidung: userId,
          capbac: capbac || null,
          phihoivien: feeVal || 0,
          trangthai: dbStatus || 'Hoạt động',
        },
      });
    }

    // 3. Fetch updated
    const updated = await prisma.nguoiDung.findUnique({
      where: { id_nguoidung: userId },
      include: { thanhVienClb: true },
    });

    res.json(mapNguoiDung(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi cập nhật thông tin thành viên' });
  }
};

exports.getAllMemberships = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.trangthai = status;
    }
    
    const memberships = await prisma.thanhVienClb.findMany({
      where,
      include: { nguoiDung: true },
      orderBy: { ngaythamgia: 'desc' }
    });

    res.json(memberships.map(m => ({
      id_thanhvien: m.id_thanhvien,
      id_nguoidung: m.id_nguoidung,
      hoten: m.nguoiDung?.hoten || m.nguoiDung?.tendangnhap,
      email: m.nguoiDung?.email,
      sdt: m.nguoiDung?.sdt,
      capbac: m.capbac,
      phihoivien: m.phihoivien,
      ngaythamgia: m.ngaythamgia,
      ngayhethan: m.ngayhethan,
      trangthai: m.trangthai,
      phuongthucthanhtoan: m.phuongthucthanhtoan
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lấy danh sách thẻ hội viên' });
  }
};

exports.updateMembershipByAdmin = async (req, res) => {
  try {
    const { capbac, phihoivien, ngayhethan, trangthai, phuongthucthanhtoan } = req.body;
    const userId = req.params.id; // it's id_nguoidung

    const updated = await prisma.thanhVienClb.update({
      where: { id_nguoidung: userId },
      data: {
        ...(capbac !== undefined && { capbac }),
        ...(phihoivien !== undefined && { phihoivien }),
        ...(ngayhethan !== undefined && { ngayhethan: ngayhethan ? new Date(ngayhethan) : null }),
        ...(trangthai !== undefined && { trangthai }),
        ...(phuongthucthanhtoan !== undefined && { phuongthucthanhtoan }),
      },
      include: { nguoiDung: true }
    });

    res.json({
      id_thanhvien: updated.id_thanhvien,
      id_nguoidung: updated.id_nguoidung,
      hoten: updated.nguoiDung?.hoten || updated.nguoiDung?.tendangnhap,
      email: updated.nguoiDung?.email,
      sdt: updated.nguoiDung?.sdt,
      capbac: updated.capbac,
      phihoivien: updated.phihoivien,
      ngaythamgia: updated.ngaythamgia,
      ngayhethan: updated.ngayhethan,
      trangthai: updated.trangthai,
      phuongthucthanhtoan: updated.phuongthucthanhtoan
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi cập nhật gói hội viên' });
  }
};

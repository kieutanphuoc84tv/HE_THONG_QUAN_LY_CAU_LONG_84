const prisma = require('../prismaClient');
const { mapSan, mapTrangThaiSanToDb } = require('../utils/csdlMapper');

exports.getAllCourts = async (req, res) => {
  try {
    const courts = await prisma.san.findMany();
    res.json(courts.map(mapSan));
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách sân' });
  }
};

exports.createCourt = async (req, res) => {
  try {
    const { TenSan, TrangThai, HinhAnh } = req.body;
    if (!TenSan) {
      return res.status(400).json({ error: 'Thiếu tên sân' });
    }
    const newCourt = await prisma.san.create({
      data: {
        tensan: TenSan,
        loaisan: 'Tiêu chuẩn',
        giathue: 70000,
        trangthai: mapTrangThaiSanToDb(TrangThai || 'Trong'),
        hinhanh: HinhAnh || null,
      },
    });
    res.status(201).json(mapSan(newCourt));
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm sân mới' });
  }
};

exports.updateCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenSan, TrangThai, HinhAnh } = req.body;
    const updatedCourt = await prisma.san.update({
      where: { id_san: id },
      data: {
        ...(TenSan && { tensan: TenSan }),
        loaisan: 'Tiêu chuẩn',
        giathue: 70000,
        ...(TrangThai && { trangthai: mapTrangThaiSanToDb(TrangThai) }),
        ...(HinhAnh !== undefined && { hinhanh: HinhAnh }),
      },
    });
    res.json(mapSan(updatedCourt));
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật thông tin sân' });
  }
};

exports.deleteCourt = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.san.delete({ where: { id_san: id } });
    res.json({ message: 'Đã xóa sân thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa sân' });
  }
};

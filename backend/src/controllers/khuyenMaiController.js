const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Tính trạng thái thực tế dựa trên ngày hiện tại
 * - Chưa tới ngày bắt đầu → 'Sắp diễn ra'
 * - Trong khoảng bắt đầu → kết thúc → 'Đang diễn ra'
 * - Qua ngày kết thúc → 'Hết hạn'
 */
function computeStatus(voucher) {
  const now = new Date();
  // Set time to start of day for fair comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (voucher.ngayketthuc) {
    const end = new Date(voucher.ngayketthuc);
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (today > endDay) return 'Hết hạn';
  }

  if (voucher.ngaybatdau) {
    const start = new Date(voucher.ngaybatdau);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    if (today < startDay) return 'Sắp diễn ra';
  }

  return 'Đang diễn ra';
}

exports.getAll = async (req, res) => {
  try {
    const data = await prisma.khuyenMai.findMany({ orderBy: { ngaybatdau: 'desc' } });

    // Tính trạng thái realtime + auto-update DB nếu cần
    const result = [];
    for (const v of data) {
      const realStatus = computeStatus(v);
      // Nếu trạng thái DB khác thực tế → cập nhật DB
      if (v.trangthai !== realStatus) {
        await prisma.khuyenMai.update({
          where: { id_khuyenmai: v.id_khuyenmai },
          data: { trangthai: realStatus }
        });
        v.trangthai = realStatus;
      }
      result.push(v);
    }

    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = await prisma.khuyenMai.create({ data: {
      ...req.body,
      ngaybatdau: req.body.ngaybatdau ? new Date(req.body.ngaybatdau) : null,
      ngayketthuc: req.body.ngayketthuc ? new Date(req.body.ngayketthuc) : null
    } });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.ngaybatdau) payload.ngaybatdau = new Date(payload.ngaybatdau);
    if (payload.ngayketthuc) payload.ngayketthuc = new Date(payload.ngayketthuc);
    const data = await prisma.khuyenMai.update({ where: { id_khuyenmai: req.params.id }, data: payload });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.delete = async (req, res) => {
  try {
    await prisma.khuyenMai.delete({ where: { id_khuyenmai: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.checkVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Vui lòng nhập mã khuyến mãi' });
    
    const voucher = await prisma.khuyenMai.findUnique({ where: { makhuyenmai: code } });
    if (!voucher) return res.status(404).json({ error: 'Mã khuyến mãi không tồn tại' });

    // Kiểm tra trạng thái thực tế dựa trên ngày
    const realStatus = computeStatus(voucher);

    // Cập nhật DB nếu status đã thay đổi
    if (voucher.trangthai !== realStatus) {
      await prisma.khuyenMai.update({
        where: { id_khuyenmai: voucher.id_khuyenmai },
        data: { trangthai: realStatus }
      });
      voucher.trangthai = realStatus;
    }

    if (realStatus === 'Hết hạn') {
      return res.status(400).json({ error: 'Mã khuyến mãi đã hết hạn' });
    }
    if (realStatus === 'Sắp diễn ra') {
      return res.status(400).json({ error: 'Mã khuyến mãi chưa đến thời gian sử dụng' });
    }
    if (voucher.soluong <= 0) {
      return res.status(400).json({ error: 'Mã khuyến mãi đã hết lượt sử dụng' });
    }
    
    res.json(voucher);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

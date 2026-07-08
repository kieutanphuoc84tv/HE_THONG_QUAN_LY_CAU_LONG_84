const prisma = require('../prismaClient');
const {
  mapThanhToanFromHoaDon,
  mapHoaDon,
  mapDatSan,
  calcTongTien,
  dec,
} = require('../utils/csdlMapper');
const { sendEmail } = require('../utils/emailService');
const { generateInvoicePDF } = require('../utils/pdfService');
const { awardLoyaltyPoints } = require('../utils/loyaltyPoints');

const LOCKED_STATUSES = ['Đã xác nhận', 'Hoàn thành'];

function normalizePaymentMethod(value) {
  const key = String(value || '').trim().toLowerCase();
  const methods = {
    mbbank: 'ChuyenKhoan',
    vnpay: 'VNPay',
    momo: 'MoMo',
    tienmat: 'TienMat',
    cash: 'TienMat',
  };
  return methods[key] || null;
}

async function findLockedConflict(tx, datSanId) {
  const datSan = await tx.datSan.findUnique({ where: { id_datsan: datSanId } });
  if (!datSan) {
    const err = new Error('Không tìm thấy lịch đặt sân');
    err.statusCode = 404;
    throw err;
  }

  const conflict = await tx.datSan.findFirst({
    where: {
      id_datsan: { not: datSanId },
      id_san: datSan.id_san,
      ngaydat: datSan.ngaydat,
      trangthai: { in: LOCKED_STATUSES },
      AND: [{ giobatdau: { lt: datSan.gioketthuc } }, { gioketthuc: { gt: datSan.giobatdau } }],
    },
  });
  if (conflict) {
    const err = new Error('Sân đã có lịch được duyệt trong khung giờ này');
    err.statusCode = 409;
    throw err;
  }
}

async function ensureHoaDon(datSan) {
  let hoaDon = await prisma.hoaDon.findUnique({ where: { id_datsan: datSan.id_datsan } });
  if (!hoaDon) {
    const tong = calcTongTien(datSan, datSan.san);
    hoaDon = await prisma.hoaDon.create({
      data: {
        id_datsan: datSan.id_datsan,
        sotien: tong,
        trangthai: 'Chưa thanh toán',
      },
    });
  }
  return hoaDon;
}

async function cancelUnpaidBookingByInvoice(hoaDonId, reason) {
  const hoaDon = await prisma.hoaDon.findUnique({
    where: { id_hoadon: hoaDonId },
    include: { datSan: true },
  });
  if (!hoaDon || hoaDon.trangthai === 'Đã thanh toán' || hoaDon.datSan?.trangthai !== 'Chờ xác nhận') return;

  const updated = await prisma.datSan.update({
    where: { id_datsan: hoaDon.id_datsan },
    data: { trangthai: 'Đã hủy', ghichu: reason },
  });
  if (global.io) {
    global.io.to(`court_${updated.id_san}`).emit('booking_updated', { courtId: updated.id_san });
  }
}

async function markPaid(hoaDonId, phuongthuc, datSanId) {
  const result = await prisma.$transaction(async (tx) => {
    await findLockedConflict(tx, datSanId);

    const hoaDon = await tx.hoaDon.update({
      where: { id_hoadon: hoaDonId },
      data: {
        trangthai: 'Đã thanh toán',
        phuongthuc,
        ngaythanhtoan: new Date(),
      },
    });
    const ds = await tx.datSan.findUnique({
      where: { id_datsan: datSanId },
      include: { san: true, nguoiDung: { include: { thanhVienClb: true } } }
    });
    return { hoaDon, ds };
  });

  // Gửi email bất đồng bộ (không await)
  const { ds, hoaDon } = result;
  if (ds?.id_nguoidung) {
    await awardLoyaltyPoints({
      userId: ds.id_nguoidung,
      sourceType: 'booking',
      sourceId: ds.id_datsan,
      amount: dec(hoaDon.sotien) || calcTongTien(ds, ds.san),
    });
  }

  if (ds && ds.nguoiDung && ds.nguoiDung.email) {
    const emailHtml = `
      <h3>Xác nhận thanh toán thành công</h3>
      <p>Xin chào <strong>${ds.nguoiDung.hoten}</strong>,</p>
      <p>Cảm ơn bạn đã đặt sân tại Cầu Lông 84. Giao dịch thanh toán của bạn đã thành công và lịch đặt đang chờ Admin xác nhận.</p>
      <ul>
        <li><strong>Sân:</strong> ${ds.san.tensan}</li>
        <li><strong>Ngày:</strong> ${new Date(ds.ngaydat).toLocaleDateString('vi-VN')}</li>
        <li><strong>Khung giờ:</strong> ${new Date(ds.giobatdau).toLocaleTimeString('vi-VN')} - ${new Date(ds.gioketthuc).toLocaleTimeString('vi-VN')}</li>
        <li><strong>Số tiền:</strong> ${dec(hoaDon.sotien).toLocaleString('vi-VN')} VNĐ</li>
        <li><strong>Phương thức:</strong> ${phuongthuc}</li>
      </ul>
      <p>Chúc bạn có những giờ phút giao lưu vui vẻ!</p>
    `;
    sendEmail(ds.nguoiDung.email, 'Xác nhận thanh toán đặt sân - Cầu Lông 84', emailHtml).catch(console.error);
  }

  return result.hoaDon;
}

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      prisma.hoaDon.findMany({
        where: { trangthai: 'Đã thanh toán' },
        skip: parseInt(skip, 10),
        take: parseInt(limit, 10),
        include: {
          datSan: { include: { san: true, nguoiDung: true } },
        },
        orderBy: { ngaythanhtoan: 'desc' },
      }),
      prisma.hoaDon.count({ where: { trangthai: 'Đã thanh toán' } }),
    ]);
    res.json({ data: rows.map(mapThanhToanFromHoaDon), total });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.getMy = async (req, res) => {
  try {
    const rows = await prisma.hoaDon.findMany({
      where: {
        trangthai: 'Đã thanh toán',
        datSan: { id_nguoidung: req.user.userId },
      },
      include: { datSan: { include: { san: true } } },
      orderBy: { ngaythanhtoan: 'desc' },
    });
    res.json(rows.map(mapThanhToanFromHoaDon));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.create = async (req, res) => {
  try {
    const { MaLichDat, PhuongThucThanhToan, SoTien } = req.body;
    const phuongThuc = normalizePaymentMethod(PhuongThucThanhToan);
    if (!MaLichDat || !phuongThuc) {
      return res.status(400).json({ error: 'Thiếu thông tin thanh toán' });
    }

    const datSan = await prisma.datSan.findUnique({
      where: { id_datsan: MaLichDat },
      include: { san: true },
    });
    if (!datSan) return res.status(404).json({ error: 'Không tìm thấy lịch đặt sân' });

    let hoaDon = await ensureHoaDon(datSan);
    if (hoaDon.trangthai === 'Đã thanh toán') {
      return res.status(409).json({ error: 'Hóa đơn này đã được thanh toán' });
    }

    const amount = SoTien !== undefined ? parseFloat(SoTien) : calcTongTien(datSan, datSan.san);
    await prisma.hoaDon.update({
      where: { id_hoadon: hoaDon.id_hoadon },
      data: { sotien: amount },
    });

    hoaDon = await markPaid(hoaDon.id_hoadon, phuongThuc, MaLichDat);
    hoaDon.datSan = datSan;

    res.status(201).json(mapThanhToanFromHoaDon(hoaDon));
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Lỗi ghi nhận thanh toán' });
  }
};

exports.clientPay = async (req, res) => {
  try {
    const { MaLichDat, PhuongThucThanhToan } = req.body;
    const phuongThuc = normalizePaymentMethod(PhuongThucThanhToan);
    if (!MaLichDat || !phuongThuc) {
      return res.status(400).json({ error: 'Thiếu thông tin' });
    }

    const datSan = await prisma.datSan.findUnique({
      where: { id_datsan: MaLichDat },
      include: { san: true },
    });
    if (!datSan) return res.status(404).json({ error: 'Không tìm thấy lịch đặt' });
    if (datSan.id_nguoidung !== req.user.userId) {
      return res.status(403).json({ error: 'Bạn không có quyền thanh toán cho lịch đặt này' });
    }

    let hoaDon = await ensureHoaDon(datSan);
    
    if (phuongThuc === 'TienMat') {
      hoaDon = await prisma.hoaDon.update({
        where: { id_hoadon: hoaDon.id_hoadon },
        data: { phuongthuc: 'TienMat' }
      });
      hoaDon.datSan = datSan;
      return res.status(200).json({ message: 'Đã lưu phương thức thanh toán tiền mặt', hoaDon });
    }

    if (hoaDon.trangthai === 'Đã thanh toán') {
      hoaDon.datSan = datSan;
      return res.status(200).json(mapThanhToanFromHoaDon(hoaDon));
    }

    hoaDon = await markPaid(hoaDon.id_hoadon, phuongThuc, MaLichDat);
    hoaDon.datSan = datSan;
    res.status(201).json(mapThanhToanFromHoaDon(hoaDon));
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Lỗi xử lý thanh toán trực tuyến' });
  }
};

const { createPaymentUrl, verifyReturnUrl } = require('../utils/vnpay');

exports.createVNPay = async (req, res) => {
  try {
    const { hoaDonId, bookingId, returnUrl } = req.body;
    let hoaDon = null;

    if (hoaDonId) {
      hoaDon = await prisma.hoaDon.findUnique({
        where: { id_hoadon: hoaDonId },
        include: { datSan: { include: { nguoiDung: true } } },
      });
      if (!hoaDon) return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
    } else if (bookingId) {
      const datSan = await prisma.datSan.findUnique({
        where: { id_datsan: bookingId },
        include: { san: true },
      });
      if (!datSan) return res.status(404).json({ error: 'Không tìm thấy lịch đặt sân' });
      hoaDon = await ensureHoaDon(datSan);
    } else {
      return res.status(400).json({ error: 'Thiếu mã hóa đơn hoặc mã lịch đặt sân' });
    }

    if (hoaDon.trangthai === 'Đã thanh toán') {
      return res.status(409).json({ error: 'Hóa đơn này đã được thanh toán' });
    }

    const ipAddr =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.connection?.remoteAddress ||
      '127.0.0.1';

    const orderInfo = `Thanh toan hoa don ${hoaDon.id_hoadon}`;
    const payUrl = createPaymentUrl(hoaDon.id_hoadon, dec(hoaDon.sotien), orderInfo, ipAddr, returnUrl);

    res.json({ payUrl, hoaDonId: hoaDon.id_hoadon });
  } catch (err) {
    console.error('createVNPay error:', err);
    res.status(500).json({ error: 'Lỗi tạo URL thanh toán VNPay' });
  }
};

exports.vnpayReturn = async (req, res) => {
  try {
    const vnpParams = req.query;
    const { isValid, responseCode } = verifyReturnUrl(vnpParams);
    const hoaDonId = vnpParams['vnp_TxnRef'];
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

    if (!isValid) {
      return res.redirect(`${CLIENT_URL}/payment/result?status=failed&reason=invalid_signature`);
    }

    if (responseCode === '00') {
      const hoaDon = await prisma.hoaDon.findUnique({ where: { id_hoadon: hoaDonId } });
      if (!hoaDon) {
        return res.redirect(`${CLIENT_URL}/payment/result?status=failed&reason=not_found`);
      }

      if (hoaDon.trangthai !== 'Đã thanh toán') {
        try {
          await markPaid(hoaDonId, 'VNPay', hoaDon.id_datsan);
        } catch (err) {
          const reason = err.statusCode === 409 ? 'conflict' : 'server_error';
          return res.redirect(`${CLIENT_URL}/payment/result?status=failed&reason=${reason}`);
        }
      }

      return res.redirect(`${CLIENT_URL}/payment/result?status=success&orderId=${hoaDonId}`);
    }

    await cancelUnpaidBookingByInvoice(hoaDonId, `Thanh toán VNPay thất bại: ${responseCode}`);
    return res.redirect(`${CLIENT_URL}/payment/result?status=failed&code=${responseCode}`);
  } catch (err) {
    console.error(err);
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${CLIENT_URL}/payment/result?status=failed&reason=server_error`);
  }
};

exports.vnpayIpn = async (req, res) => {
  try {
    const vnpParams = req.query;
    const { isValid, responseCode } = verifyReturnUrl(vnpParams);
    const hoaDonId = vnpParams['vnp_TxnRef'];

    if (!isValid) return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });

    const hoaDon = await prisma.hoaDon.findUnique({ where: { id_hoadon: hoaDonId } });
    if (!hoaDon) return res.status(200).json({ RspCode: '01', Message: 'Order not found' });

    if (hoaDon.trangthai === 'Đã thanh toán') return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });

    if (responseCode === '00') {
      try {
        await markPaid(hoaDonId, 'VNPay', hoaDon.id_datsan);
      } catch (err) {
        const message = err.statusCode === 409 ? 'Court time conflict' : 'Unknown error';
        return res.status(200).json({ RspCode: err.statusCode === 409 ? '94' : '99', Message: message });
      }
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      await cancelUnpaidBookingByInvoice(hoaDonId, `Thanh toán VNPay thất bại: ${responseCode}`);
      return res.status(200).json({ RspCode: '00', Message: 'Transaction Failed' });
    }
  } catch (err) {
    console.error('vnpayIpn error:', err);
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const hoaDon = await prisma.hoaDon.findUnique({
      where: { id_hoadon: req.params.id },
      include: {
        datSan: {
          include: {
            san: true,
            nguoiDung: true
          }
        }
      }
    });

    if (!hoaDon) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
    }
    
    // Kiểm tra quyền (chỉ admin hoặc chủ hóa đơn mới được tải)
    if (req.user.role !== 'Admin' && (!hoaDon.datSan || hoaDon.datSan.id_nguoidung !== req.user.userId)) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    generateInvoicePDF(hoaDon, res);
  } catch (err) {
    console.error('Lỗi khi xuất PDF:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

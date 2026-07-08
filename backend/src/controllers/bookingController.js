const prisma = require('../prismaClient');
const {
  mapDatSan,
  mapTrangThaiDatSan,
  mapTrangThaiDatSanToDb,
  parseDateOnly,
  parseTimeFromDate,
  combineDateTime,
  calcTongTien,
} = require('../utils/csdlMapper');
const { sendEmail } = require('../utils/emailService');
const { awardLoyaltyPoints, revokeLoyaltyPoints } = require('../utils/loyaltyPoints');

const LOCKED_STATUSES = ['Đã xác nhận', 'Hoàn thành'];

function normalizePaymentMethod(value) {
  const key = String(value || '').trim().toLowerCase();
  const methods = {
    tienmat: 'TienMat',
    cash: 'TienMat',
    vnpay: 'VNPay',
    momo: 'MoMo',
  };
  return methods[key] || null;
}

async function findLockedConflict({ tx = prisma, MaSan, ngaydat, giobatdau, gioketthuc, excludeId }) {
  return tx.datSan.findFirst({
    where: {
      id_san: MaSan,
      ngaydat,
      trangthai: { in: LOCKED_STATUSES },
      ...(excludeId ? { id_datsan: { not: excludeId } } : {}),
      AND: [{ giobatdau: { lt: gioketthuc } }, { gioketthuc: { gt: giobatdau } }],
    },
  });
}

exports.getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    const skip = (page - 1) * limit;
    const where = {};
    if (status) where.trangthai = mapTrangThaiDatSanToDb(status);
    if (date) where.ngaydat = parseDateOnly(date);

    const [rows, total] = await Promise.all([
      prisma.datSan.findMany({
        where,
        skip: parseInt(skip, 10),
        take: parseInt(limit, 10),
        include: { san: true, nguoiDung: { include: { thanhVienClb: true } }, hoaDon: true },
        orderBy: { ngaydat: 'desc' },
      }),
      prisma.datSan.count({ where }),
    ]);

    res.json({
      data: rows.map((r) => mapDatSan(r, r.san, r.nguoiDung)),
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách đặt sân' });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const rows = await prisma.datSan.findMany({
      where: { id_nguoidung: req.user.userId },
      include: { san: true, hoaDon: true },
      orderBy: { ngaydat: 'desc' },
    });
    res.json(rows.map((r) => mapDatSan({ ...r, hoaDon: r.hoaDon }, r.san)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { MaSan, NgayDat, GioBatDau, GioKetThuc, MaNguoiDung, SoDienThoai, PhuongThucThanhToan, VoucherCode } = req.body;
    if (!MaSan || !NgayDat || !GioBatDau || !GioKetThuc) {
      return res.status(400).json({ error: 'Thiếu thông tin đặt sân' });
    }

    const bookingUserId = req.user.role === 'Admin' && MaNguoiDung ? MaNguoiDung : req.user.userId;
    if (!bookingUserId) return res.status(400).json({ error: 'Thiếu thông tin khách hàng đặt sân' });

    const normalizedPhone = SoDienThoai !== undefined
      ? String(SoDienThoai).replace(/\D/g, '').trim()
      : null;
    if (SoDienThoai !== undefined && normalizedPhone.length > 15) {
      return res.status(400).json({ error: 'Số điện thoại tối đa 15 chữ số' });
    }

    const san = await prisma.san.findUnique({ where: { id_san: MaSan } });
    if (!san) return res.status(404).json({ error: 'Sân không tồn tại' });
    if (san.trangthai === 'Bảo trì') return res.status(400).json({ error: 'Sân đang bảo trì' });

    const nguoiDung = await prisma.nguoiDung.findUnique({ where: { id_nguoidung: bookingUserId } });
    if (!nguoiDung) return res.status(404).json({ error: 'Khách hàng không tồn tại' });

    const ngaydat = parseDateOnly(NgayDat);
    const giobatdau = parseTimeFromDate(GioBatDau);
    const gioketthuc = parseTimeFromDate(GioKetThuc);
    const phuongThuc = normalizePaymentMethod(PhuongThucThanhToan);

    const conflict = await findLockedConflict({ MaSan, ngaydat, giobatdau, gioketthuc });
    if (conflict) {
      return res.status(409).json({ error: 'Sân đã có người đặt trong khung giờ này' });
    }

    const booking = await prisma.$transaction(async (tx) => {
      if (normalizedPhone && nguoiDung.sdt !== normalizedPhone) {
        await tx.nguoiDung.update({
          where: { id_nguoidung: bookingUserId },
          data: { sdt: normalizedPhone },
        });
      }

      let finalTongTien = calcTongTien({ ngaydat, giobatdau, gioketthuc, nguoiDung }, san);
      
      // Apply voucher if valid
      if (VoucherCode) {
        const voucher = await tx.khuyenMai.findUnique({ where: { makhuyenmai: VoucherCode } });
        if (voucher && (voucher.trangthai === 'Đang diễn ra' || voucher.trangthai === 'Sắp diễn ra') && voucher.soluong > 0) {
          const discountAmt = finalTongTien * (Number(voucher.phantramgiam) / 100);
          const actualDiscount = Math.min(discountAmt, Number(voucher.giamtoida || 99999999));
          finalTongTien = Math.max(0, finalTongTien - actualDiscount);
          
          await tx.khuyenMai.update({
            where: { id_khuyenmai: voucher.id_khuyenmai },
            data: { soluong: voucher.soluong - 1 }
          });
        }
      }

      return tx.datSan.create({
        data: {
          id_nguoidung: bookingUserId,
          id_san: MaSan,
          ngaydat,
          giobatdau,
          gioketthuc,
          trangthai: 'Chờ xác nhận',
          ...(phuongThuc === 'TienMat'
            ? {
              hoaDon: {
                create: {
                  sotien: finalTongTien,
                  phuongthuc: 'TienMat',
                  trangthai: 'Chưa thanh toán',
                  ngaythanhtoan: null,
                },
              },
            }
            : {}),
        },
        include: { san: true, hoaDon: true },
      });
    });

    res.status(201).json(mapDatSan(booking, booking.san));

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to(`court_${MaSan}`).emit('booking_updated', { courtId: MaSan });
    }

    // Thêm thông báo cho khách hàng
    const formattedDate = new Date(ngaydat).toLocaleDateString('vi-VN');
    await prisma.thongBao.create({
      data: {
        id_nguoidung: bookingUserId,
        tieude: 'Gửi yêu cầu đặt sân thành công',
        noidung: `Lịch đặt ${san.tensan} vào ngày ${formattedDate} đã được gửi và đang chờ Admin xác nhận.`,
        loai: 'booking',
        link: '/my-bookings'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tạo đặt sân' });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const existing = await prisma.datSan.findUnique({ where: { id_datsan: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy lịch đặt' });

    const conflict = await findLockedConflict({
      MaSan: existing.id_san,
      ngaydat: existing.ngaydat,
      giobatdau: existing.giobatdau,
      gioketthuc: existing.gioketthuc,
      excludeId: req.params.id,
    });
    if (conflict) {
      return res.status(409).json({ error: 'Sân đã có lịch được duyệt trong khung giờ này' });
    }

    const updated = await prisma.datSan.update({
      where: { id_datsan: req.params.id },
      data: { trangthai: 'Đã xác nhận' },
      include: { san: true, nguoiDung: { include: { thanhVienClb: true } } },
    });

    await awardLoyaltyPoints({
      userId: updated.id_nguoidung,
      sourceType: 'booking',
      sourceId: updated.id_datsan,
      amount: calcTongTien(updated, updated.san),
    });

    res.json(mapDatSan(updated, updated.san));

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to(`court_${updated.id_san}`).emit('booking_updated', { courtId: updated.id_san });
    }

    // Thêm thông báo cho khách hàng
    if (updated.id_nguoidung) {
      await prisma.thongBao.create({
        data: {
          id_nguoidung: updated.id_nguoidung,
          tieude: 'Xác nhận đặt sân',
          noidung: `Lịch đặt sân ${updated.san.tensan} của bạn đã được xác nhận.`,
          loai: 'booking_confirm',
          link: '/my-bookings'
        }
      });
      
      // Gửi email
      if (updated.nguoiDung && updated.nguoiDung.email) {
        const emailHtml = `
          <h3>Xác nhận đặt sân thành công</h3>
          <p>Xin chào <strong>${updated.nguoiDung.hoten}</strong>,</p>
          <p>Admin đã xác nhận lịch đặt sân của bạn.</p>
          <ul>
            <li><strong>Sân:</strong> ${updated.san.tensan}</li>
            <li><strong>Ngày:</strong> ${new Date(updated.ngaydat).toLocaleDateString('vi-VN')}</li>
            <li><strong>Khung giờ:</strong> ${new Date(updated.giobatdau).toLocaleTimeString('vi-VN')} - ${new Date(updated.gioketthuc).toLocaleTimeString('vi-VN')}</li>
          </ul>
          <p>Vui lòng đến đúng giờ nhé!</p>
        `;
        sendEmail(updated.nguoiDung.email, 'Xác nhận đặt sân - Cầu Lông 84', emailHtml).catch(console.error);
      }
    }
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xác nhận' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const booking = await prisma.datSan.findUnique({ where: { id_datsan: req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Không tìm thấy lịch đặt' });

    if (req.user.role !== 'Admin' && booking.id_nguoidung !== req.user.userId) {
      return res.status(403).json({ error: 'Không có quyền hủy lịch này' });
    }
    if (req.user.role !== 'Admin' && LOCKED_STATUSES.includes(booking.trangthai)) {
      return res.status(400).json({ error: 'Lịch đã được duyệt, vui lòng liên hệ sân để hủy' });
    }

    const updated = await prisma.datSan.update({
      where: { id_datsan: req.params.id },
      data: { 
        trangthai: 'Đã hủy',
        ...(reason ? { ghichu: reason } : {})
      },
    });

    await revokeLoyaltyPoints({ sourceType: 'booking', sourceId: booking.id_datsan });

    res.json(mapDatSan(updated));

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to(`court_${updated.id_san}`).emit('booking_updated', { courtId: updated.id_san });
    }

    // Thêm thông báo cho khách hàng
    if (booking.id_nguoidung) {
      await prisma.thongBao.create({
        data: {
          id_nguoidung: booking.id_nguoidung,
          tieude: 'Hủy đặt sân',
          noidung: `Lịch đặt sân của bạn đã bị hủy${reason ? ` với lý do: ${reason}` : ''}.`,
          loai: 'booking_cancel',
          link: '/my-bookings'
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi hủy đặt sân' });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    const booking = await prisma.datSan.findUnique({ where: { id_datsan: req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Không tìm thấy lịch đặt' });

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.datSan.update({
        where: { id_datsan: req.params.id },
        data: { trangthai: 'Hoàn thành' },
        include: { san: true }
      });
      
      // Update court status to Trong
      await tx.san.update({
        where: { id_san: b.id_san },
        data: { trangthai: 'Trong' }
      });
      return b;
    });

    res.json(mapDatSan(updated, updated.san));

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to(`court_${updated.id_san}`).emit('booking_updated', { courtId: updated.id_san });
      global.io.emit('court_status_changed', { courtId: updated.id_san, status: 'Trong' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi trả sân' });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { MaSan, NgayDat, GioBatDau, GioKetThuc, TrangThai, GhiChu, TrangThaiThanhToan } = req.body;
    const existing = await prisma.datSan.findUnique({ where: { id_datsan: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy lịch đặt' });

    const data = {};
    if (MaSan) data.id_san = MaSan;
    if (NgayDat) data.ngaydat = parseDateOnly(NgayDat);
    if (GioBatDau) data.giobatdau = parseTimeFromDate(GioBatDau);
    if (GioKetThuc) data.gioketthuc = parseTimeFromDate(GioKetThuc);
    if (GhiChu !== undefined) data.ghichu = GhiChu;
    if (TrangThai) {
      const statusMap = {
        ChoXacNhan: 'Chờ xác nhận',
        DaXacNhan: 'Đã xác nhận',
        DaHuy: 'Đã hủy',
        HoanThanh: 'Hoàn thành',
      };
      data.trangthai = statusMap[TrangThai] || TrangThai;
    }

    const nextTrangThai = data.trangthai ?? existing.trangthai;
    if (LOCKED_STATUSES.includes(nextTrangThai)) {
      const conflict = await findLockedConflict({
        MaSan: data.id_san ?? existing.id_san,
        ngaydat: data.ngaydat ?? existing.ngaydat,
        giobatdau: data.giobatdau ?? existing.giobatdau,
        gioketthuc: data.gioketthuc ?? existing.gioketthuc,
        excludeId: req.params.id,
      });
      if (conflict) {
        return res.status(409).json({ error: 'Sân đã có lịch được duyệt trong khung giờ này' });
      }
    }

    let updated = await prisma.datSan.update({
      where: { id_datsan: req.params.id },
      data,
      include: { san: true, nguoiDung: { include: { thanhVienClb: true } }, hoaDon: true },
    });

    // ── Cộng điểm tích lũy idempotent: mỗi lịch đặt chỉ cộng một lần ──
    const newStatus = data.trangthai;
    const oldStatus = existing.trangthai;
    const shouldAwardByStatus =
      newStatus &&
      (newStatus === 'Hoàn thành' || newStatus === 'Đã xác nhận') &&
      oldStatus !== 'Hoàn thành' && oldStatus !== 'Đã xác nhận' &&
      updated.id_nguoidung;

    if (shouldAwardByStatus) {
      const tongTien = calcTongTien(updated, updated.san);
      await awardLoyaltyPoints({
        userId: updated.id_nguoidung,
        sourceType: 'booking',
        sourceId: updated.id_datsan,
        amount: tongTien,
      });
    }

    if (TrangThaiThanhToan) {
      const hdStatus = TrangThaiThanhToan === 'DaThanhToan' ? 'Đã thanh toán' : 'Chưa thanh toán';
      const existingHd = await prisma.hoaDon.findUnique({ where: { id_datsan: req.params.id } });
      if (existingHd) {
        await prisma.hoaDon.update({
          where: { id_hoadon: existingHd.id_hoadon },
          data: {
            trangthai: hdStatus,
            phuongthuc: TrangThaiThanhToan === 'DaThanhToan' ? (existingHd.phuongthuc || 'TienMat') : null,
            ngaythanhtoan: TrangThaiThanhToan === 'DaThanhToan' ? (existingHd.ngaythanhtoan || new Date()) : null,
          }
        });
      } else {
        const tong = calcTongTien(updated, updated.san);
        await prisma.hoaDon.create({
          data: {
            id_datsan: req.params.id,
            sotien: tong,
            trangthai: hdStatus,
            phuongthuc: TrangThaiThanhToan === 'DaThanhToan' ? 'TienMat' : null,
            ngaythanhtoan: TrangThaiThanhToan === 'DaThanhToan' ? new Date() : null,
          }
        });
      }

      // ── Thanh toán xong cũng được cộng điểm, nhưng ledger chặn cộng lặp ──
      if (TrangThaiThanhToan === 'DaThanhToan' && updated.id_nguoidung) {
        const tongTien = calcTongTien(updated, updated.san);
        await awardLoyaltyPoints({
          userId: updated.id_nguoidung,
          sourceType: 'booking',
          sourceId: updated.id_datsan,
          amount: tongTien,
        });
      }

      updated = await prisma.datSan.findUnique({
        where: { id_datsan: req.params.id },
        include: { san: true, nguoiDung: { include: { thanhVienClb: true } }, hoaDon: true }
      });
    }

    res.json(mapDatSan(updated, updated.san, updated.nguoiDung));

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to(`court_${updated.id_san}`).emit('booking_updated', { courtId: updated.id_san });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi cập nhật đặt sân' });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const existing = await prisma.datSan.findUnique({ where: { id_datsan: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy lịch đặt' });
    await revokeLoyaltyPoints({ sourceType: 'booking', sourceId: existing.id_datsan });
    await prisma.hoaDon.deleteMany({ where: { id_datsan: req.params.id } });
    await prisma.datSan.delete({ where: { id_datsan: req.params.id } });
    res.json({ message: 'Đã xóa lịch đặt sân thành công' });

    // Emit socket event for real-time update
    if (global.io) {
      global.io.to(`court_${existing.id_san}`).emit('booking_updated', { courtId: existing.id_san });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi xóa lịch đặt' });
  }
};

exports.getBusySlots = async (req, res) => {
  try {
    const { courtId, date } = req.query;
    if (!courtId || !date) {
      return res.status(400).json({ error: 'Thiếu thông tin courtId hoặc date' });
    }

    const ngaydat = parseDateOnly(date);
    const bookings = await prisma.datSan.findMany({
      where: {
        id_san: courtId,
        ngaydat,
        trangthai: { in: LOCKED_STATUSES },
      },
    });

    res.json(
      bookings.map((b) => ({
        MaLichDat: b.id_datsan,
        MaKhachHang: b.id_nguoidung,
        GioBatDau: combineDateTime(b.ngaydat, b.giobatdau),
        GioKetThuc: combineDateTime(b.ngaydat, b.gioketthuc),
        TrangThai: mapTrangThaiDatSan(b.trangthai),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi lấy lịch bận của sân' });
  }
};

exports.getAllBusySlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Thiếu thông tin date' });
    }

    const ngaydat = parseDateOnly(date);
    const bookings = await prisma.datSan.findMany({
      where: {
        ngaydat,
        trangthai: { in: LOCKED_STATUSES },
      },
    });

    res.json(
      bookings.map((b) => ({
        MaLichDat: b.id_datsan,
        MaSan: b.id_san,
        MaKhachHang: b.id_nguoidung,
        GioBatDau: combineDateTime(b.ngaydat, b.giobatdau),
        GioKetThuc: combineDateTime(b.ngaydat, b.gioketthuc),
        TrangThai: mapTrangThaiDatSan(b.trangthai),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi lấy lịch bận của tất cả sân' });
  }
};

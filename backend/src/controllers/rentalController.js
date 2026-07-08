const prisma = require('../prismaClient');
const { awardLoyaltyPoints, revokeLoyaltyPoints } = require('../utils/loyaltyPoints');
const { getDiscountPercent } = require('../utils/csdlMapper');
const { sendNotification } = require('../utils/notificationService');

function dec(n) {
  if (n == null) return null;
  return typeof n === 'object' && n.toNumber ? n.toNumber() : Number(n);
}

// Danh mục không tính giảm số lượng (khóa học, dịch vụ vô hạn)
const UNLIMITED_CATEGORIES = [];
const UNLIMITED_KEYWORDS   = ['khóa học', 'lớp học', 'hlv', 'huấn luyện'];

function isUnlimited(item) {
  if (UNLIMITED_CATEGORIES.includes(item.danhmuc)) return true;
  const name = (item.tendichvu || '').toLowerCase();
  return UNLIMITED_KEYWORDS.some(k => name.includes(k));
}

function mapProduct(row) {
  return {
    MaSanPham:  row.id_dichvu,
    TenSanPham: row.tendichvu,
    DanhMuc:    row.danhmuc  || 'Giay',
    DanhMucCon: row.danhmuccon || '',
    MoTa:       row.mota     || '',
    HinhAnh:    row.hinhanh  || '',
    Gia:        dec(row.gia) ?? 0,
    GiaThue:    dec(row.giathue),
    SoLuong:    row.soluong  ?? 0,
    TrangThai:  row.trangthai || 'ConHang',
  };
}

function mapOrder(row) {
  return {
    MaDonThue:   row.id_donthue,
    MaNguoiDung: row.id_nguoidung,
    MaSanPham:   row.id_dichvu,
    TenSanPham:  row.tendichvu  || '',
    HinhAnh:     row.hinhanh    || '',
    SoLuong:     row.soluong    ?? 1,
    SoGio:       dec(row.sogio),
    TongTien:    dec(row.tongtien) ?? 0,
    GhiChu:      row.ghichu     || '',
    TrangThai:   row.trangthai  || 'DangThue',
    NgayTao:     row.ngaytao,
  };
}

// ── GET /rentals/available ──────────────────────────────
exports.getAvailable = async (_req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM dichvu
       WHERE trangthai = 'ConHang'
         AND soluong > 0
         AND giathue IS NOT NULL
         AND giathue > 0
       ORDER BY danhmuc, tendichvu`
    );
    res.json(rows.map(mapProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách sản phẩm' });
  }
};

// ── POST /rentals/order ─────────────────────────────────
// Khi khách đặt thuê → giảm soluong (trừ khóa học)
exports.createOrder = async (req, res) => {
  try {
    const { MaSanPham, SoLuong = 1, SoGioThue, GhiChu } = req.body;
    if (!MaSanPham) return res.status(400).json({ error: 'Thiếu mã sản phẩm' });

    const qty = Math.max(1, parseInt(SoLuong, 10));

    // Lấy thông tin sản phẩm
    const items = await prisma.$queryRawUnsafe(
      `SELECT * FROM dichvu WHERE id_dichvu = $1::uuid`, MaSanPham
    );
    if (!items.length) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    const item = items[0];

    if (item.trangthai === 'HetHang') {
      return res.status(400).json({ error: 'Sản phẩm đã hết hàng' });
    }

    // Kiểm tra tồn kho (trừ dịch vụ vô hạn)
    if (!isUnlimited(item) && item.soluong < qty) {
      return res.status(400).json({ error: `Chỉ còn ${item.soluong} sản phẩm trong kho` });
    }

    const soGio = parseFloat(SoGioThue);
    if (!Number.isFinite(soGio) || soGio <= 0) {
      return res.status(400).json({ error: 'Vui lòng chọn số giờ thuê hợp lệ' });
    }

    const hourlyPrice = dec(item.giathue);
    if (!hourlyPrice || hourlyPrice <= 0) {
      return res.status(400).json({ error: 'Sản phẩm chưa có giá thuê' });
    }
    let tongTien = hourlyPrice * qty * soGio;

    // Apply membership discount if applicable
    const member = await prisma.$queryRawUnsafe(
      `SELECT capbac, trangthai FROM thanhvienclb WHERE id_nguoidung = $1::uuid AND trangthai = 'Hoạt động'`,
      req.user.userId
    );
    if (member && member.length > 0) {
      const discount = getDiscountPercent(member[0].capbac);
      if (discount > 0) {
        tongTien = tongTien * (1 - discount / 100);
      }
    }

    // Tạo đơn thuê — trạng thái ChoDuyet, chờ Admin duyệt
    const orders = await prisma.$queryRawUnsafe(
      `INSERT INTO donthue (id_nguoidung, id_dichvu, soluong, sogio, tongtien, ghichu, trangthai)
       VALUES ($1::uuid, $2::uuid, $3, CAST($4 AS DECIMAL), CAST($5 AS DECIMAL), $6, 'ChoDuyet')
       RETURNING *`,
      req.user.userId,
      MaSanPham,
      qty,
      soGio,
      tongTien,
      GhiChu || null
    );

    // Lấy tên sản phẩm để trả về
    const order = { ...orders[0], tendichvu: item.tendichvu };

    // Tạo thông báo chờ duyệt — gửi realtime qua Socket.io
    const ghiChuText = GhiChu ? ` | Ghi chú: ${GhiChu}` : '';
    await sendNotification({
      userId: req.user.userId,
      type: 'rental',
      title: '⏳ Đặt thuê thành công — Chờ xác nhận',
      content: `Bạn đã đặt thuê "${item.tendichvu}" — SL: ${qty}, Thời gian: ${soGio} giờ, Tổng tiền: ${tongTien.toLocaleString('vi-VN')}đ${ghiChuText}. Đơn đang chờ xác nhận.`,
      link: '/my-rentals'
    });

    res.status(201).json(mapOrder(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tạo đơn thuê' });
  }
};

// ── PUT /rentals/:id/approve ────────────────────────────
// Admin duyệt đơn ChoDuyet → DangThue, lúc này mới trừ kho và cộng điểm
exports.approveOrder = async (req, res) => {
  try {
    // Lấy đơn thuê kèm thông tin sản phẩm
    const existing = await prisma.$queryRawUnsafe(
      `SELECT dt.*, dv.tendichvu, dv.danhmuc, dv.soluong as dv_soluong
       FROM donthue dt
       LEFT JOIN dichvu dv ON dv.id_dichvu = dt.id_dichvu
       WHERE dt.id_donthue = $1::uuid`,
      req.params.id
    );
    if (!existing.length) return res.status(404).json({ error: 'Không tìm thấy đơn thuê' });

    const order = existing[0];

    if (order.trangthai !== 'ChoDuyet') {
      return res.status(400).json({ error: 'Chỉ có thể duyệt đơn đang ở trạng thái chờ duyệt' });
    }

    const qty = order.soluong ?? 1;

    // Kiểm tra tồn kho (trừ dịch vụ vô hạn)
    if (!isUnlimited(order) && order.dv_soluong < qty) {
      return res.status(400).json({ error: `Không đủ tồn kho. Còn ${order.dv_soluong} sản phẩm.` });
    }

    // Cập nhật trạng thái → DangThue
    const updated = await prisma.$queryRawUnsafe(
      `UPDATE donthue SET trangthai = 'DangThue' WHERE id_donthue = $1::uuid RETURNING *`,
      req.params.id
    );

    // Giảm số lượng tồn kho (trừ dịch vụ vô hạn)
    if (!isUnlimited(order)) {
      const newQty = order.dv_soluong - qty;
      await prisma.$executeRawUnsafe(
        `UPDATE dichvu SET soluong = $1, trangthai = CASE WHEN $1 <= 0 THEN 'HetHang' ELSE 'ConHang' END
         WHERE id_dichvu = $2::uuid`,
        newQty, order.id_dichvu
      );
    }

    // Cộng điểm tích lũy
    await awardLoyaltyPoints({
      userId: order.id_nguoidung,
      sourceType: 'rental',
      sourceId: order.id_donthue,
      amount: dec(order.tongtien) || 0,
    });

    // Thông báo cho khách hàng qua Notification — gửi realtime qua Socket.io
    const approvedTotal = dec(order.tongtien) || 0;
    const approvedHours = dec(order.sogio) || 0;
    await sendNotification({
      userId: order.id_nguoidung,
      type: 'rental',
      title: '✅ Đơn thuê đã được duyệt',
      content: `Đơn thuê "${order.tendichvu}" (SL: ${qty}, ${approvedHours} giờ, ${approvedTotal.toLocaleString('vi-VN')}đ) đã được xác nhận. Vui lòng đến quầy nhận đồ!`,
      link: '/my-rentals'
    });

    // Gửi Email thông báo
    const userResult = await prisma.$queryRawUnsafe(
      `SELECT email, hoten, tendangnhap FROM nguoidung WHERE id_nguoidung = $1::uuid`,
      order.id_nguoidung
    );
    if (userResult && userResult.length > 0 && userResult[0].email) {
      const emailHtml = `
        <h3>Đơn thuê dụng cụ của bạn đã được duyệt</h3>
        <p>Xin chào <strong>${userResult[0].hoten || userResult[0].tendangnhap}</strong>,</p>
        <p>Admin vừa xác nhận đơn thuê dụng cụ của bạn.</p>
        <ul>
          <li><strong>Dụng cụ/Dịch vụ:</strong> ${order.tendichvu}</li>
          <li><strong>Số lượng:</strong> ${qty}</li>
        </ul>
        <p>Vui lòng đến quầy để nhận đồ nhé!</p>
      `;
      const { sendEmail } = require('../utils/emailService');
      sendEmail(userResult[0].email, 'Duyệt đơn thuê dụng cụ - Cầu Lông 84', emailHtml).catch(console.error);
    }

    res.json({ ...mapOrder(updated[0]), tendichvu: order.tendichvu });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi duyệt đơn thuê' });
  }
};

// ── GET /rentals/my-orders ──────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT dt.*, dv.tendichvu, dv.danhmuc, dv.giathue, dv.gia, dv.hinhanh
       FROM donthue dt
       LEFT JOIN dichvu dv ON dv.id_dichvu = dt.id_dichvu
       WHERE dt.id_nguoidung = $1::uuid
       ORDER BY dt.ngaytao DESC`,
      req.user.userId
    );
    res.json(rows.map(mapOrder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ── GET /rentals/admin/all ──────────────────────────────
exports.getAllOrders = async (_req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT dt.*, dv.tendichvu, dv.danhmuc, nd.hoten, nd.email
       FROM donthue dt
       LEFT JOIN dichvu   dv ON dv.id_dichvu    = dt.id_dichvu
       LEFT JOIN nguoidung nd ON nd.id_nguoidung = dt.id_nguoidung
       ORDER BY dt.ngaytao DESC`
    );
    res.json(rows.map(r => ({
      ...mapOrder(r),
      KhachHang: { HoTen: r.hoten || '', Email: r.email || '' },
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ── PUT /rentals/:id/return ─────────────────────────────
// Admin đánh dấu đã trả hàng → hoàn lại tồn kho
exports.returnItem = async (req, res) => {
  try {
    // Lấy đơn thuê kèm thông tin sản phẩm
    const existing = await prisma.$queryRawUnsafe(
      `SELECT dt.*, dv.tendichvu, dv.danhmuc, dv.soluong as dv_soluong
       FROM donthue dt
       LEFT JOIN dichvu dv ON dv.id_dichvu = dt.id_dichvu
       WHERE dt.id_donthue = $1::uuid`,
      req.params.id
    );
    if (!existing.length) return res.status(404).json({ error: 'Không tìm thấy đơn thuê' });

    const order = existing[0];

    if (order.trangthai !== 'DangThue') {
      return res.status(400).json({ error: 'Chỉ có thể xác nhận trả đồ cho đơn đang thuê' });
    }

    // Cập nhật trạng thái → DaTraHang
    const orders = await prisma.$queryRawUnsafe(
      `UPDATE donthue SET trangthai = 'DaTraHang' WHERE id_donthue = $1::uuid RETURNING *`,
      req.params.id
    );

    // Cộng lại số lượng tồn kho (trừ dịch vụ vô hạn)
    if (!isUnlimited(order)) {
      const qty = order.soluong ?? 1;
      await prisma.$executeRawUnsafe(
        `UPDATE dichvu
         SET soluong   = soluong + $1,
             trangthai = 'ConHang'
         WHERE id_dichvu = $2::uuid`,
        qty,
        order.id_dichvu
      );
    }

    // Thông báo cho khách hàng — gửi realtime qua Socket.io
    if (order.id_nguoidung) {
      await sendNotification({
        userId: order.id_nguoidung,
        type: 'rental',
        title: '📦 Đơn thuê đã xử lý xong',
        content: `Admin đã xác nhận bạn trả đồ "${order.tendichvu}". Cảm ơn bạn đã sử dụng dịch vụ!`,
        link: '/my-rentals'
      });
    }

    res.json(mapOrder(orders[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ── PUT /rentals/:id/cancel ─────────────────────────────
// Khách hủy đơn → cộng lại số lượng tồn kho
exports.cancelOrder = async (req, res) => {
  try {
    // Lấy đơn thuê
    const existing = await prisma.$queryRawUnsafe(
      `SELECT dt.*, dv.tendichvu, dv.danhmuc, dv.soluong as dv_soluong
       FROM donthue dt
       LEFT JOIN dichvu dv ON dv.id_dichvu = dt.id_dichvu
       WHERE dt.id_donthue = $1::uuid`,
      req.params.id
    );
    if (!existing.length) return res.status(404).json({ error: 'Không tìm thấy đơn thuê' });

    const order = existing[0];

    // Chỉ cho hủy nếu đang ở trạng thái ChoDuyet hoặc DangThue
    if (order.trangthai !== 'DangThue' && order.trangthai !== 'ChoDuyet') {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn đang chờ duyệt hoặc đang thuê' });
    }

    // Kiểm tra quyền: chỉ chủ đơn hoặc admin
    if (req.user.role !== 'Admin' && order.id_nguoidung !== req.user.userId) {
      return res.status(403).json({ error: 'Không có quyền hủy đơn này' });
    }

    // Cập nhật trạng thái đơn → Đã hủy
    const updated = await prisma.$queryRawUnsafe(
      `UPDATE donthue SET trangthai = 'DaHuy' WHERE id_donthue = $1::uuid RETURNING *`,
      req.params.id
    );

    await revokeLoyaltyPoints({ sourceType: 'rental', sourceId: order.id_donthue });

    // Chỉ hoàn tồn kho nếu đơn đã được duyệt (DangThue), không hoàn khi còn ChoDuyet
    if (order.trangthai === 'DangThue' && !isUnlimited(order)) {
      await prisma.$executeRawUnsafe(
        `UPDATE dichvu
         SET soluong   = soluong + $1,
             trangthai = 'ConHang'
         WHERE id_dichvu = $2::uuid`,
        order.soluong,
        order.id_dichvu
      );
    }

    const cancelMsg = order.trangthai === 'DangThue'
      ? `Đơn thuê "${order.tendichvu}" của bạn đã bị hủy và hoàn lại tồn kho.`
      : `Đơn đặt thuê "${order.tendichvu}" của bạn đã bị hủy.`;

    // Thông báo cho khách hàng — gửi realtime qua Socket.io
    if (order.id_nguoidung) {
      await sendNotification({
        userId: order.id_nguoidung,
        type: 'rental',
        title: '❌ Đơn thuê đã bị hủy',
        content: cancelMsg,
        link: '/my-rentals'
      });
    }

    res.json({ ...mapOrder(updated[0]), message: order.trangthai === 'DangThue' ? 'Đã hủy đơn và hoàn lại tồn kho' : 'Đã hủy đơn chờ duyệt' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi hủy đơn' });
  }
};

// ── DELETE /rentals/:id ─────────────────────────────────
// Admin xóa đơn thuê khỏi hệ thống, hoàn kho nếu đang DangThue
exports.deleteOrder = async (req, res) => {
  try {
    const existing = await prisma.$queryRawUnsafe(
      `SELECT dt.*, dv.tendichvu, dv.danhmuc
       FROM donthue dt
       LEFT JOIN dichvu dv ON dv.id_dichvu = dt.id_dichvu
       WHERE dt.id_donthue = $1::uuid`,
      req.params.id
    );
    if (!existing.length) return res.status(404).json({ error: 'Không tìm thấy đơn thuê' });

    const order = existing[0];

    // Hoàn lại tồn kho nếu đơn đang ở trạng thái DangThue
    if (order.trangthai === 'DangThue' && !isUnlimited(order)) {
      await prisma.$executeRawUnsafe(
        `UPDATE dichvu
         SET soluong   = soluong + $1,
             trangthai = 'ConHang'
         WHERE id_dichvu = $2::uuid`,
        order.soluong ?? 1,
        order.id_dichvu
      );
    }

    // Thu hồi điểm tích lũy (nếu có)
    await revokeLoyaltyPoints({ sourceType: 'rental', sourceId: order.id_donthue });

    // Xóa đơn
    await prisma.$executeRawUnsafe(
      `DELETE FROM donthue WHERE id_donthue = $1::uuid`,
      req.params.id
    );

    res.json({ message: 'Đã xóa đơn thuê thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi xóa đơn thuê' });
  }
};

// ── POST /rentals/:id/notify ────────────────────────────
// Admin gửi thông báo tùy chỉnh cho khách hàng
exports.notifyCustomer = async (req, res) => {
  try {
    const { tieude, noidung } = req.body;
    if (!tieude || !noidung) {
      return res.status(400).json({ error: 'Thiếu tiêu đề hoặc nội dung thông báo' });
    }

    const existing = await prisma.$queryRawUnsafe(
      `SELECT dt.*, dv.tendichvu FROM donthue dt
       LEFT JOIN dichvu dv ON dv.id_dichvu = dt.id_dichvu
       WHERE dt.id_donthue = $1::uuid`,
      req.params.id
    );
    if (!existing.length) return res.status(404).json({ error: 'Không tìm thấy đơn thuê' });

    const order = existing[0];
    if (!order.id_nguoidung) return res.status(400).json({ error: 'Đơn thuê không có khách hàng' });

    await sendNotification({
      userId: order.id_nguoidung,
      type: 'rental',
      title: tieude,
      content: noidung,
      link: '/my-rentals'
    });

    res.json({ message: 'Đã gửi thông báo cho khách hàng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi gửi thông báo' });
  }
};

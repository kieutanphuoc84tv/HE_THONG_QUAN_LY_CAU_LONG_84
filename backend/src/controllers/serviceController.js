const prisma = require('../prismaClient');

let serviceColumnsReady = false;

async function ensureServiceColumns() {
  if (serviceColumnsReady) return;
  await prisma.$executeRawUnsafe(`ALTER TABLE dichvu ADD COLUMN IF NOT EXISTS hinhanh TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE dichvu ADD COLUMN IF NOT EXISTS danhmuccon VARCHAR(80)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE dichvu ADD COLUMN IF NOT EXISTS ngaytao TIMESTAMP DEFAULT NOW()`);
  serviceColumnsReady = true;
}

function dec(n) {
  if (n == null) return null;
  return typeof n === 'object' && n.toNumber ? n.toNumber() : Number(n);
}

function mapService(row) {
  return {
    MaDichVu:  row.id_dichvu,
    TenDichVu: row.tendichvu,
    DanhMuc:   row.danhmuc   || 'Giay',
    DanhMucCon: row.danhmuccon || '',
    MoTa:      row.mota      || '',
    HinhAnh:   row.hinhanh   || '',
    Gia:       dec(row.gia)  ?? 0,
    GiaThue:   dec(row.giathue),
    SoLuong:   row.soluong   ?? 0,
    TrangThai: row.trangthai || 'ConHang',
    NgayTao:   row.ngaytao,
  };
}

exports.getAllServices = async (_req, res) => {
  try {
    await ensureServiceColumns();
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM dichvu ORDER BY ngaytao DESC`
    );
    res.json(rows.map(mapService));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi lấy dịch vụ' });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    await ensureServiceColumns();
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM dichvu WHERE id_dichvu = $1::uuid`,
      req.params.id
    );
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    res.json(mapService(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.createService = async (req, res) => {
  try {
    await ensureServiceColumns();
    const { TenDichVu, DanhMuc, DanhMucCon, MoTa, HinhAnh, Gia, GiaThue, SoLuong, TrangThai } = req.body;
    if (!TenDichVu) return res.status(400).json({ error: 'Thiếu tên dịch vụ' });
    if (GiaThue == null || Number(GiaThue) <= 0) {
      return res.status(400).json({ error: 'Thiếu giá thuê/giờ hợp lệ' });
    }

    const normalizedDanhMuc = DanhMuc || 'Giay';
    const normalizedDanhMucCon = DanhMucCon || null;

    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO dichvu (tendichvu, danhmuc, danhmuccon, mota, hinhanh, gia, giathue, soluong, trangthai)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      TenDichVu,
      normalizedDanhMuc,
      normalizedDanhMucCon,
      MoTa      || null,
      HinhAnh   || null,
      Number(Gia) || 0,
      GiaThue   != null ? Number(GiaThue) : null,
      Number(SoLuong) || 0,
      TrangThai || 'ConHang'
    );
    res.status(201).json(mapService(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi tạo dịch vụ' });
  }
};

exports.updateService = async (req, res) => {
  try {
    await ensureServiceColumns();
    const { TenDichVu, DanhMuc, DanhMucCon, MoTa, HinhAnh, Gia, GiaThue, SoLuong, TrangThai } = req.body;
    if (Object.prototype.hasOwnProperty.call(req.body, 'GiaThue') && (GiaThue == null || Number(GiaThue) <= 0)) {
      return res.status(400).json({ error: 'Thiếu giá thuê/giờ hợp lệ' });
    }

    const shouldUpdateDanhMucCon = Object.prototype.hasOwnProperty.call(req.body, 'DanhMucCon')
      || Object.prototype.hasOwnProperty.call(req.body, 'DanhMuc');
    let normalizedDanhMucCon = DanhMucCon || null;

    const rows = await prisma.$queryRawUnsafe(
      `UPDATE dichvu
       SET tendichvu = COALESCE($1, tendichvu),
           danhmuc   = COALESCE($2, danhmuc),
           danhmuccon = CASE WHEN $3 THEN $4 ELSE danhmuccon END,
           mota      = $5,
           hinhanh   = $6,
           gia       = COALESCE($7, gia),
           giathue   = $8,
           soluong   = COALESCE($9, soluong),
           trangthai = COALESCE($10, trangthai)
       WHERE id_dichvu = $11::uuid
       RETURNING *`,
      TenDichVu || null,
      DanhMuc   || null,
      shouldUpdateDanhMucCon,
      shouldUpdateDanhMucCon ? normalizedDanhMucCon : null,
      MoTa      ?? null,
      HinhAnh   ?? null,
      Gia       != null ? Number(Gia) : null,
      GiaThue   != null ? Number(GiaThue) : null,
      SoLuong   != null ? Number(SoLuong) : null,
      TrangThai || null,
      req.params.id
    );
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    res.json(mapService(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi cập nhật dịch vụ' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await ensureServiceColumns();
    const rows = await prisma.$queryRawUnsafe(
      `DELETE FROM dichvu WHERE id_dichvu = $1::uuid RETURNING id_dichvu`,
      req.params.id
    );
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    res.json({ message: 'Đã xóa dịch vụ thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi xóa dịch vụ' });
  }
};

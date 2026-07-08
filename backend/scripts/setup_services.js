const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Tạo bảng dichvu nếu chưa có
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS dichvu (
      id_dichvu    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tendichvu    VARCHAR(200) NOT NULL,
      danhmuc      VARCHAR(50)  DEFAULT 'Giay',
      danhmuccon   VARCHAR(80),
      mota         TEXT,
      hinhanh      TEXT,
      gia          DECIMAL(12,2) NOT NULL DEFAULT 0,
      giathue      DECIMAL(12,2),
      soluong      INTEGER DEFAULT 10,
      trangthai    VARCHAR(20)  DEFAULT 'ConHang',
      ngaytao      TIMESTAMP DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`ALTER TABLE dichvu ADD COLUMN IF NOT EXISTS danhmuccon VARCHAR(80)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE dichvu ADD COLUMN IF NOT EXISTS hinhanh TEXT`);
  console.log('✅ Bảng dichvu đã sẵn sàng');

  // 2. Kiểm tra đã có data chưa
  const existing = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM dichvu`);
  const count = Number(existing[0].cnt);
  if (count > 0) {
    console.log(`ℹ️  Đã có ${count} dịch vụ, bỏ qua seed.`);
    return;
  }

  // 3. Seed dữ liệu mẫu — chỉ cho thuê
  const services = [
    { tendichvu: 'Thuê vợt cầu lông Yonex Nanoflare', danhmuc: 'Vot', danhmuccon: 'VotYonex', mota: 'Vợt Yonex nhanh, linh hoạt, phân khúc cao', gia: 0, giathue: 30000, soluong: 12, trangthai: 'ConHang' },
    { tendichvu: 'Thuê vợt cầu lông Victor Brave Sword', danhmuc: 'Vot', danhmuccon: 'VotVictor', mota: 'Vợt Victor cân bằng, kiểm soát tốt', gia: 0, giathue: 25000, soluong: 10, trangthai: 'ConHang' },
    { tendichvu: 'Thuê vợt cầu lông Lining Aeronaut', danhmuc: 'Vot', danhmuccon: 'VotLining', mota: 'Vợt Lining nhẹ, phù hợp tấn công', gia: 0, giathue: 25000, soluong: 8, trangthai: 'ConHang' },
    { tendichvu: 'Thuê giày cầu lông Yonex size 40 nam regular', danhmuc: 'Giay', danhmuccon: null, mota: 'Giày nam, bàn chân thường, đệm êm', gia: 0, giathue: 20000, soluong: 6, trangthai: 'ConHang' },
    { tendichvu: 'Thuê giày cầu lông Mizuno size 39 nữ slim', danhmuc: 'Giay', danhmuccon: null, mota: 'Giày nữ, slim bàn chân thon, ổn định', gia: 0, giathue: 20000, soluong: 5, trangthai: 'ConHang' },
    { tendichvu: 'Thuê giày cầu lông Victor size 42 unisex wide', danhmuc: 'Giay', danhmuccon: null, mota: 'Giày unisex, wide bàn chân bè, chống lật', gia: 0, giathue: 22000, soluong: 5, trangthai: 'ConHang' },
    { tendichvu: 'Thuê áo cầu lông Yonex nam', danhmuc: 'QuanAo', danhmuccon: null, mota: 'Áo cầu lông thoáng khí, nhiều size', gia: 0, giathue: 15000, soluong: 12, trangthai: 'ConHang' },
    { tendichvu: 'Thuê quần áo cầu lông Victor unisex', danhmuc: 'QuanAo', danhmuccon: null, mota: 'Bộ quần áo cầu lông unisex, co giãn tốt', gia: 0, giathue: 25000, soluong: 8, trangthai: 'ConHang' },
    { tendichvu: 'Thuê váy cầu lông Lining nữ', danhmuc: 'Vay', danhmuccon: null, mota: 'Váy cầu lông nữ, nhẹ và thoáng', gia: 0, giathue: 18000, soluong: 8, trangthai: 'ConHang' },
  ];

  for (const s of services) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO dichvu (tendichvu, danhmuc, danhmuccon, mota, gia, giathue, soluong, trangthai)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      s.tendichvu, s.danhmuc, s.danhmuccon || null, s.mota, s.gia, s.giathue, s.soluong, s.trangthai
    );
  }

  console.log(`✅ Đã seed ${services.length} dịch vụ thành công!`);
}

main()
  .catch(e => console.error('❌ Lỗi:', e.message))
  .finally(() => prisma.$disconnect());

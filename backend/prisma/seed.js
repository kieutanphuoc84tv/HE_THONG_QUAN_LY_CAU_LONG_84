const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding CAULONG84 (CSDL_84)...');

  // Courts
  const courts = await Promise.all([
    p.san.create({ data: { tensan: 'Sân 1', loaisan: 'Tiêu chuẩn', giathue: 70000, trangthai: 'Sẵn sàng' } }),
    p.san.create({ data: { tensan: 'Sân 2', loaisan: 'Tiêu chuẩn', giathue: 70000, trangthai: 'Sẵn sàng' } }),
    p.san.create({ data: { tensan: 'Sân 3', loaisan: 'Tiêu chuẩn', giathue: 70000, trangthai: 'Sẵn sàng' } }),
    p.san.create({ data: { tensan: 'Sân 4', loaisan: 'Tiêu chuẩn', giathue: 70000, trangthai: 'Sẵn sàng' } }),
    p.san.create({ data: { tensan: 'Sân 5', loaisan: 'Tiêu chuẩn', giathue: 70000, trangthai: 'Sẵn sàng' } }),
  ]);
  console.log(`✅ Đã tạo ${courts.length} sân`);

  // Admin user
  const adminPass = await bcrypt.hash('123456', 10);
  await p.nguoiDung.create({
    data: {
      tendangnhap: 'admin',
      hoten: 'Quản trị viên',
      email: 'admin@gmail.com',
      sdt: '0123456789',
      matkhau: adminPass,
      vaitro: 'Admin',
    }
  });
  console.log('✅ Đã tạo tài khoản Admin: admin@gmail.com / 123456');

  // Customer user
  const customerPass = await bcrypt.hash('123456', 10);
  await p.nguoiDung.create({
    data: {
      tendangnhap: 'khachhang',
      hoten: 'Khách hàng Demo',
      email: 'khach@gmail.com',
      sdt: '0987654321',
      matkhau: customerPass,
      vaitro: 'KhachHang',
      thanhVienClb: {
        create: { capbac: 'Thành viên', trangthai: 'Hoạt động' }
      }
    }
  });
  console.log('✅ Đã tạo tài khoản Khách: khach@gmail.com / 123456');

  console.log('🎉 Seed hoàn thành!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed lỗi:', e.message);
    process.exit(1);
  })
  .finally(() => p.$disconnect());

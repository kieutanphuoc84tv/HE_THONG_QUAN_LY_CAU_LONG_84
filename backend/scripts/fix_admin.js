const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdmin() {
  // Tìm tài khoản admin theo tendangnhap hoặc vaitro
  const admin = await prisma.nguoiDung.findFirst({
    where: {
      OR: [
        { tendangnhap: 'admin' },
        { vaitro: 'Admin' },
      ]
    }
  });

  if (!admin) {
    console.log('Không tìm thấy admin, tạo mới...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const newAdmin = await prisma.nguoiDung.create({
      data: {
        tendangnhap: 'admin',
        hoten: 'Quản Trị Viên',
        email: 'admin@caulong84.com',
        sdt: '0000000000',
        matkhau: hashedPassword,
        vaitro: 'Admin',
      }
    });
    console.log('✅ Đã tạo admin mới:', newAdmin.email);
    return;
  }

  // Reset mật khẩu và đảm bảo vaitro = Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const updated = await prisma.nguoiDung.update({
    where: { id_nguoidung: admin.id_nguoidung },
    data: {
      matkhau: hashedPassword,
      vaitro: 'Admin',
    }
  });

  console.log('✅ Đã reset admin:');
  console.log('   Email:', updated.email);
  console.log('   Username:', updated.tendangnhap);
  console.log('   Mật khẩu: admin123');
  console.log('   Vai trò:', updated.vaitro);
  console.log('\n👉 Đăng nhập bằng:');
  console.log('   Email:', updated.email, '| Mật khẩu: admin123');
  console.log('   HOẶC Username:', updated.tendangnhap, '| Mật khẩu: admin123');
}

fixAdmin()
  .catch(e => console.error('❌ Lỗi:', e.message))
  .finally(() => prisma.$disconnect());

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'admin@gmail.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existing = await prisma.nguoiDung.findUnique({ where: { email } });

  if (existing) {
    await prisma.nguoiDung.update({
      where: { email },
      data: { matkhau: hashedPassword, vaitro: 'Admin' },
    });
    console.log('Admin password updated successfully.');
    return;
  }

  const admin = await prisma.nguoiDung.create({
    data: {
      tendangnhap: 'admin',
      hoten: 'Quản Trị Viên',
      email,
      sdt: '0123456789',
      matkhau: hashedPassword,
      vaitro: 'Admin',
    },
  });

  console.log('Admin created successfully!', admin.id_nguoidung);
}

seedAdmin()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

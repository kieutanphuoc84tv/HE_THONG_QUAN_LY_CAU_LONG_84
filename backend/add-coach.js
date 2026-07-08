const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'nguyenvana@gmail.com';
  
  const existing = await prisma.nguoiDung.findUnique({ where: { email } });
  if (existing) {
    console.log('Coach already exists:', existing);
    return;
  }

  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const newCoach = await prisma.nguoiDung.create({
    data: {
      tendangnhap: 'nguyenvana',
      hoten: 'Nguyễn Văn A',
      email,
      sdt: '0988777666',
      matkhau: hashedPassword,
      vaitro: 'HuanLuyenVien',
      avatar: ''
    }
  });

  console.log('Created new coach:', newCoach);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.nguoiDung.updateMany({
    where: { tendangnhap: 'nhanvien1' },
    data: { 
      tendangnhap: 'tranmylinh',
      email: 'tranmylinh@gmail.com'
    }
  });
  console.log('Đã cập nhật email và tên đăng nhập');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

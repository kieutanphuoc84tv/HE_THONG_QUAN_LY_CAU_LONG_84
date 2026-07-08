const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cập nhật ngày hết hạn...');
  
  const t = new Date();
  t.setMonth(t.getMonth() + 1); // hết hạn sau 1 tháng
  
  await prisma.thanhVienClb.updateMany({
    where: { 
      phihoivien: { gt: 0 },
      ngayhethan: null
    },
    data: { 
      ngayhethan: t 
    }
  });

  console.log('Cập nhật ngày hết hạn thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

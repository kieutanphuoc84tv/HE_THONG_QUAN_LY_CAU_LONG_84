const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.san.updateMany({
    where: { tensan: { in: ['Sân 1', 'Sân 2', 'Sân 5'] } },
    data: { trangthai: 'DangDung' }
  });
  console.log("Updated court statuses to DangDung");
}

run().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating training sessions (LichTapLuyen) with real names...');
  const sessions = await prisma.lichTapLuyen.findMany({
    include: {
      hlv: true,
      thanhVien: { include: { nguoiDung: true } }
    }
  });

  for (const session of sessions) {
    if (session.hlv && session.thanhVien && session.thanhVien.nguoiDung) {
      // Find the session number from the old ghichu "Buổi học số X của..."
      const match = session.ghichu ? session.ghichu.match(/Buổi học số (\d+)/) : null;
      const sessionNum = match ? match[1] : '1';

      await prisma.lichTapLuyen.update({
        where: { id_lichtapluyen: session.id_lichtapluyen },
        data: {
          ghichu: `Buổi học số ${sessionNum} của ${session.thanhVien.nguoiDung.hoten} với HLV ${session.hlv.hoten}`,
        }
      });
    }
  }

  console.log('Cập nhật nội dung buổi học thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cập nhật ngày đăng ký...');

  const members = await prisma.thanhVienClb.findMany();

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    
    // Calculate a different registration date for each member
    // e.g. 18/06/2026 minus `i` days
    const baseDate = new Date('2026-06-18');
    baseDate.setDate(baseDate.getDate() - i);

    let dataToUpdate = {
      ngaythamgia: baseDate,
    };

    // If they have an expiration date, we shift it by the same number of days
    if (member.ngayhethan) {
      const offsetDays = i;
      const originalExpiry = new Date(member.ngayhethan);
      originalExpiry.setDate(originalExpiry.getDate() - offsetDays);
      dataToUpdate.ngayhethan = originalExpiry;
    }

    await prisma.thanhVienClb.update({
      where: { id_thanhvien: member.id_thanhvien },
      data: dataToUpdate
    });
  }

  console.log('Cập nhật ngày đăng ký thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

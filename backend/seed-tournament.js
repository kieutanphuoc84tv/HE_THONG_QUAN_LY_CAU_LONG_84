const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.giaiDau.findFirst({
    orderBy: { ngaybatdau: 'asc' }
  });

  if (!tournament) {
    console.log("Không có giải đấu nào.");
    return;
  }

  console.log(`Đang xử lý giải đấu: ${tournament.tengiai}`);

  // Create 4 dummy users
  const dummyUsers = [];
  for (let i = 1; i <= 4; i++) {
    const user = await prisma.nguoiDung.create({
      data: {
        tendangnhap: `dummy_player_${i}_${Date.now()}`,
        hoten: `Tuyển thủ Demo ${i}`,
        email: `player${i}_${Date.now()}@example.com`,
        matkhau: '123456',
        vaitro: 'KhachHang'
      }
    });
    dummyUsers.push(user);
    console.log(`Đã tạo VĐV: ${user.hoten}`);
  }

  // Register them to the tournament
  for (const user of dummyUsers) {
    await prisma.dkGiaiDau.create({
      data: {
        id_vadv: user.id_nguoidung,
        id_giaidau: tournament.id_giaidau,
        trangthai: 'Đã xác nhận'
      }
    });
    console.log(`Đã đăng ký VĐV ${user.hoten} vào giải.`);
  }

  // Generate bracket (Knockout)
  const registrations = await prisma.dkGiaiDau.findMany({
    where: { id_giaidau: tournament.id_giaidau, trangthai: 'Đã xác nhận' },
  });

  if (registrations.length >= 2) {
    const shuffled = [...registrations].sort(() => Math.random() - 0.5);
    const matches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      const p1 = shuffled[i];
      const p2 = shuffled[i + 1];
      if (!p2) continue;
      matches.push({
        id_giaidau: tournament.id_giaidau,
        id_vadv1: p1.id_dkgiai,
        id_vadv2: p2.id_dkgiai,
        vong: '1',
      });
    }
    for (const m of matches) {
      await prisma.ketQuaTd.create({ data: m });
    }
    await prisma.giaiDau.update({
      where: { id_giaidau: tournament.id_giaidau },
      data: { trangthai: 'Đang diễn ra' },
    });
    console.log('Đã tạo sơ đồ thi đấu thành công!');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const coachNames = [
  "Trần Minh Tuấn",
  "Nguyễn Hoàng Nam",
  "Lê Văn Thắng",
  "Phạm Đức Trí",
  "Hoàng Đình Dũng",
  "Vũ Ngọc Huy",
  "Đặng Quốc Bảo",
  "Bùi Xuân Hiệp",
  "Đỗ Khắc Tiệp",
  "Hồ Anh Minh"
];

const studentNames = [
  "Nguyễn Thị Hương",
  "Trần Thu Hà",
  "Lê Bích Ngọc",
  "Phạm Thanh Tâm",
  "Đinh Quỳnh Anh",
  "Nguyễn Văn Tài",
  "Lý Công Tuấn",
  "Đoàn Nhật Phương",
  "Trương Tuấn Tài",
  "Vương Yến Nhi"
];

function toUsername(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, '');
}

async function main() {
  console.log('Cập nhật tên đăng nhập và email theo tên thật...');

  const allNames = [...coachNames, ...studentNames];

  for (const name of allNames) {
    const username = toUsername(name);
    const email = `${username}@gmail.com`;

    // Cập nhật record dựa vào hoten (vì lúc nãy ta đã đổi hoten thành công)
    const user = await prisma.nguoiDung.findFirst({
      where: { hoten: name }
    });

    if (user) {
      await prisma.nguoiDung.update({
        where: { id_nguoidung: user.id_nguoidung },
        data: {
          tendangnhap: username,
          email: email
        }
      });
      console.log(`Đã cập nhật: ${name} -> ${username} / ${email}`);
    }
  }

  console.log('Hoàn thành cập nhật!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

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

async function main() {
  const password = await bcrypt.hash('123456', 10);

  console.log('Updating 10 coaches with real names...');
  const coaches = [];
  for (let i = 0; i < 10; i++) {
    const coach = await prisma.nguoiDung.update({
      where: { tendangnhap: `hlv${i + 1}` },
      data: {
        hoten: coachNames[i],
      }
    });
    coaches.push(coach);
  }

  console.log('Updating 10 students with real names...');
  const students = [];
  for (let i = 0; i < 10; i++) {
    const student = await prisma.nguoiDung.update({
      where: { tendangnhap: `hocvien${i + 1}` },
      data: {
        hoten: studentNames[i],
      },
      include: { thanhVienClb: true }
    });
    students.push(student);
  }

  console.log('Cập nhật tên thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

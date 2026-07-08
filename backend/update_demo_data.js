const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu cập nhật dữ liệu mẫu...');

  // 1. Cập nhật bảng HoaDon
  // Lấy các hóa đơn chưa thanh toán
  const hoaDons = await prisma.hoaDon.findMany({
    where: {
      trangthai: {
        in: ['Chưa thanh toán', 'Chờ thanh toán']
      }
    },
    take: 5
  });

  console.log(`Tìm thấy ${hoaDons.length} hóa đơn cần cập nhật.`);

  for (let i = 0; i < hoaDons.length; i++) {
    const hd = hoaDons[i];
    const phuongThuc = i % 2 === 0 ? 'Tiền mặt' : 'VNPay';
    const ngayTT = new Date();
    ngayTT.setDate(ngayTT.getDate() - i); // lùi lại vài ngày

    await prisma.hoaDon.update({
      where: { id_hoadon: hd.id_hoadon },
      data: {
        trangthai: 'Đã thanh toán',
        phuongthuc: phuongThuc,
        ngaythanhtoan: ngayTT
      }
    });
    console.log(`Đã cập nhật hóa đơn ${hd.id_hoadon}`);
  }

  // 2. Cập nhật bảng ThanhVienClb
  const thanhViens = await prisma.thanhVienClb.findMany({
    take: 5
  });

  console.log(`Tìm thấy ${thanhViens.length} thành viên cần cập nhật.`);

  const capBacs = ['Thành viên', 'Khách lẻ', 'Hội viên tháng', 'CLB / Đội nhóm', 'VIP'];
  const phiHoiViens = [0, 80000, 200000, 400000, 1000000];

  for (let i = 0; i < thanhViens.length; i++) {
    const tv = thanhViens[i];
    await prisma.thanhVienClb.update({
      where: { id_thanhvien: tv.id_thanhvien },
      data: {
        capbac: capBacs[i % capBacs.length],
        phihoivien: phiHoiViens[i % phiHoiViens.length]
      }
    });
    console.log(`Đã cập nhật thành viên ${tv.id_thanhvien}`);
  }

  console.log('Cập nhật dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

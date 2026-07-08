const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function generateReport() {
  const khachhang = await prisma.nguoiDung.findMany({ where: { vaitro: 'KhachHang' }, take: 10 });
  const hlv = await prisma.nguoiDung.findMany({ where: { vaitro: 'HuanLuyenVien' }, take: 10 });
  
  const courts = await prisma.san.findMany({ take: 10 });
  const services = await prisma.dichVu.findMany({ 
    take: 15,
    where: {
      OR: [
        { danhmuc: { contains: 'Áo' } },
        { danhmuc: { contains: 'Quần' } },
        { danhmuc: { contains: 'Giày' } },
        { danhmuc: { contains: 'Vợt' } },
        { tendichvu: { contains: 'Áo' } },
        { tendichvu: { contains: 'Quần' } },
        { tendichvu: { contains: 'Giày' } },
        { tendichvu: { contains: 'Vợt' } },
      ]
    }
  });
  
  if (services.length < 15) {
      const moreServices = await prisma.dichVu.findMany({ take: 15 - services.length });
      services.push(...moreServices);
  }

  const clubs = await prisma.thanhVienClb.findMany({ take: 10, include: { nguoiDung: true } });
  const bookings = await prisma.datSan.findMany({ take: 10, include: { nguoiDung: true, san: true } });
  const rentals = await prisma.donThue.findMany({ take: 10, include: { nguoiDung: true, dichVu: true } });
  const schedules = await prisma.lichTapLuyen.findMany({ take: 10, include: { hlv: true, thanhVien: { include: { nguoiDung: true } } } });
  const invoices = await prisma.hoaDon.findMany({ take: 10, include: { datSan: { include: { nguoiDung: true } } } });
  const tournaments = await prisma.giaiDau.findMany({ take: 10 });

  let html = `
  <!DOCTYPE html>
  <html lang='vi'>
  <head>
    <meta charset='UTF-8'>
    <style>
      body { font-family: 'Times New Roman', serif; margin: 40px auto; max-width: 900px; line-height: 1.5; color: #000; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
      th, td { border: 1px solid #8ba4c7; padding: 10px; text-align: center; }
      th { background-color: #2b579a; color: white; font-weight: bold; }
      tr:nth-child(even) { background-color: #f8fbff; }
      .caption { text-align: center; font-style: italic; margin-bottom: 50px; color: #000; font-size: 16px; }
      h2 { text-align: center; color: #000; margin-bottom: 40px; font-weight: bold; }
      h3.table-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <h2>DỮ LIỆU THỰC TẾ TỪ CƠ SỞ DỮ LIỆU</h2>
  `;

  // 1. KHACH HANG
  html += `<h3 class="table-title">4.1.1. Bảng Khách Hàng</h3>`;
  html += `<table><tr><th>STT</th><th>Tên đăng nhập</th><th>Họ và tên</th><th>SĐT</th><th>Vai trò</th><th>Trạng thái Oauth</th></tr>`;
  khachhang.forEach((u, i) => {
    let oauth = u.oauth_provider;
    if (!oauth || oauth === 'local') oauth = 'Không';
    else if (oauth.toLowerCase() === 'google') oauth = 'Google';
    else if (oauth.toLowerCase() === 'facebook') oauth = 'Facebook';
    html += `<tr><td>${i+1}</td><td>${u.tendangnhap || u.email}</td><td>${u.hoten || ''}</td><td>${u.sdt || ''}</td><td>Khách Hàng</td><td>${oauth}</td></tr>`;
  });
  html += `</table><div class='caption'>Bảng 4.1 – Dữ liệu thực tế Khách Hàng</div>`;

  // 1b. HUAN LUYEN VIEN
  html += `<h3 class="table-title">4.1.2. Bảng Huấn Luyện Viên</h3>`;
  html += `<table><tr><th>STT</th><th>Tên đăng nhập</th><th>Họ và tên</th><th>SĐT</th><th>Vai trò</th><th>Trạng thái Oauth</th></tr>`;
  hlv.forEach((u, i) => {
    let oauth = u.oauth_provider;
    if (!oauth || oauth === 'local') oauth = 'Không';
    else if (oauth.toLowerCase() === 'google') oauth = 'Google';
    else if (oauth.toLowerCase() === 'facebook') oauth = 'Facebook';
    html += `<tr><td>${i+1}</td><td>${u.tendangnhap || u.email}</td><td>${u.hoten || ''}</td><td>${u.sdt || ''}</td><td>Huấn Luyện Viên</td><td>${oauth}</td></tr>`;
  });
  html += `</table><div class='caption'>Bảng 4.2 – Dữ liệu thực tế Huấn Luyện Viên</div>`;

  // 2. SAN
  html += `<h3 class="table-title">4.1.3. Bảng SAN</h3>`;
  html += `<table><tr><th>STT</th><th>Tên sân</th><th>Loại sân</th><th>Giá thuê (VNĐ)</th><th>Trạng thái</th></tr>`;
  
  const stMapSan = {
    Trong: 'Trống',
    DangDung: 'Đang dùng',
    BaoTri: 'Bảo trì'
  };

  courts.forEach((s, i) => {
    const stText = stMapSan[s.trangthai] || s.trangthai || 'Trống';
    html += `<tr><td>${i+1}</td><td>${s.tensan || ''}</td><td>${s.loaisan || ''}</td><td>${Number(s.giathue || 0).toLocaleString('vi-VN')}</td><td>${stText}</td></tr>`;
  });
  if (courts.length === 0) html += `<tr><td colspan="5">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.3 – Dữ liệu thực tế bảng SAN</div>`;

  // 3. DICHVU (Dụng cụ/dịch vụ cho thuê)
  html += `<h3 class="table-title">4.1.4. Bảng DICHVU (Dụng cụ/Dịch vụ cho thuê)</h3>`;
  html += `<table><tr><th>STT</th><th>Tên dịch vụ/Dụng cụ thuê</th><th>Danh mục</th><th>Số lượng</th><th>Giá thuê/giờ (VNĐ)</th><th>Trạng thái</th></tr>`;
  services.forEach((d, i) => {
    html += `<tr><td>${i+1}</td><td>${d.tendichvu || ''}</td><td>${d.danhmuc || ''}</td><td>${d.soluong || 0}</td><td>${Number(d.giathue || 0).toLocaleString('vi-VN')}</td><td>${d.trangthai || 'Còn hàng'}</td></tr>`;
  });
  if (services.length === 0) html += `<tr><td colspan="6">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.4 – Dữ liệu bảng DICHVU, đơn thuê tính theo giathue</div>`;

  // 4. THANHVIENCLB
  html += `<h3 class="table-title">4.1.5. Bảng THANHVIENCLB</h3>`;
  html += `<table><tr><th>STT</th><th>Họ tên thành viên</th><th>Hạng mức</th><th>Ngày đăng ký</th><th>Điểm tích lũy</th><th>Trạng thái</th></tr>`;
  clubs.forEach((c, i) => {
    html += `<tr><td>${i+1}</td><td>${c.nguoiDung?.hoten || ''}</td><td>${c.hangmuc || 'Thường'}</td><td>${c.ngaydangky ? c.ngaydangky.toLocaleDateString('vi-VN') : ''}</td><td>${c.diemtichluy || 0}</td><td>${c.trangthai || 'Hoạt động'}</td></tr>`;
  });
  if (clubs.length === 0) html += `<tr><td colspan="6">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.5 – Dữ liệu thực tế bảng THANHVIENCLB</div>`;

  // 5. DATSAN
  html += `<h3 class="table-title">4.1.6. Bảng DATSAN</h3>`;
  html += `<table><tr><th>STT</th><th>Khách hàng</th><th>Sân</th><th>Ngày đặt</th><th>Giờ bắt đầu</th><th>Trạng thái</th></tr>`;
  bookings.forEach((b, i) => {
    html += `<tr><td>${i+1}</td><td>${b.nguoiDung?.hoten || ''}</td><td>${b.san?.tensan || ''}</td><td>${b.ngaydat.toLocaleDateString('vi-VN')}</td><td>${b.giobatdau.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</td><td>${b.trangthai}</td></tr>`;
  });
  html += `</table><div class='caption'>Bảng 4.6 – Dữ liệu thực tế bảng DATSAN</div>`;

  // 6. LICHTAPLUYEN
  html += `<h3 class="table-title">4.1.7. Bảng LICHTAPLUYEN</h3>`;
  html += `<table><tr><th>STT</th><th>Huấn Luyện Viên</th><th>Học Viên</th><th>Ngày tập</th><th>Giờ bắt đầu</th><th>Lệ phí (VNĐ)</th><th>Trạng thái</th></tr>`;
  schedules.forEach((s, i) => {
    html += `<tr><td>${i+1}</td><td>${s.hlv?.hoten || ''}</td><td>${s.thanhVien?.nguoiDung?.hoten || 'Khách vãng lai'}</td><td>${s.ngaytap ? s.ngaytap.toLocaleDateString('vi-VN') : ''}</td><td>${s.giobatdau ? s.giobatdau.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : ''}</td><td>${s.lephi ? Number(s.lephi).toLocaleString('vi-VN') : '0'}</td><td>${s.trangthai}</td></tr>`;
  });
  if (schedules.length === 0) html += `<tr><td colspan="7">Đang chờ tạo dữ liệu thực tế</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.7 – Dữ liệu thực tế bảng LICHTAPLUYEN</div>`;

  // 7. DONTHUE
  html += `<h3 class="table-title">4.1.8. Bảng DONTHUE</h3>`;
  html += `<table><tr><th>STT</th><th>Khách hàng</th><th>Dịch vụ/Thuê đồ (Vợt, Giày, Áo...)</th><th>Số lượng</th><th>Số giờ</th><th>Tổng tiền (VNĐ)</th></tr>`;
  rentals.forEach((r, i) => {
    html += `<tr><td>${i+1}</td><td>${r.nguoiDung?.hoten || ''}</td><td>${r.dichVu?.tendichvu || ''}</td><td>${r.soluong}</td><td>${r.sogio}</td><td>${Number(r.tongtien).toLocaleString('vi-VN')}</td></tr>`;
  });
  if (rentals.length === 0) html += `<tr><td colspan="6">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.8 – Dữ liệu thực tế bảng DONTHUE</div>`;

  // 8. HOADON
  html += `<h3 class="table-title">4.1.9. Bảng HOADON</h3>`;
  html += `<table><tr><th>STT</th><th>Khách hàng</th><th>Số tiền (VNĐ)</th><th>Phương thức</th><th>Ngày thanh toán</th><th>Trạng thái</th></tr>`;
  invoices.forEach((h, i) => {
    html += `<tr><td>${i+1}</td><td>${h.datSan?.nguoiDung?.hoten || ''}</td><td>${Number(h.sotien).toLocaleString('vi-VN')}</td><td>${h.phuongthuc}</td><td>${h.ngaythanhtoan ? h.ngaythanhtoan.toLocaleDateString('vi-VN') : ''}</td><td>${h.trangthai}</td></tr>`;
  });
  if (invoices.length === 0) html += `<tr><td colspan="6">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.9 – Dữ liệu thực tế bảng HOADON</div>`;

  // 9. GIAIDAU
  html += `<h3 class="table-title">4.1.10. Bảng GIAIDAU</h3>`;
  html += `<table><tr><th>STT</th><th>Tên giải đấu</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Lệ phí (VNĐ)</th><th>Số người tối đa</th><th>Hình thức</th><th>Trạng thái</th></tr>`;
  
  const stMapGiaiDau = {
    SapDienRa: 'Sắp diễn ra',
    DangDienRa: 'Đang diễn ra',
    KetThuc: 'Kết thúc'
  };

  tournaments.forEach((g, i) => {
    const stText = stMapGiaiDau[g.trangthai] || g.trangthai || 'Khởi tạo';
    html += `<tr><td>${i+1}</td><td>${g.tengiai || ''}</td><td>${g.ngaybatdau ? g.ngaybatdau.toLocaleDateString('vi-VN') : ''}</td><td>${g.ngayketthuc ? g.ngayketthuc.toLocaleDateString('vi-VN') : ''}</td><td>${g.lephi ? Number(g.lephi).toLocaleString('vi-VN') : '0'}</td><td>${g.soluongtoida || 0}</td><td>${g.hinhthuc || 'KnockOut'}</td><td>${stText}</td></tr>`;
  });
  if (tournaments.length === 0) html += `<tr><td colspan="8">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.10 – Dữ liệu thực tế bảng GIAIDAU</div>`;

  // 10. DKGIAIDAU
  const dkGiaiDau = await prisma.dkGiaiDau.findMany({ take: 10, include: { giaiDau: true, vanDongVien: true } });
  
  html += `<h3 class="table-title">4.1.11. Bảng DKGIAIDAU (Đăng ký giải đấu)</h3>`;
  html += `<table><tr><th>STT</th><th>Giải đấu</th><th>Vận động viên</th><th>Hạng mục</th><th>Ngày đăng ký</th><th>Trạng thái</th></tr>`;
  dkGiaiDau.forEach((d, i) => {
    html += `<tr><td>${i+1}</td><td>${d.giaiDau?.tengiai || ''}</td><td>${d.vanDongVien?.hoten || ''}</td><td>${d.hangmuc || 'Đơn nam'}</td><td>${d.ngaydangky ? d.ngaydangky.toLocaleDateString('vi-VN') : ''}</td><td>${d.trangthai || 'Đã duyệt'}</td></tr>`;
  });
  if (dkGiaiDau.length === 0) html += `<tr><td colspan="6">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.11 – Dữ liệu thực tế bảng DKGIAIDAU</div>`;

  // 11. GOIHOIVIEN
  const goiHoiVien = await prisma.goiHoiVien.findMany({ take: 10 });
  html += `<h3 class="table-title">4.1.12. Bảng GOIHOIVIEN (Gói hội viên)</h3>`;
  html += `<table><tr><th>STT</th><th>Tên gói</th><th>Thời hạn (tháng)</th><th>Giá tiền (VNĐ)</th><th>Mô tả</th><th>Trạng thái</th></tr>`;
  goiHoiVien.forEach((g, i) => {
    html += `<tr><td>${i+1}</td><td>${g.tengoi || ''}</td><td>${g.thoihan || 0}</td><td>${g.giatien ? Number(g.giatien).toLocaleString('vi-VN') : '0'}</td><td>${g.mota || ''}</td><td>${g.trangthai || ''}</td></tr>`;
  });
  if (goiHoiVien.length === 0) html += `<tr><td colspan="6">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.12 – Dữ liệu thực tế bảng GOIHOIVIEN</div>`;

  // 12. KHUYENMAI
  const khuyenMai = await prisma.khuyenMai.findMany({ take: 10 });
  html += `<h3 class="table-title">4.1.13. Bảng KHUYENMAI (Mã giảm giá)</h3>`;
  html += `<table><tr><th>STT</th><th>Mã KM</th><th>Tên khuyến mãi</th><th>% Giảm</th><th>Giảm tối đa (VNĐ)</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Trạng thái</th></tr>`;
  khuyenMai.forEach((k, i) => {
    html += `<tr><td>${i+1}</td><td>${k.makhuyenmai || ''}</td><td>${k.tenkhuyenmai || ''}</td><td>${k.phantramgiam || 0}%</td><td>${k.giamtoida ? Number(k.giamtoida).toLocaleString('vi-VN') : '0'}</td><td>${k.ngaybatdau ? k.ngaybatdau.toLocaleDateString('vi-VN') : ''}</td><td>${k.ngayketthuc ? k.ngayketthuc.toLocaleDateString('vi-VN') : ''}</td><td>${k.trangthai || ''}</td></tr>`;
  });
  if (khuyenMai.length === 0) html += `<tr><td colspan="8">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.13 – Dữ liệu thực tế bảng KHUYENMAI</div>`;

  // 13. CALAMVIEC
  const caLamViec = await prisma.caLamViec.findMany({ take: 10, include: { nhanVien: true } });
  html += `<h3 class="table-title">4.1.14. Bảng CALAMVIEC (Ca làm việc nhân viên)</h3>`;
  html += `<table><tr><th>STT</th><th>Nhân viên</th><th>Ngày làm việc</th><th>Ca làm việc</th><th>Trạng thái</th></tr>`;
  caLamViec.forEach((c, i) => {
    html += `<tr><td>${i+1}</td><td>${c.nhanVien?.hoten || 'Nhân viên'}</td><td>${c.ngaylamviec ? c.ngaylamviec.toLocaleDateString('vi-VN') : ''}</td><td>${c.cathi || ''}</td><td>${c.trangthai || ''}</td></tr>`;
  });
  if (caLamViec.length === 0) html += `<tr><td colspan="5">Chưa có dữ liệu</td></tr>`;
  html += `</table><div class='caption'>Bảng 4.14 – Dữ liệu thực tế bảng CALAMVIEC</div>`;


  html += `</body></html>`;
  fs.writeFileSync('../Bang_DuLieu_ThucTe.html', html);
  
  // Also create Bao_Cao_CSDL_Thuc_Te.html as duplicate just in case
  fs.writeFileSync('../Bao_Cao_CSDL_Thuc_Te.html', html);
  
  console.log('OK');
}
generateReport().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function generateMarkdownReport() {
  const khachhang = await prisma.nguoiDung.findMany({ where: { vaitro: 'KhachHang' }, take: 10 });
  const hlv = await prisma.nguoiDung.findMany({ where: { vaitro: 'HuanLuyenVien' }, take: 10 });
  const courts = await prisma.san.findMany({ take: 10 });
  const services = await prisma.dichVu.findMany({ take: 15 });
  const clubs = await prisma.thanhVienClb.findMany({ take: 10, include: { nguoiDung: true } });
  const bookings = await prisma.datSan.findMany({ take: 10, include: { nguoiDung: true, san: true } });
  const rentals = await prisma.donThue.findMany({ take: 10, include: { nguoiDung: true, dichVu: true } });
  const schedules = await prisma.lichTapLuyen.findMany({ take: 10, include: { hlv: true, thanhVien: { include: { nguoiDung: true } } } });
  const invoices = await prisma.hoaDon.findMany({ take: 10, include: { datSan: { include: { nguoiDung: true } } } });
  const tournaments = await prisma.giaiDau.findMany({ take: 10 });
  const dkGiaiDau = await prisma.dkGiaiDau.findMany({ take: 10, include: { giaiDau: true, vanDongVien: true } });
  const goiHoiVien = await prisma.goiHoiVien.findMany({ take: 10 });
  const khuyenMai = await prisma.khuyenMai.findMany({ take: 10 });
  const caLamViec = await prisma.caLamViec.findMany({ take: 10, include: { nhanVien: true } });
  let md = `# DỮ LIỆU THỰC TẾ TỪ CƠ SỞ DỮ LIỆU\n\n`;

  // 1. KHACH HANG
  md += `### 4.1.1. Bảng Khách Hàng\n\n`;
  md += `| STT | Tên đăng nhập | Họ và tên | SĐT | Vai trò | Trạng thái Oauth |\n`;
  md += `|---|---|---|---|---|---|\n`;
  khachhang.forEach((u, i) => {
    let oauth = u.oauth_provider;
    if (!oauth || oauth === 'local') oauth = 'Không';
    else if (oauth.toLowerCase() === 'google') oauth = 'Google';
    else if (oauth.toLowerCase() === 'facebook') oauth = 'Facebook';
    md += `| ${i+1} | ${u.tendangnhap || u.email} | ${u.hoten || ''} | ${u.sdt || ''} | Khách Hàng | ${oauth} |\n`;
  });
  md += `\n*Bảng 4.1 – Dữ liệu thực tế Khách Hàng*\n\n`;

  // 1b. HUAN LUYEN VIEN
  md += `### 4.1.2. Bảng Huấn Luyện Viên\n\n`;
  md += `| STT | Tên đăng nhập | Họ và tên | SĐT | Vai trò | Trạng thái Oauth |\n`;
  md += `|---|---|---|---|---|---|\n`;
  hlv.forEach((u, i) => {
    let oauth = u.oauth_provider;
    if (!oauth || oauth === 'local') oauth = 'Không';
    else if (oauth.toLowerCase() === 'google') oauth = 'Google';
    else if (oauth.toLowerCase() === 'facebook') oauth = 'Facebook';
    md += `| ${i+1} | ${u.tendangnhap || u.email} | ${u.hoten || ''} | ${u.sdt || ''} | Huấn Luyện Viên | ${oauth} |\n`;
  });
  md += `\n*Bảng 4.2 – Dữ liệu thực tế Huấn Luyện Viên*\n\n`;

  // 2. SAN
  md += `### 4.1.3. Bảng SAN\n\n`;
  md += `| STT | Tên sân | Loại sân | Giá thuê (VNĐ) | Trạng thái |\n`;
  md += `|---|---|---|---|---|\n`;
  const stMapSan = { Trong: 'Trống', DangDung: 'Đang dùng', BaoTri: 'Bảo trì' };
  courts.forEach((s, i) => {
    const stText = stMapSan[s.trangthai] || s.trangthai || 'Trống';
    md += `| ${i+1} | ${s.tensan || ''} | ${s.loaisan || ''} | ${Number(s.giathue || 0).toLocaleString('vi-VN')} | ${stText} |\n`;
  });
  if (courts.length === 0) md += `| colspan="5" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.3 – Dữ liệu thực tế bảng SAN*\n\n`;

  // 3. DICHVU (Dụng cụ/dịch vụ cho thuê)
  md += `### 4.1.4. Bảng DICHVU (Dụng cụ/Dịch vụ cho thuê)\n\n`;
  md += `| STT | Tên dịch vụ/Dụng cụ thuê | Danh mục | Số lượng | Giá thuê/giờ (VNĐ) | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|\n`;
  services.forEach((d, i) => {
    md += `| ${i+1} | ${d.tendichvu || ''} | ${d.danhmuc || ''} | ${d.soluong || 0} | ${Number(d.giathue || 0).toLocaleString('vi-VN')} | ${d.trangthai || 'Còn hàng'} |\n`;
  });
  if (services.length === 0) md += `| colspan="6" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.4 – Dữ liệu bảng DICHVU, đơn thuê tính theo giathue*\n\n`;

  // 4. THANHVIENCLB
  md += `### 4.1.5. Bảng THANHVIENCLB\n\n`;
  md += `| STT | Họ tên thành viên | Hạng mức | Ngày đăng ký | Điểm tích lũy | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|\n`;
  clubs.forEach((c, i) => {
    md += `| ${i+1} | ${c.nguoiDung?.hoten || ''} | ${c.hangmuc || 'Thường'} | ${c.ngaydangky ? c.ngaydangky.toLocaleDateString('vi-VN') : ''} | ${c.diemtichluy || 0} | ${c.trangthai || 'Hoạt động'} |\n`;
  });
  if (clubs.length === 0) md += `| colspan="6" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.5 – Dữ liệu thực tế bảng THANHVIENCLB*\n\n`;

  // 5. DATSAN
  md += `### 4.1.6. Bảng DATSAN\n\n`;
  md += `| STT | Khách hàng | Sân | Ngày đặt | Giờ bắt đầu | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|\n`;
  bookings.forEach((b, i) => {
    md += `| ${i+1} | ${b.nguoiDung?.hoten || ''} | ${b.san?.tensan || ''} | ${b.ngaydat.toLocaleDateString('vi-VN')} | ${b.giobatdau.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} | ${b.trangthai} |\n`;
  });
  if (bookings.length === 0) md += `| colspan="6" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.6 – Dữ liệu thực tế bảng DATSAN*\n\n`;

  // 6. LICHTAPLUYEN
  md += `### 4.1.7. Bảng LICHTAPLUYEN\n\n`;
  md += `| STT | Huấn Luyện Viên | Học Viên | Ngày tập | Giờ bắt đầu | Lệ phí (VNĐ) | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|---|\n`;
  schedules.forEach((s, i) => {
    md += `| ${i+1} | ${s.hlv?.hoten || ''} | ${s.thanhVien?.nguoiDung?.hoten || 'Khách vãng lai'} | ${s.ngaytap ? s.ngaytap.toLocaleDateString('vi-VN') : ''} | ${s.giobatdau ? s.giobatdau.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : ''} | ${s.lephi ? Number(s.lephi).toLocaleString('vi-VN') : '0'} | ${s.trangthai} |\n`;
  });
  if (schedules.length === 0) md += `| colspan="7" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.7 – Dữ liệu thực tế bảng LICHTAPLUYEN*\n\n`;

  // 7. DONTHUE
  md += `### 4.1.8. Bảng DONTHUE\n\n`;
  md += `| STT | Khách hàng | Dịch vụ/Thuê đồ | Số lượng | Số giờ | Tổng tiền (VNĐ) |\n`;
  md += `|---|---|---|---|---|---|\n`;
  rentals.forEach((r, i) => {
    md += `| ${i+1} | ${r.nguoiDung?.hoten || ''} | ${r.dichVu?.tendichvu || ''} | ${r.soluong} | ${r.sogio} | ${Number(r.tongtien).toLocaleString('vi-VN')} |\n`;
  });
  if (rentals.length === 0) md += `| colspan="6" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.8 – Dữ liệu thực tế bảng DONTHUE*\n\n`;

  // 8. HOADON
  md += `### 4.1.9. Bảng HOADON\n\n`;
  md += `| STT | Khách hàng | Số tiền (VNĐ) | Phương thức | Ngày thanh toán | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|\n`;
  invoices.forEach((h, i) => {
    md += `| ${i+1} | ${h.datSan?.nguoiDung?.hoten || ''} | ${Number(h.sotien).toLocaleString('vi-VN')} | ${h.phuongthuc} | ${h.ngaythanhtoan ? h.ngaythanhtoan.toLocaleDateString('vi-VN') : ''} | ${h.trangthai} |\n`;
  });
  if (invoices.length === 0) md += `| colspan="6" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.9 – Dữ liệu thực tế bảng HOADON*\n\n`;

  // 9. GIAIDAU
  md += `### 4.1.10. Bảng GIAIDAU\n\n`;
  md += `| STT | Tên giải đấu | Ngày bắt đầu | Ngày kết thúc | Lệ phí (VNĐ) | Số lượng tối đa | Hình thức | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  const stMapGiaiDau = { SapDienRa: 'Sắp diễn ra', DangDienRa: 'Đang diễn ra', KetThuc: 'Kết thúc' };
  tournaments.forEach((g, i) => {
    const stText = stMapGiaiDau[g.trangthai] || g.trangthai || 'Khởi tạo';
    md += `| ${i+1} | ${g.tengiai || ''} | ${g.ngaybatdau ? g.ngaybatdau.toLocaleDateString('vi-VN') : ''} | ${g.ngayketthuc ? g.ngayketthuc.toLocaleDateString('vi-VN') : ''} | ${g.lephi ? Number(g.lephi).toLocaleString('vi-VN') : '0'} | ${g.soluongtoida || 0} | ${g.hinhthuc || 'KnockOut'} | ${stText} |\n`;
  });
  if (tournaments.length === 0) md += `| colspan="8" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.10 – Dữ liệu thực tế bảng GIAIDAU*\n\n`;

  // 10. DKGIAIDAU
  md += `### 4.1.11. Bảng DKGIAIDAU\n\n`;
  md += `| STT | Giải đấu | Vận động viên | Hạng mục | Ngày đăng ký | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|\n`;
  dkGiaiDau.forEach((d, i) => {
    md += `| ${i+1} | ${d.giaiDau?.tengiai || ''} | ${d.vanDongVien?.hoten || ''} | ${d.hangmuc || 'Đơn nam'} | ${d.ngaydangky ? d.ngaydangky.toLocaleDateString('vi-VN') : ''} | ${d.trangthai || 'Đã duyệt'} |\n`;
  });
  if (dkGiaiDau.length === 0) md += `| colspan="6" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.11 – Dữ liệu thực tế bảng DKGIAIDAU*\n\n`;

  // 11. GOIHOIVIEN
  md += `### 4.1.12. Bảng GOIHOIVIEN\n\n`;
  md += `| STT | Tên gói | Thời hạn | Giá tiền (VNĐ) | Mô tả | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|\n`;
  goiHoiVien.forEach((g, i) => {
    md += `| ${i+1} | ${g.tengoi || ''} | ${g.thoihan || 0} tháng | ${g.giatien ? Number(g.giatien).toLocaleString('vi-VN') : '0'} | ${g.mota || ''} | ${g.trangthai || ''} |\n`;
  });
  if (goiHoiVien.length === 0) md += `| colspan="6" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.12 – Dữ liệu thực tế bảng GOIHOIVIEN*\n\n`;

  // 12. KHUYENMAI
  md += `### 4.1.13. Bảng KHUYENMAI\n\n`;
  md += `| STT | Mã KM | Tên khuyến mãi | % Giảm | Giảm tối đa | Bắt đầu | Kết thúc | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  khuyenMai.forEach((k, i) => {
    md += `| ${i+1} | ${k.makhuyenmai || ''} | ${k.tenkhuyenmai || ''} | ${k.phantramgiam || 0}% | ${k.giamtoida ? Number(k.giamtoida).toLocaleString('vi-VN') : '0'} | ${k.ngaybatdau ? k.ngaybatdau.toLocaleDateString('vi-VN') : ''} | ${k.ngayketthuc ? k.ngayketthuc.toLocaleDateString('vi-VN') : ''} | ${k.trangthai || ''} |\n`;
  });
  if (khuyenMai.length === 0) md += `| colspan="8" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.13 – Dữ liệu thực tế bảng KHUYENMAI*\n\n`;

  // 13. CALAMVIEC
  md += `### 4.1.14. Bảng CALAMVIEC\n\n`;
  md += `| STT | Nhân viên | Ngày làm việc | Ca làm việc | Trạng thái |\n`;
  md += `|---|---|---|---|---|\n`;
  caLamViec.forEach((c, i) => {
    md += `| ${i+1} | ${c.nhanVien?.hoten || 'Nhân viên'} | ${c.ngaylamviec ? c.ngaylamviec.toLocaleDateString('vi-VN') : ''} | ${c.cathi || ''} | ${c.trangthai || ''} |\n`;
  });
  if (caLamViec.length === 0) md += `| colspan="5" | Chưa có dữ liệu |\n`;
  md += `\n*Bảng 4.14 – Dữ liệu thực tế bảng CALAMVIEC*\n\n`;

  fs.writeFileSync('../Bao_Cao_Du_Lieu_CapNhat.md', md);
  console.log('Markdown report generated successfully.');
}

generateMarkdownReport().catch(console.error).finally(() => prisma.$disconnect());

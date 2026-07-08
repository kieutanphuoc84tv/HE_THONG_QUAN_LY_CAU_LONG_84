const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Tạo hóa đơn PDF và pipe trực tiếp vào response
 */
function generateInvoicePDF(hoaDon, res) {
  const doc = new PDFDocument({ margin: 50 });
  
  // Header
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="HoaDon_${hoaDon.id_hoadon}.pdf"`);
  
  doc.pipe(res);

  // Title
  doc.fontSize(20).text('HOA DON THANH TOAN', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Ma Hoa Don: ${hoaDon.id_hoadon}`);
  doc.text(`Ngay thanh toan: ${hoaDon.ngaythanhtoan ? new Date(hoaDon.ngaythanhtoan).toLocaleString('vi-VN') : 'Chua thanh toan'}`);
  doc.text(`Phuong thuc: ${hoaDon.phuongthuc || 'Tien mat'}`);
  doc.text(`Trang thai: ${hoaDon.trangthai}`);
  doc.moveDown();

  // Booking Info
  if (hoaDon.datSan) {
    doc.fontSize(14).text('Thong tin dat san:', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Nguoi dat: ${hoaDon.datSan.nguoiDung?.hoten || 'Khong ro'}`);
    doc.text(`San: ${hoaDon.datSan.san?.tensan || 'Khong ro'}`);
    doc.text(`Ngay dat: ${new Date(hoaDon.datSan.ngaydat).toLocaleDateString('vi-VN')}`);
    doc.text(`Gio bat dau: ${new Date(hoaDon.datSan.giobatdau).toLocaleTimeString('vi-VN')}`);
    doc.text(`Gio ket thuc: ${new Date(hoaDon.datSan.gioketthuc).toLocaleTimeString('vi-VN')}`);
  }

  doc.moveDown(2);
  doc.fontSize(16).text(`TONG TIEN: ${Number(hoaDon.sotien).toLocaleString('vi-VN')} VND`, { align: 'right' });

  doc.moveDown(3);
  doc.fontSize(10).text('Cam on quy khach da su dung dich vu cua Cau Long 84!', { align: 'center', italic: true });

  doc.end();
}

module.exports = {
  generateInvoicePDF
};

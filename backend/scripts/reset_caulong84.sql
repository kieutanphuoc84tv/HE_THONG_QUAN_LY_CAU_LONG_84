-- Reset CAULONG84 theo CSDL_84.sql (xóa schema cũ của Prisma)
DROP TABLE IF EXISTS
  "ChiTietHoaDon", "ThanhToan", "TranDau", "DonThue", "DangKyGiaiDau",
  "ChiTietHoaDon", "HoaDon", "LichDatSan", "KhachHang", "NhanVien",
  "NguoiDung", "San", "DichVu", "GiaiDau",
  ketquatd, dkgiaidau, giaidau, thongke, lichtapluyen, hoadon, datsan,
  thanhvienclb, san, nguoidung
CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE nguoidung (
    id_nguoidung UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tendangnhap VARCHAR(50) UNIQUE NOT NULL,
    hoten VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    matkhau VARCHAR(255) NOT NULL,
    "SDT" VARCHAR(15),
    vaitro VARCHAR(20),
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(100) UNIQUE,
    avatar TEXT,
    ngaytao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE san (
    id_san UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_quanly UUID REFERENCES nguoidung(id_nguoidung),
    tensan VARCHAR(100) NOT NULL,
    loaisan VARCHAR(50),
    giathue DECIMAL(10, 2),
    trangthai VARCHAR(50) DEFAULT 'Sẵn sàng'
);

CREATE TABLE thanhvienclb (
    id_thanhvien UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_nguoidung UUID UNIQUE REFERENCES nguoidung(id_nguoidung),
    capbac VARCHAR(50),
    ngaythamgia DATE DEFAULT CURRENT_DATE,
    phihoivien DECIMAL(10, 2),
    trangthai VARCHAR(50) DEFAULT 'Hoạt động'
);

CREATE TABLE datsan (
    id_datsan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_nguoidung UUID REFERENCES nguoidung(id_nguoidung),
    id_san UUID REFERENCES san(id_san),
    ngaydat DATE NOT NULL,
    giobatdau TIME NOT NULL,
    gioketthuc TIME NOT NULL,
    trangthai VARCHAR(50) DEFAULT 'Chờ xác nhận',
    ghichu TEXT
);

CREATE TABLE hoadon (
    id_hoadon UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_datsan UUID UNIQUE REFERENCES datsan(id_datsan),
    sotien DECIMAL(12, 2) NOT NULL,
    phuongthuc VARCHAR(50),
    trangthai VARCHAR(50) DEFAULT 'Chưa thanh toán',
    ngaythanhtoan TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lichtapluyen (
    id_lichtapluyen UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_hlv UUID REFERENCES nguoidung(id_nguoidung),
    id_thanhvien UUID REFERENCES thanhvienclb(id_thanhvien),
    ngaytap DATE NOT NULL,
    giobatdau TIME,
    ketqua TEXT,
    ghichu TEXT
);

CREATE TABLE giaidau (
    id_giaidau UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_nguoitochuc UUID REFERENCES nguoidung(id_nguoidung),
    tengiai VARCHAR(200) NOT NULL,
    ngaybatdau DATE,
    ngayketthuc DATE,
    thele TEXT,
    lephi DECIMAL(10, 2),
    trangthai VARCHAR(50) DEFAULT 'Sắp diễn ra'
);

CREATE TABLE dkgiaidau (
    id_dkgiai UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_giaidau UUID REFERENCES giaidau(id_giaidau),
    id_vadv UUID REFERENCES nguoidung(id_nguoidung),
    hangmuc VARCHAR(100),
    ngaydangky DATE DEFAULT CURRENT_DATE,
    trangthai VARCHAR(50) DEFAULT 'Chờ xác nhận'
);

CREATE TABLE ketquatd (
    id_ketquatd UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_giaidau UUID REFERENCES giaidau(id_giaidau),
    id_vadv1 UUID REFERENCES dkgiaidau(id_dkgiai),
    id_vadv2 UUID REFERENCES dkgiaidau(id_dkgiai),
    id_thang UUID REFERENCES dkgiaidau(id_dkgiai),
    diemso VARCHAR(50),
    vong VARCHAR(50),
    ngaythi TIMESTAMP
);

CREATE TABLE thongke (
    id_baocao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_nguoitao UUID REFERENCES nguoidung(id_nguoidung),
    loai VARCHAR(50),
    tungay DATE,
    denngay DATE,
    noidung TEXT,
    ngaytao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

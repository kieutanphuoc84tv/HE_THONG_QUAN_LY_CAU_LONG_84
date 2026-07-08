-- Chạy file này trong pgAdmin (Query Tool) hoặc psql để tạo DB theo CSDL_84.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bảng Người dùng
CREATE TABLE IF NOT EXISTS NGUOIDUNG (
    id_nguoidung UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tendangnhap VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    matkhau VARCHAR(255) NOT NULL,
    SDT VARCHAR(15),
    vaitro VARCHAR(20),
    ngaytao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Sân Cầu Lông
CREATE TABLE IF NOT EXISTS SAN (
    id_san UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_quanly UUID REFERENCES NGUOIDUNG(id_nguoidung),
    tensan VARCHAR(100) NOT NULL,
    loaisan VARCHAR(50),
    giathue DECIMAL(10, 2),
    trangthai VARCHAR(50) DEFAULT 'Sẵn sàng'
);

-- 3. Bảng Thành viên CLB
CREATE TABLE IF NOT EXISTS THANHVIENCLB (
    id_thanhvien UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_nguoidung UUID UNIQUE REFERENCES NGUOIDUNG(id_nguoidung),
    capbac VARCHAR(50),
    ngaythamgia DATE DEFAULT CURRENT_DATE,
    phihoivien DECIMAL(10, 2),
    trangthai VARCHAR(50)
);

-- 4. Bảng Đặt sân
CREATE TABLE IF NOT EXISTS DATSAN (
    id_datsan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_nguoidung UUID REFERENCES NGUOIDUNG(id_nguoidung),
    id_san UUID REFERENCES SAN(id_san),
    ngaydat DATE NOT NULL,
    giobatdau TIME NOT NULL,
    gioketthuc TIME NOT NULL,
    trangthai VARCHAR(50) DEFAULT 'Chờ xác nhận',
    ghichu TEXT
);

-- 5. Bảng Hóa đơn
CREATE TABLE IF NOT EXISTS HOADON (
    id_hoadon UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_datsan UUID UNIQUE REFERENCES DATSAN(id_datsan),
    sotien DECIMAL(12, 2) NOT NULL,
    phuongthuc VARCHAR(50),
    trangthai VARCHAR(50),
    ngaythanhtoan TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Lịch tập luyện
CREATE TABLE IF NOT EXISTS LICHTAPLUYEN (
    id_lichtapluyen UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_hlv UUID REFERENCES NGUOIDUNG(id_nguoidung),
    id_thanhvien UUID REFERENCES THANHVIENCLB(id_thanhvien),
    ngaytap DATE NOT NULL,
    giobatdau TIME,
    ketqua TEXT,
    ghichu TEXT
);

-- 7. Bảng Giải đấu
CREATE TABLE IF NOT EXISTS GIAIDAU (
    id_giaidau UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_nguoitochuc UUID REFERENCES NGUOIDUNG(id_nguoidung),
    tengiai VARCHAR(200) NOT NULL,
    ngaybatdau DATE,
    ngayketthuc DATE,
    thele TEXT,
    lephi DECIMAL(10, 2),
    trangthai VARCHAR(50)
);

-- 8. Bảng Đăng ký giải đấu
CREATE TABLE IF NOT EXISTS DKGIAIDAU (
    id_dkgiai UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_giaidau UUID REFERENCES GIAIDAU(id_giaidau),
    id_vadv UUID REFERENCES NGUOIDUNG(id_nguoidung),
    hangmuc VARCHAR(100),
    ngaydangky DATE DEFAULT CURRENT_DATE,
    trangthai VARCHAR(50)
);

-- 9. Bảng Kết quả trận đấu
CREATE TABLE IF NOT EXISTS KETQUATD (
    id_ketquatd UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_giaidau UUID REFERENCES GIAIDAU(id_giaidau),
    id_vadv1 UUID REFERENCES DKGIAIDAU(id_dkgiai),
    id_vadv2 UUID REFERENCES DKGIAIDAU(id_dkgiai),
    id_thang UUID REFERENCES DKGIAIDAU(id_dkgiai),
    diemso VARCHAR(50),
    vong VARCHAR(50),
    ngaythi TIMESTAMP
);

-- 10. Bảng Thống kê/Báo cáo
CREATE TABLE IF NOT EXISTS THONGKE (
    id_baocao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_nguoitao UUID REFERENCES NGUOIDUNG(id_nguoidung),
    loai VARCHAR(50),
    tungay DATE,
    denngay DATE,
    noidung TEXT,
    ngaytao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

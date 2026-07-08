-- ============================================================
-- CAU LONG 84 - FILE SQL TAO CSDL HOAN CHINH
-- Nguon tong hop: backend/prisma/schema.prisma
-- He quan tri CSDL: PostgreSQL
-- Ngay lap: 16/06/2026
-- ============================================================

-- Tuy chon tao database rieng:
-- CREATE DATABASE caulong84;
-- Sau khi tao database, ket noi vao database caulong84 roi chay phan ben duoi.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

SET search_path TO public;

-- ============================================================
-- XOA BANG CU NEU CAN TAO LAI TU DAU
-- ============================================================

DROP TABLE IF EXISTS "donthue" CASCADE;
DROP TABLE IF EXISTS "dichvu" CASCADE;
DROP TABLE IF EXISTS "tinnhan" CASCADE;
DROP TABLE IF EXISTS "thongbao" CASCADE;
DROP TABLE IF EXISTS "thongke" CASCADE;
DROP TABLE IF EXISTS "ketquatd" CASCADE;
DROP TABLE IF EXISTS "dkgiaidau" CASCADE;
DROP TABLE IF EXISTS "giaidau" CASCADE;
DROP TABLE IF EXISTS "lichtapluyen" CASCADE;
DROP TABLE IF EXISTS "hoadon" CASCADE;
DROP TABLE IF EXISTS "datsan" CASCADE;
DROP TABLE IF EXISTS "thanhvienclb" CASCADE;
DROP TABLE IF EXISTS "san" CASCADE;
DROP TABLE IF EXISTS "khuyenmai" CASCADE;
DROP TABLE IF EXISTS "goihoivien" CASCADE;
DROP TABLE IF EXISTS "nguoidung" CASCADE;

-- ============================================================
-- 1. BANG NGUOI DUNG
-- ============================================================

CREATE TABLE "nguoidung" (
    "id_nguoidung" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tendangnhap" VARCHAR(50) NOT NULL,
    "hoten" VARCHAR(100),
    "email" VARCHAR(100),
    "matkhau" VARCHAR(255) NOT NULL,
    "SDT" VARCHAR(15),
    "vaitro" VARCHAR(20),
    "oauth_provider" VARCHAR(20),
    "oauth_id" VARCHAR(100),
    "avatar" TEXT,
    "ngaytao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nguoidung_tendangnhap_key" UNIQUE ("tendangnhap"),
    CONSTRAINT "nguoidung_email_key" UNIQUE ("email"),
    CONSTRAINT "nguoidung_oauth_id_key" UNIQUE ("oauth_id")
);

-- ============================================================
-- 2. BANG SAN
-- ============================================================

CREATE TABLE "san" (
    "id_san" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_quanly" UUID,
    "tensan" VARCHAR(100) NOT NULL,
    "loaisan" VARCHAR(50),
    "giathue" DECIMAL(10, 2),
    "trangthai" VARCHAR(50) DEFAULT 'Sẵn sàng',
    "hinhanh" TEXT,
    CONSTRAINT "san_id_quanly_fkey"
        FOREIGN KEY ("id_quanly")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 3. BANG THANH VIEN CLB
-- ============================================================

CREATE TABLE "thanhvienclb" (
    "id_thanhvien" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_nguoidung" UUID NOT NULL,
    "capbac" VARCHAR(50),
    "ngaythamgia" DATE DEFAULT CURRENT_DATE,
    "ngayhethan" DATE,
    "phihoivien" DECIMAL(10, 2),
    "trangthai" VARCHAR(50),
    "phuongthucthanhtoan" VARCHAR(50),
    "diemtichluy" INTEGER DEFAULT 0,
    CONSTRAINT "thanhvienclb_id_nguoidung_key" UNIQUE ("id_nguoidung"),
    CONSTRAINT "thanhvienclb_id_nguoidung_fkey"
        FOREIGN KEY ("id_nguoidung")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 4. BANG DAT SAN
-- ============================================================

CREATE TABLE "datsan" (
    "id_datsan" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_nguoidung" UUID,
    "id_san" UUID,
    "ngaydat" DATE NOT NULL,
    "giobatdau" TIME(6) NOT NULL,
    "gioketthuc" TIME(6) NOT NULL,
    "trangthai" VARCHAR(50) DEFAULT 'Chờ xác nhận',
    "ghichu" TEXT,
    CONSTRAINT "datsan_id_nguoidung_fkey"
        FOREIGN KEY ("id_nguoidung")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT "datsan_id_san_fkey"
        FOREIGN KEY ("id_san")
        REFERENCES "san" ("id_san")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 5. BANG HOA DON
-- ============================================================

CREATE TABLE "hoadon" (
    "id_hoadon" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_datsan" UUID NOT NULL,
    "sotien" DECIMAL(12, 2) NOT NULL,
    "phuongthuc" VARCHAR(50),
    "trangthai" VARCHAR(50),
    "ngaythanhtoan" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hoadon_id_datsan_key" UNIQUE ("id_datsan"),
    CONSTRAINT "hoadon_id_datsan_fkey"
        FOREIGN KEY ("id_datsan")
        REFERENCES "datsan" ("id_datsan")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 6. BANG LICH TAP LUYEN
-- ============================================================

CREATE TABLE "lichtapluyen" (
    "id_lichtapluyen" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_hlv" UUID,
    "id_thanhvien" UUID,
    "ngaytap" DATE,
    "ngayketthuc" DATE,
    "giobatdau" TIME(6),
    "gioketthuc" TIME(6),
    "ketqua" TEXT,
    "ghichu" TEXT,
    "lephi" DECIMAL(10, 2),
    "trangthai" VARCHAR(50) DEFAULT 'Chờ xếp lịch',
    CONSTRAINT "lichtapluyen_id_hlv_fkey"
        FOREIGN KEY ("id_hlv")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT "lichtapluyen_id_thanhvien_fkey"
        FOREIGN KEY ("id_thanhvien")
        REFERENCES "thanhvienclb" ("id_thanhvien")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 7. BANG GIAI DAU
-- ============================================================

CREATE TABLE "giaidau" (
    "id_giaidau" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_nguoitochuc" UUID,
    "tengiai" VARCHAR(200) NOT NULL,
    "ngaybatdau" DATE,
    "ngayketthuc" DATE,
    "thele" TEXT,
    "lephi" DECIMAL(10, 2),
    "trangthai" VARCHAR(50),
    "soluongtoida" INTEGER DEFAULT 32,
    "hinhthuc" VARCHAR(50) DEFAULT 'KnockOut',
    "sovaodauknockout" INTEGER DEFAULT 4,
    CONSTRAINT "giaidau_id_nguoitochuc_fkey"
        FOREIGN KEY ("id_nguoitochuc")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 8. BANG DANG KY GIAI DAU
-- ============================================================

CREATE TABLE "dkgiaidau" (
    "id_dkgiai" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_giaidau" UUID,
    "id_vadv" UUID,
    "hangmuc" VARCHAR(100),
    "ngaydangky" DATE DEFAULT CURRENT_DATE,
    "trangthai" VARCHAR(50),
    CONSTRAINT "dkgiaidau_id_giaidau_fkey"
        FOREIGN KEY ("id_giaidau")
        REFERENCES "giaidau" ("id_giaidau")
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT "dkgiaidau_id_vadv_fkey"
        FOREIGN KEY ("id_vadv")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 9. BANG KET QUA TRAN DAU
-- ============================================================

CREATE TABLE "ketquatd" (
    "id_ketquatd" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_giaidau" UUID,
    "id_vadv1" UUID,
    "id_vadv2" UUID,
    "id_thang" UUID,
    "diemso" VARCHAR(50),
    "vong" VARCHAR(50),
    "ngaythi" TIMESTAMP(6),
    CONSTRAINT "ketquatd_id_giaidau_fkey"
        FOREIGN KEY ("id_giaidau")
        REFERENCES "giaidau" ("id_giaidau")
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT "ketquatd_id_vadv1_fkey"
        FOREIGN KEY ("id_vadv1")
        REFERENCES "dkgiaidau" ("id_dkgiai")
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT "ketquatd_id_vadv2_fkey"
        FOREIGN KEY ("id_vadv2")
        REFERENCES "dkgiaidau" ("id_dkgiai")
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT "ketquatd_id_thang_fkey"
        FOREIGN KEY ("id_thang")
        REFERENCES "dkgiaidau" ("id_dkgiai")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 10. BANG THONG KE
-- ============================================================

CREATE TABLE "thongke" (
    "id_baocao" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_nguoitao" UUID,
    "loai" VARCHAR(50),
    "tungay" DATE,
    "denngay" DATE,
    "noidung" TEXT,
    "ngaytao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "thongke_id_nguoitao_fkey"
        FOREIGN KEY ("id_nguoitao")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 11. BANG THONG BAO
-- ============================================================

CREATE TABLE "thongbao" (
    "id_thongbao" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_nguoidung" UUID,
    "tieude" VARCHAR(255) NOT NULL,
    "noidung" TEXT NOT NULL,
    "loai" VARCHAR(50) NOT NULL,
    "id_lienket" UUID,
    "link" VARCHAR(255),
    "dadoct" BOOLEAN NOT NULL DEFAULT false,
    "ngaytao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "thongbao_id_nguoidung_fkey"
        FOREIGN KEY ("id_nguoidung")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 12. BANG TIN NHAN
-- ============================================================

CREATE TABLE "tinnhan" (
    "id_tinnhan" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_nguoigui" UUID NOT NULL,
    "id_nguoinhan" UUID NOT NULL,
    "noidung" TEXT NOT NULL,
    "dadoct" BOOLEAN NOT NULL DEFAULT false,
    "ngaytao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tinnhan_id_nguoigui_fkey"
        FOREIGN KEY ("id_nguoigui")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT "tinnhan_id_nguoinhan_fkey"
        FOREIGN KEY ("id_nguoinhan")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 13. BANG DICH VU
-- ============================================================

CREATE TABLE "dichvu" (
    "id_dichvu" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tendichvu" VARCHAR(100) NOT NULL,
    "danhmuc" VARCHAR(50),
    "danhmuccon" VARCHAR(80),
    "mota" TEXT,
    "hinhanh" TEXT,
    "gia" DECIMAL(10, 2),
    "giathue" DECIMAL(10, 2),
    "soluong" INTEGER DEFAULT 0,
    "trangthai" VARCHAR(50) DEFAULT 'ConHang',
    "ngaytao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. BANG DON THUE
-- ============================================================

CREATE TABLE "donthue" (
    "id_donthue" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_nguoidung" UUID,
    "id_dichvu" UUID,
    "soluong" INTEGER DEFAULT 1,
    "sogio" DECIMAL(5, 2),
    "tongtien" DECIMAL(12, 2),
    "ghichu" TEXT,
    "trangthai" VARCHAR(50) DEFAULT 'DangThue',
    "ngaytao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "donthue_id_nguoidung_fkey"
        FOREIGN KEY ("id_nguoidung")
        REFERENCES "nguoidung" ("id_nguoidung")
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT "donthue_id_dichvu_fkey"
        FOREIGN KEY ("id_dichvu")
        REFERENCES "dichvu" ("id_dichvu")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 15. BANG KHUYEN MAI
-- ============================================================

CREATE TABLE "khuyenmai" (
    "id_khuyenmai" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "makhuyenmai" VARCHAR(50) NOT NULL,
    "tenkhuyenmai" VARCHAR(150) NOT NULL,
    "phantramgiam" DECIMAL(5, 2),
    "giamtoida" DECIMAL(12, 2),
    "ngaybatdau" TIMESTAMP(6),
    "ngayketthuc" TIMESTAMP(6),
    "soluong" INTEGER DEFAULT 0,
    "trangthai" VARCHAR(50) DEFAULT 'Đang diễn ra',
    CONSTRAINT "khuyenmai_makhuyenmai_key" UNIQUE ("makhuyenmai")
);

-- ============================================================
-- 16. BANG GOI HOI VIEN
-- ============================================================

CREATE TABLE "goihoivien" (
    "id_goi" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tengoi" VARCHAR(100) NOT NULL,
    "thoihan" INTEGER,
    "giatien" DECIMAL(12, 2),
    "mota" TEXT,
    "trangthai" VARCHAR(50) DEFAULT 'Đang bán'
);


-- ============================================================
-- INDEX BO SUNG
-- ============================================================

CREATE INDEX "idx_san_id_quanly" ON "san" ("id_quanly");
CREATE INDEX "idx_datsan_id_nguoidung" ON "datsan" ("id_nguoidung");
CREATE INDEX "idx_datsan_id_san" ON "datsan" ("id_san");
CREATE INDEX "idx_lichtapluyen_id_hlv" ON "lichtapluyen" ("id_hlv");
CREATE INDEX "idx_lichtapluyen_id_thanhvien" ON "lichtapluyen" ("id_thanhvien");
CREATE INDEX "idx_giaidau_id_nguoitochuc" ON "giaidau" ("id_nguoitochuc");
CREATE INDEX "idx_dkgiaidau_id_giaidau" ON "dkgiaidau" ("id_giaidau");
CREATE INDEX "idx_dkgiaidau_id_vadv" ON "dkgiaidau" ("id_vadv");
CREATE INDEX "idx_ketquatd_id_giaidau" ON "ketquatd" ("id_giaidau");
CREATE INDEX "idx_ketquatd_id_vadv1" ON "ketquatd" ("id_vadv1");
CREATE INDEX "idx_ketquatd_id_vadv2" ON "ketquatd" ("id_vadv2");
CREATE INDEX "idx_ketquatd_id_thang" ON "ketquatd" ("id_thang");
CREATE INDEX "idx_thongke_id_nguoitao" ON "thongke" ("id_nguoitao");
CREATE INDEX "idx_thongbao_id_nguoidung" ON "thongbao" ("id_nguoidung");
CREATE INDEX "idx_tinnhan_gui_nhan_ngaytao" ON "tinnhan" ("id_nguoigui", "id_nguoinhan", "ngaytao");
CREATE INDEX "idx_tinnhan_nguoinhan_dadoct" ON "tinnhan" ("id_nguoinhan", "dadoct");
CREATE INDEX "idx_donthue_id_nguoidung" ON "donthue" ("id_nguoidung");
CREATE INDEX "idx_donthue_id_dichvu" ON "donthue" ("id_dichvu");
CREATE INDEX "idx_calamviec_id_nhanvien" ON "calamviec" ("id_nhanvien");

-- ============================================================
-- KIEM TRA SO LUONG BANG SAU KHI TAO
-- ============================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'nguoidung',
    'san',
    'thanhvienclb',
    'datsan',
    'hoadon',
    'lichtapluyen',
    'giaidau',
    'dkgiaidau',
    'ketquatd',
    'thongke',
    'thongbao',
    'tinnhan',
    'dichvu',
    'donthue',
    'khuyenmai',
    'goihoivien',
  )
ORDER BY table_name;

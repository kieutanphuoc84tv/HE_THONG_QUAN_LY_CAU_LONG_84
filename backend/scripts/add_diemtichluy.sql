-- Thêm cột diemtichluy vào bảng thanhvienclb
ALTER TABLE thanhvienclb ADD COLUMN IF NOT EXISTS diemtichluy INTEGER DEFAULT 0;

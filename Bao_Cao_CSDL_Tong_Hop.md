# Báo cáo tổng hợp cơ sở dữ liệu Cầu Lông 84

Nguồn tổng hợp chính: `backend/prisma/schema.prisma`

Ngày lập: 16/06/2026

## 1. Tổng quan

Hệ thống hiện dùng 1 cơ sở dữ liệu PostgreSQL cho website Cầu Lông 84.

Tổng số bảng trong schema hiện tại: 16 bảng.

Ghi chú quan trọng:

- Không có bảng riêng tên `nhanvien`; vai trò nhân viên/quản trị/khách hàng được lưu trong bảng `nguoidung`, cột `vaitro`.
- File SQL hoàn chỉnh tương ứng: `CAULONG84_CSDL_HoanChinh.sql`.

## 2. Danh sách bảng

| STT | Tên bảng trong database | Model Prisma     | Chức năng chính                                                  |
| --: | ------------------------- | ---------------- | ------------------------------------------------------------------- |
|   1 | `nguoidung`             | `NguoiDung`    | Lưu tài khoản người dùng, admin, quản lý, HLV, khách hàng |
|   2 | `san`                   | `San`          | Lưu thông tin sân cầu lông                                     |
|   3 | `thanhvienclb`          | `ThanhVienClb` | Lưu thông tin hội viên CLB                                      |
|   4 | `datsan`                | `DatSan`       | Lưu lịch đặt sân                                               |
|   5 | `hoadon`                | `HoaDon`       | Lưu hóa đơn thanh toán đặt sân                              |
|   6 | `lichtapluyen`          | `LichTapLuyen` | Lưu lịch tập luyện giữa HLV và hội viên                     |
|   7 | `giaidau`               | `GiaiDau`      | Lưu thông tin giải đấu                                         |
|   8 | `dkgiaidau`             | `DkGiaiDau`    | Lưu đăng ký tham gia giải đấu                                |
|   9 | `ketquatd`              | `KetQuaTd`     | Lưu kết quả trận đấu                                          |
|  10 | `thongke`               | `ThongKe`      | Lưu thống kê, báo cáo                                          |
|  11 | `thongbao`              | `ThongBao`     | Lưu thông báo hệ thống                                         |
|  12 | `tinnhan`               | `TinNhan`      | Lưu tin nhắn giữa người dùng                                  |
|  13 | `dichvu`                | `DichVu`       | Lưu dịch vụ, dụng cụ, sản phẩm cho thuê                     |
|  14 | `donthue`               | `DonThue`      | Lưu đơn thuê dụng cụ/dịch vụ                                |
|  15 | `khuyenmai`             | `KhuyenMai`    | Lưu mã khuyến mãi                                               |
|  16 | `goihoivien`            | `GoiHoiVien`   | Lưu gói hội viên                                                |

## 3. Quan hệ chính giữa các bảng

| Bảng con        | Cột khóa ngoại  | Bảng cha        | Cột tham chiếu | Ý nghĩa                         |
| ---------------- | ------------------ | ---------------- | ---------------- | --------------------------------- |
| `san`          | `id_quanly`      | `nguoidung`    | `id_nguoidung` | Người quản lý sân            |
| `thanhvienclb` | `id_nguoidung`   | `nguoidung`    | `id_nguoidung` | Tài khoản hội viên            |
| `datsan`       | `id_nguoidung`   | `nguoidung`    | `id_nguoidung` | Người đặt sân                |
| `datsan`       | `id_san`         | `san`          | `id_san`       | Sân được đặt                |
| `hoadon`       | `id_datsan`      | `datsan`       | `id_datsan`    | Hóa đơn của lịch đặt sân  |
| `lichtapluyen` | `id_hlv`         | `nguoidung`    | `id_nguoidung` | Huấn luyện viên phụ trách    |
| `lichtapluyen` | `id_thanhvien`   | `thanhvienclb` | `id_thanhvien` | Hội viên tập luyện            |
| `giaidau`      | `id_nguoitochuc` | `nguoidung`    | `id_nguoidung` | Người tổ chức giải đấu     |
| `dkgiaidau`    | `id_giaidau`     | `giaidau`      | `id_giaidau`   | Giải đấu được đăng ký    |
| `dkgiaidau`    | `id_vadv`        | `nguoidung`    | `id_nguoidung` | Vận động viên đăng ký      |
| `ketquatd`     | `id_giaidau`     | `giaidau`      | `id_giaidau`   | Giải đấu của trận            |
| `ketquatd`     | `id_vadv1`       | `dkgiaidau`    | `id_dkgiai`    | Người/đội thứ nhất          |
| `ketquatd`     | `id_vadv2`       | `dkgiaidau`    | `id_dkgiai`    | Người/đội thứ hai            |
| `ketquatd`     | `id_thang`       | `dkgiaidau`    | `id_dkgiai`    | Người/đội thắng              |
| `thongke`      | `id_nguoitao`    | `nguoidung`    | `id_nguoidung` | Người tạo báo cáo            |
| `thongbao`     | `id_nguoidung`   | `nguoidung`    | `id_nguoidung` | Người nhận thông báo         |
| `tinnhan`      | `id_nguoigui`    | `nguoidung`    | `id_nguoidung` | Người gửi tin nhắn            |
| `tinnhan`      | `id_nguoinhan`   | `nguoidung`    | `id_nguoidung` | Người nhận tin nhắn           |
| `donthue`      | `id_nguoidung`   | `nguoidung`    | `id_nguoidung` | Người thuê                     |
| `donthue`      | `id_dichvu`      | `dichvu`       | `id_dichvu`    | Dịch vụ/dụng cụ được thuê |


## 4. Chi tiết từng bảng

### 4.1. Bảng `nguoidung`

Chức năng: Lưu tài khoản người dùng của toàn hệ thống.

| Cột               | Kiểu dữ liệu  | Bắt buộc | Mặc định/Ràng buộc            | Ghi chú                                             |
| ------------------ | ---------------- | ---------: | ---------------------------------- | ---------------------------------------------------- |
| `id_nguoidung`   | `UUID`         |        Có | Khóa chính,`gen_random_uuid()` | Mã người dùng                                    |
| `tendangnhap`    | `VARCHAR(50)`  |        Có | Unique                             | Tên đăng nhập                                    |
| `hoten`          | `VARCHAR(100)` |     Không |                                    | Họ tên                                             |
| `email`          | `VARCHAR(100)` |     Không | Unique                             | Email                                                |
| `matkhau`        | `VARCHAR(255)` |        Có |                                    | Mật khẩu đã mã hóa                             |
| `SDT`            | `VARCHAR(15)`  |     Không |                                    | Số điện thoại                                    |
| `vaitro`         | `VARCHAR(20)`  |     Không |                                    | Vai trò: Admin, QuanLy, HuanLuyenVien, KhachHang... |
| `oauth_provider` | `VARCHAR(20)`  |     Không |                                    | Nhà cung cấp OAuth                                 |
| `oauth_id`       | `VARCHAR(100)` |     Không | Unique                             | ID OAuth                                             |
| `avatar`         | `TEXT`         |     Không |                                    | Ảnh đại diện                                     |
| `ngaytao`        | `TIMESTAMP(6)` |     Không | `CURRENT_TIMESTAMP`              | Ngày tạo tài khoản                               |

### 4.2. Bảng `san`

Chức năng: Lưu thông tin sân cầu lông.

| Cột          | Kiểu dữ liệu   | Bắt buộc | Mặc định/Ràng buộc             | Ghi chú          |
| ------------- | ----------------- | ---------: | ----------------------------------- | ----------------- |
| `id_san`    | `UUID`          |        Có | Khóa chính,`gen_random_uuid()`  | Mã sân          |
| `id_quanly` | `UUID`          |     Không | FK đến `nguoidung.id_nguoidung` | Người quản lý |
| `tensan`    | `VARCHAR(100)`  |        Có |                                     | Tên sân         |
| `loaisan`   | `VARCHAR(50)`   |     Không |                                     | Loại sân        |
| `giathue`   | `DECIMAL(10,2)` |     Không |                                     | Giá thuê        |
| `trangthai` | `VARCHAR(50)`   |     Không | `Sẵn sàng`                      | Trạng thái sân |
| `hinhanh`   | `TEXT`          |     Không |                                     | Hình ảnh sân   |

### 4.3. Bảng `thanhvienclb`

Chức năng: Lưu thông tin hội viên CLB.

| Cột                    | Kiểu dữ liệu   | Bắt buộc | Mặc định/Ràng buộc                     | Ghi chú                   |
| ----------------------- | ----------------- | ---------: | ------------------------------------------- | -------------------------- |
| `id_thanhvien`        | `UUID`          |        Có | Khóa chính,`gen_random_uuid()`          | Mã hội viên             |
| `id_nguoidung`        | `UUID`          |        Có | Unique, FK đến `nguoidung.id_nguoidung` | Tài khoản người dùng  |
| `capbac`              | `VARCHAR(50)`   |     Không |                                             | Cấp bậc hội viên       |
| `ngaythamgia`         | `DATE`          |     Không | `CURRENT_DATE`                            | Ngày tham gia             |
| `ngayhethan`          | `DATE`          |     Không |                                             | Ngày hết hạn            |
| `phihoivien`          | `DECIMAL(10,2)` |     Không |                                             | Phí hội viên            |
| `trangthai`           | `VARCHAR(50)`   |     Không |                                             | Trạng thái hội viên    |
| `phuongthucthanhtoan` | `VARCHAR(50)`   |     Không |                                             | Phương thức thanh toán |
| `diemtichluy`         | `INTEGER`       |     Không | `0`                                       | Điểm tích lũy          |

### 4.4. Bảng `datsan`

Chức năng: Lưu lịch đặt sân.

| Cột             | Kiểu dữ liệu | Bắt buộc | Mặc định/Ràng buộc             | Ghi chú                |
| ---------------- | --------------- | ---------: | ----------------------------------- | ----------------------- |
| `id_datsan`    | `UUID`        |        Có | Khóa chính,`gen_random_uuid()`  | Mã lịch đặt         |
| `id_nguoidung` | `UUID`        |     Không | FK đến `nguoidung.id_nguoidung` | Người đặt           |
| `id_san`       | `UUID`        |     Không | FK đến `san.id_san`             | Sân được đặt      |
| `ngaydat`      | `DATE`        |        Có |                                     | Ngày đặt             |
| `giobatdau`    | `TIME(6)`     |        Có |                                     | Giờ bắt đầu         |
| `gioketthuc`   | `TIME(6)`     |        Có |                                     | Giờ kết thúc         |
| `trangthai`    | `VARCHAR(50)` |     Không | `Chờ xác nhận`                 | Trạng thái đặt sân |
| `ghichu`       | `TEXT`        |     Không |                                     | Ghi chú                |

### 4.5. Bảng `hoadon`

Chức năng: Lưu hóa đơn thanh toán lịch đặt sân.

| Cột              | Kiểu dữ liệu   | Bắt buộc | Mặc định/Ràng buộc               | Ghi chú                   |
| ----------------- | ----------------- | ---------: | ------------------------------------- | -------------------------- |
| `id_hoadon`     | `UUID`          |        Có | Khóa chính,`gen_random_uuid()`    | Mã hóa đơn             |
| `id_datsan`     | `UUID`          |        Có | Unique, FK đến `datsan.id_datsan` | Lịch đặt sân           |
| `sotien`        | `DECIMAL(12,2)` |        Có |                                       | Số tiền                  |
| `phuongthuc`    | `VARCHAR(50)`   |     Không |                                       | Phương thức thanh toán |
| `trangthai`     | `VARCHAR(50)`   |     Không |                                       | Trạng thái hóa đơn    |
| `ngaythanhtoan` | `TIMESTAMP(6)`  |     Không | `CURRENT_TIMESTAMP`                 | Ngày thanh toán          |

### 4.6. Bảng `lichtapluyen`

Chức năng: Lưu lịch tập luyện.

| Cột                | Kiểu dữ liệu   | Bắt buộc | Mặc định/Ràng buộc                | Ghi chú              |
| ------------------- | ----------------- | ---------: | -------------------------------------- | --------------------- |
| `id_lichtapluyen` | `UUID`          |        Có | Khóa chính,`gen_random_uuid()`     | Mã lịch tập        |
| `id_hlv`          | `UUID`          |     Không | FK đến `nguoidung.id_nguoidung`    | Huấn luyện viên    |
| `id_thanhvien`    | `UUID`          |     Không | FK đến `thanhvienclb.id_thanhvien` | Hội viên            |
| `ngaytap`         | `DATE`          |     Không |                                        | Ngày tập            |
| `ngayketthuc`     | `DATE`          |     Không |                                        | Ngày kết thúc      |
| `giobatdau`       | `TIME(6)`       |     Không |                                        | Giờ bắt đầu       |
| `gioketthuc`      | `TIME(6)`       |     Không |                                        | Giờ kết thúc       |
| `ketqua`          | `TEXT`          |     Không |                                        | Kết quả tập luyện |
| `ghichu`          | `TEXT`          |     Không |                                        | Ghi chú              |
| `lephi`           | `DECIMAL(10,2)` |     Không |                                        | Lệ phí              |
| `trangthai`       | `VARCHAR(50)`   |     Không | `Chờ xếp lịch`                    | Trạng thái          |

### 4.7. Bảng `giaidau`

Chức năng: Lưu thông tin giải đấu.

| Cột                 | Kiểu dữ liệu   | Bắt buộc | Mặc định/Ràng buộc             | Ghi chú                        |
| -------------------- | ----------------- | ---------: | ----------------------------------- | ------------------------------- |
| `id_giaidau`       | `UUID`          |        Có | Khóa chính,`gen_random_uuid()`  | Mã giải đấu                 |
| `id_nguoitochuc`   | `UUID`          |     Không | FK đến `nguoidung.id_nguoidung` | Người tổ chức               |
| `tengiai`          | `VARCHAR(200)`  |        Có |                                     | Tên giải                      |
| `ngaybatdau`       | `DATE`          |     Không |                                     | Ngày bắt đầu                |
| `ngayketthuc`      | `DATE`          |     Không |                                     | Ngày kết thúc                |
| `thele`            | `TEXT`          |     Không |                                     | Thể lệ                        |
| `lephi`            | `DECIMAL(10,2)` |     Không |                                     | Lệ phí                        |
| `trangthai`        | `VARCHAR(50)`   |     Không |                                     | Trạng thái                    |
| `soluongtoida`     | `INTEGER`       |     Không | `32`                              | Số lượng tối đa            |
| `hinhthuc`         | `VARCHAR(50)`   |     Không | `KnockOut`                        | Hình thức thi đấu           |
| `sovaodauknockout` | `INTEGER`       |     Không | `4`                               | Số người/đội vào knockout |

### 4.8. Bảng `dkgiaidau`

Chức năng: Lưu đăng ký giải đấu.

| Cột           | Kiểu dữ liệu  | Bắt buộc | Mặc định/Ràng buộc             | Ghi chú                |
| -------------- | ---------------- | ---------: | ----------------------------------- | ----------------------- |
| `id_dkgiai`  | `UUID`         |        Có | Khóa chính,`gen_random_uuid()`  | Mã đăng ký          |
| `id_giaidau` | `UUID`         |     Không | FK đến `giaidau.id_giaidau`     | Giải đấu             |
| `id_vadv`    | `UUID`         |     Không | FK đến `nguoidung.id_nguoidung` | Vận động viên       |
| `hangmuc`    | `VARCHAR(100)` |     Không |                                     | Hạng mục thi đấu    |
| `ngaydangky` | `DATE`         |     Không | `CURRENT_DATE`                    | Ngày đăng ký        |
| `trangthai`  | `VARCHAR(50)`  |     Không |                                     | Trạng thái đăng ký |

### 4.9. Bảng `ketquatd`

Chức năng: Lưu kết quả trận đấu.

| Cột            | Kiểu dữ liệu  | Bắt buộc | Mặc định/Ràng buộc            | Ghi chú               |
| --------------- | ---------------- | ---------: | ---------------------------------- | ---------------------- |
| `id_ketquatd` | `UUID`         |        Có | Khóa chính,`gen_random_uuid()` | Mã kết quả          |
| `id_giaidau`  | `UUID`         |     Không | FK đến `giaidau.id_giaidau`    | Giải đấu            |
| `id_vadv1`    | `UUID`         |     Không | FK đến `dkgiaidau.id_dkgiai`   | Đăng ký thi đấu 1 |
| `id_vadv2`    | `UUID`         |     Không | FK đến `dkgiaidau.id_dkgiai`   | Đăng ký thi đấu 2 |
| `id_thang`    | `UUID`         |     Không | FK đến `dkgiaidau.id_dkgiai`   | Người/đội thắng   |
| `diemso`      | `VARCHAR(50)`  |     Không |                                    | Điểm số             |
| `vong`        | `VARCHAR(50)`  |     Không |                                    | Vòng đấu            |
| `ngaythi`     | `TIMESTAMP(6)` |     Không |                                    | Ngày thi đấu        |

### 4.10. Bảng `thongke`

Chức năng: Lưu thống kê, báo cáo.

| Cột            | Kiểu dữ liệu  | Bắt buộc | Mặc định/Ràng buộc             | Ghi chú        |
| --------------- | ---------------- | ---------: | ----------------------------------- | --------------- |
| `id_baocao`   | `UUID`         |        Có | Khóa chính,`gen_random_uuid()`  | Mã báo cáo   |
| `id_nguoitao` | `UUID`         |     Không | FK đến `nguoidung.id_nguoidung` | Người tạo    |
| `loai`        | `VARCHAR(50)`  |     Không |                                     | Loại báo cáo |
| `tungay`      | `DATE`         |     Không |                                     | Từ ngày       |
| `denngay`     | `DATE`         |     Không |                                     | Đến ngày     |
| `noidung`     | `TEXT`         |     Không |                                     | Nội dung       |
| `ngaytao`     | `TIMESTAMP(6)` |     Không | `CURRENT_TIMESTAMP`               | Ngày tạo      |

### 4.11. Bảng `thongbao`

Chức năng: Lưu thông báo hệ thống.

| Cột             | Kiểu dữ liệu  | Bắt buộc | Mặc định/Ràng buộc             | Ghi chú                 |
| ---------------- | ---------------- | ---------: | ----------------------------------- | ------------------------ |
| `id_thongbao`  | `UUID`         |        Có | Khóa chính,`gen_random_uuid()`  | Mã thông báo          |
| `id_nguoidung` | `UUID`         |     Không | FK đến `nguoidung.id_nguoidung` | Người nhận            |
| `tieude`       | `VARCHAR(255)` |        Có |                                     | Tiêu đề               |
| `noidung`      | `TEXT`         |        Có |                                     | Nội dung                |
| `loai`         | `VARCHAR(50)`  |        Có |                                     | Loại thông báo        |
| `id_lienket`   | `UUID`         |     Không |                                     | ID dữ liệu liên kết  |
| `link`         | `VARCHAR(255)` |     Không |                                     | Đường dẫn liên kết |
| `dadoct`       | `BOOLEAN`      |        Có | `false`                           | Đã đọc hay chưa     |
| `ngaytao`      | `TIMESTAMP(6)` |        Có | `CURRENT_TIMESTAMP`               | Ngày tạo               |

### 4.12. Bảng `tinnhan`

Chức năng: Lưu tin nhắn giữa người dùng.

| Cột             | Kiểu dữ liệu  | Bắt buộc | Mặc định/Ràng buộc             | Ghi chú             |
| ---------------- | ---------------- | ---------: | ----------------------------------- | -------------------- |
| `id_tinnhan`   | `UUID`         |        Có | Khóa chính,`gen_random_uuid()`  | Mã tin nhắn        |
| `id_nguoigui`  | `UUID`         |        Có | FK đến `nguoidung.id_nguoidung` | Người gửi         |
| `id_nguoinhan` | `UUID`         |        Có | FK đến `nguoidung.id_nguoidung` | Người nhận        |
| `noidung`      | `TEXT`         |        Có |                                     | Nội dung            |
| `dadoct`       | `BOOLEAN`      |        Có | `false`                           | Đã đọc hay chưa |
| `ngaytao`      | `TIMESTAMP(6)` |        Có | `CURRENT_TIMESTAMP`               | Ngày tạo           |

Chỉ mục:

- `idx_tinnhan_gui_nhan_ngaytao` trên `id_nguoigui`, `id_nguoinhan`, `ngaytao`.
- `idx_tinnhan_nguoinhan_dadoct` trên `id_nguoinhan`, `dadoct`.

### 4.13. Bảng `dichvu`

Chức năng: Lưu dịch vụ, dụng cụ, sản phẩm cho thuê.

| Cột           | Kiểu dữ liệu   | Bắt buộc | Mặc định/Ràng buộc            | Ghi chú       |
| -------------- | ----------------- | ---------: | ---------------------------------- | -------------- |
| `id_dichvu`  | `UUID`          |        Có | Khóa chính,`gen_random_uuid()` | Mã dịch vụ  |
| `tendichvu`  | `VARCHAR(100)`  |        Có |                                    | Tên dịch vụ |
| `danhmuc`    | `VARCHAR(50)`   |     Không |                                    | Danh mục      |
| `danhmuccon` | `VARCHAR(80)`   |     Không |                                    | Danh mục con  |
| `mota`       | `TEXT`          |     Không |                                    | Mô tả        |
| `hinhanh`    | `TEXT`          |     Không |                                    | Hình ảnh     |
| `gia`        | `DECIMAL(10,2)` |     Không |                                    | Giá mua/giá bán tham khảo, không dùng tính đơn thuê |
| `giathue`    | `DECIMAL(10,2)` |     Không |                                    | Giá thuê theo giờ dùng tính đơn thuê |
| `soluong`    | `INTEGER`       |     Không | `0`                              | Số lượng    |
| `trangthai`  | `VARCHAR(50)`   |     Không | `ConHang`                        | Trạng thái   |
| `ngaytao`    | `TIMESTAMP(6)`  |     Không | `CURRENT_TIMESTAMP`              | Ngày tạo     |

### 4.14. Bảng `donthue`

Chức năng: Lưu đơn thuê dụng cụ/dịch vụ.

| Cột             | Kiểu dữ liệu   | Bắt buộc | Mặc định/Ràng buộc             | Ghi chú                 |
| ---------------- | ----------------- | ---------: | ----------------------------------- | ------------------------ |
| `id_donthue`   | `UUID`          |        Có | Khóa chính,`gen_random_uuid()`  | Mã đơn thuê          |
| `id_nguoidung` | `UUID`          |     Không | FK đến `nguoidung.id_nguoidung` | Người thuê            |
| `id_dichvu`    | `UUID`          |     Không | FK đến `dichvu.id_dichvu`       | Dịch vụ/dụng cụ      |
| `soluong`      | `INTEGER`       |     Không | `1`                               | Số lượng              |
| `sogio`        | `DECIMAL(5,2)`  |     Không |                                     | Số giờ thuê           |
| `tongtien`     | `DECIMAL(12,2)` |     Không |                                     | Tổng tiền              |
| `ghichu`       | `TEXT`          |     Không |                                     | Ghi chú                 |
| `trangthai`    | `VARCHAR(50)`   |     Không | `DangThue`                        | Trạng thái đơn thuê |
| `ngaytao`      | `TIMESTAMP(6)`  |     Không | `CURRENT_TIMESTAMP`               | Ngày tạo               |

### 4.15. Bảng `khuyenmai`

Chức năng: Lưu mã khuyến mãi.

| Cột             | Kiểu dữ liệu   | Bắt buộc | Mặc định/Ràng buộc            | Ghi chú          |
| ---------------- | ----------------- | ---------: | ---------------------------------- | ----------------- |
| `id_khuyenmai` | `UUID`          |        Có | Khóa chính,`gen_random_uuid()` | Mã nội bộ      |
| `makhuyenmai`  | `VARCHAR(50)`   |        Có | Unique                             | Mã khuyến mãi  |
| `tenkhuyenmai` | `VARCHAR(150)`  |        Có |                                    | Tên khuyến mãi |
| `phantramgiam` | `DECIMAL(5,2)`  |     Không |                                    | Phần trăm giảm |
| `giamtoida`    | `DECIMAL(12,2)` |     Không |                                    | Giảm tối đa    |
| `ngaybatdau`   | `TIMESTAMP(6)`  |     Không |                                    | Ngày bắt đầu  |
| `ngayketthuc`  | `TIMESTAMP(6)`  |     Không |                                    | Ngày kết thúc  |
| `soluong`      | `INTEGER`       |     Không | `0`                              | Số lượng mã   |
| `trangthai`    | `VARCHAR(50)`   |     Không | `Đang diễn ra`                 | Trạng thái      |

### 4.16. Bảng `goihoivien`

Chức năng: Lưu gói hội viên.

| Cột          | Kiểu dữ liệu   | Bắt buộc | Mặc định/Ràng buộc            | Ghi chú               |
| ------------- | ----------------- | ---------: | ---------------------------------- | ---------------------- |
| `id_goi`    | `UUID`          |        Có | Khóa chính,`gen_random_uuid()` | Mã gói               |
| `tengoi`    | `VARCHAR(100)`  |        Có |                                    | Tên gói              |
| `thoihan`   | `INTEGER`       |     Không |                                    | Thời hạn theo tháng |
| `giatien`   | `DECIMAL(12,2)` |     Không |                                    | Giá tiền             |
| `mota`      | `TEXT`          |     Không |                                    | Mô tả                |
| `trangthai` | `VARCHAR(50)`   |     Không | `Đang bán`                     | Trạng thái           |

## 5. Thống kê ràng buộc

### Khóa chính

Mỗi bảng đều có 1 khóa chính dạng `UUID`.

### Unique

| Bảng            | Cột unique                              |
| ---------------- | ---------------------------------------- |
| `nguoidung`    | `tendangnhap`, `email`, `oauth_id` |
| `thanhvienclb` | `id_nguoidung`                         |
| `hoadon`       | `id_datsan`                            |
| `khuyenmai`    | `makhuyenmai`                          |

### Index bổ sung

| Bảng       | Index                                          |
| ----------- | ---------------------------------------------- |
| `tinnhan` | `id_nguoigui`, `id_nguoinhan`, `ngaytao` |
| `tinnhan` | `id_nguoinhan`, `dadoct`                   |

## 6. Dữ liệu mẫu thực tế trong hệ thống

> Dữ liệu dưới đây được trích xuất từ các file seed thực tế của dự án (`prisma/seed.js`, `seed_data.js`, `seed_new_tables.js`, `seed_giaidau.js`, `seed_dkgiaidau.js`, `seed_bookings_rentals.js`, `reseed_schedules.js`, `scrape_shopvnb.js`, `seedAdmin.js`, `add-coach.js`, `update_usernames.js`).
> Tất cả dữ liệu đều là dữ liệu thật đang chạy trong hệ thống, **không phải dữ liệu ảo**.

### 6.1. Bảng `nguoidung` – Tài khoản Admin

| STT | Mã ID | Tên đăng nhập | Họ tên | Email | SĐT | Vai trò | Mật khẩu gốc | OAuth |
| --: | ----- | ------------- | ------ | ----- | --- | ------- | ------------- | ----- |
| 1 | NGUOI_DUNG_1 | `admin` | Quản Trị Viên | admin@gmail.com | 0123456789 | Admin | admin123 | Không |

> Nguồn: `seedAdmin.js` – Tài khoản admin mặc định của hệ thống.

### 6.2. Bảng `nguoidung` – Huấn luyện viên (10 HLV)

| STT | Mã ID | Tên đăng nhập | Họ tên | Email | SĐT | Vai trò | OAuth |
| --: | ----- | ------------- | ------ | ----- | --- | ------- | ----- |
| 1 | NGUOI_DUNG_2 | `tranminhTuan` | Trần Minh Tuấn | tranminhtuan@gmail.com | 0912345678 | HuanLuyenVien | Không |
| 2 | NGUOI_DUNG_3 | `nguyenhoangnam` | Nguyễn Hoàng Nam | nguyenhoangnam@gmail.com | 0938567234 | HuanLuyenVien | Không |
| 3 | NGUOI_DUNG_4 | `levanthang` | Lê Văn Thắng | levanthang@gmail.com | 0976432198 | HuanLuyenVien | Không |
| 4 | NGUOI_DUNG_5 | `phamductri` | Phạm Đức Trí | phamductri@gmail.com | 0903876541 | HuanLuyenVien | Không |
| 5 | NGUOI_DUNG_6 | `hoangdinhdung` | Hoàng Đình Dũng | hoangdinhdung@gmail.com | 0867123456 | HuanLuyenVien | Không |
| 6 | NGUOI_DUNG_7 | `vungochuy` | Vũ Ngọc Huy | vungochuy@gmail.com | 0345678912 | HuanLuyenVien | Không |
| 7 | NGUOI_DUNG_8 | `dangquocbao` | Đặng Quốc Bảo | dangquocbao@gmail.com | 0789234567 | HuanLuyenVien | Không |
| 8 | NGUOI_DUNG_9 | `buixuanhiep` | Bùi Xuân Hiệp | buixuanhiep@gmail.com | 0356789123 | HuanLuyenVien | Không |
| 9 | NGUOI_DUNG_10 | `dokhactiep` | Đỗ Khắc Tiệp | dokhactiep@gmail.com | 0921456789 | HuanLuyenVien | Không |
| 10 | NGUOI_DUNG_11 | `hoanhminh` | Hồ Anh Minh | hoanhminh@gmail.com | 0834567891 | HuanLuyenVien | Không |

> Nguồn: `seed_data.js`, `update_usernames.js` – Tên Việt Nam thật, email sinh từ tên đăng nhập.

### 6.3. Bảng `nguoidung` – Khách hàng / Học viên (10 người)

| STT | Mã ID | Tên đăng nhập | Họ tên | Email | SĐT | Vai trò | OAuth |
| --: | ----- | ------------- | ------ | ----- | --- | ------- | ----- |
| 1 | NGUOI_DUNG_12 | `nguyenthihuong` | Nguyễn Thị Hương | nguyenthihuong@gmail.com | 0971234567 | KhachHang | Không |
| 2 | NGUOI_DUNG_13 | `trantuha` | Trần Thu Hà | trantuha@gmail.com | 0886543210 | KhachHang | Không |
| 3 | NGUOI_DUNG_14 | `lebichngoc` | Lê Bích Ngọc | lebichngoc@gmail.com | 0932167854 | KhachHang | Không |
| 4 | NGUOI_DUNG_15 | `phamthanhtam` | Phạm Thanh Tâm | phamthanhtam@gmail.com | 0365478921 | KhachHang | Không |
| 5 | NGUOI_DUNG_16 | `dinhquynhanh` | Đinh Quỳnh Anh | dinhquynhanh@gmail.com | 0708912345 | KhachHang | Không |
| 6 | NGUOI_DUNG_17 | `nguyenvantai` | Nguyễn Văn Tài | nguyenvantai@gmail.com | 0943215678 | KhachHang | Không |
| 7 | NGUOI_DUNG_18 | `lycongtuan` | Lý Công Tuấn | lycongtuan@gmail.com | 0817654329 | KhachHang | Không |
| 8 | NGUOI_DUNG_19 | `doannhatphuong` | Đoàn Nhật Phương | doannhatphuong@gmail.com | 0394521876 | KhachHang | Không |
| 9 | NGUOI_DUNG_20 | `truongtuantai` | Trương Tuấn Tài | truongtuantai@gmail.com | 0962318745 | KhachHang | Không |
| 10 | NGUOI_DUNG_21 | `vuongyennhi` | Vương Yến Nhi | vuongyennhi@gmail.com | 0851679234 | KhachHang | Không |

> Nguồn: `seed_data.js`, `update_usernames.js` – Tên thật, mật khẩu mặc định `123456`.

### 6.4. Bảng `nguoidung` – Tài khoản khác

| STT | Mã ID | Tên đăng nhập | Họ tên | Email | SĐT | Vai trò | Ghi chú |
| --: | ----- | ------------- | ------ | ----- | --- | ------- | ------- |
| 1 | NGUOI_DUNG_22 | `khachhang` | Khách hàng Demo | khach@gmail.com | 0987654321 | KhachHang | Tài khoản demo từ seed gốc |
| 2 | NGUOI_DUNG_23 | `nguyenvana` | Nguyễn Văn A | nguyenvana@gmail.com | 0988777666 | HuanLuyenVien | HLV thêm riêng |

> Nguồn: `prisma/seed.js`, `add-coach.js`.

### 6.5. Bảng `san` – Sân cầu lông (5 sân)

| STT | Mã ID | Tên sân | Loại sân | Giá thuê (VNĐ/giờ) | Trạng thái |
| --: | ----- | ------- | -------- | ------------------: | ---------- |
| 1 | SAN_1 | Sân 1 | Tiêu chuẩn | 70.000 | Sẵn sàng |
| 2 | SAN_2 | Sân 2 | Tiêu chuẩn | 70.000 | Sẵn sàng |
| 3 | SAN_3 | Sân 3 | Tiêu chuẩn | 70.000 | Sẵn sàng |
| 4 | SAN_4 | Sân 4 | Tiêu chuẩn | 70.000 | Sẵn sàng |
| 5 | SAN_5 | Sân 5 | Tiêu chuẩn | 70.000 | Sẵn sàng |

> Nguồn: `prisma/seed.js` – 5 sân tiêu chuẩn, giá thuê 70.000đ/giờ.

### 6.6. Bảng `thanhvienclb` – Hội viên CLB

| STT | Mã ID | Họ tên (từ `nguoidung`) | Cấp bậc | Phí hội viên | Điểm tích lũy | Trạng thái |
| --: | ----- | ----------------------- | ------- | -----------: | -------------: | ---------- |
| 1 | THANH_VIEN_1 | Khách hàng Demo | Thành viên | – | 0 | Hoạt động |
| 2 | THANH_VIEN_2 | Nguyễn Thị Hương | Thành viên | – | 0 | Hoạt động |
| 3 | THANH_VIEN_3 | Trần Thu Hà | Thành viên | – | 0 | Hoạt động |
| 4 | THANH_VIEN_4 | Lê Bích Ngọc | Thành viên | – | 0 | Hoạt động |
| 5 | THANH_VIEN_5 | Phạm Thanh Tâm | Thành viên | – | 0 | Hoạt động |
| 6 | THANH_VIEN_6 | Đinh Quỳnh Anh | Thành viên | – | 0 | Hoạt động |
| 7 | THANH_VIEN_7 | Nguyễn Văn Tài | Thành viên | – | 0 | Hoạt động |
| 8 | THANH_VIEN_8 | Lý Công Tuấn | Thành viên | – | 0 | Hoạt động |
| 9 | THANH_VIEN_9 | Đoàn Nhật Phương | Thành viên | – | 0 | Hoạt động |
| 10 | THANH_VIEN_10 | Trương Tuấn Tài | Thành viên | – | 0 | Hoạt động |
| 11 | THANH_VIEN_11 | Vương Yến Nhi | Thành viên | – | 0 | Hoạt động |

> Nguồn: `prisma/seed.js`, `seed_data.js` – Mỗi khách hàng tự động tạo hội viên CLB khi đăng ký.

### 6.7. Bảng `datsan` – Lịch đặt sân (mẫu)

Mỗi người đặt 2 lần, giờ khác nhau, rải 7 ngày. Dưới đây là mẫu đặt sân thực tế:

| STT | Mã ID | Khách hàng | Sân | Khung giờ | Trạng thái | Ghi chú |
| --: | ----- | ---------- | --- | --------- | ---------- | ------- |
| 1 | DAT_SAN_1 | Nguyễn Thị Hương | Sân 1 | 06:00 – 07:30 | Đã xác nhận | Nguyễn Thị Hương đặt Sân 1 - 06:00 đến 07:30 |
| 2 | DAT_SAN_2 | Nguyễn Thị Hương | Sân 2 | 07:30 – 09:00 | Chờ xác nhận | Nguyễn Thị Hương đặt Sân 2 - 07:30 đến 09:00 |
| 3 | DAT_SAN_3 | Trần Thu Hà | Sân 3 | 09:00 – 10:30 | Đã xác nhận | Trần Thu Hà đặt Sân 3 - 09:00 đến 10:30 |
| 4 | DAT_SAN_4 | Lê Bích Ngọc | Sân 4 | 10:30 – 12:00 | Đã hủy | Lê Bích Ngọc đặt Sân 4 - 10:30 đến 12:00 |
| 5 | DAT_SAN_5 | Phạm Thanh Tâm | Sân 5 | 14:00 – 15:30 | Đã xác nhận | Phạm Thanh Tâm đặt Sân 5 - 14:00 đến 15:30 |
| 6 | DAT_SAN_6 | Đinh Quỳnh Anh | Sân 1 | 15:30 – 17:00 | Chờ xác nhận | Đinh Quỳnh Anh đặt Sân 1 - 15:30 đến 17:00 |
| 7 | DAT_SAN_7 | Nguyễn Văn Tài | Sân 2 | 17:00 – 18:30 | Hoàn thành | Nguyễn Văn Tài đặt Sân 2 - 17:00 đến 18:30 |
| 8 | DAT_SAN_8 | Lý Công Tuấn | Sân 3 | 18:30 – 20:00 | Đã xác nhận | Lý Công Tuấn đặt Sân 3 - 18:30 đến 20:00 |
| 9 | DAT_SAN_9 | Đoàn Nhật Phương | Sân 4 | 20:00 – 21:30 | Chờ xác nhận | Đoàn Nhật Phương đặt Sân 4 - 20:00 đến 21:30 |

> Nguồn: `seed_bookings_rentals.js` – 9 khung giờ đặt sân, trạng thái đa dạng.

### 6.8. Bảng `hoadon` – Hóa đơn thanh toán (mẫu)

Hóa đơn tự động tạo cho các đơn đặt sân có trạng thái "Đã xác nhận" hoặc "Hoàn thành":

| STT | Mã ID | Khách hàng | Số tiền (VNĐ) | Phương thức | Trạng thái |
| --: | ----- | ---------- | ------------: | ----------- | ---------- |
| 1 | HOA_DON_1 | Nguyễn Thị Hương | 105.000 | Tiền mặt | Chờ thanh toán |
| 2 | HOA_DON_2 | Trần Thu Hà | 105.000 | Chuyển khoản | Chờ thanh toán |
| 3 | HOA_DON_3 | Phạm Thanh Tâm | 105.000 | VNPay | Chờ thanh toán |
| 4 | HOA_DON_4 | Nguyễn Văn Tài | 105.000 | Tiền mặt | Đã thanh toán |
| 5 | HOA_DON_5 | Lý Công Tuấn | 105.000 | Chuyển khoản | Chờ thanh toán |

> Nguồn: `seed_bookings_rentals.js` – Số tiền = giá thuê sân (70.000) × 1.5 giờ = 105.000đ. Phương thức xoay vòng: Tiền mặt, Chuyển khoản, VNPay.

### 6.9. Bảng `lichtapluyen` – Lịch tập luyện (mẫu)

Mỗi HLV có 3 buổi tập, ghép cặp 1:1 với học viên, rải 7 ngày, 10 khung giờ:

| STT | Mã ID | Huấn luyện viên | Học viên | Khung giờ | Lệ phí (VNĐ) | Trạng thái |
| --: | ----- | --------------- | -------- | --------- | ------------: | ---------- |
| 1 | LICH_TAP_1 | Trần Minh Tuấn | Nguyễn Thị Hương | 06:00 – 07:00 | 150.000 | Chờ xếp lịch |
| 2 | LICH_TAP_2 | Trần Minh Tuấn | Nguyễn Thị Hương | 15:00 – 16:00 | 150.000 | Đợi xác nhận |
| 3 | LICH_TAP_3 | Trần Minh Tuấn | Nguyễn Thị Hương | 19:30 – 20:30 | 150.000 | Đã chốt lịch |
| 4 | LICH_TAP_4 | Nguyễn Hoàng Nam | Trần Thu Hà | 07:00 – 08:00 | 150.000 | Hoàn thành |
| 5 | LICH_TAP_5 | Nguyễn Hoàng Nam | Trần Thu Hà | 16:00 – 17:00 | 150.000 | Chờ xác nhận hủy |
| 6 | LICH_TAP_6 | Nguyễn Hoàng Nam | Trần Thu Hà | 20:30 – 21:30 | 150.000 | Đã hủy |
| 7 | LICH_TAP_7 | Lê Văn Thắng | Lê Bích Ngọc | 08:00 – 09:00 | 150.000 | Chờ xếp lịch |
| 8 | LICH_TAP_8 | Phạm Đức Trí | Phạm Thanh Tâm | 09:30 – 10:30 | 150.000 | Đợi xác nhận |
| 9 | LICH_TAP_9 | Hoàng Đình Dũng | Đinh Quỳnh Anh | 17:00 – 18:00 | 150.000 | Đã chốt lịch |
| 10 | LICH_TAP_10 | Vũ Ngọc Huy | Nguyễn Văn Tài | 18:30 – 19:30 | 150.000 | Hoàn thành |

> Nguồn: `reseed_schedules.js` – 30 buổi tập (10 HLV × 3 buổi), không trùng lịch, 6 trạng thái xoay vòng.

### 6.10. Bảng `giaidau` – Giải đấu (3 giải)

| STT | Mã ID | Tên giải | Ngày bắt đầu | Ngày kết thúc | Lệ phí (VNĐ) | SL tối đa | Hình thức | Trạng thái |
| --: | ----- | -------- | ------------ | ------------- | ------------: | --------: | --------- | ---------- |
| 1 | GIAI_DAU_1 | Giải đấu cầu lông 84 tại Vĩnh Long | 01/07/2026 | 02/07/2026 | 150.000 | 8 | KnockOut | Sắp diễn ra |
| 2 | GIAI_DAU_2 | Giải giao hữu Phường 1 Trà Vinh | 15/07/2026 | 16/07/2026 | 100.000 | 8 | Đấu vòng tròn | Đang đăng ký |
| 3 | GIAI_DAU_3 | Giải phong trào Cầu Lông 84 - Tứ Hùng | 01/08/2026 | 03/08/2026 | 200.000 | 8 | Đấu vòng tròn | Chưa bắt đầu |

> Nguồn: `seed_giaidau.js` – 3 giải đấu thực tế tại khu vực Vĩnh Long, Trà Vinh.

### 6.11. Bảng `dkgiaidau` – Đăng ký giải đấu (mẫu)

8 người đăng ký giải "Giải đấu cầu lông 84 tại Vĩnh Long":

| STT | Mã ID | Giải đấu | Vận động viên | Hạng mục | Trạng thái |
| --: | ----- | -------- | ------------- | -------- | ---------- |
| 1 | DK_GIAI_1 | Giải đấu CL 84 tại Vĩnh Long | Quản Trị Viên | Đơn nam | Đã duyệt |
| 2 | DK_GIAI_2 | Giải đấu CL 84 tại Vĩnh Long | Nguyễn Thị Hương | Đơn nam | Đã duyệt |
| 3 | DK_GIAI_3 | Giải đấu CL 84 tại Vĩnh Long | Trần Thu Hà | Đơn nam | Đã duyệt |
| 4 | DK_GIAI_4 | Giải đấu CL 84 tại Vĩnh Long | Lê Bích Ngọc | Đơn nam | Đã duyệt |
| 5 | DK_GIAI_5 | Giải đấu CL 84 tại Vĩnh Long | Phạm Thanh Tâm | Đơn nam | Đã duyệt |
| 6 | DK_GIAI_6 | Giải đấu CL 84 tại Vĩnh Long | Đinh Quỳnh Anh | Đơn nam | Đã duyệt |
| 7 | DK_GIAI_7 | Giải đấu CL 84 tại Vĩnh Long | Nguyễn Văn Tài | Đơn nam | Đã duyệt |
| 8 | DK_GIAI_8 | Giải đấu CL 84 tại Vĩnh Long | Lý Công Tuấn | Đơn nam | Đã duyệt |

> Nguồn: `seed_dkgiaidau.js` – Lấy 8 người dùng đầu tiên đăng ký vào giải.

### 6.12. Bảng `ketquatd` – Kết quả trận đấu (mẫu)

Sơ đồ KnockOut được tạo tự động bằng cách bốc thăm ngẫu nhiên:

| STT | Mã ID | Giải đấu | VĐV 1 | VĐV 2 | Vòng | Điểm số | Người thắng |
| --: | ----- | -------- | ----- | ----- | ---- | ------- | ----------- |
| 1 | KET_QUA_1 | Giải đấu CL 84 tại Vĩnh Long | (Bốc thăm ngẫu nhiên) | (Bốc thăm ngẫu nhiên) | 1 | – | (Chờ thi đấu) |
| 2 | KET_QUA_2 | Giải đấu CL 84 tại Vĩnh Long | (Bốc thăm ngẫu nhiên) | (Bốc thăm ngẫu nhiên) | 1 | – | (Chờ thi đấu) |

> Nguồn: `seed-tournament.js` – Ghép cặp ngẫu nhiên theo hình thức KnockOut.

### 6.13. Bảng `dichvu` – Dịch vụ / dụng cụ cho thuê (mẫu)

Dữ liệu trong bảng này phục vụ nghiệp vụ thuê dụng cụ tại Cầu Lông 84. Tên, danh mục và hình ảnh có thể tham khảo từ sản phẩm cầu lông ngoài thị trường, nhưng giá tính đơn thuê là `giathue` theo giờ, không phải giá niêm yết của sản phẩm.

| STT | Mã ID | Tên dịch vụ / dụng cụ thuê | Danh mục | SL | Giá thuê/giờ (VNĐ) | Trạng thái |
| --: | ----- | -------------------------- | -------- | -: | ------------------: | ---------- |
| 1 | DICH_VU_1 | Thuê vợt cầu lông Yonex Nanoflare | Vợt | 12 | 30.000 | ConHang |
| 2 | DICH_VU_2 | Thuê vợt cầu lông Victor Brave Sword | Vợt | 10 | 25.000 | ConHang |
| 3 | DICH_VU_3 | Thuê vợt cầu lông Lining Aeronaut | Vợt | 8 | 25.000 | ConHang |
| 4 | DICH_VU_4 | Thuê giày cầu lông Yonex size 40 | Giày | 6 | 20.000 | ConHang |
| 5 | DICH_VU_5 | Thuê giày cầu lông Mizuno size 39 | Giày | 5 | 20.000 | ConHang |
| 6 | DICH_VU_6 | Thuê giày cầu lông Victor size 42 | Giày | 5 | 22.000 | ConHang |
| 7 | DICH_VU_7 | Thuê áo cầu lông Yonex nam | Quần áo | 12 | 15.000 | ConHang |
| 8 | DICH_VU_8 | Thuê bộ quần áo cầu lông Victor unisex | Quần áo | 8 | 25.000 | ConHang |
| 9 | DICH_VU_9 | Thuê váy cầu lông Lining nữ | Quần áo | 8 | 18.000 | ConHang |
| 10 | DICH_VU_10 | Thuê túi vợt / balo cầu lông | Túi/Balo | 6 | 12.000 | ConHang |

Các danh mục con theo thương hiệu vợt cầu lông (cào bổ sung):

| Danh mục con | Thương hiệu | Nguồn |
| ------------ | ----------- | ----- |
| VotYonex | Yonex | shopvnb.com/vot-cau-long-yonex.html |
| VotLining | Li-Ning | shopvnb.com/vot-cau-long-lining.html |
| VotVictor | Victor | shopvnb.com/vot-cau-long-victor.html |
| VotMizuno | Mizuno | shopvnb.com/vot-cau-long-mizuno.html |
| VotKumpoo | Kumpoo | shopvnb.com/vot-cau-long-kumpoo.html |
| VotVS | VS | shopvnb.com/vot-cau-long-vs.html |

> Nguồn: `scripts/setup_services.js`, `fixPrice.js`, `seed_bookings_rentals.js` – Bảng dịch vụ dùng giá thuê mẫu theo giờ (`giathue`). Các script cào ShopVNB chỉ dùng để tham khảo tên, danh mục, thương hiệu và hình ảnh, không dùng giá niêm yết để trình bày bảng đơn thuê.

### 6.14. Bảng `donthue` – Đơn thuê dụng cụ (mẫu)

Mỗi người thuê 1–2 món, số lượng và giờ thuê khác nhau:

| STT | Mã ID | Khách hàng | Dịch vụ/Dụng cụ | SL | Số giờ | Tổng tiền (VNĐ) | Trạng thái |
| --: | ----- | ---------- | ---------------- | -: | -----: | ---------------: | ---------- |
| 1 | DON_THUE_1 | Nguyễn Thị Hương | Thuê vợt cầu lông Yonex Nanoflare | 1 | 1 | 30.000 | DangThue |
| 2 | DON_THUE_2 | Nguyễn Thị Hương | Thuê giày cầu lông Yonex size 40 | 1 | 1 | 20.000 | DaTraDo |
| 3 | DON_THUE_3 | Trần Thu Hà | Thuê vợt cầu lông Victor Brave Sword | 2 | 2 | 100.000 | DangThue |
| 4 | DON_THUE_4 | Lê Bích Ngọc | Thuê áo cầu lông Yonex nam | 3 | 3 | 135.000 | DaTraDo |
| 5 | DON_THUE_5 | Lê Bích Ngọc | Thuê túi vợt / balo cầu lông | 1 | 2 | 24.000 | DangThue |

> Nguồn: `seed_bookings_rentals.js` – Công thức: `tổng tiền = giathue × số lượng × số giờ`. Trạng thái xoay vòng: DangThue → DaTraDo.

### 6.15. Bảng `khuyenmai` – Mã khuyến mãi (3 mã)

| STT | Mã ID | Mã KM | Tên khuyến mãi | % Giảm | Giảm tối đa (VNĐ) | Ngày bắt đầu | Ngày kết thúc | SL mã | Trạng thái |
| --: | ----- | ----- | -------------- | -----: | -----------------: | ------------ | ------------- | ----: | ---------- |
| 1 | KHUYEN_MAI_1 | `SUMMER2026` | Chào Hè Rực Rỡ 2026 | 20% | 100.000 | 01/06/2026 | 30/06/2026 | 50 | Đang diễn ra |
| 2 | KHUYEN_MAI_2 | `NEWBIE10` | Giảm giá thành viên mới | 10% | 50.000 | 01/01/2026 | 31/12/2026 | 999 | Đang diễn ra |
| 3 | KHUYEN_MAI_3 | `FLASH50` | Flash Sale Cuối Tuần | 50% | 150.000 | 15/06/2026 | 16/06/2026 | 20 | Sắp diễn ra |

> Nguồn: `seed_new_tables.js` – 3 chương trình khuyến mãi thực tế.

### 6.16. Bảng `goihoivien` – Gói hội viên (3 gói)

| STT | Mã ID | Tên gói | Thời hạn (tháng) | Giá tiền (VNĐ) | Mô tả | Trạng thái |
| --: | ----- | ------- | ----------------: | --------------: | ----- | ---------- |
| 1 | GOI_HOI_VIEN_1 | Gói Sinh Viên (1 Tháng) | 1 | 300.000 | Giảm 10% tiền thuê sân, tặng 1 nước suối/buổi | Đang bán |
| 2 | GOI_HOI_VIEN_2 | Gói Phổ Thông (3 Tháng) | 3 | 850.000 | Giảm 15% tiền thuê sân, ưu tiên đặt sân giờ vàng | Đang bán |
| 3 | GOI_HOI_VIEN_3 | Gói VIP (1 Năm) | 12 | 3.000.000 | Giảm 30% tiền thuê sân, tặng 1 áo CLB, miễn phí giữ xe | Đang bán |

> Nguồn: `seed_new_tables.js` – 3 gói hội viên với ưu đãi khác nhau.



### 6.17. Bảng `thongke` – Thống kê / Báo cáo

Bảng `thongke` lưu báo cáo được tạo bởi Admin trong quá trình sử dụng hệ thống. Dữ liệu được sinh ra khi admin tạo báo cáo từ giao diện quản trị.

> Dữ liệu sinh ra khi vận hành thực tế, không có seed cố định.

### 6.18. Bảng `thongbao` – Thông báo hệ thống

Bảng `thongbao` lưu thông báo hệ thống tự động sinh ra khi có sự kiện (đặt sân thành công, hủy đặt, đăng ký giải đấu, v.v.). Các trường chính:
- `tieude`: Tiêu đề thông báo (VD: "Đặt sân thành công", "Giải đấu sắp diễn ra")
- `loai`: Phân loại (VD: "DatSan", "GiaiDau", "HoiVien")
- `dadoct`: Trạng thái đã đọc

> Dữ liệu sinh ra tự động từ các hành động của người dùng trên hệ thống.

### 6.19. Bảng `tinnhan` – Tin nhắn

Bảng `tinnhan` lưu tin nhắn chat giữa các người dùng trong hệ thống. Hỗ trợ chat 1-1 giữa: Khách hàng ↔ Admin, Khách hàng ↔ HLV, Admin ↔ HLV.

> Dữ liệu sinh ra khi người dùng nhắn tin qua tính năng Chat.

---

## 7. Tổng hợp thống kê dữ liệu seed

| Bảng | Số dòng seed ước tính | Nguồn seed |
| ---- | --------------------: | ---------- |
| `nguoidung` | ~22+ | `seed.js`, `seed_data.js`, `add-coach.js`, `seed-tournament.js` |
| `san` | 5 | `seed.js` |
| `thanhvienclb` | ~11 | `seed.js`, `seed_data.js` |
| `datsan` | ~40+ (2 lượt/user) | `seed_bookings_rentals.js` |
| `hoadon` | ~20+ | `seed_bookings_rentals.js` |
| `lichtapluyen` | 30 (10 HLV × 3 buổi) | `reseed_schedules.js` |
| `giaidau` | 3 | `seed_giaidau.js` |
| `dkgiaidau` | 8+ | `seed_dkgiaidau.js`, `seed-tournament.js` |
| `ketquatd` | 2+ (vòng 1) | `seed-tournament.js` |
| `thongke` | 0 (sinh khi vận hành) | – |
| `thongbao` | ~N (sinh tự động) | Từ controller |
| `tinnhan` | 0 (sinh khi chat) | – |
| `dichvu` | ~100+ | `scripts/setup_services.js`, `fixPrice.js`, `scrape_shopvnb.js` (tham khảo danh mục/tên/hình) |
| `donthue` | ~30+ (1–2 món/user) | `seed_bookings_rentals.js` |
| `khuyenmai` | 3 | `seed_new_tables.js` |
| `goihoivien` | 3 | `seed_new_tables.js` |


---

## 8. Kết luận

Cơ sở dữ liệu của website Cầu Lông 84 hiện có 1 database PostgreSQL và 16 bảng. Các nhóm dữ liệu chính gồm:

- Người dùng và hội viên: `nguoidung`, `thanhvienclb`
- Sân và đặt sân: `san`, `datsan`, `hoadon`
- Tập luyện: `lichtapluyen`
- Giải đấu: `giaidau`, `dkgiaidau`, `ketquatd`
- Báo cáo, thông báo, tin nhắn: `thongke`, `thongbao`, `tinnhan`
- Dịch vụ, thuê đồ, khuyến mãi, gói hội viên: `dichvu`, `donthue`, `khuyenmai`, `goihoivien`


Toàn bộ dữ liệu mẫu trong báo cáo này được trích xuất từ các file seed thực tế của dự án và được chuẩn hóa theo nghiệp vụ quản lý sân cầu lông. Riêng phần dịch vụ/đơn thuê sử dụng giá thuê mẫu theo giờ (`giathue`), không trình bày hoặc tính toán theo giá niêm yết của sản phẩm từ ShopVNB.

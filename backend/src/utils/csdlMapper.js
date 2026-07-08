const ADMIN_ROLES = ['Admin', 'ChuSan', 'HLV', 'QuanLy'];
const { getConfig } = require('../configStore');

function dec(n) {
  if (n == null) return 0;
  return typeof n === 'object' && n.toNumber ? n.toNumber() : Number(n);
}

function timeFromDb(timeVal) {
  const t = new Date(timeVal);
  return {
    hours: t.getUTCHours(),
    minutes: t.getUTCMinutes(),
    seconds: t.getUTCSeconds(),
  };
}

function combineDateTime(dateVal, timeVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  if (timeVal) {
    const { hours, minutes, seconds } = timeFromDb(timeVal);
    // Return a local Date object because the frontend expects it.
    return new Date(y, m, day, hours, minutes, seconds);
  }
  // For @db.Date fields to be saved, but wait! combineDateTime is used for BOTH reading and writing.
  // When reading, we want a local Date. When writing, Prisma needs a UTC Date.
  return new Date(y, m, day);
}

function parseTimeFromDate(iso) {
  const d = new Date(iso);
  return new Date(Date.UTC(1970, 0, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
}

function parseDateOnly(iso) {
  const d = new Date(iso);
  // Ensure we return UTC midnight for the requested date to prevent Prisma from shifting it back 1 day
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function mapTrangThaiDatSan(db) {
  const m = {
    'Chờ xác nhận': 'ChoXacNhan',
    'Đã xác nhận': 'DaXacNhan',
    'Đã hủy': 'DaHuy',
    'Hoàn thành': 'HoanThanh',
  };
  return m[db] || db;
}

function mapTrangThaiDatSanToDb(api) {
  const m = {
    ChoXacNhan: 'Chờ xác nhận',
    DaXacNhan: 'Đã xác nhận',
    DaHuy: 'Đã hủy',
    HoanThanh: 'Hoàn thành',
  };
  return m[api] || api;
}

function mapTrangThaiSan(db) {
  const m = {
    'Sẵn sàng': 'Trong',
    'Đang dùng': 'DangDung',
    'Bảo trì': 'BaoTri',
  };
  return m[db] || db;
}

function mapTrangThaiSanToDb(api) {
  const m = {
    Trong: 'Sẵn sàng',
    DangDung: 'Đang dùng',
    BaoTri: 'Bảo trì',
  };
  return m[api] || api;
}

function mapTrangThaiGiai(db) {
  const m = {
    'Sắp diễn ra': 'SapDienRa',
    'Đang diễn ra': 'DangDienRa',
    'Kết thúc': 'KetThuc',
  };
  return m[db] || db;
}

function mapTrangThaiGiaiToDb(api) {
  const m = {
    SapDienRa: 'Sắp diễn ra',
    DangDienRa: 'Đang diễn ra',
    KetThuc: 'Kết thúc',
  };
  return m[api] || api;
}

function mapTrangThaiHoaDon(db) {
  const m = {
    'Chưa thanh toán': 'ChuaThanhToan',
    'Đã thanh toán': 'DaThanhToan',
  };
  return m[db] || db;
}

function mapTrangThaiHoaDonToDb(api) {
  const m = {
    ChuaThanhToan: 'Chưa thanh toán',
    DaThanhToan: 'Đã thanh toán',
  };
  return m[api] || api;
}

const STATUS_MAP_TO_API = {
  'Hoạt động': 'HoatDong',
  'Khóa': 'Khoa',
  'Tạm khóa': 'TamKhoa',
  'Chờ duyệt': 'ChoDuyet',
};

const STATUS_MAP_TO_DB = {
  HoatDong: 'Hoạt động',
  Khoa: 'Khóa',
  TamKhoa: 'Tạm khóa',
  ChoDuyet: 'Chờ duyệt',
};

function mapNguoiDung(u) {
  if (!u) return null;
  const isAdmin = ADMIN_ROLES.includes(u.vaitro);
  return {
    MaNguoiDung: u.id_nguoidung,
    HoTen: u.hoten || u.tendangnhap,
    Email: u.email,
    SoDienThoai: u.sdt,
    MatKhau: u.matkhau,
    OAuthProvider: u.oauth_provider,
    OAuthId: u.oauth_id,
    Avatar: u.avatar,
    NgayTao: u.ngaytao,
    vaitro: u.vaitro,
    NhanVien: isAdmin ? { ChucVu: u.vaitro || 'Admin' } : null,
    KhachHang: u.thanhVienClb
      ? {
        MaKhachHang: u.id_nguoidung,
        capbac: u.thanhVienClb.capbac,
        phihoivien: dec(u.thanhVienClb.phihoivien),
        NgayThamGia: u.thanhVienClb.ngaythamgia,
        NgayHetHan: u.thanhVienClb.ngayhethan,
        TrangThai: STATUS_MAP_TO_API[u.thanhVienClb.trangthai] || u.thanhVienClb.trangthai || 'Khoa',
        DiemTichLuy: u.thanhVienClb.diemtichluy ?? 0,
      }
      : u.vaitro === 'KhachHang'
        ? { MaKhachHang: u.id_nguoidung, TrangThai: 'HoatDong', DiemTichLuy: 0 }
        : null,
  };
}

function mapSan(s) {
  if (!s) return null;
  return {
    MaSan: s.id_san,
    TenSan: s.tensan,
    LoaiSan: 'TieuChuan',
    GiaSieu: dec(s.giathue) || 70000,
    TrangThai: mapTrangThaiSan(s.trangthai),
    GhiChu: null,
    HinhAnh: s.hinhanh || null,
  };
}

function getDiscountPercent(capbac) {
  if (!capbac) return 0;
  const name = capbac.toLowerCase();
  if (name.includes('vip')) return 30;
  if (name.includes('phổ thông')) return 15;
  if (name.includes('sinh viên')) return 10;
  return 0;
}

function calcTongTien(dat, san) {
  if (!dat || !san) return 0;
  const start = combineDateTime(dat.ngaydat, dat.giobatdau);
  const end = combineDateTime(dat.ngaydat, dat.gioketthuc);
  const hours = Math.max(0, (end - start) / 3600000);
  let total = dec(san.giathue) * hours;
  
  if (dat.nguoiDung?.thanhVienClb?.trangthai === 'Hoạt động') {
    const capbac = dat.nguoiDung.thanhVienClb.capbac;
    const discount = getDiscountPercent(capbac);
    if (discount > 0) {
      total = total * (1 - discount / 100);
    } else {
      const cfg = getConfig();
      if (cfg && cfg.discountBooking) {
        total = total * (1 - cfg.discountBooking / 100);
      }
    }
  }
  return total;
}

function mapDatSan(d, san, nguoiDung, opts = {}) {
  if (!d) return null;
  const { includeHoaDon = true } = opts;
  const s = san || d.san;
  const nd = nguoiDung || d.nguoiDung;
  const tongTien = calcTongTien(d, s);
  const mapped = {
    MaLichDat: d.id_datsan,
    NgayDat: combineDateTime(d.ngaydat, d.giobatdau),
    GioBatDau: combineDateTime(d.ngaydat, d.giobatdau),
    GioKetThuc: combineDateTime(d.ngaydat, d.gioketthuc),
    TrangThai: mapTrangThaiDatSan(d.trangthai),
    TongTien: tongTien,
    MaKhachHang: d.id_nguoidung,
    MaSan: d.id_san,
    ghichu: d.ghichu,
    San: mapSan(s),
  };
  if (nd) {
    mapped.KhachHang = {
      MaKhachHang: nd.id_nguoidung,
      NguoiDung: mapNguoiDung(nd),
    };
  }
  if (includeHoaDon && d.hoaDon) {
    mapped.HoaDon = mapHoaDon(d.hoaDon, d, { includeLichDat: false });
  }
  return mapped;
}

function mapHoaDon(h, datSan, opts = {}) {
  if (!h) return null;
  const { includeLichDat = true } = opts;
  const ds = datSan || h.datSan;
  return {
    MaHoaDon: h.id_hoadon,
    MaLichDat: h.id_datsan,
    TongTien: dec(h.sotien),
    PhuongThucThanhToan: h.phuongthuc,
    TrangThai: mapTrangThaiHoaDon(h.trangthai),
    NgayLap: h.ngaythanhtoan,
    LichDatSan:
      includeLichDat && ds
        ? mapDatSan(ds, ds.san, ds.nguoiDung, { includeHoaDon: false })
        : undefined,
    ThanhToan:
      h.trangthai === 'Đã thanh toán'
        ? {
          MaThanhToan: h.id_hoadon,
          MaHoaDon: h.id_hoadon,
          SoTien: dec(h.sotien),
          PhuongThucThanhToan: h.phuongthuc,
          NgayThanhToan: h.ngaythanhtoan,
          TrangThai: 'ThanhCong',
        }
        : null,
  };
}

function mapThanhToanFromHoaDon(h) {
  if (!h || h.trangthai !== 'Đã thanh toán') return null;
  return {
    MaThanhToan: h.id_hoadon,
    MaHoaDon: h.id_hoadon,
    SoTien: dec(h.sotien),
    PhuongThucThanhToan: h.phuongthuc,
    NgayThanhToan: h.ngaythanhtoan,
    TrangThai: 'ThanhCong',
    HoaDon: mapHoaDon(h, h.datSan, { includeLichDat: true }),  // include LichDatSan để lấy tên sân
  };
}

function mapGiaiDau(g) {
  if (!g) return null;
  return {
    MaGiaiDau: g.id_giaidau,
    TenGiaiDau: g.tengiai,
    NgayBatDau: g.ngaybatdau,
    NgayKetThuc: g.ngayketthuc,
    DiaDiem: 'Sân Cầu Lông 84',
    LePhi: dec(g.lephi),
    SoLuongToiDa: g.soluongtoida ?? 32,
    MoTa: g.thele,
    TrangThai: mapTrangThaiGiai(g.trangthai),
    HinhThuc: g.hinhthuc || 'KnockOut',
    SoVaoDauKnockOut: g.sovaodauknockout || 4,
    DangKyGiaiDaus: (g.dangKys || []).map(mapDangKyGiai),
  };
}

function mapDangKyGiai(dk) {
  if (!dk) return null;
  return {
    MaDangKy: dk.id_dkgiai,
    MaGiaiDau: dk.id_giaidau,
    MaKhachHang: dk.id_vadv,
    TrangThai: dk.trangthai === 'Đã xác nhận' ? 'DaXacNhan' : dk.trangthai === 'Đã hủy' ? 'DaHuy' : 'ChoXacNhan',
    NgayDangKy: dk.ngaydangky,
    KhachHang: dk.vanDongVien
      ? { MaKhachHang: dk.id_vadv, NguoiDung: mapNguoiDung(dk.vanDongVien) }
      : null,
  };
}

function mapKetQuaAsTran(m) {
  if (!m) return null;
  const p1 = m.vanDongVien1?.vanDongVien;
  const p2 = m.vanDongVien2?.vanDongVien;
  const winner = m.nguoiThang?.vanDongVien;
  const scores = (m.diemso || '0-0').split('-').map((x) => parseInt(x.trim(), 10) || 0);
  return {
    MaTranDau: m.id_ketquatd,
    MaGiaiDau: m.id_giaidau,
    VongDau: parseInt(m.vong, 10) || 1,
    ThuTu: 1,
    DoiThu1Id: m.id_vadv1,
    DoiThu2Id: m.id_vadv2,
    DiemDoi1: scores[0] ?? 0,
    DiemDoi2: scores[1] ?? 0,
    MaNguoiThang: m.id_thang,
    TrangThai: m.id_thang ? 'KetThuc' : 'ChuaDienRa',
    NgayDienRa: m.ngaythi,
    DoiThu1: p1 ? { MaKhachHang: p1.id_nguoidung, NguoiDung: mapNguoiDung(p1) } : null,
    DoiThu2: p2 ? { MaKhachHang: p2.id_nguoidung, NguoiDung: mapNguoiDung(p2) } : null,
    NguoiThang: winner ? { MaKhachHang: winner.id_nguoidung, NguoiDung: mapNguoiDung(winner) } : null,
  };
}

function getRole(u) {
  if (u?.vaitro === 'HuanLuyenVien') return 'HuanLuyenVien';
  if (ADMIN_ROLES.includes(u?.vaitro)) return u?.vaitro;
  return 'Customer';
}

module.exports = {
  STATUS_MAP_TO_API,
  STATUS_MAP_TO_DB,
  ADMIN_ROLES,
  dec,
  combineDateTime,
  parseTimeFromDate,
  parseDateOnly,
  mapTrangThaiDatSan,
  mapTrangThaiDatSanToDb,
  mapTrangThaiSan,
  mapTrangThaiSanToDb,
  mapTrangThaiGiai,
  mapTrangThaiGiaiToDb,
  mapTrangThaiHoaDon,
  mapTrangThaiHoaDonToDb,
  mapNguoiDung,
  mapSan,
  mapDatSan,
  mapHoaDon,
  mapThanhToanFromHoaDon,
  mapGiaiDau,
  mapDangKyGiai,
  mapKetQuaAsTran,
  calcTongTien,
  getRole,
  getDiscountPercent,
};

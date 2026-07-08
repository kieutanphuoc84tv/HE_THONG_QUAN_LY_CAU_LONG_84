const prisma = require('../prismaClient');

// Lấy danh sách HLV
exports.getCoaches = async (req, res) => {
  try {
    const coaches = await prisma.nguoiDung.findMany({
      where: { vaitro: 'HuanLuyenVien' },
      select: { id_nguoidung: true, hoten: true, email: true, sdt: true, avatar: true }
    });
    res.json(coaches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy danh sách HLV' });
  }
};

// Khách hàng đăng ký lịch tập luyện
exports.registerTraining = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id_hlv, ghichu, lephi } = req.body;

    if (!id_hlv) {
      return res.status(400).json({ error: 'Vui lòng chọn Huấn luyện viên!' });
    }

    // Kiểm tra user có phải thành viên CLB không
    const member = await prisma.thanhVienClb.findUnique({ where: { id_nguoidung: userId } });
    if (!member) {
      return res.status(400).json({ error: 'Bạn cần là thành viên CLB để đăng ký lịch tập!' });
    }

    // Kiểm tra HLV có tồn tại không
    const coach = await prisma.nguoiDung.findFirst({ where: { id_nguoidung: id_hlv, vaitro: 'HuanLuyenVien' } });
    if (!coach) return res.status(400).json({ error: 'Huấn luyện viên không tồn tại!' });

    const newTraining = await prisma.lichTapLuyen.create({
      data: {
        id_hlv,
        id_thanhvien: member.id_thanhvien,
        ghichu,
        lephi: lephi ? Number(lephi) : 150000,
        trangthai: 'Chờ xếp lịch'
      },
      include: {
        hlv: { select: { hoten: true, email: true } },
        thanhVien: { include: { nguoiDung: { select: { hoten: true } } } }
      }
    });

    // Tạo thông báo cho HLV
    await prisma.thongBao.create({
      data: {
        id_nguoidung: id_hlv,
        tieude: 'Yêu cầu tập luyện mới',
        noidung: `Học viên ${member.nguoiDung?.hoten || 'Khách'} vừa gửi yêu cầu tập luyện. Vui lòng kiểm tra và xếp lịch!`,
        loai: 'system',
        link: '/coach/dashboard'
      }
    });

    res.status(201).json(newTraining);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi đăng ký lịch tập' });
  }
};

// Khách hàng xem lịch tập của mình
exports.getMyTraining = async (req, res) => {
  try {
    const { userId } = req.user;
    const member = await prisma.thanhVienClb.findUnique({ where: { id_nguoidung: userId } });
    if (!member) return res.json([]);

    const trainings = await prisma.lichTapLuyen.findMany({
      where: {
        id_thanhvien: member.id_thanhvien,
        // Chỉ hiện lịch đã được admin xác nhận, ẩn lịch đang chờ duyệt
        trangthai: {
          notIn: ['Đợi xác nhận', 'Chờ xếp lịch']
        }
      },
      include: {
        hlv: { select: { hoten: true, email: true, sdt: true, avatar: true } }
      },
      orderBy: { ngaytap: 'desc' }
    });
    res.json(trainings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy lịch tập' });
  }
};

// Hủy lịch tập
exports.cancelTraining = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const member = await prisma.thanhVienClb.findUnique({ where: { id_nguoidung: userId } });
    if (!member) return res.status(403).json({ error: 'Không có quyền!' });

    const training = await prisma.lichTapLuyen.findUnique({ where: { id_lichtapluyen: id } });
    if (!training || training.id_thanhvien !== member.id_thanhvien) {
      return res.status(404).json({ error: 'Lịch tập không tồn tại!' });
    }

    await prisma.lichTapLuyen.delete({ where: { id_lichtapluyen: id } });
    res.json({ message: 'Đã hủy lịch tập thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi hủy lịch tập' });
  }
};

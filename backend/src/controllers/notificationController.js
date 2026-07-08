const prisma = require('../prismaClient');

exports.getAll = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'QuanLy';
    const where = isAdmin 
      ? { id_nguoidung: null } 
      : { 
          OR: [
            { id_nguoidung: req.user.userId },
            { id_nguoidung: null, loai: 'global' }
          ]
        };
    
    const notifs = await prisma.thongBao.findMany({
      where,
      orderBy: { ngaytao: 'desc' },
      take: 20
    });
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lấy danh sách thông báo' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'QuanLy';
    const where = isAdmin 
      ? { id_thongbao: id, id_nguoidung: null } 
      : { 
          id_thongbao: id, 
          OR: [
            { id_nguoidung: req.user.userId },
            { id_nguoidung: null, loai: 'global' }
          ]
        };
    
    await prisma.thongBao.updateMany({
      where,
      data: { dadoct: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật thông báo' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'QuanLy';
    const where = isAdmin 
      ? { dadoct: false, id_nguoidung: null } 
      : { 
          dadoct: false, 
          OR: [
            { id_nguoidung: req.user.userId },
            { id_nguoidung: null, loai: 'global' }
          ]
        };
    
    await prisma.thongBao.updateMany({
      where,
      data: { dadoct: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật tất cả thông báo' });
  }
};

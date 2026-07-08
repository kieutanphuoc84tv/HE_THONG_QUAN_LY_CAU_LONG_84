const prisma = require('../prismaClient');
const { sendNotification } = require('../utils/notificationService');

const CHAT_ROLES = {
  CUSTOMER: 'KhachHang',
  COACH: 'HuanLuyenVien',
};

const userSelect = {
  id_nguoidung: true,
  hoten: true,
  email: true,
  sdt: true,
  vaitro: true,
  avatar: true,
};

function mapUser(user) {
  if (!user) return null;
  return {
    id: user.id_nguoidung,
    name: user.hoten || user.email || 'Nguoi dung',
    email: user.email,
    phone: user.sdt,
    role: user.vaitro,
    avatar: user.avatar,
  };
}

function mapMessage(message) {
  return {
    id: message.id_tinnhan,
    content: message.noidung,
    read: message.dadoct,
    createdAt: message.ngaytao,
    sender: mapUser(message.nguoiGui),
    receiver: mapUser(message.nguoiNhan),
  };
}

function isCoachRole(role) {
  return role === CHAT_ROLES.COACH;
}

function isCustomerSideRole(role) {
  return role !== CHAT_ROLES.COACH;
}

function assertCanChat(currentRole, otherRole) {
  return (
    (isCoachRole(currentRole) && isCustomerSideRole(otherRole)) ||
    (isCustomerSideRole(currentRole) && isCoachRole(otherRole))
  );
}

async function getChatPartner(req, res, otherUserId) {
  const currentUser = await prisma.nguoiDung.findUnique({
    where: { id_nguoidung: req.user.userId },
    select: userSelect,
  });
  const otherUser = await prisma.nguoiDung.findUnique({
    where: { id_nguoidung: otherUserId },
    select: userSelect,
  });

  if (!currentUser || !otherUser) {
    res.status(404).json({ error: 'Không tìm thấy người dùng' });
    return null;
  }
  if (currentUser.id_nguoidung === otherUser.id_nguoidung) {
    res.status(400).json({ error: 'Không thể nhắn tin cho chính mình' });
    return null;
  }
  if (!assertCanChat(currentUser.vaitro, otherUser.vaitro)) {
    res.status(403).json({ error: 'Bạn không có quyền nhắn tin với người này' });
    return null;
  }

  return { currentUser, otherUser };
}

exports.getContacts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const currentUser = await prisma.nguoiDung.findUnique({
      where: { id_nguoidung: currentUserId },
      select: userSelect,
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const targetRole = isCoachRole(currentUser.vaitro)
      ? CHAT_ROLES.CUSTOMER
      : CHAT_ROLES.COACH;

    const contacts = await prisma.nguoiDung.findMany({
      where: {
        id_nguoidung: { not: currentUserId },
        vaitro: targetRole,
        ...(targetRole === CHAT_ROLES.CUSTOMER ? { thanhVienClb: { isNot: null } } : {}),
      },
      select: userSelect,
      orderBy: { hoten: 'asc' },
    });

    const contactIds = contacts.map(c => c.id_nguoidung);
    const messages = contactIds.length
      ? await prisma.tinNhan.findMany({
          where: {
            OR: [
              { id_nguoigui: currentUserId, id_nguoinhan: { in: contactIds } },
              { id_nguoinhan: currentUserId, id_nguoigui: { in: contactIds } },
            ],
          },
          orderBy: { ngaytao: 'desc' },
          include: { nguoiGui: { select: userSelect }, nguoiNhan: { select: userSelect } },
        })
      : [];

    const lastByContact = new Map();
    const unreadByContact = new Map();
    messages.forEach((msg) => {
      const contactId = msg.id_nguoigui === currentUserId ? msg.id_nguoinhan : msg.id_nguoigui;
      if (!lastByContact.has(contactId)) lastByContact.set(contactId, mapMessage(msg));
      if (msg.id_nguoinhan === currentUserId && !msg.dadoct) {
        unreadByContact.set(contactId, (unreadByContact.get(contactId) || 0) + 1);
      }
    });

    res.json(contacts.map(contact => ({
      ...mapUser(contact),
      lastMessage: lastByContact.get(contact.id_nguoidung) || null,
      unreadCount: unreadByContact.get(contact.id_nguoidung) || 0,
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy danh sách tin nhắn' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const allowed = await getChatPartner(req, res, otherUserId);
    if (!allowed) return;

    await prisma.tinNhan.updateMany({
      where: {
        id_nguoigui: otherUserId,
        id_nguoinhan: req.user.userId,
        dadoct: false,
      },
      data: { dadoct: true },
    });

    const messages = await prisma.tinNhan.findMany({
      where: {
        OR: [
          { id_nguoigui: req.user.userId, id_nguoinhan: otherUserId },
          { id_nguoigui: otherUserId, id_nguoinhan: req.user.userId },
        ],
      },
      orderBy: { ngaytao: 'desc' },
      take: 200,
      include: { nguoiGui: { select: userSelect }, nguoiNhan: { select: userSelect } },
    });

    res.json(messages.reverse().map(mapMessage));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy hội thoại' });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const allowed = await getChatPartner(req, res, otherUserId);
    if (!allowed) return;

    await prisma.tinNhan.updateMany({
      where: {
        id_nguoigui: otherUserId,
        id_nguoinhan: req.user.userId,
        dadoct: false,
      },
      data: { dadoct: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái đã đọc' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const receiverId = req.body.receiverId;
    const content = String(req.body.content || '').trim();

    if (!receiverId) return res.status(400).json({ error: 'Thiếu người nhận' });
    if (!content) return res.status(400).json({ error: 'Vui lòng nhập nội dung tin nhắn' });
    if (content.length > 1000) return res.status(400).json({ error: 'Tin nhắn tối đa 1000 ký tự' });

    const allowed = await getChatPartner(req, res, receiverId);
    if (!allowed) return;
    const { currentUser, otherUser } = allowed;

    const message = await prisma.tinNhan.create({
      data: {
        id_nguoigui: currentUser.id_nguoidung,
        id_nguoinhan: otherUser.id_nguoidung,
        noidung: content,
      },
      include: { nguoiGui: { select: userSelect }, nguoiNhan: { select: userSelect } },
    });
    const payload = mapMessage(message);

    if (global.io) {
      global.io.to(currentUser.id_nguoidung).emit('chat_message', payload);
      global.io.to(otherUser.id_nguoidung).emit('chat_message', payload);
    }

    const senderIsCoach = currentUser.vaitro === CHAT_ROLES.COACH;
    const receiverIsCoach = otherUser.vaitro === CHAT_ROLES.COACH;
    try {
      await sendNotification({
        userId: otherUser.id_nguoidung,
        type: 'chat',
        title: senderIsCoach
          ? `Tin nhắn từ HLV ${currentUser.hoten || ''}`.trim()
          : `Tin nhắn từ học viên ${currentUser.hoten || ''}`.trim(),
        content,
        link: receiverIsCoach
          ? `/coach/messages?with=${currentUser.id_nguoidung}`
          : `/messages?with=${currentUser.id_nguoidung}`,
      });
    } catch (notificationError) {
      console.error('Lỗi tạo thông báo tin nhắn:', notificationError);
    }

    res.status(201).json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi gửi tin nhắn' });
  }
};

const prisma = require('../prismaClient');

const ADMIN_TRAINING_LINK = '/admin/coaches?tab=schedules';
const COACH_TRAINING_LINK = '/coach/dashboard';
const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const CANCELLATION_PENDING_STATUS = 'Chờ xác nhận hủy';
const SCHEDULE_CONFIRM_PENDING_STATUS = 'Đợi xác nhận';

const normalizeStatus = (status = '') => String(status || '').toLowerCase().replace(/huỷ/g, 'hủy');

const isCancellationPendingStatus = (status = '') => {
  const text = normalizeStatus(status);
  return text.includes('chờ') && text.includes('xác nhận') && text.includes('hủy');
};

const isCancelledStatus = (status = '') => {
  const text = normalizeStatus(status);
  return text.includes('đã') && text.includes('hủy');
};

const isScheduleConfirmPendingStatus = (status = '') => {
  const text = normalizeStatus(status);
  return (text.includes('đợi') || text.includes('chờ')) && text.includes('xác nhận') && !text.includes('hủy');
};

const isConfirmedScheduleStatus = (status = '') => {
  const text = normalizeStatus(status);
  return text.includes('đã') && text.includes('chốt') && text.includes('lịch');
};

const isInactiveTrainingStatus = (status = '') => isCancelledStatus(status) || isCancellationPendingStatus(status);

const withCancelReason = (note = '', reason = '') => {
  const cleanNote = String(note || '').replace(/\s*\[LÝ DO HỦY:\s*[^\]]+\]/gi, '').trim();
  const cleanReason = String(reason || '').trim();
  if (!cleanReason) return cleanNote;
  return `${cleanNote} [LÝ DO HỦY: ${cleanReason}]`.trim();
};

const toDateKey = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const toDateValue = (value) => {
  const key = toDateKey(value);
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

const formatDateVi = (value) => {
  const key = toDateKey(value);
  if (!key) return 'Chưa xếp ngày';
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
};

const formatTime = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && value.includes('T')) return value.split('T')[1].slice(0, 5);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(11, 16);
};

const timeToMinutes = (value) => {
  const time = typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : formatTime(value);
  if (!time) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const parseScheduleNote = (note = '') => {
  const text = note || '';
  const daysMatch = text.match(/\[Ngày:\s*([^\]]+)\]/i);
  const sessionMatch = text.match(/\[Buổi\s+([^\]]+)\]/i);
  const cancelMatch = text.match(/\[LÝ DO HỦY:\s*([^\]]+)\]/i);
  const absenceMatches = [...text.matchAll(/\[NGAY_NGHI:\s*([^\]]+)\]/gi)];
  const lessonCancelReasonMatches = [...text.matchAll(/\[LÝ DO HỦY BUỔI:\s*([^|\]]+)\|\s*([^\]]+)\]/gi)];
  const lessonCancelReasons = lessonCancelReasonMatches.reduce((acc, match) => {
    const dateKey = match[1]?.trim();
    const reason = match[2]?.trim();
    if (dateKey && reason) acc[dateKey] = reason;
    return acc;
  }, {});

  const choHuyMatches = [...text.matchAll(/\[CHO_HUY_BUOI:\s*([^|\]]+)\|\s*([^\]]+)\]/gi)];
  const pendingLessonCancels = choHuyMatches.reduce((acc, match) => {
    const dateKey = match[1]?.trim();
    const reason = match[2]?.trim();
    if (dateKey && reason) acc[dateKey] = reason;
    return acc;
  }, {});

  let sessions = [];
  if (sessionMatch) {
    const sessionText = sessionMatch[1].split('-')[0].trim();
    if (sessionText.includes('Cả Hai') || (sessionText.includes('Sáng') && sessionText.includes('Chiều'))) {
      sessions = ['Sáng', 'Chiều'];
    } else if (sessionText.includes('Sáng')) {
      sessions = ['Sáng'];
    } else if (sessionText.includes('Chiều')) {
      sessions = ['Chiều'];
    }
  }

  return {
    daysOfWeek: daysMatch ? daysMatch[1].split(',').map(d => d.trim()).filter(Boolean) : [],
    sessions,
    absenceDates: absenceMatches.map(m => m[1].trim()).filter(Boolean),
    lessonCancelReasons,
    pendingLessonCancels,
    cancelReason: cancelMatch?.[1]?.trim() || null,
    cleanNote: text
      .replace(/\[NGAY_NGHI:\s*[^\]]+\]/gi, '')
      .replace(/\[LÝ DO HỦY BUỔI:\s*[^|\]]+\|\s*[^\]]+\]/gi, '')
      .replace(/\[CHO_HUY_BUOI:\s*[^|\]]+\|\s*[^\]]+\]/gi, '')
      .replace(/\[LÝ DO HỦY:\s*[^\]]+\]/gi, '')
      .replace(/\[Buổi\s+[^\]]+\]/gi, '')
      .replace(/\[Ngày:\s*[^\]]+\]/gi, '')
      .replace(/\[(HỌC BÙ|Học theo nhóm cơ bản|Học nâng cao\/chuyên sâu|Kèm riêng \(1-1\))\]/gi, '')
      .trim()
  };
};

const getDayLabel = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return DAY_LABELS[date.getUTCDay()];
};

const getScheduleDays = (schedule, parsed = parseScheduleNote(schedule.ghichu)) => {
  if (parsed.daysOfWeek.length) return parsed.daysOfWeek;
  const fallback = getDayLabel(schedule.ngaytap);
  return fallback ? [fallback] : [];
};

const getScheduleSessions = (schedule, parsed = parseScheduleNote(schedule.ghichu)) => {
  if (parsed.sessions.length) return parsed.sessions;
  const start = timeToMinutes(schedule.giobatdau);
  const end = timeToMinutes(schedule.gioketthuc);
  if (start === null) return [];
  if (end !== null && start < 12 * 60 && end > 12 * 60) return ['Sáng', 'Chiều'];
  return start < 12 * 60 ? ['Sáng'] : ['Chiều'];
};

const hasIntersection = (a = [], b = []) => a.some(item => b.includes(item));

const dateRangesOverlap = (a, b) => {
  const aStart = toDateValue(a.ngaytap);
  const bStart = toDateValue(b.ngaytap);
  if (aStart === null || bStart === null) return false;
  const aEnd = toDateValue(a.ngayketthuc) ?? aStart;
  const bEnd = toDateValue(b.ngayketthuc) ?? bStart;
  return aStart <= bEnd && bStart <= aEnd;
};

const timeRangesOverlap = (a, b) => {
  const aStart = timeToMinutes(a.giobatdau);
  const bStart = timeToMinutes(b.giobatdau);
  if (aStart === null || bStart === null) return false;
  const aEnd = timeToMinutes(a.gioketthuc) ?? aStart + 60;
  const bEnd = timeToMinutes(b.gioketthuc) ?? bStart + 60;
  return aStart < bEnd && bStart < aEnd;
};

const schedulesConflict = (a, b) => {
  if (!a.id_hlv || !b.id_hlv || a.id_hlv === b.id_hlv) return false;
  if (isInactiveTrainingStatus(a.trangthai) || isInactiveTrainingStatus(b.trangthai)) return false;
  if (!dateRangesOverlap(a, b)) return false;

  const parsedA = parseScheduleNote(a.ghichu);
  const parsedB = parseScheduleNote(b.ghichu);
  if (!hasIntersection(getScheduleDays(a, parsedA), getScheduleDays(b, parsedB))) return false;

  const sessionOverlap = hasIntersection(getScheduleSessions(a, parsedA), getScheduleSessions(b, parsedB));
  return timeRangesOverlap(a, b) || sessionOverlap;
};

const getCoachName = (schedule) => schedule.hlv?.hoten || schedule.hlv?.tendangnhap || 'HLV chưa rõ';
const getStudentName = (schedule) => schedule.thanhVien?.nguoiDung?.hoten || schedule.thanhVien?.nguoiDung?.tendangnhap || 'Học viên chưa rõ';

const summarizeSchedule = (schedule) => {
  const parsed = parseScheduleNote(schedule.ghichu);
  const startTime = formatTime(schedule.giobatdau);
  const endTime = formatTime(schedule.gioketthuc);
  const dateRange = schedule.ngayketthuc && toDateKey(schedule.ngayketthuc) !== toDateKey(schedule.ngaytap)
    ? `${formatDateVi(schedule.ngaytap)} - ${formatDateVi(schedule.ngayketthuc)}`
    : formatDateVi(schedule.ngaytap);

  return {
    id_lichtapluyen: schedule.id_lichtapluyen,
    id_hlv: schedule.id_hlv,
    coachName: getCoachName(schedule),
    studentName: getStudentName(schedule),
    dateRange,
    timeRange: startTime ? `${startTime}${endTime ? ` - ${endTime}` : ''}` : 'Chưa xếp giờ',
    daysOfWeek: getScheduleDays(schedule, parsed),
    sessions: getScheduleSessions(schedule, parsed),
    trangthai: schedule.trangthai,
  };
};

const buildConflictMap = (schedules) => {
  const map = new Map(schedules.map(item => [item.id_lichtapluyen, []]));
  for (let i = 0; i < schedules.length; i += 1) {
    for (let j = i + 1; j < schedules.length; j += 1) {
      if (schedulesConflict(schedules[i], schedules[j])) {
        map.get(schedules[i].id_lichtapluyen).push(summarizeSchedule(schedules[j]));
        map.get(schedules[j].id_lichtapluyen).push(summarizeSchedule(schedules[i]));
      }
    }
  }
  return map;
};

const mapScheduleForAdmin = (schedule, conflicts = []) => {
  const parsed = parseScheduleNote(schedule.ghichu);
  return {
    ...schedule,
    lephi: schedule.lephi ? Number(schedule.lephi) : null,
    coachName: getCoachName(schedule),
    studentName: getStudentName(schedule),
    dateRange: summarizeSchedule(schedule).dateRange,
    timeRange: summarizeSchedule(schedule).timeRange,
    daysOfWeek: getScheduleDays(schedule, parsed),
    sessions: getScheduleSessions(schedule, parsed),
    absenceDates: parsed.absenceDates,
    lessonCancelReasons: parsed.lessonCancelReasons,
    pendingLessonCancels: parsed.pendingLessonCancels,
    cancelReason: parsed.cancelReason,
    cleanNote: parsed.cleanNote,
    conflicts,
  };
};

const createTrainingNotification = async ({ userId = null, title, content, type, link, linkedId = null }) => {
  const notification = await prisma.thongBao.create({
    data: {
      id_nguoidung: userId,
      tieude: title,
      noidung: content,
      loai: type,
      id_lienket: linkedId,
      link,
      dadoct: false,
    },
  });

  if (userId && global.io) {
    global.io.to(userId).emit('new_notification', notification);
  }

  return notification;
};

const adminScheduleInclude = {
  hlv: { select: { id_nguoidung: true, hoten: true, tendangnhap: true, email: true, sdt: true, avatar: true } },
  thanhVien: {
    include: {
      nguoiDung: { select: { id_nguoidung: true, hoten: true, tendangnhap: true, email: true, sdt: true, avatar: true } }
    }
  }
};

const notifyAdminCoachAbsence = async (schedule, reasonText = '') => {
  const reason = reasonText ? ` Lý do: ${reasonText}` : '';
  const pendingCancel = isCancellationPendingStatus(schedule.trangthai);
  await createTrainingNotification({
    title: pendingCancel ? 'HLV yêu cầu hủy lịch tập' : 'HLV báo nghỉ buổi tập',
    content: pendingCancel
      ? `${getCoachName(schedule)} yêu cầu hủy lịch tập ${summarizeSchedule(schedule).dateRange} (${summarizeSchedule(schedule).timeRange}) với học viên ${getStudentName(schedule)}.${reason} Vui lòng xác nhận ở trang quản lý HLV.`
      : `${getCoachName(schedule)} đã báo nghỉ lịch tập ${summarizeSchedule(schedule).dateRange} (${summarizeSchedule(schedule).timeRange}) với học viên ${getStudentName(schedule)}.${reason}`,
    type: pendingCancel ? 'training_cancel_request' : 'training_absence',
    link: ADMIN_TRAINING_LINK,
    linkedId: schedule.id_lichtapluyen,
  });
};

const notifyAdminScheduleApprovalRequest = async (schedule) => {
  const summary = summarizeSchedule(schedule);
  await createTrainingNotification({
    title: 'HLV tạo lịch chờ xác nhận',
    content: `${getCoachName(schedule)} đã tạo/xếp lịch ${summary.dateRange} (${summary.timeRange}) với học viên ${getStudentName(schedule)}. Vui lòng xác nhận lịch ở trang quản lý HLV.`,
    type: 'training_approval_request',
    link: ADMIN_TRAINING_LINK,
    linkedId: schedule.id_lichtapluyen,
  });
};

// Lấy lịch dạy của HLV
exports.getSchedules = async (req, res) => {
  try {
    const { userId } = req.user;
    const schedules = await prisma.lichTapLuyen.findMany({
      where: {
        id_hlv: userId,
        id_thanhvien: { not: null },
      },
      include: {
        thanhVien: {
          include: { nguoiDung: { select: { hoten: true, tendangnhap: true, sdt: true, email: true } } }
        }
      },
      orderBy: { id_lichtapluyen: 'desc' }
    });
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi lấy lịch dạy' });
  }
};

// Cập nhật trạng thái và ngày giờ lịch tập
exports.updateScheduleStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { trangthai, ngaytap, giobatdau, gioketthuc, ghichu_huy } = req.body;

    const schedule = await prisma.lichTapLuyen.findUnique({
      where: { id_lichtapluyen: id },
      include: {
        hlv: { select: { hoten: true, tendangnhap: true } },
        thanhVien: {
          include: { nguoiDung: { select: { hoten: true, tendangnhap: true } } }
        }
      }
    });
    if (!schedule || schedule.id_hlv !== userId) {
      return res.status(403).json({ error: 'Không có quyền thay đổi lịch này' });
    }

    const wantsCancel = isCancelledStatus(trangthai) || isCancellationPendingStatus(trangthai);
    const wantsScheduleApproval = isConfirmedScheduleStatus(trangthai) || isScheduleConfirmPendingStatus(trangthai);
    const data = {
      trangthai: wantsCancel
        ? CANCELLATION_PENDING_STATUS
        : (wantsScheduleApproval ? SCHEDULE_CONFIRM_PENDING_STATUS : trangthai)
    };
    if (ngaytap) data.ngaytap = new Date(ngaytap);
    if (giobatdau) data.giobatdau = new Date(`1970-01-01T${giobatdau}:00Z`);
    if (gioketthuc) data.gioketthuc = new Date(`1970-01-01T${gioketthuc}:00Z`);
    
    // HLV hủy lịch phải chờ admin xác nhận.
    if (wantsCancel && ghichu_huy) {
      data.ghichu = withCancelReason(schedule.ghichu, ghichu_huy);
    }

    const updated = await prisma.lichTapLuyen.update({
      where: { id_lichtapluyen: id },
      data,
      include: {
        hlv: { select: { hoten: true, tendangnhap: true } },
        thanhVien: {
          include: { nguoiDung: { select: { hoten: true } } }
        }
      }
    });

    if (wantsCancel) {
      await notifyAdminCoachAbsence(updated, ghichu_huy);
    } else if (wantsScheduleApproval) {
      await notifyAdminScheduleApprovalRequest(updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi cập nhật lịch dạy' });
  }
};

// Lấy tất cả thành viên CLB để HLV có thể tạo lịch mới
exports.getAllMembersList = async (req, res) => {
  try {
    const members = await prisma.thanhVienClb.findMany({
      include: {
        nguoiDung: { select: { id_nguoidung: true, hoten: true, tendangnhap: true, sdt: true, email: true, avatar: true } }
      }
    });
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy danh sách học viên' });
  }
};

// HLV Tự tạo lịch dạy mới (Thêm lịch)
exports.createSchedule = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id_thanhvien, ngaytap, ngayketthuc, giobatdau, gioketthuc, lephi, ghichu } = req.body;

    if (!id_thanhvien || !ngaytap || !giobatdau) {
      return res.status(400).json({ error: 'Vui lòng chọn học viên, ngày và giờ tập!' });
    }

    const newSchedule = await prisma.lichTapLuyen.create({
      data: {
        id_hlv: userId,
        id_thanhvien,
        ngaytap: new Date(ngaytap),
        ngayketthuc: ngayketthuc ? new Date(ngayketthuc) : null,
        giobatdau: new Date(`1970-01-01T${giobatdau}:00Z`),
        gioketthuc: gioketthuc ? new Date(`1970-01-01T${gioketthuc}:00Z`) : null,
        lephi: lephi ? Number(lephi) : 150000,
        ghichu,
        trangthai: SCHEDULE_CONFIRM_PENDING_STATUS
      },
      include: {
        hlv: { select: { hoten: true, tendangnhap: true } },
        thanhVien: { include: { nguoiDung: { select: { hoten: true } } } }
      }
    });

    await notifyAdminScheduleApprovalRequest(newSchedule);

    res.status(201).json(newSchedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi tạo lịch dạy' });
  }
};

// HLV Sửa lịch dạy (Sửa lịch)
exports.updateSchedule = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { ngaytap, giobatdau, lephi, ghichu } = req.body;

    const schedule = await prisma.lichTapLuyen.findUnique({
      where: { id_lichtapluyen: id },
      include: {
        hlv: { select: { hoten: true, tendangnhap: true } },
        thanhVien: {
          include: { nguoiDung: { select: { hoten: true, tendangnhap: true } } }
        }
      }
    });
    if (!schedule || schedule.id_hlv !== userId) {
      return res.status(403).json({ error: 'Không có quyền thay đổi lịch này' });
    }

    const data = {};
    if (ngaytap) data.ngaytap = new Date(ngaytap);
    if (req.body.ngayketthuc) data.ngayketthuc = new Date(req.body.ngayketthuc);
    if (giobatdau) data.giobatdau = new Date(`1970-01-01T${giobatdau}:00Z`);
    if (req.body.gioketthuc) data.gioketthuc = new Date(`1970-01-01T${req.body.gioketthuc}:00Z`);
    if (lephi !== undefined) data.lephi = Number(lephi);
    if (ghichu !== undefined) data.ghichu = ghichu;

    const updated = await prisma.lichTapLuyen.update({
      where: { id_lichtapluyen: id },
      data,
      include: {
        hlv: { select: { hoten: true, tendangnhap: true } },
        thanhVien: { include: { nguoiDung: { select: { hoten: true, tendangnhap: true } } } }
      }
    });

    if (ghichu !== undefined) {
      const oldAbsences = new Set(parseScheduleNote(schedule.ghichu).absenceDates);
      const updatedNote = parseScheduleNote(updated.ghichu);
      const newAbsences = updatedNote.absenceDates.filter(date => !oldAbsences.has(date));
      if (newAbsences.length) {
        const absenceDetails = newAbsences.map(date => {
          const reason = updatedNote.lessonCancelReasons?.[date];
          return reason ? `Hủy buổi ${formatDateVi(date)}: ${reason}` : `Báo nghỉ ngày ${formatDateVi(date)}`;
        });
        await notifyAdminCoachAbsence(updated, absenceDetails.join('; '));
      }
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi cập nhật lịch dạy' });
  }
};

// HLV Xóa cứng lịch dạy (Xóa lịch)
exports.deleteSchedule = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const schedule = await prisma.lichTapLuyen.findUnique({ where: { id_lichtapluyen: id } });
    if (!schedule || schedule.id_hlv !== userId) {
      return res.status(403).json({ error: 'Không có quyền xóa lịch này' });
    }

    await prisma.lichTapLuyen.delete({ where: { id_lichtapluyen: id } });
    res.json({ message: 'Xóa lịch dạy thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi xóa lịch dạy' });
  }
};

// Admin xem toàn bộ lịch dạy của HLV và các cảnh báo trùng lịch
exports.getAdminCoachSchedules = async (req, res) => {
  try {
    const schedules = await prisma.lichTapLuyen.findMany({
      include: {
        hlv: { select: { id_nguoidung: true, hoten: true, tendangnhap: true, email: true, sdt: true, avatar: true } },
        thanhVien: {
          include: {
            nguoiDung: { select: { id_nguoidung: true, hoten: true, tendangnhap: true, email: true, sdt: true, avatar: true } }
          }
        }
      },
      orderBy: [
        { ngaytap: 'desc' },
        { giobatdau: 'asc' },
        { id_lichtapluyen: 'desc' }
      ]
    });

    const conflictMap = buildConflictMap(schedules);
    const mapped = schedules.map(schedule => mapScheduleForAdmin(schedule, conflictMap.get(schedule.id_lichtapluyen) || []));
    const summary = {
      total: mapped.length,
      pending: mapped.filter(item => item.trangthai === 'Chờ xếp lịch' || isScheduleConfirmPendingStatus(item.trangthai)).length,
      absences: mapped.filter(item => isInactiveTrainingStatus(item.trangthai) || item.absenceDates.length > 0).length,
      conflicts: mapped.filter(item => item.conflicts.length > 0).length,
    };

    res.json({ schedules: mapped, summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy lịch dạy huấn luyện viên' });
  }
};

// Admin cập nhật trạng thái lịch dạy khi cần xử lý buổi nghỉ/hủy
exports.adminUpdateScheduleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangthai, ghichu_huy } = req.body;
    if (!trangthai) return res.status(400).json({ error: 'Vui lòng chọn trạng thái lịch' });

    const schedule = await prisma.lichTapLuyen.findUnique({
      where: { id_lichtapluyen: id },
      include: {
        hlv: { select: { id_nguoidung: true, hoten: true, tendangnhap: true } },
        thanhVien: { include: { nguoiDung: { select: { id_nguoidung: true, hoten: true, tendangnhap: true } } } }
      }
    });

    if (!schedule) return res.status(404).json({ error: 'Không tìm thấy lịch dạy' });

    const data = { trangthai };
    if (trangthai === 'Đã hủy' && ghichu_huy) {
      data.ghichu = withCancelReason(schedule.ghichu, ghichu_huy);
    }

    const updated = await prisma.lichTapLuyen.update({
      where: { id_lichtapluyen: id },
      data,
      include: {
        hlv: { select: { id_nguoidung: true, hoten: true, tendangnhap: true, email: true, sdt: true, avatar: true } },
        thanhVien: {
          include: {
            nguoiDung: { select: { id_nguoidung: true, hoten: true, tendangnhap: true, email: true, sdt: true, avatar: true } }
          }
        }
      }
    });

    if (updated.id_hlv) {
      const adminConfirmedCancel = isCancelledStatus(trangthai);
      const adminConfirmedSchedule = isConfirmedScheduleStatus(trangthai);
      const summary = summarizeSchedule(updated);
      await createTrainingNotification({
        userId: updated.id_hlv,
        title: adminConfirmedCancel
          ? 'Yêu cầu hủy đã được xác nhận'
          : (adminConfirmedSchedule ? 'Lịch dạy đã được xác nhận' : 'Admin cập nhật lịch dạy'),
        content: adminConfirmedCancel
          ? `Yêu cầu hủy lịch dạy ${summary.dateRange} (${summary.timeRange}) với học viên ${getStudentName(updated)} đã được xác nhận.`
          : (adminConfirmedSchedule
            ? `Lịch dạy ${summary.dateRange} (${summary.timeRange}) với học viên ${getStudentName(updated)} đã được admin xác nhận.`
            : `Lịch dạy ${summary.dateRange} (${summary.timeRange}) với học viên ${getStudentName(updated)} đã được cập nhật thành "${trangthai}".`),
        type: 'training_status',
        link: COACH_TRAINING_LINK,
        linkedId: updated.id_lichtapluyen,
      });

      // Thông báo cho học viên khi admin xác nhận hoặc hủy lịch
      const studentUserId = updated.thanhVien?.nguoiDung?.id_nguoidung;
      if (studentUserId) {
        if (adminConfirmedSchedule) {
          await createTrainingNotification({
            userId: studentUserId,
            title: 'Lịch tập đã được xác nhận',
            content: `Lịch tập ${summary.dateRange} (${summary.timeRange}) với HLV ${getCoachName(updated)} đã được xác nhận. Bạn có thể xem lịch trên thời khóa biểu cá nhân.`,
            type: 'training_confirmed',
            link: '/my-trainings',
            linkedId: updated.id_lichtapluyen,
          });
        } else if (adminConfirmedCancel) {
          await createTrainingNotification({
            userId: studentUserId,
            title: 'Lịch tập đã bị hủy',
            content: `Lịch tập ${summary.dateRange} (${summary.timeRange}) với HLV ${getCoachName(updated)} đã bị hủy. Vui lòng liên hệ HLV hoặc admin nếu cần thêm thông tin.`,
            type: 'training_cancelled',
            link: '/my-trainings',
            linkedId: updated.id_lichtapluyen,
          });
        }
      }
    }

    res.json(mapScheduleForAdmin(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái lịch dạy' });
  }
};

// Admin sửa lịch dạy của HLV
exports.adminUpdateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_hlv, id_thanhvien, ngaytap, ngayketthuc, giobatdau, gioketthuc, lephi, ghichu, trangthai } = req.body;

    const schedule = await prisma.lichTapLuyen.findUnique({
      where: { id_lichtapluyen: id },
      include: adminScheduleInclude
    });

    if (!schedule) return res.status(404).json({ error: 'Không tìm thấy lịch dạy' });

    const data = {};
    if (id_hlv !== undefined) data.id_hlv = id_hlv || null;
    if (id_thanhvien !== undefined) data.id_thanhvien = id_thanhvien || null;
    if (ngaytap !== undefined) data.ngaytap = ngaytap ? new Date(ngaytap) : null;
    if (ngayketthuc !== undefined) data.ngayketthuc = ngayketthuc ? new Date(ngayketthuc) : null;
    if (giobatdau !== undefined) data.giobatdau = giobatdau ? new Date(`1970-01-01T${giobatdau}:00Z`) : null;
    if (gioketthuc !== undefined) data.gioketthuc = gioketthuc ? new Date(`1970-01-01T${gioketthuc}:00Z`) : null;
    if (lephi !== undefined) data.lephi = lephi === null || lephi === '' ? null : Number(lephi);
    if (ghichu !== undefined) data.ghichu = ghichu;
    if (trangthai !== undefined) data.trangthai = trangthai;

    const updated = await prisma.lichTapLuyen.update({
      where: { id_lichtapluyen: id },
      data,
      include: adminScheduleInclude
    });

    if (updated.id_hlv) {
      await createTrainingNotification({
        userId: updated.id_hlv,
        title: 'Admin chỉnh sửa lịch dạy',
        content: `Lịch dạy ${summarizeSchedule(updated).dateRange} (${summarizeSchedule(updated).timeRange}) với học viên ${getStudentName(updated)} vừa được admin cập nhật. Vui lòng kiểm tra lại lịch dạy.`,
        type: 'training_update',
        link: COACH_TRAINING_LINK,
        linkedId: updated.id_lichtapluyen,
      });
    }

    res.json(mapScheduleForAdmin(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi sửa lịch dạy' });
  }
};

// Admin xóa lịch dạy của HLV
exports.adminDeleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.lichTapLuyen.findUnique({
      where: { id_lichtapluyen: id },
      include: adminScheduleInclude
    });

    if (!schedule) return res.status(404).json({ error: 'Không tìm thấy lịch dạy' });

    await prisma.lichTapLuyen.delete({ where: { id_lichtapluyen: id } });

    if (schedule.id_hlv) {
      await createTrainingNotification({
        userId: schedule.id_hlv,
        title: 'Admin đã xóa lịch dạy',
        content: `Lịch dạy ${summarizeSchedule(schedule).dateRange} (${summarizeSchedule(schedule).timeRange}) với học viên ${getStudentName(schedule)} đã được admin xóa khỏi hệ thống.`,
        type: 'training_delete',
        link: COACH_TRAINING_LINK,
        linkedId: schedule.id_lichtapluyen,
      });
    }

    res.json({ message: 'Đã xóa lịch dạy' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi xóa lịch dạy' });
  }
};

// Admin gửi thông báo cho HLV. Nếu có lịch trùng thì gửi cảnh báo trùng lịch.
exports.notifyCoachScheduleConflict = async (req, res) => {
  try {
    const { id } = req.params;
    const { conflictId, message } = req.body || {};

    const schedules = await prisma.lichTapLuyen.findMany({
      include: adminScheduleInclude
    });

    const schedule = schedules.find(item => item.id_lichtapluyen === id);
    if (!schedule) return res.status(404).json({ error: 'Không tìm thấy lịch dạy cần báo' });
    if (!schedule.id_hlv) return res.status(400).json({ error: 'Lịch này chưa có HLV để gửi thông báo' });

    const conflicts = schedules.filter(item => item.id_lichtapluyen !== id && schedulesConflict(schedule, item));
    const conflict = conflictId
      ? conflicts.find(item => item.id_lichtapluyen === conflictId)
      : conflicts[0];

    const hasConflict = Boolean(conflict);
    const title = hasConflict ? 'Cảnh báo trùng lịch dạy' : 'Thông báo lịch dạy từ Admin';
    const defaultContent = hasConflict
      ? `Lịch dạy của bạn ${summarizeSchedule(schedule).dateRange} (${summarizeSchedule(schedule).timeRange}) đang trùng với HLV ${getCoachName(conflict)} - học viên ${getStudentName(conflict)}. Vui lòng kiểm tra lại lịch dạy.`
      : `Admin nhắc bạn kiểm tra lịch dạy ${summarizeSchedule(schedule).dateRange} (${summarizeSchedule(schedule).timeRange}) với học viên ${getStudentName(schedule)}.`;

    const notification = await createTrainingNotification({
      userId: schedule.id_hlv,
      title,
      content: message || defaultContent,
      type: hasConflict ? 'training_conflict' : 'training_notice',
      link: COACH_TRAINING_LINK,
      linkedId: schedule.id_lichtapluyen,
    });

    res.json({
      message: hasConflict ? 'Đã gửi cảnh báo trùng lịch cho huấn luyện viên' : 'Đã gửi thông báo cho huấn luyện viên',
      notification
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi gửi thông báo cho HLV' });
  }
};

// ── QUẢN LÝ HUẤN LUYỆN VIÊN (DÀNH CHO ADMIN) ──
const bcrypt = require('bcrypt');

exports.getAllCoaches = async (req, res) => {
  try {
    const coaches = await prisma.nguoiDung.findMany({
      where: { vaitro: 'HuanLuyenVien' },
      orderBy: { ngaytao: 'desc' },
      select: { id_nguoidung: true, hoten: true, email: true, sdt: true, tendangnhap: true, avatar: true, ngaytao: true }
    });
    res.json(coaches);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách HLV' });
  }
};

exports.createCoach = async (req, res) => {
  try {
    const { hoten, email, sdt, matkhau, tendangnhap } = req.body;
    const hash = await bcrypt.hash(matkhau || '123456', 10);
    const newCoach = await prisma.nguoiDung.create({
      data: {
        hoten, email, sdt,
        tendangnhap: tendangnhap || `hlv_${Date.now()}`,
        matkhau: hash,
        vaitro: 'HuanLuyenVien'
      }
    });
    res.json(newCoach);
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'Dữ liệu';
      return res.status(400).json({ error: `${field === 'email' ? 'Email' : field === 'tendangnhap' ? 'Tên đăng nhập' : field} đã được sử dụng. Vui lòng nhập khác.` });
    }
    console.error('Lỗi tạo HLV:', error);
    res.status(500).json({ error: 'Lỗi tạo HLV. Vui lòng thử lại.' });
  }
};

exports.updateCoach = async (req, res) => {
  try {
    const { id } = req.params;
    const { hoten, email, sdt, matkhau, tendangnhap } = req.body;
    let data = { hoten, email, sdt };
    if (tendangnhap) data.tendangnhap = tendangnhap;
    if (matkhau) data.matkhau = await bcrypt.hash(matkhau, 10);
    
    const updated = await prisma.nguoiDung.update({
      where: { id_nguoidung: id },
      data
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'Dữ liệu';
      return res.status(400).json({ error: `${field === 'email' ? 'Email' : field === 'tendangnhap' ? 'Tên đăng nhập' : field} đã được sử dụng. Vui lòng nhập khác.` });
    }
    res.status(500).json({ error: 'Lỗi cập nhật HLV' });
  }
};

exports.deleteCoach = async (req, res) => {
  try {
    await prisma.nguoiDung.delete({ where: { id_nguoidung: req.params.id } });
    res.json({ message: 'Xóa HLV thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa HLV (Có thể HLV này đang có lịch dạy)' });
  }
};

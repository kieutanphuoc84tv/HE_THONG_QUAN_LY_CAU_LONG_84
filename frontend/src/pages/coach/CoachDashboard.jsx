import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Tabs, Table, Button, Modal, Form, Input, Select, 
  DatePicker, TimePicker, message, Calendar, Badge, Space, Card, Tag, Tooltip, Radio, Checkbox
} from 'antd';
import { 
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  EditOutlined, DeleteOutlined, UserOutlined, ClockCircleOutlined,
  CalendarOutlined, ScheduleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import { clearStoredAuth } from '../../utils/authStorage';

const { TabPane } = Tabs;
const { Option } = Select;

// Helper: parse ghichu from student registration
const parseGhichu = (ghichu) => {
  if (!ghichu) return {};
  const result = {};

  const ngayNghiMatch = ghichu.match(/\[NGAY_NGHI:\s*([^\]]+)\]/g);
  if (ngayNghiMatch) {
    result.ngayNghi = ngayNghiMatch.map(m => m.match(/\[NGAY_NGHI:\s*([^\]]+)\]/)[1]);
  }

  const isMakeup = ghichu.includes('[HỌC BÙ]');
  result.isMakeup = isMakeup;

  // New simple format: [Buổi Sáng]
  const buoiSimple = ghichu.match(/\[Buổi (Sáng|Chiều|Cả Hai)\]/);
  const buoiNew = ghichu.match(/\[Buổi (Sáng|Chiều|Cả Hai) - (\d{2}:\d{2})(?:→(\d{2}:\d{2}))?\]/);
  
  const choHuyMatch = [...ghichu.matchAll(/\[CHO_HUY_BUOI:\s*([^|\]]+)\|\s*([^\]]+)\]/g)];
  if (choHuyMatch.length) {
    result.choHuyBuoi = {};
    choHuyMatch.forEach(match => {
      result.choHuyBuoi[match[1].trim()] = match[2].trim();
    });
  }

  if (buoiSimple) {
    result.buoi = buoiSimple[1];
    result.gioStart = null;
    result.gioEnd = null;
  } else if (buoiNew) {
    result.buoi = buoiNew[1];
    result.gioStart = buoiNew[2];
    result.gioEnd = buoiNew[3] || null;
  }

  // Hình thức
  const ht = ghichu.match(/\[(Học theo nhóm cơ bản|Học nâng cao\/chuyên sâu|Kèm riêng \(1-1\))\]/);
  if (ht) result.hinhThuc = ht[1];

  // Ngày trong tuần
  const days = ghichu.match(/\[Ngày: ([^\]]+)\]/);
  if (days) result.ngayTrongTuan = days[1].split(',').map(d => d.trim());

  // Lấy lý do hủy do HLV nhập (nếu có)
  const isCancelMatch = ghichu.match(/\[LÝ DO HỦY:\s*([^\]]+)\]/);
  if (isCancelMatch) {
    result.cancelReason = isCancelMatch[1];
  }

  const lessonCancelReasonMatches = [...ghichu.matchAll(/\[LÝ DO HỦY BUỔI:\s*([^|\]]+)\|\s*([^\]]+)\]/g)];
  if (lessonCancelReasonMatches.length) {
    result.lessonCancelReasons = {};
    lessonCancelReasonMatches.forEach(match => {
      const dateKey = match[1]?.trim();
      const reason = match[2]?.trim();
      if (dateKey && reason) result.lessonCancelReasons[dateKey] = reason;
    });
  }

  // Clean text (ghi chú riêng do HỌC VIÊN nhập)
  let clean = ghichu
    .replace(/\[NGAY_NGHI:\s*[^\]]+\]/g, '')
    .replace(/\[LÝ DO HỦY BUỔI:\s*[^|\]]+\|\s*[^\]]+\]/g, '')
    .replace(/\[CHO_HUY_BUOI:\s*[^|\]]+\|\s*[^\]]+\]/g, '')
    .replace(/\[LÝ DO HỦY:\s*[^\]]+\]/g, '')
    .replace(/\[Buổi\s+[^\]]+\]/g, '')
    .replace(/\[Ngày:\s*[^\]]+\]/g, '')
    .replace(/\[(HỌC BÙ|Học theo nhóm cơ bản|Học nâng cao\/chuyên sâu|Kèm riêng \(1-1\))\]/g, '')
    .trim();
  
  result.cleanText = clean.trim();

  return result;
};

const extractTime = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return dateStr.split('T')[1].substring(0, 5);
  }
  return dayjs(dateStr).format('HH:mm');
};

const TRAINING_DESCRIPTIONS = {
  'Học theo nhóm cơ bản': { sessions: '2-3 buổi/tuần', color: '#10b981' },
  'Học nâng cao/chuyên sâu': { sessions: '4-5 buổi/tuần', color: '#f59e0b' },
  'Kèm riêng (1-1)': { sessions: 'Linh hoạt', color: '#8b5cf6' },
};

const DAY_LABELS = ['T2','T3','T4','T5','T6','T7','CN'];
const CANCEL_PENDING_STATUS = 'Chờ xác nhận hủy';
const SCHEDULE_CONFIRM_PENDING_STATUS = 'Đợi xác nhận';

const normalizeStatus = (status = '') => String(status || '').toLowerCase().replace(/huỷ/g, 'hủy');
const isScheduleConfirmPending = (status = '') => {
  const text = normalizeStatus(status);
  return (text.includes('đợi') || text.includes('chờ')) && text.includes('xác nhận') && !text.includes('hủy');
};
const isCancellationPending = (status = '') => {
  const text = normalizeStatus(status);
  return text.includes('chờ') && text.includes('xác nhận') && text.includes('hủy');
};
const isConfirmedCancelled = (status = '') => {
  const text = normalizeStatus(status);
  return text.includes('đã') && text.includes('hủy');
};
const isVisibleTeachingStatus = (status = '') => (
  status === 'Đã chốt lịch' || isScheduleConfirmPending(status) || isCancellationPending(status) || isConfirmedCancelled(status)
);

const BoxSelector = ({ value = [], onChange, disabled }) => {
  const toggle = (v) => {
    if (disabled) return;
    const next = value.includes(v) ? value.filter(i => i !== v) : [...value, v];
    onChange(next);
  };
  return (
    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
      {['Sáng', 'Chiều'].map(v => {
        const isActive = value.includes(v);
        return (
          <div
            key={v}
            onClick={() => toggle(v)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 12px',
              borderRadius: 8,
              border: `1.5px solid ${isActive ? '#3b82f6' : '#e2e8f0'}`,
              background: isActive ? '#eff6ff' : '#ffffff',
              color: isActive ? '#1d4ed8' : '#475569',
              fontWeight: isActive ? 600 : 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
          >
            Ca {v}
          </div>
        );
      })}
    </div>
  );
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [members, setMembers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [makeupForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [parsedInfo, setParsedInfo] = useState({});
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [lessonCancelModalVisible, setLessonCancelModalVisible] = useState(false);
  const [lessonCancelDate, setLessonCancelDate] = useState(null);
  const [lessonCancelReason, setLessonCancelReason] = useState('');
  const [makeupModalVisible, setMakeupModalVisible] = useState(false);
  const [clickedDate, setClickedDate] = useState(null);

  // Timetable week logic
  const getStartOfWeek = (date) => {
    const d = dayjs(date);
    const day = d.day();
    const diff = day === 0 ? -6 : 1 - day; 
    return d.add(diff, 'day').startOf('day');
  };
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(dayjs()));
  const weekDays = Array.from({ length: 7 }).map((_, i) => currentWeekStart.add(i, 'day'));
  const nextWeek = () => setCurrentWeekStart(prev => prev.add(7, 'day'));
  const prevWeek = () => setCurrentWeekStart(prev => prev.subtract(7, 'day'));
  const currentWeek = () => setCurrentWeekStart(getStartOfWeek(dayjs()));

  const dayLabelsMap = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 0: 'CN' };
  const dayNamesMap = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 0: 'Chủ Nhật' };

  const extractHour = (dateStr) => {
    const time = extractTime(dateStr);
    if (time) return parseInt(time.split(':')[0], 10);
    return 0;
  };

  const getClassesForCell = (date, sessionType) => {
    return schedules.filter(t => {
      if (!isVisibleTeachingStatus(t.trangthai)) return false;
      if (!t.id_thanhvien || !t.thanhVien?.nguoiDung) return false;
      if (!t.ngaytap) return false;
      const start = dayjs(t.ngaytap);
      const end = t.ngayketthuc ? dayjs(t.ngayketthuc) : start;

      if (date.isBefore(start, 'day') || date.isAfter(end, 'day')) return false;

      const info = parseGhichu(t.ghichu);
      const dayLabel = dayLabelsMap[date.day()];
      
      if (info.isMakeup) {
        if (!date.isSame(start, 'day')) return false;
      } else {
        if (info.ngayTrongTuan && !info.ngayTrongTuan.includes(dayLabel)) return false;
        if (!info.ngayTrongTuan && !date.isSame(start, 'day')) return false;
      }

      const tSession = info.buoi || (t.giobatdau && extractHour(t.giobatdau) < 12 ? 'Sáng' : 'Chiều');
      if (tSession === 'Cả Hai') return true; // Hiển thị trên cả 2 lịch
      if (tSession !== sessionType) return false;

      return true;
    });
  };

  const getClassMeta = (t, sessionType, date) => {
    const info = parseGhichu(t.ghichu);
    const dateStr = date ? date.format('YYYY-MM-DD') : null;
    const isPendingLessonCancel = info.choHuyBuoi && info.choHuyBuoi[dateStr];
    const isPendingApproval = isScheduleConfirmPending(t.trangthai);
    const isPendingCancellation = isCancellationPending(t.trangthai) || isPendingLessonCancel;
    const isCancelled = isConfirmedCancelled(t.trangthai) || (info.ngayNghi && info.ngayNghi.includes(dateStr));
    const isMakeup = info.isMakeup;
    const startTime = info.gioStart || (t.giobatdau ? extractTime(t.giobatdau) : '?');
    const endTime = info.gioEnd || (t.gioketthuc ? extractTime(t.gioketthuc) : '?');
    const title = isMakeup ? '💡 HỌC BÙ' : (info.hinhThuc || 'Lịch Tập');

    return { info, isPendingApproval, isPendingCancellation, isCancelled, isMakeup, startTime, endTime, title, sessionType, date };
  };

  const getClassGroups = (classes, sessionType, date) => {
    const groups = new Map();

    classes.forEach(t => {
      const meta = getClassMeta(t, sessionType, date);
      const key = [
        sessionType,
        meta.title,
        meta.startTime,
        meta.endTime,
        meta.isMakeup ? 'makeup' : 'regular',
        meta.isPendingApproval ? 'pending-approval' : 'approval-done',
        meta.isPendingCancellation ? 'pending-cancel' : 'ready',
        meta.isCancelled ? 'cancelled' : 'active',
      ].join('|');

      if (!groups.has(key)) {
        groups.set(key, { key, meta, schedules: [] });
      }
      groups.get(key).schedules.push(t);
    });

    return Array.from(groups.values());
  };

  const [classDetail, setClassDetail] = useState(null);

  const openClassDetail = (group) => {
    setClassDetail(group);
  };

  const renderClassCard = (group) => {
    const { meta, schedules: groupSchedules } = group;
    const { isCancelled, isPendingApproval, isPendingCancellation, isMakeup, startTime, endTime, title } = meta;
    const cardTheme = isPendingCancellation
      ? { bg: '#fdf2f8', border: '#f9a8d4', header: '#be185d', tagBg: '#fce7f3', tagColor: '#be185d' }
      : isCancelled
        ? { bg: '#fee2e2', border: '#ef4444', header: '#b91c1c', tagBg: '#fecaca', tagColor: '#991b1b' }
        : isPendingApproval
          ? { bg: '#f5f3ff', border: '#8b5cf6', header: '#6d28d9', tagBg: '#ede9fe', tagColor: '#6d28d9' }
          : isMakeup
            ? { bg: '#fef3c7', border: '#f59e0b', header: '#d97706', tagBg: '#fffbeb', tagColor: '#b45309' }
            : { bg: '#eff6ff', border: '#3b82f6', header: '#2563eb', tagBg: '#dbeafe', tagColor: '#1d4ed8' };

    return (
      <div key={group.key} onClick={() => openClassDetail(group)} title="Bấm để xem danh sách học viên" style={{ 
        position: 'relative', background: cardTheme.bg, border: `2px solid ${cardTheme.border}`, 
        borderRadius: 8, padding: '10px 12px', marginBottom: 8, opacity: isCancelled ? 0.9 : 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontWeight: 800, color: cardTheme.header, fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>{title}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
            {startTime} - {endTime}
          </div>
          <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <UserIcon size={14} color={cardTheme.header} />
            <span style={{ fontWeight: 700 }}>{groupSchedules.length} học viên</span>
          </div>
          {(isPendingApproval || isPendingCancellation || isCancelled) && (
            <div style={{
              marginTop: 8,
              padding: '4px 8px',
              background: cardTheme.tagBg,
              color: cardTheme.tagColor,
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center'
            }}>
              {isPendingApproval ? 'ĐỢI XÁC NHẬN' : (isPendingCancellation ? 'ĐỢI XÁC NHẬN HỦY' : 'ĐÃ HỦY / VẮNG')}
            </div>
          )}
        </div>
      </div>
    );
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, memRes] = await Promise.all([
        api.get('/coach/schedules'),
        api.get('/coach/members')
      ]);
      setSchedules(schedRes.data);
      setMembers(memRes.data);
    } catch (error) {
      console.error('API Error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearStoredAuth();
        message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
        navigate('/login', { replace: true });
        return;
      }
      message.error(error.response?.data?.error || "Lỗi khi tải dữ liệu lịch dạy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dữ liệu khách đăng ký đang "Chờ xếp lịch"
  const requests = schedules.filter(s => s.trangthai === 'Chờ xếp lịch');

  // Mở modal thêm mới
  const openAddModal = () => {
    form.resetFields();
    setEditingId(null);
    setParsedInfo({});
    setIsModalVisible(true);
  };

  const currentEditingSchedule = schedules.find(s => s.id_lichtapluyen === editingId);
  const isFormDisabled = !!editingId && currentEditingSchedule?.trangthai !== 'Chờ xếp lịch';

  // Mở modal sửa lịch
  const openEditModal = (record, date = null) => {
    setEditingId(record.id_lichtapluyen);
    setClickedDate(date);
    const info = parseGhichu(record.ghichu);
    setParsedInfo(info);

    form.setFieldsValue({
      id_thanhvien: record.id_thanhvien,
      ngaytap: record.ngaytap ? dayjs(record.ngaytap) : null,
      ngayketthuc: record.ngayketthuc ? dayjs(record.ngayketthuc) : null,
      giobatdau: info.gioStart || (record.giobatdau ? extractTime(record.giobatdau) : '06:00'),
      gioketthuc: info.gioEnd || (record.gioketthuc ? extractTime(record.gioketthuc) : '10:00'),
      lephi: record.lephi,
      ghichu: info.cleanText || '',
      buoi: info.buoi === 'Cả Hai' ? ['Sáng', 'Chiều'] : (info.buoi ? [info.buoi] : ['Sáng']),
      ngayTrongTuan: info.ngayTrongTuan || []
    });
    setIsModalVisible(true);
  };

  const handleMemberSelect = (val) => {
    let req = requests.find(r => r.id_thanhvien === val);
    
    // Nếu không có yêu cầu chờ xếp lịch, lấy lịch gần nhất đã duyệt của học viên này
    if (!req) {
      const studentSchedules = schedules.filter(s => s.id_thanhvien === val);
      if (studentSchedules.length > 0) {
        req = studentSchedules[studentSchedules.length - 1];
      }
    }

    if (req) {
      const info = parseGhichu(req.ghichu);
      setParsedInfo(info);

      form.setFieldsValue({
        ghichu: info.cleanText || '',
        buoi: info.buoi === 'Cả Hai' ? ['Sáng', 'Chiều'] : (info.buoi ? [info.buoi] : ['Sáng']),
        ngayTrongTuan: info.ngayTrongTuan || [],
        ngaytap: req.ngaytap ? dayjs(req.ngaytap) : null,
        ngayketthuc: req.ngayketthuc ? dayjs(req.ngayketthuc) : null
      });
      
      if (req.trangthai === 'Chờ xếp lịch') {
        setEditingId(req.id_lichtapluyen);
      } else {
        setEditingId(null);
      }
    } else {
      setParsedInfo({});
      form.setFieldsValue({
        ghichu: '',
        buoi: ['Sáng'],
        ngayTrongTuan: [],
        ngaytap: null,
        ngayketthuc: null
      });
      setEditingId(null);
    }
  };

  // Phê duyệt yêu cầu
  const handleApprove = (record) => {
    openEditModal(record, null);
  };

  const openLessonCancelModal = (date) => {
    setLessonCancelDate(date);
    setLessonCancelReason('');
    setLessonCancelModalVisible(true);
  };

  const handleLessonCancelSubmit = () => {
    if (!reason) {
      message.warning('Vui lòng nhập lý do hủy buổi học!');
      return;
    }

    const dateStr = lessonCancelDate.format('YYYY-MM-DD');
    const safeReason = lessonCancelReason.replace(/\]/g, ')');
    setParsedInfo(prev => {
      return {
        ...prev,
        choHuyBuoi: {
          ...(prev.choHuyBuoi || {}),
          [dateStr]: safeReason,
        },
      };
    });
    setLessonCancelModalVisible(false);
    message.success(`Đã thêm hủy buổi học ngày ${lessonCancelDate.format('DD/MM/YYYY')}. Nhấn "OK" để lưu lại.`);
  };

  const handleSubmit = async (values) => {
    try {
      const { buoi, ngayTrongTuan, ghichu, ...rest } = values;
      
      let timeStart = '06:00';
      let timeEnd = '10:00';
      const buoiArr = Array.isArray(buoi) ? buoi : [buoi];
      const hasSang = buoiArr.includes('Sáng');
      const hasChieu = buoiArr.includes('Chiều');
      
      let buoiLabel = 'Sáng';
      if (hasSang && hasChieu) { timeStart = '06:00'; timeEnd = '22:00'; buoiLabel = 'Cả Hai'; }
      else if (hasSang) { timeStart = '06:00'; timeEnd = '12:00'; buoiLabel = 'Sáng'; }
      else if (hasChieu) { timeStart = '13:00'; timeEnd = '22:00'; buoiLabel = 'Chiều'; }
      
      const start = values.ngaytap;
      const end = values.ngayketthuc || start;
      const hinhThucMoi = parsedInfo.hinhThuc || 'Học theo nhóm cơ bản';
      const isSoloMoi = hinhThucMoi === 'Kèm riêng (1-1)';
      
      if (ngayTrongTuan && ngayTrongTuan.length > 0) {
        const overlappingSchedules = schedules.filter(s => {
          if (s.id_lichtapluyen === editingId) return false;
          if (s.trangthai !== 'Đã chốt lịch' && !isScheduleConfirmPending(s.trangthai)) return false;
          const sStart = dayjs(s.ngaytap);
          const sEnd = s.ngayketthuc ? dayjs(s.ngayketthuc) : sStart;
          return !(end.isBefore(sStart, 'day') || start.isAfter(sEnd, 'day'));
        });

        for (const s of overlappingSchedules) {
          const info = parseGhichu(s.ghichu);
          const sBuoi = info.buoi || 'Sáng';
          const sDays = info.ngayTrongTuan || [];
          const sHinhThuc = info.hinhThuc || 'Học theo nhóm cơ bản';
          const isSoloCu = sHinhThuc === 'Kèm riêng (1-1)';

          const sessionOverlap = (buoiLabel === 'Cả Hai' || sBuoi === 'Cả Hai' || buoiLabel === sBuoi);
          
          if (sessionOverlap) {
            const dayOverlap = ngayTrongTuan.some(d => sDays.includes(d));
            if (dayOverlap) {
              if (isSoloCu) {
                message.error(`Trùng lịch! Đã xếp lịch Kèm riêng (1-1) cho ${s.thanhVien?.nguoiDung?.hoten} vào ca này.`);
                return;
              }
              if (isSoloMoi) {
                message.error(`Trùng lịch! Ca này đang có lớp nhóm (${sHinhThuc}), không thể xếp Kèm riêng.`);
                return;
              }
              if (hinhThucMoi !== sHinhThuc) {
                message.error(`Trùng lịch loại hình! Ca này đang dạy nhóm [${sHinhThuc}], không thể ghép với [${hinhThucMoi}].`);
                return;
              }
            }
          }
        }
      }

      const dayStr = ngayTrongTuan && ngayTrongTuan.length > 0 ? `[Ngày: ${ngayTrongTuan.join(', ')}] ` : '';
      const buoiStr = `[Buổi ${buoiLabel}] `;
      
      // Preserve isMakeup, ngayNghi and hinhThuc
      let extraInfo = '';
      if (parsedInfo.isMakeup) extraInfo += '[HỌC BÙ] ';
      if (parsedInfo.ngayNghi) {
        extraInfo += parsedInfo.ngayNghi.map(d => {
          const reason = parsedInfo.lessonCancelReasons?.[d];
          return reason ? `[NGAY_NGHI: ${d}] [LÝ DO HỦY BUỔI: ${d} | ${reason}]` : `[NGAY_NGHI: ${d}]`;
        }).join(' ') + ' ';
      }
      if (parsedInfo.choHuyBuoi) {
        Object.entries(parsedInfo.choHuyBuoi).forEach(([d, reason]) => {
          extraInfo += `[CHO_HUY_BUOI: ${d} | ${reason}] `;
        });
      }
      if (parsedInfo.hinhThuc) extraInfo += `[${parsedInfo.hinhThuc}] `;

      const finalGhichu = `${buoiStr}${dayStr}${extraInfo}${ghichu || ''}`.trim();

      const formattedValues = {
        ...rest,
        giobatdau: timeStart,
        gioketthuc: timeEnd,
        ghichu: finalGhichu,
        ngaytap: values.ngaytap.format('YYYY-MM-DD'),
        ngayketthuc: values.ngayketthuc ? values.ngayketthuc.format('YYYY-MM-DD') : null,
      };

      if (editingId) {
        await api.put(`/coach/schedules/${editingId}`, formattedValues);
        const sched = schedules.find(s => s.id_lichtapluyen === editingId);
        if (sched && sched.trangthai === 'Chờ xếp lịch') {
           await api.put(`/coach/schedules/${editingId}/status`, { trangthai: SCHEDULE_CONFIRM_PENDING_STATUS });
        }
        message.success("Đã gửi lịch, đang đợi xác nhận");
      } else {
        await api.post(`/coach/schedules`, formattedValues);
        message.success("Đã gửi lịch mới, đang đợi xác nhận");
      }
      setIsModalVisible(false);
      fetchData();
    } catch (err) {
      console.error('Lỗi lưu lịch dạy:', err);
      message.error(err.response?.data?.error || 'Không kết nối được backend. Vui lòng kiểm tra API server.');
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa lịch này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Không',
      onOk: async () => {
        try {
          await api.delete(`/coach/schedules/${id}`);
          message.success("Xóa thành công");
          fetchData();
        } catch (err) {
          message.error("Lỗi khi xóa lịch");
        }
      }
    });
  };

  // Hủy lịch kèm lý do
  const openCancelModal = (id) => {
    setCancelId(id);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      message.warning('Vui lòng nhập lý do hủy!');
      return;
    }
    try {
      await api.put(`/coach/schedules/${cancelId}/status`, { 
        trangthai: CANCEL_PENDING_STATUS,
        ghichu_huy: cancelReason 
      });
      message.success('Đã gửi yêu cầu hủy, đang đợi xác nhận');
      setCancelModalVisible(false);
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Lỗi khi hủy lịch');
    }
  };

  // Đăng ký học bù
  const handleMakeupSubmit = async (values) => {
    try {
      let timeStart = '06:00';
      let timeEnd = '10:00';
      const buoiArr = Array.isArray(values.buoi) ? values.buoi : [values.buoi];
      const hasSang = buoiArr.includes('Sáng');
      const hasChieu = buoiArr.includes('Chiều');
      
      let buoiLabel = 'Sáng';
      if (hasSang && hasChieu) { timeStart = '06:00'; timeEnd = '22:00'; buoiLabel = 'Cả Hai'; }
      else if (hasSang) { timeStart = '06:00'; timeEnd = '12:00'; buoiLabel = 'Sáng'; }
      else if (hasChieu) { timeStart = '13:00'; timeEnd = '22:00'; buoiLabel = 'Chiều'; }

      const formattedValues = {
        id_thanhvien: values.id_thanhvien,
        ngaytap: values.ngaytap.format('YYYY-MM-DD'),
        ngayketthuc: values.ngaytap.format('YYYY-MM-DD'), // Học bù chỉ tính 1 ngày
        giobatdau: timeStart,
        gioketthuc: timeEnd,
        ghichu: `[Buổi ${buoiLabel}] [HỌC BÙ] Lý do: ${values.lydo}`,
        lephi: 0 // Học bù không tính phí mới
      };
      
      await api.post(`/coach/schedules`, formattedValues);
      message.success("Đăng ký lịch học bù thành công");
      setMakeupModalVisible(false);
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error || "Có lỗi xảy ra");
    }
  };

  // Calendar render
  const dateCellRender = (value) => {
    const listData = schedules.filter(s => 
      dayjs(s.ngaytap).isSame(value, 'day') && (s.trangthai === 'Đã chốt lịch' || isScheduleConfirmPending(s.trangthai))
    );
    return (
      <ul className="m-0 p-0 list-none">
        {listData.map(item => (
          <li key={item.id_lichtapluyen} className="mb-1">
            <Tooltip title={`Học viên: ${item.thanhVien?.nguoiDung?.hoten} | Ghi chú: ${item.ghichu || 'Không'}`}>
              <div 
                onClick={() => openEditModal(item)}
                className={`text-xs px-2 py-1 rounded border cursor-pointer truncate ${isScheduleConfirmPending(item.trangthai) ? 'bg-purple-100 border-purple-300 hover:bg-purple-200' : 'bg-blue-100 border-blue-300 hover:bg-blue-200'}`}
              >
                <span className={`font-semibold ${isScheduleConfirmPending(item.trangthai) ? 'text-purple-800' : 'text-blue-800'}`}>{item.giobatdau ? extractTime(item.giobatdau) : '06:00'}</span> - {item.thanhVien?.nguoiDung?.hoten}
              </div>
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  // Table columns for requests
  const requestColumns = [
    { 
      title: 'Học viên', 
      dataIndex: ['thanhVien', 'nguoiDung', 'hoten'], 
      key: 'hoten',
      render: (text) => <><UserOutlined className="mr-2" />{text}</>
    },
    { 
      title: 'Ngày muốn tập', 
      dataIndex: 'ngaytap', 
      key: 'ngaytap', 
      render: text => text ? dayjs(text).format('DD/MM/YYYY') : 'Chưa rõ' 
    },
    { 
      title: 'Thông tin đăng ký', 
      dataIndex: 'ghichu', 
      key: 'ghichu',
      width: 360,
      render: (text) => {
        if (!text) return 'Không';
        const info = parseGhichu(text);
        return (
          <div>
            {info.hinhThuc && <Tag color="green" className="mb-1">{info.hinhThuc}</Tag>}
            {info.buoi && (
              <Tag color={info.buoi === 'Sáng' ? 'orange' : 'blue'} className="mb-1">
                {info.buoi === 'Sáng' ? '🌅' : '🌇'} {info.buoi} {info.gioStart}{info.gioEnd ? `→${info.gioEnd}` : ''}
              </Tag>
            )}
            {info.ngayTrongTuan && (
              <Tag color="purple" className="mb-1">📅 {info.ngayTrongTuan.join(', ')}</Tag>
            )}
            {info.cleanText && <div className="text-xs text-gray-500 mt-1">{info.cleanText}</div>}
          </div>
        );
      }
    },
    { 
      title: 'Hành động', 
      key: 'action', 
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleApprove(record)}>Xếp lịch</Button>
          <Button style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }} size="small" icon={<CloseCircleOutlined />} onClick={() => openCancelModal(record.id_lichtapluyen)}>Hủy</Button>
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id_lichtapluyen)}>Xóa</Button>
        </Space>
      ) 
    }
  ];

  // Render parsed schedule info in modal
  const renderScheduleInfo = () => {
    const { hinhThuc } = parsedInfo;
    const displayHinhThuc = hinhThuc || 'Học theo nhóm cơ bản'; // Default nếu data cũ bị thiếu
    const htInfo = TRAINING_DESCRIPTIONS[displayHinhThuc];

    return (
      <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#166534', marginBottom: 10 }}>📋 Thông tin đăng ký của học viên</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', minWidth: 90 }}>Hình thức:</span>
          <Tag color="green" style={{ margin: 0, fontWeight: 600 }}>{displayHinhThuc}</Tag>
          {htInfo && <span style={{ fontSize: 11, color: '#94a3b8' }}>({htInfo.sessions})</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold uppercase text-blue-900">Bảng Điều Khiển Huấn Luyện Viên</h1>
        <Space>
          <Button type="default" icon={<ScheduleOutlined />} onClick={() => { makeupForm.resetFields(); setMakeupModalVisible(true); }} size="large" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
            Đăng Ký Học Bù
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="large">
            Thêm Lịch Mới
          </Button>
        </Space>
      </div>

      <Card className="shadow-sm border-gray-200">
        <Tabs defaultActiveKey="1" size="large">
          <TabPane tab={<span className="font-medium">Quản lý Lịch Dạy (Sơ đồ)</span>} key="1">
            <div style={{ background: '#fff', padding: '16px 24px', borderRadius: '8px 8px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={prevWeek} style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={20} color="#475569" />
                </button>
                <button onClick={currentWeek} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: 8, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                  Tuần hiện tại
                </button>
                <button onClick={nextWeek} style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={20} color="#475569" />
                </button>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                Tuần từ {weekDays[0].format('DD/MM/YYYY')} đến {weekDays[6].format('DD/MM/YYYY')}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: 3 }}></div> Đã xác nhận</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#f5f3ff', border: '2px solid #8b5cf6', borderRadius: 3 }}></div> Đợi xác nhận</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 3 }}></div> Học Bù</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#fdf2f8', border: '2px solid #f9a8d4', borderRadius: 3 }}></div> Đợi xác nhận hủy</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 3 }}></div> Đã hủy</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px' }}>
              <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: 120, padding: 16, borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #3b82f6', background: '#f8fafc' }}>
                      <Clock size={20} color="#94a3b8" style={{ display: 'block', margin: '0 auto' }} />
                    </th>
                    {weekDays.map(date => {
                      const isToday = date.isSame(dayjs(), 'day');
                      return (
                        <th key={date.format('YYYY-MM-DD')} style={{ 
                          padding: '16px 8px', borderRight: '1px solid #e2e8f0', borderBottom: `2px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`,
                          background: isToday ? '#eff6ff' : '#f8fafc', textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: isToday ? '#2563eb' : '#0f172a' }}>{dayNamesMap[date.day()]}</div>
                          <div style={{ fontSize: 13, color: isToday ? '#3b82f6' : '#64748b', fontWeight: 600, marginTop: 4 }}>{date.format('DD/MM')}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 16, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 800, color: '#d97706', fontSize: 15 }}>SÁNG</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>(06:00 - 12:00)</div>
                    </td>
                    {weekDays.map(date => {
                      const classes = getClassesForCell(date, 'Sáng');
                      const groups = getClassGroups(classes, 'Sáng', date);
                      return (
                        <td key={`sang-${date.format()}`} style={{ padding: 8, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', background: classes.length > 0 ? '#fff' : '#fcfcfc' }}>
                          {groups.map(group => renderClassCard(group))}
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td style={{ padding: 16, borderRight: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 800, color: '#4f46e5', fontSize: 15 }}>CHIỀU</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>(13:00 - 22:00)</div>
                    </td>
                    {weekDays.map(date => {
                      const classes = getClassesForCell(date, 'Chiều');
                      const groups = getClassGroups(classes, 'Chiều', date);
                      return (
                        <td key={`chieu-${date.format()}`} style={{ padding: 8, borderRight: '1px solid #e2e8f0', verticalAlign: 'top', background: classes.length > 0 ? '#fff' : '#fcfcfc' }}>
                          {groups.map(group => renderClassCard(group))}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabPane>
          
          <TabPane tab={
            <Badge count={requests.length} offset={[10, 0]}>
              <span className="font-medium pr-2">Khách Đăng Ký</span>
            </Badge>
          } key="2">
            <Table 
              dataSource={requests} 
              columns={requestColumns} 
              rowKey="id_lichtapluyen"
              loading={loading}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Hiện chưa có khách hàng nào đăng ký lịch tập.' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="Danh sách học viên"
        open={!!classDetail}
        onCancel={() => setClassDetail(null)}
        footer={[
          <Button key="close" onClick={() => setClassDetail(null)}>Đóng</Button>
        ]}
        width={560}
        destroyOnClose
      >
        {classDetail && (
          <div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{classDetail.meta.title}</div>
              <div style={{ color: '#475569', fontSize: 13 }}>
                {classDetail.meta.date?.format('DD/MM/YYYY')} · {classDetail.meta.sessionType} · {classDetail.meta.startTime} - {classDetail.meta.endTime}
              </div>
              <Tag color="blue" style={{ marginTop: 10, fontWeight: 700 }}>
                {classDetail.schedules.length} học viên
              </Tag>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classDetail.schedules.map(item => {
                const info = parseGhichu(item.ghichu);
                const student = item.thanhVien?.nguoiDung;
                const detailDateKey = classDetail.meta.date?.format('YYYY-MM-DD');
                const lessonCancelReason = detailDateKey ? info.lessonCancelReasons?.[detailDateKey] : null;

                return (
                  <div key={item.id_lichtapluyen} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          <UserOutlined style={{ marginRight: 8, color: '#2563eb' }} />
                          {student?.hoten || 'N/A'}
                        </div>
                        {student?.sdt && (
                          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>SĐT: {student.sdt}</div>
                        )}
                        {info.cleanText && (
                          <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>Ghi chú: {info.cleanText}</div>
                        )}
                        {lessonCancelReason && (
                          <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6, fontWeight: 700 }}>
                            Lý do hủy buổi học: {lessonCancelReason}
                          </div>
                        )}
                      </div>
                      <Button
                        size="small"
                        onClick={() => {
                          const targetDate = classDetail.meta.date || null;
                          setClassDetail(null);
                          openEditModal(item, targetDate);
                        }}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={editingId ? "Cập Nhật Lịch Tập Luyện" : "Thêm Lịch Tập Luyện Mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            OK
          </Button>
        ]}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="id_thanhvien" label="Học viên" rules={[{ required: true, message: 'Vui lòng chọn học viên' }]}>
            <Select showSearch placeholder="Chọn học viên" optionFilterProp="children" disabled={!!editingId} onChange={handleMemberSelect}>
              {members.map(m => (
                <Option key={m.id_thanhvien} value={m.id_thanhvien}>{m.nguoiDung?.hoten} - {m.nguoiDung?.sdt}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* Thông tin đăng ký của học viên */}
          {renderScheduleInfo()}

          <div className="flex gap-4">
            <Form.Item name="buoi" label="Ca học" className="w-1/2" rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ca' }]}>
              <BoxSelector disabled={isFormDisabled} />
            </Form.Item>
            <Form.Item name="ngayTrongTuan" label="Ngày học trong tuần" className="w-1/2" rules={[{ required: true, message: 'Vui lòng chọn ngày học' }]}>
              <Select mode="multiple" placeholder="Chọn ngày (VD: T2, T4)" disabled={isFormDisabled}>
                {['T2','T3','T4','T5','T6','T7','CN'].map(d => <Option key={d} value={d}>{d}</Option>)}
              </Select>
            </Form.Item>
          </div>

          <div className="flex gap-4">
            <Form.Item name="ngaytap" label="Ngày bắt đầu khóa" className="w-1/2" rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}>
              <DatePicker className="w-full" format="DD/MM/YYYY" disabled={isFormDisabled} onChange={(val) => {
                if (val && !isFormDisabled) {
                  form.setFieldValue('ngayketthuc', val.add(8, 'week'));
                }
              }} />
            </Form.Item>
            <Form.Item name="ngayketthuc" label="Ngày kết thúc khóa" className="w-1/2" rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}>
              <DatePicker className="w-full" format="DD/MM/YYYY" disabled={isFormDisabled} />
            </Form.Item>
          </div>

          <Form.Item name="ghichu" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Giáo án, lưu ý (nếu có)..." />
          </Form.Item>

          {editingId && clickedDate && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#dc2626', display: 'block' }}>Hủy buổi học</span>
                  <span style={{ fontSize: 12, color: '#b91c1c' }}>Yêu cầu hủy buổi học ngày {clickedDate.format('DD/MM/YYYY')}</span>
                </div>
                <Button danger onClick={() => openLessonCancelModal(clickedDate)}>
                  Hủy Buổi Học
                </Button>
              </div>
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        title="Hủy buổi học"
        open={lessonCancelModalVisible}
        onCancel={() => setLessonCancelModalVisible(false)}
        onOk={handleLessonCancelSubmit}
        okText="Thêm lý do"
        okButtonProps={{ danger: true }}
        cancelText="Đóng"
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ color: '#991b1b', fontSize: 13, fontWeight: 700 }}>
              Ngày hủy: {lessonCancelDate ? lessonCancelDate.format('DD/MM/YYYY') : ''}
            </div>
            <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
              Sau khi thêm lý do, bấm "OK" ở form lịch để lưu thay đổi.
            </div>
          </div>
          <label style={{ fontWeight: 600, fontSize: 13, color: '#374151', display: 'block', marginBottom: 8 }}>
            Lý do hủy buổi học <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <Input.TextArea
            rows={4}
            value={lessonCancelReason}
            onChange={e => setLessonCancelReason(e.target.value)}
            placeholder="VD: HLV bận việc cá nhân, học viên xin nghỉ, cần đổi sang buổi khác..."
            style={{ borderRadius: 8 }}
          />
        </div>
      </Modal>

      {/* Modal Hủy lịch */}
      <Modal
        title="Gửi yêu cầu hủy lịch tập luyện"
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        onOk={handleCancelSubmit}
        okText="Gửi yêu cầu hủy"
        okButtonProps={{ danger: true }}
        cancelText="Đóng"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ background: '#fdf2f8', border: '1px solid #f9a8d4', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloseCircleOutlined style={{ color: '#db2777', fontSize: 18 }} />
            <span style={{ color: '#be185d', fontSize: 13, fontWeight: 600 }}>
              Lịch sẽ chuyển sang màu hồng để đợi xác nhận. Khi được duyệt hủy, lịch mới chuyển sang màu đỏ.
            </span>
          </div>
          <label style={{ fontWeight: 600, fontSize: 13, color: '#374151', display: 'block', marginBottom: 8 }}>
            Lý do hủy <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <Input.TextArea 
            rows={4} 
            value={cancelReason} 
            onChange={e => setCancelReason(e.target.value)}
            placeholder="VD: Trùng lịch với lớp khác, HLV có việc bận, học viên yêu cầu đổi giờ..."
            style={{ borderRadius: 8 }}
          />
        </div>
      </Modal>

      {/* Modal Học Bù */}
      <Modal
        title="Đăng Ký Lịch Học Bù"
        open={makeupModalVisible}
        onCancel={() => setMakeupModalVisible(false)}
        onOk={() => makeupForm.submit()}
        okText="Đăng ký"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={makeupForm} layout="vertical" onFinish={handleMakeupSubmit}>
          <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <span style={{ color: '#0369a1', fontSize: 13, fontWeight: 600 }}>💡 Lưu ý: Lịch học bù sẽ được lên lịch vào 1 ngày duy nhất và không yêu cầu học viên đóng thêm lệ phí.</span>
          </div>
          <Form.Item name="id_thanhvien" label="Học viên" rules={[{ required: true, message: 'Vui lòng chọn học viên' }]}>
            <Select showSearch placeholder="Chọn học viên" optionFilterProp="children">
              {members.map(m => (
                <Option key={m.id_thanhvien} value={m.id_thanhvien}>{m.nguoiDung?.hoten} - {m.nguoiDung?.sdt}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="ngaytap" label="Ngày học bù" rules={[{ required: true, message: 'Vui lòng chọn ngày học bù' }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="buoi" label="Ca học bù" rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ca' }]}>
            <BoxSelector />
          </Form.Item>
          <Form.Item name="lydo" label="Lý do học bù" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
            <Input.TextArea rows={2} placeholder="Ví dụ: HLV bận việc cá nhân ngày 20/10 nên học bù vào ngày này..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

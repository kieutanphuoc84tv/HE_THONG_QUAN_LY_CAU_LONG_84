import React, { useState, useEffect } from 'react'
import CustomerLayout from '../../layouts/CustomerLayout'
import { Calendar, ChevronLeft, ChevronRight, User, AlertCircle, CheckCircle, X, MapPin, Clock } from 'lucide-react'
import api from '../../services/api'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'

// Hàm phân tích cú pháp ghi chú từ DB
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
  
  if (buoiSimple) {
    result.buoi = buoiSimple[1];
    result.gioStart = null;
    result.gioEnd = null;
  } else if (buoiNew) {
    result.buoi = buoiNew[1];
    result.gioStart = buoiNew[2];
    result.gioEnd = buoiNew[3] || null;
  }

  const ht = ghichu.match(/\[(Học theo nhóm cơ bản|Học nâng cao\/chuyên sâu|Kèm riêng \(1-1\))\]/);
  if (ht) result.hinhThuc = ht[1];

  const days = ghichu.match(/\[Ngày: ([^\]]+)\]/);
  if (days) result.ngayTrongTuan = days[1].split(',').map(d => d.trim());

  let clean = ghichu;
  if (ngayNghiMatch) ngayNghiMatch.forEach(m => { clean = clean.replace(m, ''); });
  if (isMakeup) clean = clean.replace(/\[HỌC BÙ\]\s*(Lý do:)?\s*/i, '');
  if (buoiSimple) clean = clean.replace(buoiSimple[0], '');
  else if (buoiNew) clean = clean.replace(buoiNew[0], '');
  if (ht) clean = clean.replace(ht[0], '');
  if (days) clean = clean.replace(days[0], '');
  result.cleanText = clean.trim();

  return result;
};

const extractTime = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    const timePart = dateStr.split('T')[1];
    return timePart.substring(0, 5);
  }
  return dayjs(dateStr).format('HH:mm');
};

const extractHour = (dateStr) => {
  const time = extractTime(dateStr);
  if (time) return parseInt(time.split(':')[0], 10);
  return 0;
};

const dayLabelsMap = {
  1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 0: 'CN'
};
const dayNamesMap = {
  1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 0: 'Chủ Nhật'
};

export default function MyTrainingsPage() {
  const [myTrainings, setMyTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState({ type: '', text: '' })
  
  // Khởi tạo tuần hiện tại (bắt đầu từ Thứ 2)
  const getStartOfWeek = (date) => {
    const d = dayjs(date);
    const day = d.day();
    const diff = day === 0 ? -6 : 1 - day; // Nếu là CN (0) thì trừ 6 ngày, còn lại trừ để ra thứ 2
    return d.add(diff, 'day').startOf('day');
  };
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(dayjs()));

  useEffect(() => {
    fetchMyTrainings()
  }, [])

  const fetchMyTrainings = async () => {
    try {
      const res = await api.get('/training/my')
      setMyTrainings(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Tạo danh sách 7 ngày trong tuần
  const weekDays = Array.from({ length: 7 }).map((_, i) => currentWeekStart.add(i, 'day'));

  const nextWeek = () => setCurrentWeekStart(prev => prev.add(7, 'day'));
  const prevWeek = () => setCurrentWeekStart(prev => prev.subtract(7, 'day'));
  const currentWeek = () => setCurrentWeekStart(getStartOfWeek(dayjs()));

  // Lấy các lớp học tương ứng với 1 ô (Ngày cụ thể + Buổi Sáng/Chiều)
  const getClassesForCell = (date, sessionType) => {
    return myTrainings.filter(t => {
      if (!t.ngaytap) return false; // Chưa xếp lịch thì không hiện trên TKB
      const start = dayjs(t.ngaytap);
      const end = t.ngayketthuc ? dayjs(t.ngayketthuc) : start;

      // 1. Nằm trong khoảng thời gian khoá học
      if (date.isBefore(start, 'day') || date.isAfter(end, 'day')) return false;

      const info = parseGhichu(t.ghichu);
      const dayLabel = dayLabelsMap[date.day()];
      
      // 2. Có đúng ngày trong tuần không?
      if (info.isMakeup) {
        // Học bù chỉ diễn ra đúng 1 ngày
        if (!date.isSame(start, 'day')) return false;
      } else {
        // Lớp thường
        if (info.ngayTrongTuan && !info.ngayTrongTuan.includes(dayLabel)) return false;
        // Fallback: nếu không ghi rõ ngày trong tuần, tạm thời chỉ hiện vào ngày bắt đầu
        if (!info.ngayTrongTuan && !date.isSame(start, 'day')) return false;
      }

      // 3. Có đúng Buổi Sáng/Chiều không?
      const tSession = info.buoi || (t.giobatdau && extractHour(t.giobatdau) < 12 ? 'Sáng' : 'Chiều');
      if (tSession === 'Cả Hai') return true; // Hiển thị trên cả 2 lịch
      if (tSession !== sessionType) return false;

      return true;
    });
  };

  // Hàm Render 1 Thẻ Lớp Học
  const renderClassCard = (t, sessionType, date) => {
    const info = parseGhichu(t.ghichu);
    const dateStr = date ? date.format('YYYY-MM-DD') : null;
    const isCancelled = t.trangthai === 'Đã hủy' || (info.ngayNghi && info.ngayNghi.includes(dateStr));
    const isMakeup = info.isMakeup;
    
    // Style tuỳ theo buổi
    const bgColors = {
      Sáng: isCancelled ? '#f1f5f9' : (isMakeup ? '#fef3c7' : '#eff6ff'),
      Chiều: isCancelled ? '#f1f5f9' : (isMakeup ? '#fef3c7' : '#ecfdf5')
    };
    const borderColors = {
      Sáng: isCancelled ? '#e2e8f0' : (isMakeup ? '#f59e0b' : '#3b82f6'),
      Chiều: isCancelled ? '#e2e8f0' : (isMakeup ? '#f59e0b' : '#10b981')
    };
    const headerColors = {
      Sáng: isCancelled ? '#94a3b8' : (isMakeup ? '#d97706' : '#2563eb'),
      Chiều: isCancelled ? '#94a3b8' : (isMakeup ? '#d97706' : '#059669')
    };

    return (
      <div key={t.id_lichtapluyen} style={{ 
        position: 'relative',
        background: bgColors[sessionType], 
        border: `2px solid ${borderColors[sessionType]}`, 
        borderRadius: 8, 
        padding: '10px 12px',
        marginBottom: 8,
        opacity: isCancelled ? 0.7 : 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {/* Dấu X siêu to nếu bị huỷ */}
        {isCancelled && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.15, pointerEvents: 'none' }}>
            <X size={80} color="#ef4444" strokeWidth={3} />
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontWeight: 800, color: headerColors[sessionType], fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>{isMakeup ? '💡 HỌC BÙ' : (info.hinhThuc || 'Lịch Tập')}</span>
          </div>
          
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
            {info.gioStart || (t.giobatdau ? extractTime(t.giobatdau) : '?')} 
            {' - '}
            {info.gioEnd || (t.gioketthuc ? extractTime(t.gioketthuc) : '?')}
          </div>

          <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <User size={14} color={headerColors[sessionType]} />
            <span style={{ fontWeight: 600 }}>HLV: {t.hlv?.hoten || 'N/A'}</span>
          </div>

          {info.cleanText && (
            <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
              📝 {info.cleanText}
            </div>
          )}

          {isCancelled && (
            <div style={{ marginTop: 8, padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', borderRadius: 4, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
              ĐÃ HỦY / VẮNG
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Calendar size={28} color="#3b82f6" />
              THỜI KHÓA BIỂU CÁ NHÂN
            </h1>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 15 }}>Theo dõi lịch học tập cầu lông hàng tuần của bạn</p>
          </div>
          <Link to="/training" style={{ background: '#3b82f6', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
            + Đăng ký khóa mới
          </Link>
        </div>

        {/* Toolbar & Week Navigation */}
        <div style={{ background: '#fff', padding: '16px 24px', borderRadius: '16px 16px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          
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
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: 3 }}></div> Buổi Sáng</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#ecfdf5', border: '2px solid #10b981', borderRadius: 3 }}></div> Buổi Chiều</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 3 }}></div> Học Bù</span>
          </div>
        </div>

        {/* Timetable Grid */}
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
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
                      padding: '16px 8px', 
                      borderRight: '1px solid #e2e8f0', 
                      borderBottom: `2px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`,
                      background: isToday ? '#eff6ff' : '#f8fafc',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: isToday ? '#2563eb' : '#0f172a' }}>{dayNamesMap[date.day()]}</div>
                      <div style={{ fontSize: 13, color: isToday ? '#3b82f6' : '#64748b', fontWeight: 600, marginTop: 4 }}>{date.format('DD/MM')}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              
              {/* ROW: BUỔI SÁNG */}
              <tr>
                <td style={{ padding: 16, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center', verticalAlign: 'middle' }}>
                  <div style={{ fontWeight: 800, color: '#d97706', fontSize: 15 }}>SÁNG</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>(06:00 - 12:00)</div>
                </td>
                {weekDays.map(date => {
                  const classes = getClassesForCell(date, 'Sáng');
                  return (
                    <td key={`sang-${date.format()}`} style={{ padding: 8, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', background: classes.length > 0 ? '#fff' : '#fcfcfc' }}>
                      {classes.map(t => renderClassCard(t, 'Sáng', date))}
                    </td>
                  )
                })}
              </tr>

              {/* ROW: BUỔI CHIỀU */}
              <tr>
                <td style={{ padding: 16, borderRight: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center', verticalAlign: 'middle' }}>
                  <div style={{ fontWeight: 800, color: '#4f46e5', fontSize: 15 }}>CHIỀU</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>(13:00 - 22:00)</div>
                </td>
                {weekDays.map(date => {
                  const classes = getClassesForCell(date, 'Chiều');
                  return (
                    <td key={`chieu-${date.format()}`} style={{ padding: 8, borderRight: '1px solid #e2e8f0', verticalAlign: 'top', background: classes.length > 0 ? '#fff' : '#fcfcfc' }}>
                      {classes.map(t => renderClassCard(t, 'Chiều', date))}
                    </td>
                  )
                })}
              </tr>

            </tbody>
          </table>
        </div>

      </div>
    </CustomerLayout>
  )
}

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock } from 'lucide-react';
import './AdminScheduleCalendar.css';

const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAYS_FULL = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const MONTHS_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const STATUS_COLORS = {
  'Đã chốt lịch': { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  'Chờ xếp lịch': { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  'Đợi xác nhận': { bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6' },
  'Đã hoàn thành': { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  'Đã hủy': { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  'Chờ xác nhận hủy': { bg: '#fce7f3', color: '#9d174d', dot: '#ec4899' },
  'Hoàn thành': { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
};

const getStatusColor = (status) => STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };

function parseTime(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    if (/^\d{2}:\d{2}/.test(val)) return val.slice(0, 5);
    if (val.includes('T')) return val.split('T')[1].slice(0, 5);
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toTimeString().slice(0, 5);
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  // Pad đầu tháng
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, inMonth: false });
  }
  // Ngày trong tháng
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), inMonth: true });
  }
  // Pad cuối tháng cho đủ hàng
  while (days.length % 7 !== 0) {
    const d = new Date(year, month + 1, days.length - startDow - lastDay.getDate() + 1);
    days.push({ date: d, inMonth: false });
  }
  return days;
}

export default function AdminScheduleCalendar({ schedules, onEditSchedule, getScheduleCoach, getScheduleStudent }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  // Gom lịch theo ngày
  const schedulesByDate = useMemo(() => {
    const map = {};
    schedules.forEach(item => {
      const d = new Date(item.ngaytap || Date.now());
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [schedules]);

  const goMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDay(null);
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const getSchedulesForDay = (date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return schedulesByDate[key] || [];
  };

  const selectedSchedules = selectedDay ? getSchedulesForDay(selectedDay) : [];

  return (
    <div className="custom-cal">
      {/* Header */}
      <div className="custom-cal__header">
        <div className="custom-cal__nav">
          <button type="button" onClick={() => goMonth(-1)} className="custom-cal__nav-btn">
            <ChevronLeft size={18} />
          </button>
          <h2 className="custom-cal__title">
            <CalendarIcon size={18} />
            {MONTHS_VI[month]} {year}
          </h2>
          <button type="button" onClick={() => goMonth(1)} className="custom-cal__nav-btn">
            <ChevronRight size={18} />
          </button>
        </div>
        <button type="button" onClick={goToday} className="custom-cal__today-btn">
          Hôm nay
        </button>
      </div>

      {/* Weekday headers */}
      <div className="custom-cal__weekdays">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
          <div key={d} className="custom-cal__weekday">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="custom-cal__grid">
        {days.map(({ date, inMonth }, idx) => {
          const daySchedules = getSchedulesForDay(date);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDay && isSameDay(date, selectedDay);
          const hasEvents = daySchedules.length > 0;

          return (
            <div
              key={idx}
              className={`custom-cal__cell ${!inMonth ? 'custom-cal__cell--dim' : ''} ${isToday ? 'custom-cal__cell--today' : ''} ${isSelected ? 'custom-cal__cell--selected' : ''} ${hasEvents ? 'custom-cal__cell--has-events' : ''}`}
              onClick={() => setSelectedDay(date)}
            >
              <div className="custom-cal__date-num">
                {isToday ? (
                  <span className="custom-cal__today-badge">{date.getDate()}</span>
                ) : (
                  date.getDate()
                )}
              </div>

              {/* Hiển thị tối đa 3 sự kiện */}
              <div className="custom-cal__events">
                {daySchedules.slice(0, 3).map((item, i) => {
                  const sc = getStatusColor(item.trangthai);
                  return (
                    <div
                      key={item.id_lichtapluyen || i}
                      className="custom-cal__event-dot"
                      style={{ background: sc.bg, color: sc.color, borderLeft: `3px solid ${sc.dot}` }}
                      onClick={(e) => { e.stopPropagation(); onEditSchedule(item); }}
                      title={`${getScheduleCoach(item)} → ${getScheduleStudent(item)}`}
                    >
                      <span className="custom-cal__event-text">
                        {getScheduleCoach(item).split(' ').slice(-1)[0]}
                      </span>
                    </div>
                  );
                })}
                {daySchedules.length > 3 && (
                  <div className="custom-cal__more">+{daySchedules.length - 3} nữa</div>
                )}
              </div>

              {/* Badge số lượng */}
              {hasEvents && (
                <div className="custom-cal__count">{daySchedules.length}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chi tiết ngày đã chọn */}
      {selectedDay && (
        <div className="custom-cal__detail">
          <div className="custom-cal__detail-header">
            <h3>
              📅 {DAYS_FULL[selectedDay.getDay()]} — {selectedDay.getDate()}/{selectedDay.getMonth() + 1}/{selectedDay.getFullYear()}
            </h3>
            <span className="custom-cal__detail-count">
              {selectedSchedules.length} buổi học
            </span>
          </div>

          {selectedSchedules.length === 0 ? (
            <div className="custom-cal__detail-empty">
              Không có buổi học nào trong ngày này
            </div>
          ) : (
            <div className="custom-cal__detail-grid">
              {selectedSchedules.map((item, i) => {
                const sc = getStatusColor(item.trangthai);
                const timeStart = parseTime(item.giobatdau);
                const timeEnd = parseTime(item.gioketthuc);
                return (
                  <div
                    key={item.id_lichtapluyen || i}
                    className="custom-cal__card"
                    style={{ borderLeft: `4px solid ${sc.dot}` }}
                    onClick={() => onEditSchedule(item)}
                  >
                    <div className="custom-cal__card-top">
                      <div className="custom-cal__card-coach">
                        <div className="custom-cal__card-avatar" style={{ background: `linear-gradient(135deg, ${sc.dot}, ${sc.color})` }}>
                          {getScheduleCoach(item).charAt(0)}
                        </div>
                        <div>
                          <div className="custom-cal__card-name">{getScheduleCoach(item)}</div>
                          <div className="custom-cal__card-role">Huấn luyện viên</div>
                        </div>
                      </div>
                      <span className="custom-cal__card-status" style={{ background: sc.bg, color: sc.color }}>
                        {item.trangthai || 'Chờ xếp lịch'}
                      </span>
                    </div>

                    <div className="custom-cal__card-info">
                      <div className="custom-cal__card-row">
                        <User size={14} />
                        <span>Học viên: <strong>{getScheduleStudent(item)}</strong></span>
                      </div>
                      {(timeStart || timeEnd) && (
                        <div className="custom-cal__card-row">
                          <Clock size={14} />
                          <span>{timeStart || '??:??'} — {timeEnd || '??:??'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

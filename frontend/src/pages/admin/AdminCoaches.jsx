import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Trash2, Edit2, Search, Check, Shield, CalendarDays, AlertTriangle, Bell, RefreshCw, Clock, X } from 'lucide-react';
import api from '../../services/api';
import styles from './AdminCRUD.module.css';
import AdminScheduleCalendar from '../../components/AdminScheduleCalendar';

const formatDate = (value) => {
  if (!value) return 'Chưa xếp';
  return new Date(value).toLocaleDateString('vi-VN');
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const toTimeInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
    if (value.includes('T')) return value.split('T')[1].slice(0, 5);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(11, 16);
};

const parseCurrencyInput = (value) => {
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
};

const formatCurrencyInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return String(Math.round(number)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const normalizeStatus = (status = '') => String(status || '').toLowerCase().replace(/huỷ/g, 'hủy');
const isCancellationPending = (status = '') => {
  const text = normalizeStatus(status);
  return text.includes('chờ') && text.includes('xác nhận') && text.includes('hủy');
};
const isConfirmedCancelled = (status = '') => {
  const text = normalizeStatus(status);
  return text.includes('đã') && text.includes('hủy');
};
const isCancellationLike = (status = '') => isCancellationPending(status) || isConfirmedCancelled(status);
const isScheduleConfirmPending = (status = '') => {
  const text = normalizeStatus(status);
  return (text.includes('đợi') || text.includes('chờ')) && text.includes('xác nhận') && !text.includes('hủy');
};

const statusStyle = (status = '') => {
  if (status === 'Đã chốt lịch') return { background: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' };
  if (isScheduleConfirmPending(status)) return { background: '#ede9fe', color: '#6d28d9', border: '#c4b5fd' };
  if (status === 'Chờ xếp lịch') return { background: '#fef3c7', color: '#92400e', border: '#fde68a' };
  if (isCancellationPending(status)) return { background: '#fdf2f8', color: '#be185d', border: '#f9a8d4' };
  if (isConfirmedCancelled(status)) return { background: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
  return { background: '#e0f2fe', color: '#075985', border: '#bae6fd' };
};

const isCancelled = (status = '') => {
  return isConfirmedCancelled(status);
};

const getScheduleCoach = (item) => item.coachName || item.hlv?.hoten || item.hlv?.tendangnhap || 'HLV chưa rõ';
const getScheduleStudent = (item) => item.studentName || item.thanhVien?.nguoiDung?.hoten || item.thanhVien?.nguoiDung?.tendangnhap || 'Học viên chưa rõ';

function CoachModal({ coach, onClose, onSave }) {
  const [form, setForm] = useState(
    coach || { id_nguoidung: '', hoten: '', email: '', sdt: '', tendangnhap: '', matkhau: '' }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (form.id_nguoidung) {
        await api.put(`/admin/coaches/${form.id_nguoidung}`, form);
      } else {
        await api.post('/admin/coaches', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const inp = { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: '"Be Vietnam Pro", sans-serif' };
  const lbl = { fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6, display: 'block', textTransform: 'uppercase' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 540, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {coach ? <Edit2 size={20} /> : <Plus size={20} />}
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
            {coach ? 'Chỉnh sửa Huấn luyện viên' : 'Thêm Huấn luyện viên mới'}
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                ⚠️ {error}
              </div>
            )}
            <div>
              <label style={lbl}>Họ tên</label>
              <input required type="text" value={form.hoten} onChange={e => setForm({...form, hoten: e.target.value})} style={inp} placeholder="VD: Nguyễn Văn A"/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lbl}>Tên đăng nhập</label>
                <input type="text" autoComplete="off" value={form.tendangnhap} onChange={e => setForm({...form, tendangnhap: e.target.value})} placeholder="Tự tạo nếu để trống" style={inp} />
              </div>
              <div>
                <label style={lbl}>Mật khẩu</label>
                <input type="password" autoComplete="new-password" required={!form.id_nguoidung} value={form.matkhau} onChange={e => setForm({...form, matkhau: e.target.value})} placeholder={form.id_nguoidung ? '*** (Bỏ trống để giữ nguyên)' : 'Mặc định: 123456'} style={inp} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lbl}>Email</label>
                <input required type="email" autoComplete="off" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inp} placeholder="VD: email@gmail.com"/>
              </div>
              <div>
                <label style={lbl}>Số điện thoại</label>
                <input type="text" autoComplete="off" value={form.sdt} onChange={e => setForm({...form, sdt: e.target.value})} style={inp} placeholder="VD: 0988..."/>
              </div>
            </div>
          </div>
          <div style={{ padding: '16px 28px 24px', display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' }}>Hủy bỏ</button>
            <button type="submit" disabled={saving} style={{ padding: '10px 28px', borderRadius: 12, border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
              {saving ? '⏳ Đang lưu...' : <><Check size={16}/> Lưu thông tin</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScheduleModal({ schedule, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ngaytap: toDateInput(schedule.ngaytap),
    ngayketthuc: toDateInput(schedule.ngayketthuc),
    giobatdau: toTimeInput(schedule.giobatdau),
    gioketthuc: toTimeInput(schedule.gioketthuc),
    lephi: formatCurrencyInput(schedule.lephi),
    trangthai: schedule.trangthai || 'Chờ xếp lịch',
    ghichu: schedule.ghichu || schedule.cleanNote || '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/coaches/schedules/${schedule.id_lichtapluyen}`, {
        ngaytap: form.ngaytap || null,
        ngayketthuc: form.ngayketthuc || null,
        giobatdau: form.giobatdau || null,
        gioketthuc: form.gioketthuc || null,
        lephi: parseCurrencyInput(form.lephi),
        trangthai: form.trangthai,
        ghichu: form.ghichu,
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi sửa lịch dạy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ width: 640 }}>
        <div className={styles.modalHead}>
          <h3>Sửa lịch dạy</h3>
          <button type="button" onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, fontWeight: 700 }}>
                {error}
              </div>
            )}

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Huấn luyện viên</label>
                <input className={styles.fieldInput} value={getScheduleCoach(schedule)} disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Học viên</label>
                <input className={styles.fieldInput} value={getScheduleStudent(schedule)} disabled />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Ngày bắt đầu</label>
                <input type="date" className={styles.fieldInput} value={form.ngaytap} onChange={e => setField('ngaytap', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Ngày kết thúc</label>
                <input type="date" className={styles.fieldInput} value={form.ngayketthuc} onChange={e => setField('ngayketthuc', e.target.value)} />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Giờ bắt đầu</label>
                <input type="time" className={styles.fieldInput} value={form.giobatdau} onChange={e => setField('giobatdau', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Giờ kết thúc</label>
                <input type="time" className={styles.fieldInput} value={form.gioketthuc} onChange={e => setField('gioketthuc', e.target.value)} />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Lệ phí</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.lephi}
                  onChange={e => setField('lephi', e.target.value)}
                  onBlur={() => setField('lephi', formatCurrencyInput(parseCurrencyInput(form.lephi)))}
                  placeholder="Ví dụ: 150.000"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Trạng thái</label>
                <select className={styles.fieldInput} value={form.trangthai} onChange={e => setField('trangthai', e.target.value)}>
                  {['Chờ xếp lịch', 'Đợi xác nhận', 'Đã chốt lịch', 'Chờ xác nhận hủy', 'Đã hủy', 'Hoàn thành'].map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Ghi chú</label>
              <textarea
                className={styles.fieldInput}
                rows={4}
                value={form.ghichu}
                onChange={e => setField('ghichu', e.target.value)}
                placeholder="Ghi chú cho lịch dạy"
              />
            </div>
          </div>

          <div className={styles.modalFoot}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Đang lưu...' : <><Check size={15} /> Lưu lịch</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScheduleStats({ summary, schedules }) {
  const fallback = {
    total: schedules.length,
    pending: schedules.filter(item => item.trangthai === 'Chờ xếp lịch' || isScheduleConfirmPending(item.trangthai)).length,
    absences: schedules.filter(item => isCancellationLike(item.trangthai) || item.absenceDates?.length).length,
    conflicts: schedules.filter(item => item.conflicts?.length).length,
  };
  const stats = summary || fallback;
  const cards = [
    { label: 'Tổng lịch dạy', value: stats.total || 0, icon: CalendarDays, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Chờ xác nhận', value: stats.pending || 0, icon: Clock, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'HLV báo nghỉ', value: stats.absences || 0, icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Lịch bị trùng', value: stats.conflicts || 0, icon: Bell, color: '#7c3aed', bg: '#f5f3ff' },
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div className={styles.statCard} key={label}>
          <div className={styles.statIcon} style={{ background: bg, color }}>
            <Icon size={22} />
          </div>
          <div className={styles.statValue}>{value}</div>
          <div className={styles.statLabel}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function AdminScheduleTable({ schedules, summary, loading, onRefresh, onNotifyConflict, onStatusChange, onEditSchedule, onDeleteSchedule }) {
  const statusOptions = ['Chờ xếp lịch', 'Đợi xác nhận', 'Đã chốt lịch', 'Chờ xác nhận hủy', 'Đã hủy', 'Hoàn thành'];
  const [notifiedIds, setNotifiedIds] = useState(new Set());

  const handleNotify = async (item) => {
    await onNotifyConflict(item);
    setNotifiedIds(prev => new Set(prev).add(item.id_lichtapluyen));
  };

  if (loading) {
    return (
      <div className={styles.tableCard}>
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div style={{ fontWeight: 700 }}>Đang tải lịch dạy huấn luyện viên...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScheduleStats summary={summary} schedules={schedules} />

      <div className={styles.tableCard}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Lịch dạy & cảnh báo</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 600 }}>
              Theo dõi buổi HLV báo nghỉ và các lịch trùng giữa nhiều huấn luyện viên.
            </div>
          </div>
          <button type="button" className={styles.btnSecondary} onClick={onRefresh}>
            <RefreshCw size={15} /> Làm mới
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <div className={styles.emptyTitle}>Chưa có lịch dạy nào</div>
            <div className={styles.emptyDesc}>Khi HLV xếp lịch tập, admin sẽ xem được tại đây.</div>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Huấn luyện viên</th>
                  <th>Học viên</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Cảnh báo</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(item => {
                  const status = item.trangthai || 'Chờ xếp lịch';
                  const badge = statusStyle(status);
                  const pendingScheduleConfirm = isScheduleConfirmPending(status);
                  const pendingLessonCancels = Object.keys(item.pendingLessonCancels || {});
                  const pendingCancel = isCancellationPending(status) || pendingLessonCancels.length > 0;
                  const confirmedCancel = isCancelled(status);
                  const hasAbsence = pendingCancel || confirmedCancel || item.absenceDates?.length > 0;
                  const firstConflict = item.conflicts?.[0];
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const isPastOrToday = new Date(item.ngaytap) <= today;
                  return (
                    <tr key={item.id_lichtapluyen}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #10b981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                            {getScheduleCoach(item).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{getScheduleCoach(item)}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{item.hlv?.sdt || item.hlv?.email || 'Chưa cập nhật liên hệ'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{getScheduleStudent(item)}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.thanhVien?.nguoiDung?.sdt || item.thanhVien?.nguoiDung?.email || 'Học viên CLB'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.dateRange || formatDate(item.ngaytap)}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          <span style={{ padding: '3px 8px', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 800 }}>
                            {item.timeRange || 'Chưa xếp giờ'}
                          </span>
                          {(item.daysOfWeek || []).map(day => (
                            <span key={day} style={{ padding: '3px 7px', borderRadius: 999, background: '#f8fafc', color: '#64748b', fontSize: 11, fontWeight: 800, border: '1px solid #e2e8f0' }}>{day}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <select
                          value={status}
                          onChange={e => onStatusChange(item, e.target.value)}
                          style={{
                            padding: '7px 10px',
                            borderRadius: 10,
                            border: `1.5px solid ${badge.border}`,
                            background: badge.background,
                            color: badge.color,
                            fontWeight: 800,
                            fontSize: 12,
                            outline: 'none',
                            fontFamily: '"Be Vietnam Pro", sans-serif',
                          }}
                        >
                          {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 220 }}>
                          {pendingScheduleConfirm && (
                            <div style={{
                              padding: '8px 10px',
                              borderRadius: 10,
                              background: '#f5f3ff',
                              color: '#6d28d9',
                              border: '1px solid #c4b5fd',
                              fontSize: 12,
                              fontWeight: 800,
                              lineHeight: 1.45
                            }}>
                              HLV tạo lịch - đợi xác nhận
                            </div>
                          )}
                          {hasAbsence && (
                            <div style={{
                              padding: '8px 10px',
                              borderRadius: 10,
                              background: pendingCancel ? '#fdf2f8' : '#fef2f2',
                              color: pendingCancel ? '#be185d' : '#991b1b',
                              border: pendingCancel ? '1px solid #f9a8d4' : '1px solid #fecaca',
                              fontSize: 12,
                              fontWeight: 700,
                              lineHeight: 1.45
                            }}>
                              {pendingCancel ? 'Yêu cầu hủy - đợi xác nhận' : confirmedCancel ? 'HLV hủy đã xác nhận' : 'HLV báo nghỉ'}
                              {item.absenceDates?.length ? `: ${item.absenceDates.map(formatDate).join(', ')}` : ''}
                              {item.absenceDates?.map(date => item.lessonCancelReasons?.[date] ? (
                                <div key={date} style={{ fontWeight: 600, marginTop: 3 }}>
                                  {formatDate(date)}: {item.lessonCancelReasons[date]}
                                </div>
                              ) : null)}
                              {pendingLessonCancels.length > 0 && pendingLessonCancels.map(date => (
                                <div key={`pending-${date}`} style={{ fontWeight: 600, marginTop: 3, color: '#be185d' }}>
                                  Yêu cầu hủy {formatDate(date)}: {item.pendingLessonCancels[date]}
                                </div>
                              ))}
                              {item.cancelReason ? <div style={{ fontWeight: 600, marginTop: 3 }}>Lý do hủy toàn bộ lịch: {item.cancelReason}</div> : null}
                            </div>
                          )}
                          {item.conflicts?.length > 0 && (
                            <div style={{ padding: '8px 10px', borderRadius: 10, background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', fontSize: 12, fontWeight: 700, lineHeight: 1.45 }}>
                              Trùng với {item.conflicts.slice(0, 2).map(c => c.coachName).join(', ')}
                              <div style={{ fontWeight: 600, marginTop: 3 }}>
                                {firstConflict?.dateRange} · {firstConflict?.timeRange}
                              </div>
                            </div>
                          )}
                          {!pendingScheduleConfirm && !hasAbsence && !item.conflicts?.length && (
                            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Không có cảnh báo</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                          {pendingScheduleConfirm && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(item, 'Đã chốt lịch')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1.5px solid #93c5fd',
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                fontWeight: 900,
                                fontSize: 12,
                                cursor: 'pointer',
                                fontFamily: '"Be Vietnam Pro", sans-serif',
                              }}
                              title="Admin xác nhận lịch HLV đã tạo"
                            >
                              <Check size={14} /> Xác nhận lịch
                            </button>
                          )}
                          {pendingCancel && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(item, 'Đã hủy')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1.5px solid #fca5a5',
                                background: '#fee2e2',
                                color: '#991b1b',
                                fontWeight: 900,
                                fontSize: 12,
                                cursor: 'pointer',
                                fontFamily: '"Be Vietnam Pro", sans-serif',
                              }}
                              title="Admin xác nhận hủy lịch"
                            >
                              <Check size={14} /> Xác nhận hủy
                            </button>
                          )}
                          {pendingLessonCancels.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleApproveLessonCancel(item)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1.5px solid #fca5a5',
                                background: '#fee2e2',
                                color: '#991b1b',
                                fontWeight: 900,
                                fontSize: 12,
                                cursor: 'pointer',
                                fontFamily: '"Be Vietnam Pro", sans-serif',
                              }}
                              title="Duyệt yêu cầu hủy buổi học"
                            >
                              <Check size={14} /> Duyệt hủy buổi
                            </button>
                          )}
                          {item.trangthai === 'Hoàn thành' ? (
                            <button
                              type="button"
                              onClick={() => onStatusChange(item, 'Đã chốt lịch')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1.5px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#475569',
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: 'pointer',
                                fontFamily: '"Be Vietnam Pro", sans-serif',
                              }}
                              title="Hủy đánh dấu hoàn thành"
                            >
                              <Check size={14} /> Chưa xong
                            </button>
                          ) : isPastOrToday && !pendingScheduleConfirm && !hasAbsence && item.trangthai === 'Đã chốt lịch' ? (
                            <button
                              type="button"
                              onClick={() => onStatusChange(item, 'Hoàn thành')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1.5px solid #6ee7b7',
                                background: '#d1fae5',
                                color: '#059669',
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: 'pointer',
                                fontFamily: '"Be Vietnam Pro", sans-serif',
                              }}
                              title="Đánh dấu đã dạy xong"
                            >
                              <Check size={14} /> Hoàn thành
                            </button>
                          ) : null}

                          {notifiedIds.has(item.id_lichtapluyen) ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1.5px solid #bbf7d0',
                                background: '#f0fdf4',
                                color: '#16a34a',
                                fontWeight: 800,
                                fontSize: 12,
                                fontFamily: '"Be Vietnam Pro", sans-serif',
                              }}
                            >
                              <Check size={14} /> Đã báo
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={!item.id_hlv}
                              onClick={() => handleNotify(item)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: item.id_hlv ? (item.conflicts?.length ? '1.5px solid #fed7aa' : '1.5px solid #bae6fd') : '1.5px solid #e2e8f0',
                                background: item.id_hlv ? (item.conflicts?.length ? '#fff7ed' : '#f0f9ff') : '#f8fafc',
                                color: item.id_hlv ? (item.conflicts?.length ? '#ea580c' : '#0369a1') : '#94a3b8',
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: item.id_hlv ? 'pointer' : 'not-allowed',
                                fontFamily: '"Be Vietnam Pro", sans-serif',
                              }}
                              title={item.id_hlv ? 'Gửi thông báo cho HLV' : 'Lịch này chưa có HLV'}
                            >
                              <Bell size={14} /> Báo HLV
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => onEditSchedule(item)}
                            title="Sửa lịch dạy"
                          >
                            <Edit2 size={14} /> Sửa
                          </button>
                          <button
                            type="button"
                            className={styles.delBtn}
                            onClick={() => onDeleteSchedule(item)}
                            title="Xóa lịch dạy"
                            style={{ padding: '8px 10px', gap: 5, fontWeight: 800 }}
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminCoaches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'schedules' ? 'schedules' : 'coaches');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [coachSchedules, setCoachSchedules] = useState([]);
  const [scheduleSummary, setScheduleSummary] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coaches');
      setCoaches(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSchedules = async () => {
    setScheduleLoading(true);
    try {
      const res = await api.get('/admin/coaches/schedules');
      const data = Array.isArray(res.data) ? res.data : (res.data.schedules || []);
      setCoachSchedules(data);
      setScheduleSummary(res.data.summary || null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Lỗi tải lịch dạy HLV');
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
    fetchSchedules();
  }, []);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') === 'schedules' ? 'schedules' : 'coaches');
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'schedules' ? { tab: 'schedules' } : {});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa HLV này khỏi hệ thống? Dữ liệu lịch dạy có thể bị ảnh hưởng!')) return;
    try {
      await api.delete(`/admin/coaches/${id}`);
      setCoaches(prev => prev.filter(c => c.id_nguoidung !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi xóa HLV');
    }
  };

  const handleOpenAdd = () => {
    setEditingCoach(null);
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCoach({ ...c, matkhau: '' });
    setShowModal(true);
  };

  const handleSaveDone = () => {
    setShowModal(false);
    fetchCoaches();
  };

  const handleNotifyConflict = async (schedule) => {
    const conflict = schedule.conflicts?.[0];
    try {
      await api.post(`/admin/coaches/schedules/${schedule.id_lichtapluyen}/notify-conflict`, {
        conflictId: conflict?.id_lichtapluyen,
      });
      alert(conflict
        ? `Đã báo ${getScheduleCoach(schedule)} về lịch trùng với ${conflict.coachName}.`
        : `Đã gửi thông báo lịch dạy cho ${getScheduleCoach(schedule)}.`
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi gửi thông báo cho HLV');
    }
  };

  const handleStatusChange = async (schedule, status) => {
    try {
      await api.put(`/admin/coaches/schedules/${schedule.id_lichtapluyen}/status`, { trangthai: status });
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi cập nhật trạng thái lịch');
    }
  };

  const handleApproveLessonCancel = async (schedule) => {
    try {
      let updatedGhichu = schedule.ghichu || '';
      const choHuyMatches = [...updatedGhichu.matchAll(/\[CHO_HUY_BUOI:\s*([^|\]]+)\|\s*([^\]]+)\]/gi)];
      for (const m of choHuyMatches) {
        updatedGhichu = updatedGhichu.replace(m[0], `[NGAY_NGHI: ${m[1].trim()}] [LÝ DO HỦY BUỔI: ${m[1].trim()} | ${m[2].trim()}]`);
      }
      
      await api.put(`/admin/coaches/schedules/${schedule.id_lichtapluyen}`, {
        ngaytap: schedule.ngaytap ? new Date(schedule.ngaytap).toISOString().split('T')[0] : null,
        ngayketthuc: schedule.ngayketthuc ? new Date(schedule.ngayketthuc).toISOString().split('T')[0] : null,
        giobatdau: schedule.giobatdau || null,
        gioketthuc: schedule.gioketthuc || null,
        lephi: schedule.lephi || 0,
        trangthai: schedule.trangthai,
        ghichu: updatedGhichu,
      });
      alert('Đã duyệt yêu cầu hủy buổi học!');
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi duyệt hủy buổi học');
    }
  };

  const handleScheduleSaveDone = () => {
    setEditingSchedule(null);
    fetchSchedules();
  };

  const handleDeleteSchedule = async (schedule) => {
    const message = `Bạn có chắc muốn xóa lịch dạy của ${getScheduleCoach(schedule)} (${schedule.dateRange || formatDate(schedule.ngaytap)} - ${schedule.timeRange || 'chưa xếp giờ'})?`;
    if (!window.confirm(message)) return;

    try {
      await api.delete(`/admin/coaches/schedules/${schedule.id_lichtapluyen}`);
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi xóa lịch dạy');
    }
  };

  const filtered = coaches.filter(c => 
    c.hoten?.toLowerCase().includes(search.toLowerCase()) || 
    c.tendangnhap?.toLowerCase().includes(search.toLowerCase()) ||
    c.sdt?.includes(search)
  );

  const filteredSchedules = coachSchedules.filter(item => {
    const keyword = search.toLowerCase();
    return (
      getScheduleCoach(item).toLowerCase().includes(keyword) ||
      getScheduleStudent(item).toLowerCase().includes(keyword) ||
      item.trangthai?.toLowerCase().includes(keyword) ||
      item.timeRange?.toLowerCase().includes(keyword) ||
      item.dateRange?.toLowerCase().includes(keyword)
    );
  });

  return (
    <AdminLayout title="Quản lý Huấn luyện viên">
      <div className={styles.page}>

        {/* Toolbar */}
        <div className={styles.toolbar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'coaches' ? styles.tabActive : ''}`}
                onClick={() => handleTabChange('coaches')}
              >
                Danh sách HLV
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'schedules' ? styles.tabActive : ''}`}
                onClick={() => handleTabChange('schedules')}
              >
                Lịch dạy
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                placeholder={activeTab === 'coaches' ? 'Tìm tên, SĐT, username...' : 'Tìm HLV, học viên, trạng thái...'} 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', outline: 'none', width: 280, fontFamily: '"Be Vietnam Pro", sans-serif', transition: 'border-color 0.2s' }} 
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>
          {activeTab === 'coaches' ? (
            <button 
              onClick={handleOpenAdd} 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
            >
              <Plus size={16}/> Thêm HLV mới
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 12, border: '1.5px solid #e2e8f0' }}>
                <button 
                  type="button" 
                  onClick={() => setViewMode('list')}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#10b981' : '#64748b', boxShadow: viewMode === 'list' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                  Danh sách
                </button>
                <button 
                  type="button" 
                  onClick={() => setViewMode('calendar')}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none', background: viewMode === 'calendar' ? '#fff' : 'transparent', color: viewMode === 'calendar' ? '#10b981' : '#64748b', boxShadow: viewMode === 'calendar' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                >
                  Lịch (Dạng ô)
                </button>
              </div>
              <button type="button" onClick={fetchSchedules} className={styles.btnPrimary}>
                <RefreshCw size={15}/> Cập nhật
              </button>
            </div>
          )}
        </div>

        {activeTab === 'coaches' ? (
          <div className={styles.tableCard}>
            {loading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                <div style={{ fontWeight: 700 }}>Đang tải danh sách huấn luyện viên...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState} style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div className={styles.emptyIcon} style={{ fontSize: 48, marginBottom: 16 }}>👨‍🏫</div>
                <div className={styles.emptyTitle} style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Không tìm thấy Huấn luyện viên nào</div>
                <div className={styles.emptyDesc} style={{ color: '#64748b' }}>Thử thay đổi từ khóa tìm kiếm hoặc thêm mới HLV vào hệ thống.</div>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Họ tên & Vai trò</th>
                      <th>Liên hệ</th>
                      <th>Tên đăng nhập</th>
                      <th>Ngày tạo</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id_nguoidung}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
                              {c.hoten ? c.hoten.charAt(0).toUpperCase() : 'H'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{c.hoten}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <Shield size={12} color="#10b981" />
                                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>Huấn luyện viên</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>{c.sdt || 'Chưa cập nhật SĐT'}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{c.email || 'Chưa cập nhật Email'}</div>
                        </td>
                        <td>
                          <span style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>
                            {c.tendangnhap}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#475569', fontSize: 13 }}>
                            {new Date(c.ngaytao).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleOpenEdit(c)} 
                              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}
                              title="Chỉnh sửa"
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981' }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b' }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(c.id_nguoidung)} 
                              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1.5px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }}
                              title="Xóa"
                              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : viewMode === 'calendar' ? (
          <>
            <ScheduleStats summary={scheduleSummary} schedules={filteredSchedules} />
            <AdminScheduleCalendar 
              schedules={filteredSchedules} 
              onEditSchedule={setEditingSchedule} 
              getScheduleCoach={getScheduleCoach} 
              getScheduleStudent={getScheduleStudent} 
            />
          </>
        ) : (
          <AdminScheduleTable
            schedules={filteredSchedules}
            summary={scheduleSummary}
            loading={scheduleLoading}
            onRefresh={fetchSchedules}
            onNotifyConflict={handleNotifyConflict}
            onStatusChange={handleStatusChange}
            onEditSchedule={setEditingSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        )}
      </div>

      {showModal && (
        <CoachModal 
          coach={editingCoach} 
          onClose={() => setShowModal(false)} 
          onSave={handleSaveDone} 
        />
      )}
      {editingSchedule && (
        <ScheduleModal
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSave={handleScheduleSaveDone}
        />
      )}
    </AdminLayout>
  );
}

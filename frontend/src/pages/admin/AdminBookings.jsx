import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Check, X, CreditCard, Plus, Pencil, Trash2, List, Calendar as CalendarIcon, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import CourtCalendar from '../../components/CourtCalendar'
import styles from './AdminCRUD.module.css'

const stMap = {
  ChoXacNhan: { label: 'Chờ xác nhận', cls: 'badge-warning' },
  DaXacNhan: { label: 'Đã xác nhận', cls: 'badge-success' },
  DaHuy: { label: 'Đã hủy', cls: 'badge-danger' },
  HoanThanh: { label: 'Hoàn thành', cls: 'badge-info' },
}

const HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']

function PayBadge({ hoaDon }) {
  const paid = hoaDon?.TrangThai === 'DaThanhToan'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 800,
      background: paid ? '#dcfce7' : '#fff7ed',
      color: paid ? '#15803d' : '#c2410c',
      border: `1.5px solid ${paid ? '#86efac' : '#fed7aa'}`,
      whiteSpace: 'nowrap',
    }}>
      <CreditCard size={11} />
      {paid ? 'Đã TT' : 'Chưa TT'}
    </span>
  )
}

/* ── Modal thêm / sửa ── */
function BookingModal({ booking, courts, onClose, onSave }) {
  const isEdit = !!booking?.MaLichDat
  const [form, setForm] = useState({
    MaSan: booking?.MaSan || (courts[0]?.MaSan || ''),
    NgayDat: booking?.NgayDat ? new Date(booking.NgayDat).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    GioBatDau: booking?.GioBatDau ? new Date(booking.GioBatDau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '06:00',
    GioKetThuc: booking?.GioKetThuc ? new Date(booking.GioKetThuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '07:00',
    TrangThai: booking?.TrangThai || 'ChoXacNhan',
    GhiChu: booking?.ghichu || '',
    MaNguoiDung: booking?.MaKhachHang || '',
    TrangThaiThanhToan: booking?.HoaDon?.TrangThai || 'ChuaThanhToan',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.MaSan || !form.NgayDat || !form.GioBatDau || !form.GioKetThuc) {
      alert('Vui lòng điền đầy đủ thông tin!')
      return
    }
    setSaving(true)
    try {
      const payload = {
        MaSan: form.MaSan,
        NgayDat: form.NgayDat,
        GioBatDau: `${form.NgayDat}T${form.GioBatDau}:00`,
        GioKetThuc: `${form.NgayDat}T${form.GioKetThuc}:00`,
        TrangThai: form.TrangThai,
        GhiChu: form.GhiChu,
        TrangThaiThanhToan: form.TrangThaiThanhToan,
      }
      if (!isEdit && form.MaNguoiDung) payload.MaNguoiDung = form.MaNguoiDung

      let result
      if (isEdit) {
        result = await api.put(`/bookings/${booking.MaLichDat}`, payload)
      } else {
        result = await api.post('/bookings', payload)
      }
      onSave(result.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi lưu dữ liệu')
    } finally {
      setSaving(false)
    }
  }

  const inp = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: '"Be Vietnam Pro", sans-serif',
  }
  const lbl = { fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '.04em', display: 'block', marginBottom: 5, textTransform: 'uppercase' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ padding: '22px 26px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
              {isEdit ? '✏️ Sửa lịch đặt sân' : '➕ Thêm lịch đặt sân'}
            </h3>
            {isEdit && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>Mã: {booking.MaLichDat}</p>}
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 9, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Sân */}
          <div>
            <label style={lbl}>Sân</label>
            <select value={form.MaSan} onChange={e => set('MaSan', e.target.value)} style={inp}>
              {courts.map(c => <option key={c.MaSan} value={c.MaSan}>{c.TenSan} — {(c.GiaSieu / 1000).toFixed(0)}K/h</option>)}
            </select>
          </div>

          {/* Ngày */}
          <div>
            <label style={lbl}>Ngày đặt</label>
            <input type="date" value={form.NgayDat} onChange={e => set('NgayDat', e.target.value)} style={inp} />
          </div>

          {/* Giờ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Giờ bắt đầu</label>
              <select value={form.GioBatDau} onChange={e => set('GioBatDau', e.target.value)} style={inp}>
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Giờ kết thúc</label>
              <select value={form.GioKetThuc} onChange={e => set('GioKetThuc', e.target.value)} style={inp}>
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Trạng thái (chỉ sửa) */}
          {isEdit && (
            <div>
              <label style={lbl}>Trạng thái</label>
              <select value={form.TrangThai} onChange={e => set('TrangThai', e.target.value)} style={inp}>
                <option value="ChoXacNhan">Chờ xác nhận</option>
                <option value="DaXacNhan">Đã xác nhận</option>
                <option value="DaHuy">Đã hủy</option>
                <option value="HoanThanh">Hoàn thành</option>
              </select>
            </div>
          )}

          {/* Trạng thái thanh toán */}
          <div>
            <label style={lbl}>Trạng thái thanh toán</label>
            <select value={form.TrangThaiThanhToan} onChange={e => set('TrangThaiThanhToan', e.target.value)} style={inp}>
              <option value="ChuaThanhToan">Chưa thanh toán</option>
              <option value="DaThanhToan">Đã thanh toán</option>
            </select>
          </div>

          {/* Ghi chú */}
          <div>
            <label style={lbl}>Ghi chú (tùy chọn)</label>
            <textarea value={form.GhiChu} onChange={e => set('GhiChu', e.target.value)} rows={2}
              placeholder="Ghi chú đặc biệt..." style={{ ...inp, resize: 'vertical', minHeight: 60 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: '"Be Vietnam Pro", sans-serif' }}>
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 26px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, fontFamily: '"Be Vietnam Pro", sans-serif' }}>
            {saving ? '⏳' : <Check size={15} />}
            {saving ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Tạo lịch đặt')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminBookings() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [acting, setActing] = useState(null)
  const [courts, setCourts] = useState([])
  const [modal, setModal] = useState(null)   // null | 'add' | booking-object (edit)
  const [deleting, setDeleting] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'calendar'

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/bookings', { params: { page, limit: 20, status: statusFilter || undefined } }),
      courts.length === 0 ? api.get('/courts') : Promise.resolve(null),
    ]).then(([br, cr]) => {
      setData(br.data.data)
      setTotal(br.data.total)
      if (cr) setCourts(Array.isArray(cr.data) ? cr.data : [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [courts.length, page, statusFilter])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  /* ── Actions ── */
  const handleConfirm = async (id) => {
    setActing(id)
    try {
      await api.put(`/bookings/${id}/confirm`)
      setData(prev => prev.map(b => b.MaLichDat === id ? { ...b, TrangThai: 'DaXacNhan' } : b))
    } catch (err) { alert(err.response?.data?.error || 'Lỗi') }
    finally { setActing(null) }
  }

  const handleComplete = async (id) => {
    if (!window.confirm('Đánh dấu đã sử dụng xong và trả sân trống?')) return
    setActing(id)
    try {
      await api.put(`/bookings/${id}/complete`)
      setData(prev => prev.map(b => b.MaLichDat === id ? { ...b, TrangThai: 'HoanThanh' } : b))
    } catch (err) { alert(err.response?.data?.error || 'Lỗi trả sân') }
    finally { setActing(null) }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Hủy lịch đặt này?')) return
    setActing(id)
    try {
      await api.put(`/bookings/${id}/cancel`)
      setData(prev => prev.map(b => b.MaLichDat === id ? { ...b, TrangThai: 'DaHuy' } : b))
    } catch (err) { alert(err.response?.data?.error || 'Lỗi') }
    finally { setActing(null) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ Xóa hoàn toàn lịch đặt này? Thao tác không thể hoàn tác!')) return
    setDeleting(id)
    try {
      await api.delete(`/bookings/${id}`)
      setData(prev => prev.filter(b => b.MaLichDat !== id))
      setTotal(t => t - 1)
    } catch (err) { alert(err.response?.data?.error || 'Lỗi xóa') }
    finally { setDeleting(null) }
  }

  const handleSave = () => {
    setModal(null)
    load() // refetch toàn bộ
  }

  const handleDownloadPDF = async (hoaDon) => {
    const hoaDonId = hoaDon?.MaHoaDon || hoaDon?.id_hoadon
    if (!hoaDonId) {
      alert('Không tìm thấy mã hóa đơn để tải PDF.')
      return
    }
    try {
      const res = await api.get(`/payments/export/${hoaDonId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `HoaDon_${hoaDonId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi tải hóa đơn PDF.')
    }
  }

  /* ── Pagination ── */
  const totalPages = Math.ceil(total / 20)

  return (
    <AdminLayout title="Quản lý đặt sân">
      <div className={styles.page}>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            Tổng: {total} lịch đặt
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', fontFamily: '"Be Vietnam Pro", sans-serif' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ChoXacNhan">Chờ xác nhận</option>
              <option value="DaXacNhan">Đã xác nhận</option>
              <option value="DaHuy">Đã hủy</option>
              <option value="HoanThanh">Hoàn thành</option>
            </select>

            {/* Nút Thêm mới */}
            <button
              onClick={() => setModal('add')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#10b981,#059669)',
                color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                fontFamily: '"Be Vietnam Pro", sans-serif',
              }}
            >
              <Plus size={16} /> Thêm lịch đặt
            </button>

            {/* Toggle View */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
              <button
                onClick={() => setViewMode('list')}
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#10b981' : '#64748b', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: viewMode === 'calendar' ? '#fff' : 'transparent', color: viewMode === 'calendar' ? '#10b981' : '#64748b', cursor: 'pointer', boxShadow: viewMode === 'calendar' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}
              >
                <CalendarIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Đang tải...</div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 15 }}>
            📭 Không có lịch đặt nào
          </div>
        ) : viewMode === 'calendar' ? (
          <CourtCalendar 
            courts={courts}
            bookings={data.map(b => ({
              ...b,
              title: `${b.San?.TenSan} - ${b.KhachHang?.NguoiDung?.HoTen || 'Khách'}`
            }))}
            onSelectEvent={(e) => setModal(e.resource)}
          />
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>THÀNH VIÊN</th>
                  <th>SÂN</th>
                  <th>NGÀY</th>
                  <th>GIỜ</th>
                  <th>TỔNG TIỀN</th>
                  <th>TRẠNG THÁI</th>
                  <th>THANH TOÁN</th>
                  <th style={{ minWidth: 140 }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {data.map(b => (
                  <tr key={b.MaLichDat}>
                    {/* Thành viên */}
                    <td>
                      <div className={styles.memberCell}>
                        <div className={styles.mAvatar}>{b.KhachHang?.NguoiDung?.HoTen?.[0] || '?'}</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{b.KhachHang?.NguoiDung?.HoTen || 'Khách'}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.KhachHang?.NguoiDung?.SoDienThoai}</div>
                        </div>
                      </div>
                    </td>

                    <td className={styles.highlight}>{b.San?.TenSan}</td>

                    <td>{new Date(b.NgayDat).toLocaleDateString('vi-VN')}</td>

                    <td>
                      {new Date(b.GioBatDau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(b.GioKetThuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td><strong>{b.TongTien?.toLocaleString('vi-VN')}đ</strong></td>

                    <td>
                      <span className={`badge ${stMap[b.TrangThai]?.cls || 'badge-warning'}`}>
                        {stMap[b.TrangThai]?.label || b.TrangThai}
                      </span>
                    </td>

                    <td><PayBadge hoaDon={b.HoaDon} /></td>

                    {/* Thao tác */}
                    <td>
                      <div className={styles.actions} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        {/* Xác nhận / Hủy (cho ChoXacNhan) */}
                        {b.TrangThai === 'ChoXacNhan' && (
                          <>
                            <button
                              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#059669', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}
                              onClick={() => handleConfirm(b.MaLichDat)}
                              disabled={acting === b.MaLichDat}
                              title="Xác nhận lịch đặt sân"
                            >
                              <Check size={14} />
                              {acting === b.MaLichDat ? 'Đang duyệt...' : 'Duyệt đơn'}
                            </button>
                            <button
                              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#dc2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}
                              onClick={() => handleCancel(b.MaLichDat)}
                              disabled={acting === b.MaLichDat}
                              title="Hủy lịch đặt sân"
                            >
                              <X size={14} />
                              {acting === b.MaLichDat ? 'Đang hủy...' : 'Hủy đơn'}
                            </button>
                          </>
                        )}
                        {b.TrangThai === 'DaXacNhan' && (
                          <button
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #10b981', background: '#10b981', color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, boxShadow: '0 2px 5px rgba(16,185,129,0.25)' }}
                            onClick={() => handleComplete(b.MaLichDat)}
                            disabled={acting === b.MaLichDat}
                            title="Khách đã chơi xong, xác nhận trả sân và hoàn thành đơn"
                          >
                            <CheckCircle size={14} />
                            {acting === b.MaLichDat ? 'Đang xử lý...' : 'Trả sân'}
                          </button>
                        )}

                        {/* Nút Sửa — luôn hiện */}
                        <button
                          title="Sửa thông tin"
                          onClick={() => setModal(b)}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#2563eb', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}
                        >
                          <Pencil size={13} />
                          Sửa
                        </button>

                        {/* Nút Xóa — luôn hiện */}
                        <button
                          title="Xóa lịch đặt"
                          onClick={() => handleDelete(b.MaLichDat)}
                          disabled={deleting === b.MaLichDat}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#dc2626', cursor: deleting === b.MaLichDat ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}
                        >
                          <Trash2 size={13} />
                          {deleting === b.MaLichDat ? 'Đang xóa...' : 'Xóa'}
                        </button>

                        {/* Nút tải PDF */}
                        {b.HoaDon?.TrangThai === 'DaThanhToan' && (
                          <button
                            title="Tải hóa đơn PDF"
                            onClick={() => handleDownloadPDF(b.HoaDon)}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', background: '#ecfdf5', color: '#10b981', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800, fontSize: 11 }}
                          >
                            PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '7px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: page === 1 ? '#f8fafc' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, color: '#475569', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
              ← Trước
            </button>
            <span style={{ padding: '7px 16px', fontWeight: 700, color: '#10b981', fontSize: 14 }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '7px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, color: '#475569', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <BookingModal
          booking={modal === 'add' ? null : modal}
          courts={courts}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  )
}

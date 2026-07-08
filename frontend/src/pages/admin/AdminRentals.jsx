import { useState, useEffect } from 'react'
import { CheckCircle, RefreshCw, Package, Clock, XCircle, RotateCcw, Trash2, Bell, X } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../services/api'
import styles from './AdminCRUD.module.css'

const STATUS_MAP = {
  ChoDuyet: { label: 'Chờ duyệt', color: '#92400e', bg: 'rgba(245,158,11,0.15)', icon: '⏳' },
  DangThue: { label: 'Đang thuê',  color: '#d97706', bg: 'rgba(245,158,11,0.12)', icon: '📦' },
  DaTraDo:  { label: 'Đã trả đồ', color: '#059669', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
  DaHuy:    { label: 'Đã hủy',    color: '#dc2626', bg: 'rgba(239,68,68,0.12)',  icon: '❌' },
}

const TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'ChoDuyet', label: 'Chờ duyệt' },
  { key: 'DangThue', label: 'Đang thuê' },
  { key: 'DaTraDo',  label: 'Đã trả đồ' },
  { key: 'DaHuy',    label: 'Đã hủy' },
]

export default function AdminRentals() {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [confirming, setConfirming] = useState(null)
  const [approving, setApproving]   = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [notifyModal, setNotifyModal] = useState(null) // { id, tenSP, tenKhach }
  const [notifyForm, setNotifyForm]   = useState({ tieude: '', noidung: '' })
  const [notifying, setNotifying]     = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/rentals/admin/all')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : []
        setOrders(data)
      })
      .catch(err => {
        console.error('AdminRentals error:', err)
        setError(err.response?.data?.error || 'Không thể tải dữ liệu. Kiểm tra kết nối backend.')
        setOrders([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Xác nhận duyệt đơn thuê này?')) return
    setApproving(id)
    try {
      await api.put(`/rentals/${id}/approve`)
      setOrders(prev => prev.map(o => o.MaDonThue === id ? { ...o, TrangThai: 'DangThue' } : o))
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi duyệt đơn')
    } finally {
      setApproving(null)
    }
  }

  const handleReturn = async (id) => {
    if (!window.confirm('Xác nhận khách đã trả đồ?')) return
    setConfirming(id)
    try {
      await api.put(`/rentals/${id}/return`)
      setOrders(prev => prev.map(o => o.MaDonThue === id ? { ...o, TrangThai: 'DaTraDo' } : o))
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi cập nhật trạng thái')
    } finally {
      setConfirming(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đơn thuê này? Thao tác không thể hoàn tác!')) return
    setDeleting(id)
    try {
      await api.delete(`/rentals/${id}`)
      setOrders(prev => prev.filter(o => o.MaDonThue !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi xóa đơn')
    } finally {
      setDeleting(null)
    }
  }

  const openNotify = (o) => {
    setNotifyModal({ id: o.MaDonThue, tenSP: o.TenSanPham, tenKhach: o.KhachHang?.HoTen || '' })
    setNotifyForm({
      tieude: `Thông báo về đơn thuê "${o.TenSanPham}"`,
      noidung: ''
    })
  }

  const handleNotify = async () => {
    if (!notifyForm.tieude.trim() || !notifyForm.noidung.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung')
      return
    }
    setNotifying(true)
    try {
      await api.post(`/rentals/${notifyModal.id}/notify`, notifyForm)
      alert('Đã gửi thông báo thành công!')
      setNotifyModal(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi gửi thông báo')
    } finally {
      setNotifying(false)
    }
  }

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.TrangThai === activeTab)

  const stats = [
    { label: 'Tổng đơn',    value: orders.length,                                                  icon: <Package size={20}/>,     color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
    { label: 'Chờ duyệt',  value: orders.filter(o => o.TrangThai === 'ChoDuyet').length,            icon: <Clock size={20}/>,       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
    { label: 'Đang thuê',   value: orders.filter(o => o.TrangThai === 'DangThue').length,             icon: <Package size={20}/>,     color: '#d97706', bg: 'rgba(245,158,11,0.1)'  },
    { label: 'Đã trả đồ',  value: orders.filter(o => o.TrangThai === 'DaTraDo').length,              icon: <CheckCircle size={20}/>, color: '#059669', bg: 'rgba(16,185,129,0.1)'  },
    { label: 'Đã hủy',     value: orders.filter(o => o.TrangThai === 'DaHuy').length,                icon: <XCircle size={20}/>,    color: '#dc2626', bg: 'rgba(239,68,68,0.1)'   },
  ]

  return (<>
    <AdminLayout title="Quản lý thuê đồ">
      <div className={styles.page}>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {stats.map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className={styles.statValue}>{loading ? '—' : s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 14, padding: '16px 20px',
            color: '#dc2626', fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <XCircle size={18}/>
            {error}
            <button onClick={load} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
              Thử lại
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.tabs}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                  {t.key !== 'all' && (
                    <span style={{ marginLeft: 6, background: activeTab === t.key ? '#10b981' : '#e8edf5', color: activeTab === t.key ? '#fff' : '#64748b', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 100 }}>
                      {orders.filter(o => t.key === 'all' || o.TrangThai === t.key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.toolbarRight}>
            <button className={styles.btnSecondary} onClick={load}>
              <RefreshCw size={14}/> Làm mới
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
              <div style={{ fontWeight: 700 }}>Đang tải dữ liệu...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📦</div>
              <div className={styles.emptyTitle}>Không có đơn thuê nào</div>
              <div className={styles.emptyDesc}>
                {activeTab === 'all' ? 'Chưa có đơn thuê dụng cụ nào trong hệ thống.' : `Không có đơn nào ở trạng thái "${STATUS_MAP[activeTab]?.label || activeTab}"`}
              </div>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Sản phẩm</th>
                    <th style={{ textAlign: 'center' }}>SL</th>
                    <th>Tổng tiền</th>
                    <th>Ngày thuê</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => {
                    const st = STATUS_MAP[o.TrangThai] || STATUS_MAP.DangThue
                    // Safe field access — handle both nested and flat responses
                    const tenKhach = o.KhachHang?.NguoiDung?.HoTen
                      || o.KhachHang?.HoTen
                      || o.TenKhachHang
                      || o.NguoiDung?.HoTen
                      || '—'
                    const tenSP = o.DichVu?.TenDichVu
                      || o.SanPham?.TenSanPham
                      || o.TenSanPham
                      || o.TenDichVu
                      || '—'

                    return (
                      <tr key={o.MaDonThue || Math.random()}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{tenKhach}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            {o.KhachHang?.NguoiDung?.Email || o.KhachHang?.Email || ''}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{tenSP}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{o.SoLuong ?? '—'}</td>
                        <td>
                          <span style={{ fontWeight: 900, color: '#059669', fontSize: 14 }}>
                            {(o.TongTien || 0).toLocaleString('vi-VN')}đ
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>
                          {o.NgayTao ? new Date(o.NgayTao).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 100,
                            fontSize: 12, fontWeight: 800,
                            background: st.bg, color: st.color,
                          }}>
                            {st.icon} {st.label}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions} style={{ gap: 6 }}>
                            <button
                              className={styles.editBtn}
                              style={{ background: 'rgba(245,158,11,0.15)', color: '#92400e', border: '1px solid rgba(245,158,11,0.3)' }}
                              onClick={() => handleApprove(o.MaDonThue)}
                              disabled={approving === o.MaDonThue || o.TrangThai !== 'ChoDuyet'}
                              title="Duyệt đơn (chỉ dùng khi Chờ duyệt)"
                            >
                              <CheckCircle size={13}/>
                              {approving === o.MaDonThue ? 'Đang duyệt...' : 'Duyệt đơn'}
                            </button>
                            <button
                              className={styles.editBtn}
                              onClick={() => handleReturn(o.MaDonThue)}
                              disabled={confirming === o.MaDonThue || o.TrangThai !== 'DangThue'}
                              title="Xác nhận trả (chỉ dùng khi Đang thuê)"
                            >
                              <RotateCcw size={13}/>
                              {confirming === o.MaDonThue ? 'Đang xử lý...' : 'Xác nhận trả'}
                            </button>
                            <button
                              className={styles.editBtn}
                              onClick={() => openNotify(o)}
                              title="Gửi thông báo cho khách"
                              style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5', border: '1px solid rgba(99,102,241,0.3)' }}
                            >
                              <Bell size={13}/>
                              Thông báo
                            </button>
                            <button
                              className={styles.editBtn}
                              onClick={() => handleDelete(o.MaDonThue)}
                              disabled={deleting === o.MaDonThue}
                              title="Xóa đơn thuê"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' }}
                            >
                              <Trash2 size={13}/>
                              {deleting === o.MaDonThue ? 'Đang xóa...' : 'Xóa'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>

    {/* ── Modal gửi thông báo ── */}
    {notifyModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '28px 32px',
          width: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          fontFamily: '"Be Vietnam Pro", sans-serif',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a' }}>📣 Gửi thông báo</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                Khách: <b>{notifyModal.tenKhach || '—'}</b> · Đơn: <b>{notifyModal.tenSP}</b>
              </div>
            </div>
            <button onClick={() => setNotifyModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={20}/>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>Tiêu đề</label>
              <input
                value={notifyForm.tieude}
                onChange={e => setNotifyForm(f => ({ ...f, tieude: e.target.value }))}
                placeholder="Nhập tiêu đề thông báo..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600,
                  outline: 'none', boxSizing: 'border-box', fontFamily: '"Be Vietnam Pro", sans-serif',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>Nội dung</label>
              <textarea
                value={notifyForm.noidung}
                onChange={e => setNotifyForm(f => ({ ...f, noidung: e.target.value }))}
                placeholder="Nhập nội dung thông báo cho khách..."
                rows={4}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: '"Be Vietnam Pro", sans-serif',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setNotifyModal(null)}
              style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >Hủy</button>
            <button
              onClick={handleNotify}
              disabled={notifying}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: notifying ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff', fontSize: 13, fontWeight: 800, cursor: notifying ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
              }}
            >
              <Bell size={13} style={{ marginRight: 6, verticalAlign: 'middle' }}/>
              {notifying ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>)
}

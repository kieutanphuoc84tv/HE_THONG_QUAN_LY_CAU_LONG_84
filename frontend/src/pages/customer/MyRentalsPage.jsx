import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import CustomerLayout from '../../layouts/CustomerLayout'
import api from '../../services/api'

const STATUS_MAP = {
  ChoDuyet: { label: '⏳ Chờ duyệt', color: '#92400e', bg: '#fef3c7' },
  DangThue: { label: '📦 Đang thuê',  color: '#1e40af', bg: '#dbeafe' },
  DaTraDo:  { label: '✅ Đã trả đồ', color: '#065f46', bg: '#d1fae5' },
  DaHuy:    { label: '❌ Đã hủy',    color: '#991b1b', bg: '#fee2e2' },
}

export default function MyRentalsPage() {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [cancelling, setCancelling] = useState(null)

  const load = () => {
    api.get('/rentals/my-orders')
      .then(r => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn thuê này?')) return
    setCancelling(id)
    try {
      await api.put(`/rentals/${id}/cancel`)
      setOrders(prev => prev.map(o => o.MaDonThue === id ? { ...o, TrangThai: 'DaHuy' } : o))
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi hủy đơn thuê')
    } finally {
      setCancelling(null)
    }
  }

  return (
    <CustomerLayout>
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '40px 24px 60px',
        fontFamily: '"Be Vietnam Pro", sans-serif',
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
          📦 Đơn thuê của tôi
        </h1>
        <p style={{ color: '#64748b', margin: '0 0 32px' }}>Danh sách các đơn thuê dụng cụ của bạn</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            ⏳ Đang tải dữ liệu...
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>💭</div>
            <p style={{ color: '#64748b', fontWeight: 700 }}>Bạn chưa có đơn thuê nào</p>
            <a href="/rental" style={{ color: '#10b981', fontWeight: 800, textDecoration: 'none' }}>
              Thuê dụng cụ ngay →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {orders.map(o => {
              const st = STATUS_MAP[o.TrangThai] || STATUS_MAP.DangThue
              return (
                <div key={o.MaDonThue} style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  flexWrap: 'wrap',
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 50,
                    height: 50,
                    background: '#f0fdf4',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                  }}>
                    📦
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 6 }}>
                      {o.TenSanPham || 'Sản phẩm'}
                    </div>
                    <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 13, flexWrap: 'wrap' }}>
                      <span>Số lượng: <b style={{ color: '#0f172a' }}>{o.SoLuong}</b></span>
                      {o.SoGio && <span>Giờ thuê: <b style={{ color: '#0f172a' }}>{o.SoGio}h</b></span>}
                      <span>Ngày thuê: <b style={{ color: '#0f172a' }}>
                        {o.NgayTao ? new Date(o.NgayTao).toLocaleDateString('vi-VN') : '--'}
                      </b></span>
                      {o.GhiChu && <span>Ghi chú: <b style={{ color: '#0f172a' }}>{o.GhiChu}</b></span>}
                    </div>
                  </div>

                  {/* Price & Status */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 17, color: '#0f172a' }}>
                      {(o.TongTien || 0).toLocaleString('vi-VN')}đ
                    </div>
                    <span style={{
                      display: 'inline-block',
                      marginTop: 6,
                      padding: '3px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: st.bg,
                      color: st.color,
                    }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Cancel button — cho phép hủy cả đơn ChoDuyet lẫn DangThue */}
                  {(o.TrangThai === 'DangThue' || o.TrangThai === 'ChoDuyet') && (
                    <button
                      onClick={() => handleCancel(o.MaDonThue)}
                      disabled={cancelling === o.MaDonThue}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: '1px solid #fecaca',
                        background: '#fff',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      {cancelling === o.MaDonThue
                        ? '...'
                        : <><X size={13} /> Hủy</>
                      }
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}

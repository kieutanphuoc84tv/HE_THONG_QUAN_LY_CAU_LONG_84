import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../layouts/CustomerLayout'
import { Calendar, Clock, Building2 } from 'lucide-react'
import api from '../../services/api'

const statusMap = {
  ChoXacNhan: { label: 'Chờ xác nhận', color: '#92400e', bg: '#fef3c7' },
  DaXacNhan:  { label: 'Đã xác nhận',  color: '#065f46', bg: '#d1fae5' },
  DaHuy:      { label: 'Đã hủy',       color: '#991b1b', bg: '#fee2e2' },
  HoanThanh:  { label: 'Hoàn thành',   color: '#1e40af', bg: '#dbeafe' },
  BiXoa:      { label: 'Bị xóa',       color: '#7f1d1d', bg: '#fca5a5' },
}

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/bookings/my')
      const list = Array.isArray(r.data) ? r.data : []
      setBookings(list)
    } catch (err) {
      console.error('Lỗi tải lịch đặt:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchBookings = async () => { await load() }
    fetchBookings()
  }, [])

  useEffect(() => {
    const refreshBookings = async () => { await load() }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshBookings()
    }
    window.addEventListener('focus', refreshBookings)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', refreshBookings)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy lịch đặt này?')) return
    setCancelling(id)
    try {
      await api.put(`/bookings/${id}/cancel`)
      await load()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi hủy đặt sân')
    } finally {
      setCancelling(null)
    }
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
      alert(err.response?.data?.error || 'Không thể tải hóa đơn PDF.')
    }
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>📅 Lịch sử đặt sân</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Tất cả các lịch đặt sân của bạn</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Đang tải dữ liệu...</div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏸</div>
            <p>Bạn chưa có lịch đặt sân nào</p>
            <a href="/booking" style={{ color: '#10b981', fontWeight: 700 }}>Đặt sân ngay →</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map(b => {
              const st = statusMap[b.TrangThai] || statusMap.ChoXacNhan
              const paymentMethod = b.HoaDon?.PhuongThucThanhToan || b.HoaDon?.ThanhToan?.PhuongThucThanhToan
              const isCashPayment = paymentMethod === 'TienMat'
              const canPayOnline =
                (b.TrangThai === 'ChoXacNhan' || b.TrangThai === 'DaXacNhan') &&
                b.HoaDon?.TrangThai !== 'DaThanhToan' &&
                !isCashPayment

              return (
                <div key={b.MaLichDat} style={{ display: 'flex', flexDirection: 'column', marginBottom: 16, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{
                    padding: '20px 24px', display: 'flex', alignItems: 'center',
                    gap: 20
                  }}>
                    <div style={{ width: 48, height: 48, background: '#ecfdf5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={22} color="#10b981" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{b.San?.TenSan}</div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 6, color: '#64748b', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} />{new Date(b.NgayDat).toLocaleDateString('vi-VN')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} />
                          {new Date(b.GioBatDau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(b.GioKetThuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>
                        {b.TongTien?.toLocaleString('vi-VN')}đ
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: b.HoaDon?.TrangThai === 'DaThanhToan' ? '#dcfce7' : '#fff7ed',
                          color: b.HoaDon?.TrangThai === 'DaThanhToan' ? '#15803d' : '#c2410c',
                          border: `1px solid ${b.HoaDon?.TrangThai === 'DaThanhToan' ? '#86efac' : '#fed7aa'}`
                        }}>
                          {b.HoaDon?.TrangThai === 'DaThanhToan' ? 'Đã TT' : 'Chưa TT'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {(b.TrangThai === 'DaHuy' || b.TrangThai === 'BiXoa') && b.ghichu && (
                    <div style={{ padding: '12px 24px', background: '#fef2f2', borderTop: '1px dashed #fca5a5', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                      ⚠️ Lý do: {b.ghichu}
                    </div>
                  )}
                  {(b.TrangThai === 'ChoXacNhan' || b.TrangThai === 'DaXacNhan' || b.TrangThai === 'HoanThanh') && (
                    <div style={{ padding: '0 24px 16px', background: '#fff', display: 'flex', gap: 10 }}>
                      {b.TrangThai === 'ChoXacNhan' && (
                        <button
                          onClick={() => handleCancel(b.MaLichDat)}
                          disabled={cancelling === b.MaLichDat}
                          style={{
                            padding: '8px 14px', borderRadius: 10, border: '1px solid #fee2e2',
                            background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700
                          }}
                        >
                          {cancelling === b.MaLichDat ? '...' : 'Hủy lịch đặt'}
                        </button>
                      )}
                      {canPayOnline && (
                        <button
                          onClick={() => {
                            navigate(`/payment/checkout?bookingId=${b.MaLichDat}&method=vnpay&amount=${b.TongTien}`)
                          }}
                          style={{
                            padding: '8px 16px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                            cursor: 'pointer', fontSize: 13, fontWeight: 800,
                            boxShadow: '0 2px 6px rgba(16,185,129,0.2)'
                          }}
                        >
                          💳 Thanh toán ngay
                        </button>
                      )}
                      {b.HoaDon?.TrangThai === 'DaThanhToan' && (
                        <button
                          onClick={() => handleDownloadPDF(b.HoaDon)}
                          style={{
                            padding: '8px 16px', borderRadius: 10, border: '1.5px solid #10b981',
                            background: '#fff', color: '#10b981',
                            cursor: 'pointer', fontSize: 13, fontWeight: 800,
                          }}
                        >
                          📄 Tải PDF hóa đơn
                        </button>
                      )}
                    </div>
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

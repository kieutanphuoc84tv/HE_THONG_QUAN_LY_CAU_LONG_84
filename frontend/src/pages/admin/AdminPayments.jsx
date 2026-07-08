import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { CreditCard, Check } from 'lucide-react'
import api from '../../services/api'
import styles from './AdminCRUD.module.css'

const ptMap = { TienMat: '💵 Tiền mặt', MBBank: '🏦 MB Bank', MoMo: '📱 MoMo' }

export default function AdminPayments() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [payingId, setPayingId] = useState(null)
  const [showPayForm, setShowPayForm] = useState(null) // MaLichDat đang cần thanh toán
  const [payForm, setPayForm] = useState({ PhuongThucThanhToan: 'TienMat', SoTien: '' })
  const [pendingBookings, setPendingBookings] = useState([])
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/payments'),
      api.get('/bookings', { params: { status: 'DaXacNhan' } }),
      api.get('/services')
    ]).then(([pr, br, sr]) => {
      setData(pr.data.data)
      setTotal(pr.data.total)
      setServices(sr.data.filter(s => s.TrangThai === 'ConHang' && s.SoLuong > 0))
      // Bookings đã xác nhận nhưng chưa có hóa đơn
      const paidLichDats = new Set(pr.data.data.map(p => p.HoaDon?.MaLichDat))
      setPendingBookings(br.data.data.filter(b => !paidLichDats.has(b.MaLichDat)))
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addServiceItem = (serviceId) => {
    if (!serviceId) return
    const existing = selectedServices.find(s => s.MaDichVu === serviceId)
    if (existing) {
      updateServiceQty(serviceId, existing.SoLuong + 1)
      return
    }
    const target = services.find(s => s.MaDichVu === serviceId)
    if (target) {
      setSelectedServices([...selectedServices, { ...target, SoLuong: 1 }])
    }
  }

  const updateServiceQty = (serviceId, qty) => {
    const target = services.find(s => s.MaDichVu === serviceId)
    if (target && qty > target.SoLuong) {
      alert(`Số lượng vượt quá tồn kho (Còn: ${target.SoLuong})`)
      return
    }
    if (qty <= 0) {
      setSelectedServices(selectedServices.filter(s => s.MaDichVu !== serviceId))
    } else {
      setSelectedServices(selectedServices.map(s => s.MaDichVu === serviceId ? { ...s, SoLuong: qty } : s))
    }
  }

  const extraServicesTotal = selectedServices.reduce((sum, s) => sum + s.Gia * s.SoLuong, 0)
  const grandTotal = Number(payForm.SoTien || 0) + extraServicesTotal

  const handlePay = async () => {
    if (!showPayForm || !payForm.SoTien) return
    setPayingId(showPayForm)
    try {
      await api.post('/payments', {
        MaLichDat: showPayForm,
        PhuongThucThanhToan: payForm.PhuongThucThanhToan,
        SoTien: payForm.SoTien,
        services: selectedServices.map(s => ({ MaDichVu: s.MaDichVu, SoLuong: s.SoLuong }))
      })
      setShowPayForm(null)
      setSelectedServices([])
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi thanh toán')
    } finally {
      setPayingId(null)
    }
  }

  return (
    <AdminLayout title="Quản lý thanh toán">
      <div className={styles.page}>
        {/* Cần thanh toán */}
        {pendingBookings.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <h4 style={{ color: '#92400e', margin: '0 0 12px', fontWeight: 800 }}>⚠️ Cần ghi nhận thanh toán ({pendingBookings.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingBookings.slice(0, 5).map(b => (
                <div key={b.MaLichDat} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fffbeb', borderRadius: 10 }}>
                  <CreditCard size={16} color="#f59e0b" />
                  <div style={{ flex: 1, fontSize: 14 }}>
                    <strong>{b.KhachHang?.NguoiDung?.HoTen}</strong> — {b.San?.TenSan} — {b.TongTien?.toLocaleString('vi-VN')}đ
                  </div>
                  <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}
                    onClick={() => { setShowPayForm(b.MaLichDat); setPayForm({ PhuongThucThanhToan: 'TienMat', SoTien: b.TongTien }); setSelectedServices([]); }}>
                    Thanh toán
                  </button>
                </div>
              ))}
            </div>
            {showPayForm && (
              <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <h5 style={{ margin: '0 0 12px', color: '#0f172a' }}>Ghi nhận thanh toán</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>PHƯƠNG THỨC</label>
                    <select value={payForm.PhuongThucThanhToan} onChange={e => setPayForm(p => ({ ...p, PhuongThucThanhToan: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, marginTop: 4, outline: 'none' }}>
                      {Object.entries(ptMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>SỐ TIỀN SÂN (đ)</label>
                    <input type="number" value={payForm.SoTien} onChange={e => setPayForm(p => ({ ...p, SoTien: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, marginTop: 4, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ marginTop: 16, borderTop: '1px dashed #e2e8f0', paddingTop: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>THÊM DỊCH VỤ KÈM THEO</label>
                  <select onChange={e => { addServiceItem(e.target.value); e.target.value = ''; }}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, outline: 'none', background: '#fff' }}>
                    <option value="">-- Chọn dịch vụ để thêm --</option>
                    {services.map(s => (
                      <option key={s.MaDichVu} value={s.MaDichVu}>
                        {s.TenDichVu} - {s.Gia.toLocaleString('vi-VN')}đ (Tồn: {s.SoLuong})
                      </option>
                    ))}
                  </select>

                  {selectedServices.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedServices.map(item => (
                        <div key={item.MaDichVu} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                          <span style={{ flex: 1 }}>{item.TenDichVu} (<strong>{item.Gia.toLocaleString('vi-VN')}đ</strong>)</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => updateServiceQty(item.MaDichVu, item.SoLuong - 1)} style={{ width: 22, height: 22, border: '1px solid #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f1f5f9' }}>-</button>
                            <span style={{ fontWeight: 'bold', minWidth: 16, textAlign: 'center' }}>{item.SoLuong}</span>
                            <button onClick={() => updateServiceQty(item.MaDichVu, item.SoLuong + 1)} style={{ width: 22, height: 22, border: '1px solid #cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f1f5f9' }}>+</button>
                            <span style={{ fontWeight: 'bold', color: '#10b981', marginLeft: 10, minWidth: 70, textAlign: 'right' }}>{(item.Gia * item.SoLuong).toLocaleString('vi-VN')}đ</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e2e8f0', padding: '12px 16px', borderRadius: 10 }}>
                  <span style={{ fontWeight: 'bold', color: '#475569' }}>Tổng cộng thanh toán:</span>
                  <strong style={{ fontSize: 18, color: '#10b981' }}>{grandTotal.toLocaleString('vi-VN')}đ</strong>
                </div>

                {payForm.PhuongThucThanhToan === 'MBBank' && grandTotal > 0 && (
                  <div style={{ marginTop: 16, textAlign: 'center', background: '#eff6ff', padding: '20px 16px', borderRadius: 12, border: '1.5px dashed #3b82f6' }}>
                    <h6 style={{ margin: '0 0 12px', color: '#1e3a8a', fontSize: 14, fontWeight: 800 }}>Quét mã QR để thanh toán MB Bank</h6>
                    <img 
                      src={`https://img.vietqr.io/image/mb-0984562210-compact2.png?amount=${grandTotal}&addInfo=Thanh toan lich dat ${showPayForm}&accountName=CAU LONG 84`}
                      alt="VietQR MB Bank"
                      style={{ width: 220, height: 220, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    />
                    <div style={{ marginTop: 12, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                      Ngân hàng: <strong>MB Bank</strong><br/>
                      Số tài khoản: <strong style={{ fontSize: 16, color: '#0f172a' }}>0984562210</strong><br/>
                      Chủ tài khoản: <strong>CAU LONG 84</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-outline" onClick={() => setShowPayForm(null)}>Hủy</button>
                  <button className="btn btn-primary" onClick={handlePay} disabled={!!payingId}><Check size={14} /> {payingId ? '...' : 'Xác nhận'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.toolbar}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Lịch sử thanh toán ({total})</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Đang tải...</div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead><tr><th>THÀNH VIÊN</th><th>SÂN</th><th>GIỜ ĐẶT</th><th>PHƯƠNG THỨC</th><th>SỐ TIỀN</th><th>NGÀY TT</th><th>TRẠNG THÁI</th></tr></thead>
              <tbody>
                {data.map(p => {
                  const lichDat = p.HoaDon?.LichDatSan
                  const tenKhach = lichDat?.KhachHang?.NguoiDung?.HoTen || 'Khách'
                  const tenSan   = lichDat?.San?.TenSan || '—'
                  const gioBD    = lichDat?.GioBatDau ? new Date(lichDat.GioBatDau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'
                  const gioKT    = lichDat?.GioKetThuc ? new Date(lichDat.GioKetThuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''
                  return (
                  <tr key={p.MaThanhToan}>
                    {/* Thành viên */}
                    <td>
                      <div className={styles.memberCell}>
                        <div className={styles.mAvatar} style={{ width: 32, height: 32, fontSize: 13 }}>
                          {tenKhach[0]}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{tenKhach}</span>
                      </div>
                    </td>
                    {/* Sân */}
                    <td className={styles.highlight}>{tenSan}</td>
                    {/* Giờ đặt */}
                    <td style={{ fontSize: 13, color: '#475569' }}>{gioBD}{gioKT ? ` – ${gioKT}` : ''}</td>
                    {/* Phương thức */}
                    <td>{ptMap[p.PhuongThucThanhToan] || p.PhuongThucThanhToan}</td>
                    {/* Số tiền */}
                    <td><strong style={{ color: '#10b981' }}>{p.SoTien?.toLocaleString('vi-VN')}đ</strong></td>
                    {/* Ngày TT */}
                    <td>{new Date(p.NgayThanhToan).toLocaleDateString('vi-VN')}</td>
                    {/* Trạng thái */}
                    <td><span className={`badge ${p.TrangThai === 'ThanhCong' ? 'badge-success' : 'badge-danger'}`}>{p.TrangThai === 'ThanhCong' ? 'Thành công' : 'Thất bại'}</span></td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

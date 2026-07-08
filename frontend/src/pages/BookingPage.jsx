import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import styles from './BookingPage.module.css'
import { getStoredUser } from '../utils/authStorage'

const timeSlots = [
  '06:00','07:00','08:00','09:00','10:00',
  '11:00','13:00','14:00','15:00','16:00',
  '17:00','18:00','19:00','20:00','21:00'
]

// Mock occupied per court
const occupied = {
  'Sân 1': ['08:00','09:00'],
  'Sân 3': ['08:00','09:00','10:00','14:00'],
  'Sân 5': ['14:00','15:00'],
}

export default function BookingPage() {
  const navigate = useNavigate()
  const user = getStoredUser(null)

  const [courts, setCourts] = useState([])
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [extras, setExtras] = useState({ racket: false, shuttle: false, coach: false, shoes: false })
  const [note, setNote] = useState('')
  const [step, setStep] = useState(1)
  const [payMethod, setPayMethod] = useState('cash')

  useEffect(() => {
    api.get('/courts')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : []
        const normalized = data.map(c => ({ ...c, GiaSieu: 70000 }))
        setCourts(normalized)
      })
      .catch(() => {
        setCourts([
          { MaSan: 1, TenSan: 'Sân 1', GiaSieu: 70000 },
          { MaSan: 2, TenSan: 'Sân 2', GiaSieu: 70000 },
          { MaSan: 3, TenSan: 'Sân 3', GiaSieu: 70000 },
          { MaSan: 4, TenSan: 'Sân 4', GiaSieu: 70000 },
          { MaSan: 5, TenSan: 'Sân 5', GiaSieu: 70000 },
        ])
      })
  }, [])

  const toggleSlot = (slot) => {
    setSelectedSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    )
  }

  const toggleExtra = (key) => {
    setExtras(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isOccupied = (slot) => {
    if (!selectedCourt) return false
    return (occupied[selectedCourt.TenSan] || []).includes(slot)
  }

  const courtPrice = selectedCourt?.GiaSieu || 0
  const totalHours = selectedSlots.length
  const extrasTotal = (extras.racket ? 30000 : 0) + (extras.shuttle ? 45000 : 0) + (extras.coach ? 150000 : 0) + (extras.shoes ? 20000 : 0)
  const grandTotal = (totalHours * courtPrice) + extrasTotal

  const canProceed = selectedCourt && selectedSlots.length > 0

  return (
    <AppLayout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Đặt lịch sân cầu lông</h1>
          <p className={styles.subtitle}>Chọn sân, chọn ngày và giờ phù hợp</p>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          <div className={`${styles.stepItem} ${step >= 1 ? styles.active : ''} ${step > 1 ? styles.done : ''}`}>
            <span className={styles.stepNum}>{step > 1 ? '✓' : '1'}</span>
            Chọn sân & giờ
          </div>
          <div className={`${styles.stepLine} ${step > 1 ? styles.done : ''}`} />
          <div className={`${styles.stepItem} ${step >= 2 ? styles.active : ''} ${step > 2 ? styles.done : ''}`}>
            <span className={styles.stepNum}>{step > 2 ? '✓' : '2'}</span>
            Xác nhận thông tin
          </div>
          <div className={`${styles.stepLine} ${step > 2 ? styles.done : ''}`} />
          <div className={`${styles.stepItem} ${step >= 3 ? styles.active : ''}`}>
            <span className={styles.stepNum}>3</span>
            Hoàn tất
          </div>
        </div>

        <div className={styles.layout}>
          {/* ====== LEFT COLUMN ====== */}
          <div>
            {step === 1 && (
              <>
                {/* 1. Chọn sân */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionTitle}>
                    <span className={styles.sectionNum}>1</span>
                    Chọn sân
                  </div>
                  <div className={styles.courtList}>
                    {courts.map(court => (
                      <div
                        key={court.MaSan}
                        className={`${styles.courtItem} ${selectedCourt?.MaSan === court.MaSan ? styles.selected : ''}`}
                        onClick={() => { setSelectedCourt(court); setSelectedSlots([]) }}
                      >
                        <div className={styles.courtInfo}>
                          <div className={styles.courtIcon}>🏸</div>
                          <div>
                            <div className={styles.courtName}>{court.TenSan}</div>
                          </div>
                        </div>
                        <div>
                          <span className={styles.courtPrice}>{court.GiaSieu.toLocaleString('vi-VN')} đ</span>
                          <span className={styles.courtPriceUnit}>/giờ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Chọn ngày */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionTitle}>
                    <span className={styles.sectionNum}>2</span>
                    Chọn ngày
                  </div>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* 3. Chọn giờ */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionTitle}>
                    <span className={styles.sectionNum}>3</span>
                    Chọn khung giờ {selectedCourt ? `— ${selectedCourt.TenSan}` : ''}
                  </div>
                  {selectedCourt ? (
                    <>
                      <div className={styles.timeGrid}>
                        {timeSlots.map(slot => {
                          const occ = isOccupied(slot)
                          const sel = selectedSlots.includes(slot)
                          return (
                            <div
                              key={slot}
                              className={`${styles.timeSlot} ${occ ? styles.occupied : ''} ${sel ? styles.selected : ''}`}
                              onClick={() => !occ && toggleSlot(slot)}
                            >
                              {slot}
                            </div>
                          )
                        })}
                      </div>
                      <div className={styles.legend}>
                        <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendFree}`} /> Trống</div>
                        <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendSelected}`} /> Đã chọn</div>
                        <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendOccupied}`} /> Đã đặt</div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>☝️</div>
                      Vui lòng chọn sân ở bước 1 trước
                    </div>
                  )}
                </div>

                {/* 4. Dịch vụ thêm */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionTitle}>
                    <span className={styles.sectionNum}>4</span>
                    Dịch vụ thêm (tuỳ chọn)
                  </div>
                  <div className={styles.extrasGrid}>
                    <div className={`${styles.extraItem} ${extras.racket ? styles.checked : ''}`} onClick={() => toggleExtra('racket')}>
                      <span className={styles.extraIcon}>🏸</span>
                      <div>
                        <div>Thuê vợt</div>
                        <div className={styles.extraPrice}>+30.000đ</div>
                      </div>
                    </div>
                    <div className={`${styles.extraItem} ${extras.shuttle ? styles.checked : ''}`} onClick={() => toggleExtra('shuttle')}>
                      <span className={styles.extraIcon}>🧶</span>
                      <div>
                        <div>Chuẩn bị cầu</div>
                        <div className={styles.extraPrice}>+45.000đ</div>
                      </div>
                    </div>
                    <div className={`${styles.extraItem} ${extras.shoes ? styles.checked : ''}`} onClick={() => toggleExtra('shoes')}>
                      <span className={styles.extraIcon}>👟</span>
                      <div>
                        <div>Thuê giày</div>
                        <div className={styles.extraPrice}>+20.000đ</div>
                      </div>
                    </div>
                    <div className={`${styles.extraItem} ${extras.coach ? styles.checked : ''}`} onClick={() => toggleExtra('coach')}>
                      <span className={styles.extraIcon}>🎓</span>
                      <div>
                        <div>Thuê HLV</div>
                        <div className={styles.extraPrice}>+150.000đ</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>
                  <span className={styles.sectionNum}>✓</span>
                  Xác nhận thông tin đặt sân
                </div>
                <div className={styles.confirmCard}>
                  <div className={styles.confirmRow}><span>Khách hàng</span><strong>{user?.hoTen || 'Khách'}</strong></div>
                  <div className={styles.confirmRow}><span>Sân</span><strong>{selectedCourt?.TenSan}</strong></div>
                  <div className={styles.confirmRow}><span>Ngày</span><strong>{selectedDate.split('-').reverse().join('/')}</strong></div>
                  <div className={styles.confirmRow}><span>Khung giờ</span><strong>{selectedSlots.sort().join(', ')}</strong></div>
                  <div className={styles.confirmRow}><span>Số giờ</span><strong>{totalHours} tiếng</strong></div>
                  {extras.racket && <div className={styles.confirmRow}><span>Thuê vợt</span><strong>+30.000đ</strong></div>}
                  {extras.shuttle && <div className={styles.confirmRow}><span>Chuẩn bị cầu</span><strong>+45.000đ</strong></div>}
                  {extras.shoes && <div className={styles.confirmRow}><span>Thuê giày</span><strong>+20.000đ</strong></div>}
                  {extras.coach && <div className={styles.confirmRow}><span>Thuê HLV</span><strong>+150.000đ</strong></div>}
                  <div className={styles.confirmRow} style={{ borderBottom: 'none', paddingTop: 14 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Tổng cộng</span>
                    <strong style={{ color: '#b7e014', fontSize: 18 }}>{grandTotal.toLocaleString('vi-VN')}đ</strong>
                  </div>
                </div>

                <div className={styles.sectionTitle} style={{ marginTop: 24 }}>
                  <span className={styles.sectionNum}>💳</span>
                  Phương thức thanh toán
                </div>
                <div className={styles.payGrid}>
                  {[
                    { key: 'cash', icon: '💵', label: 'Tiền mặt' },
                    { key: 'vnpay', icon: '🔵', label: 'VNPay' },
                    { key: 'momo', icon: '🟣', label: 'MoMo' },
                  ].map(p => (
                    <div
                      key={p.key}
                      className={`${styles.payBtn} ${payMethod === p.key ? styles.activePay : ''}`}
                      onClick={() => setPayMethod(p.key)}
                    >
                      <span className={styles.payIcon}>{p.icon}</span>
                      {p.label}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Ghi chú</label>
                  <textarea className={styles.noteInput} rows={3} placeholder="Yêu cầu thêm (nếu có)..." value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={styles.sectionCard} style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#b7e014', textTransform: 'uppercase', marginBottom: 8 }}>Đặt sân thành công!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
                  Cảm ơn bạn đã đặt sân tại Cầu Lông 84. Vui lòng đến đúng giờ và mang theo {payMethod === 'cash' ? 'tiền mặt' : 'điện thoại'} để thanh toán.
                </p>
                <div className={styles.confirmCard} style={{ marginTop: 24, textAlign: 'left' }}>
                  <div className={styles.confirmRow}><span>Sân</span><strong>{selectedCourt?.TenSan}</strong></div>
                  <div className={styles.confirmRow}><span>Ngày</span><strong>{selectedDate.split('-').reverse().join('/')}</strong></div>
                  <div className={styles.confirmRow}><span>Giờ</span><strong>{selectedSlots.sort().join(', ')}</strong></div>
                  <div className={styles.confirmRow} style={{ borderBottom: 'none' }}><span>Tổng</span><strong style={{ color: '#b7e014' }}>{grandTotal.toLocaleString('vi-VN')}đ</strong></div>
                </div>
                <button className={styles.btnPrimary} style={{ marginTop: 24 }} onClick={() => navigate('/')}>
                  Về trang chủ
                </button>
              </div>
            )}
          </div>

          {/* ====== RIGHT SIDEBAR ====== */}
          <div className={styles.sidebar}>
            <h3 className={styles.sideTitle}>
              {step === 3 ? '✅ Đã xác nhận' : '📋 Tóm tắt đặt sân'}
            </h3>

            {selectedCourt ? (
              <>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Sân</span>
                  <span className={styles.summaryValue}>{selectedCourt.TenSan}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Ngày</span>
                  <span className={styles.summaryValue}>{selectedDate.split('-').reverse().join('/')}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Giờ chơi</span>
                  <span className={styles.summaryValue}>{totalHours > 0 ? `${totalHours} tiếng` : '—'}</span>
                </div>
                {totalHours > 0 && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Khung giờ</span>
                    <span className={styles.summaryValue} style={{ fontSize: 11 }}>{selectedSlots.sort().join(', ')}</span>
                  </div>
                )}
                {extrasTotal > 0 && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Dịch vụ thêm</span>
                    <span className={styles.summaryValue}>+{extrasTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                <div className={styles.totalBox}>
                  <span className={styles.totalLabel}>Tổng cộng</span>
                  <span className={styles.totalValue}>{grandTotal.toLocaleString('vi-VN')}đ</span>
                </div>

                {step === 1 && (
                  <button className={styles.btnPrimary} disabled={!canProceed} onClick={() => setStep(2)}>
                    Tiếp tục →
                  </button>
                )}
                {step === 2 && (
                  <>
                    <button className={styles.btnPrimary} onClick={() => setStep(3)}>
                      <CheckCircle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      Xác nhận đặt sân
                    </button>
                    <button className={styles.btnGhost} onClick={() => setStep(1)}>
                      ← Quay lại chỉnh sửa
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🏸</div>
                Chọn sân để bắt đầu đặt lịch
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, Zap, MapPin, Users, ArrowRight } from 'lucide-react'
import api from '../../services/api'
import CustomerLayout from '../../layouts/CustomerLayout'

const STATUS_MAP = {
  Trong:    { label: 'Trống', color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
  DangDung: { label: 'Đang dùng', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  BaoTri:   { label: 'Bảo trì', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444' },
}

const COURT_FEATURES = {
  VIP: ['Ánh sáng LED cao cấp', 'Sàn gỗ chuyên nghiệp', 'Điều hòa không khí', 'Ghế nghỉ riêng'],
  TieuChuan: ['Ánh sáng đầy đủ', 'Sàn PU tiêu chuẩn', 'Quạt làm mát', 'Chỗ để đồ'],
}

function CourtVisual({ type, status }) {
  const isVIP = type === 'VIP'
  const isBusy = status === 'DangDung'
  const isMaintenance = status === 'BaoTri'

  return (
    <div style={{
      height: 200,
      position: 'relative',
      background: isMaintenance
        ? 'linear-gradient(180deg, #374151 0%, #4b5563 50%, #374151 100%)'
        : isVIP
          ? 'linear-gradient(180deg, #1e3a7a 0%, #2563eb 40%, #1e3a7a 100%)'
          : 'linear-gradient(180deg, #14532d 0%, #16a34a 40%, #14532d 100%)',
      overflow: 'hidden',
    }}>
      {/* Background texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 62%)',
      }} />

      {/* Court lines */}
      {!isMaintenance && (
        <>
          {/* Outer boundary */}
          <div style={{
            position: 'absolute', inset: '16px 20px',
            border: '2px solid rgba(255,255,255,0.6)',
            borderRadius: 2,
          }} />
          {/* Center line (net) */}
          <div style={{
            position: 'absolute',
            left: 20, right: 20,
            top: '50%', transform: 'translateY(-50%)',
            height: 3,
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 0 10px rgba(255,255,255,0.8)',
          }} />
          {/* Left service box */}
          <div style={{
            position: 'absolute',
            left: 20, right: '50%',
            top: '25%', bottom: '25%',
            borderTop: '1.5px solid rgba(255,255,255,0.4)',
            borderBottom: '1.5px solid rgba(255,255,255,0.4)',
            borderRight: '1.5px solid rgba(255,255,255,0.4)',
          }} />
          {/* Right service box */}
          <div style={{
            position: 'absolute',
            left: '50%', right: 20,
            top: '25%', bottom: '25%',
            borderTop: '1.5px solid rgba(255,255,255,0.4)',
            borderBottom: '1.5px solid rgba(255,255,255,0.4)',
            borderLeft: '1.5px solid rgba(255,255,255,0.4)',
          }} />
          {/* Center dot */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 10, height: 10, borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 0 6px rgba(255,255,255,0.6)',
            zIndex: 2,
          }} />
        </>
      )}

      {/* Overlay for busy/maintenance */}
      {(isBusy || isMaintenance) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3,
        }}>
          <div style={{
            background: isMaintenance ? 'rgba(239,68,68,0.9)' : 'rgba(245,158,11,0.9)',
            color: '#fff', fontWeight: 800, fontSize: 13,
            padding: '8px 18px', borderRadius: 100,
            letterSpacing: '.05em',
            backdropFilter: 'blur(4px)',
          }}>
            {isMaintenance ? '🔧 Đang bảo trì' : '⏳ Đang sử dụng'}
          </div>
        </div>
      )}

      {/* VIP crown */}
      {isVIP && !isMaintenance && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff', fontSize: 10, fontWeight: 900,
          padding: '3px 10px', borderRadius: 8,
          letterSpacing: '.08em', zIndex: 2,
          boxShadow: '0 3px 10px rgba(245,158,11,0.4)',
        }}>⭐ VIP</div>
      )}

      {/* Shuttlecock decoration */}
      <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 28, opacity: 0.2 }}>🏸</div>
    </div>
  )
}

export default function CourtsPage() {
  const [courts, setCourts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [todayBusy, setTodayBusy] = useState([])

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    Promise.all([
      api.get('/courts'),
      api.get('/bookings/busy-all', { params: { date: todayStr } }).catch(() => ({ data: [] }))
    ])
      .then(([courtsRes, busyRes]) => {
        const data = Array.isArray(courtsRes.data) ? courtsRes.data : []
        const normalized = data.map(c => ({ ...c, LoaiSan: 'TieuChuan', GiaSieu: 70000 }))
        setCourts(normalized)
        setTodayBusy(Array.isArray(busyRes.data) ? busyRes.data : [])
      })
      .catch(() => setCourts([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = courts.filter(c => {
    if (filter === 'available') return c.TrangThai === 'Trong'
    return true
  })

  const availableCount = courts.filter(c => c.TrangThai === 'Trong').length

  return (
    <CustomerLayout>
      <div style={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}>

        {/* ── Hero ── */}
        <div style={{
          background: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.75) 45%, rgba(15, 23, 42, 0.1) 100%), url('/banner_courts.png') center 20%/cover no-repeat`,
          padding: '80px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Grid bg */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(115deg, rgba(16,185,129,0.16), rgba(223,245,74,0.08) 48%, transparent 78%)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 1260, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 0, lineHeight: 1.15 }}>
              Hệ thống <span style={{ color: '#10b981' }}>Sân Cầu Lông</span><br />chuyên nghiệp
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginTop: 14, fontWeight: 500 }}>
              Tất cả sân tiêu chuẩn 70K/giờ · Đặt online 24/7 · Xác nhận ngay lập tức
            </p>

            <div style={{ display: 'flex', gap: 20, marginTop: 32, flexWrap: 'wrap' }}>
              {[
                { icon: <Clock size={16}/>, text: '06:00 – 22:00 hàng ngày' },
                { icon: <MapPin size={16}/>, text: 'Trà Vinh, Việt Nam' },
                { icon: <Users size={16}/>, text: 'Phù hợp mọi trình độ' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: '#10b981' }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 1260, margin: '0 auto', padding: '40px 28px' }}>

          {/* Filter tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, background: '#fff', padding: 4, borderRadius: 14, border: '1px solid #e8edf5' }}>
              {[
                { k: 'all', label: `Tất cả (${courts.length})` },
                { k: 'available', label: `Còn trống (${availableCount})` },
              ].map(t => (
                <button key={t.k} onClick={() => setFilter(t.k)} style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  background: filter === t.k ? '#10b981' : 'transparent',
                  color: filter === t.k ? '#fff' : '#64748b',
                  boxShadow: filter === t.k ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                }}>
                  {t.label}
                </button>
              ))}
            </div>
            <Link to="/booking" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', padding: '10px 22px', borderRadius: 12,
              textDecoration: 'none', fontWeight: 800, fontSize: 14,
              boxShadow: '0 6px 16px rgba(16,185,129,0.3)',
            }}>
              <Zap size={15}/> Đặt sân ngay <ArrowRight size={14}/>
            </Link>
          </div>

          {/* Court grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: '#fff', borderRadius: 20, height: 380, border: '1px solid #e8edf5', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filtered.map(c => {
                const courtBookings = todayBusy.filter(b => b.MaSan === c.MaSan);
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                let isCurrentlyBusy = false;
                let bookedSlotsCount = 0;

                const busyHours = new Set();
                courtBookings.forEach(b => {
                  const d = new Date(b.GioBatDau);
                  const start = d.getHours() * 60 + d.getMinutes();
                  const endD = new Date(b.GioKetThuc);
                  const end = endD.getHours() * 60 + endD.getMinutes();
                  if (start != null && end != null) {
                    if (currentMinutes >= start && currentMinutes < end) {
                      isCurrentlyBusy = true;
                    }
                    for (let h = Math.floor(start/60); h < Math.floor(end/60); h++) {
                      busyHours.add(h);
                    }
                  }
                });
                bookedSlotsCount = busyHours.size;

                let currentStatus = c.TrangThai || 'Trong';
                if (currentStatus === 'Trong' && isCurrentlyBusy) {
                  currentStatus = 'DangDung';
                }

                const st = STATUS_MAP[currentStatus] || STATUS_MAP.Trong
                const isAvailable = currentStatus === 'Trong'
                const features = COURT_FEATURES.TieuChuan

                return (
                  <div key={c.MaSan} style={{
                    background: '#fff',
                    borderRadius: 22,
                    overflow: 'hidden',
                    border: '1px solid #e8edf5',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Visual court / Image */}
                    {c.HinhAnh ? (
                      <div style={{ position: 'relative', height: 200, width: '100%' }}>
                        <img src={c.HinhAnh} alt={c.TenSan} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {currentStatus !== 'Trong' && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 3,
                          }}>
                            <div style={{
                              background: currentStatus === 'BaoTri' ? 'rgba(239,68,68,0.9)' : 'rgba(245,158,11,0.9)',
                              color: '#fff', fontWeight: 800, fontSize: 13,
                              padding: '8px 18px', borderRadius: 100,
                              letterSpacing: '.05em',
                              backdropFilter: 'blur(4px)',
                            }}>
                              {currentStatus === 'BaoTri' ? '🔧 Đang bảo trì' : '⏳ Đang sử dụng'}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <CourtVisual type="TieuChuan" status={currentStatus} />
                    )}

                    {/* Card body */}
                    <div style={{ padding: '20px 22px' }}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
                            {c.TenSan}
                          </h3>
                          {bookedSlotsCount > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', background: '#ffedd5', padding: '4px 8px', borderRadius: 8, border: '1px solid #fed7aa' }}>
                              Đã đặt {bookedSlotsCount} giờ
                            </span>
                          )}
                        </div>
                        
                        {/* Mini Timeline */}
                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                            <span>06:00</span>
                            <span style={{ color: '#64748b' }}>Lịch hôm nay</span>
                            <span>22:00</span>
                          </div>
                          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            {Array.from({ length: 16 }, (_, i) => i + 6).map(h => {
                              const isBusy = busyHours.has(h)
                              return (
                                <div 
                                  key={h}
                                  title={`${h}:00 - ${h+1}:00: ${isBusy ? 'Kín chỗ' : 'Còn trống'}`}
                                  style={{
                                    flex: 1,
                                    height: 8,
                                    borderRadius: 3,
                                    background: isBusy ? '#f97316' : '#cbd5e1',
                                    cursor: 'help',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'scaleY(1.5)'
                                    if (!isBusy) e.currentTarget.style.background = '#10b981'
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'scaleY(1)'
                                    if (!isBusy) e.currentTarget.style.background = '#cbd5e1'
                                  }}
                                />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 16 }}>
                        {features.map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', fontWeight: 600 }}>
                            <CheckCircle size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                            {f}
                          </div>
                        ))}
                      </div>

                      {/* Price + CTA */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                        <div>
                          <span style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>
                            {(c.GiaSieu / 1000).toFixed(0)}K
                          </span>
                          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>/giờ</span>
                        </div>
                        {isAvailable ? (
                          <Link to="/booking" style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            padding: '10px 20px', borderRadius: 12,
                            textDecoration: 'none',
                            fontSize: 13, fontWeight: 800,
                            boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                            transition: 'all 0.2s',
                          }}>
                            Đặt ngay <ArrowRight size={13}/>
                          </Link>
                        ) : (
                          <button disabled style={{
                            padding: '10px 20px', borderRadius: 12,
                            background: '#f1f5f9', color: '#94a3b8',
                            border: 'none', fontSize: 13, fontWeight: 700,
                            cursor: 'not-allowed',
                          }}>
                            Không khả dụng
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🏸</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Không có sân nào phù hợp</div>
              <p style={{ fontSize: 14, marginTop: 8 }}>Thử chọn bộ lọc khác</p>
            </div>
          )}

          {/* Info section */}
          <div style={{
            marginTop: 60,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {[
              { icon: '⚡', title: 'Đặt sân tức thì', desc: 'Xác nhận ngay sau khi đặt, không cần chờ đợi' },
              { icon: '🔒', title: 'Bảo đảm chỗ chơi', desc: 'Cam kết giữ sân cho bạn đúng theo lịch đặt' },
              { icon: '💳', title: 'Thanh toán linh hoạt', desc: 'Tiền mặt, VNPay, MoMo — tùy bạn lựa chọn' },
              { icon: '🏆', title: 'Chất lượng cao', desc: 'Sân được bảo dưỡng định kỳ, ánh sáng chuẩn thi đấu' },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 18, padding: '24px 22px',
                border: '1px solid #e8edf5',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

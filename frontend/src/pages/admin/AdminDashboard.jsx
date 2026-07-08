import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Users, Building2, Trophy, CreditCard, ArrowUpRight, Download } from 'lucide-react'
import { motion } from 'motion/react'
import api from '../../services/api'
import styles from './AdminDashboard.module.css'
import { getStoredUser } from '../../utils/authStorage'

const statusMap = {
  DaXacNhan:  { label: 'Đã xác nhận', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  ChoXacNhan: { label: 'Chờ xác nhận', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  DaHuy:      { label: 'Đã hủy',      color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  HoanThanh:  { label: 'Hoàn thành',  color: '#6366F1', bg: 'rgba(99,102,241,0.15)' },
}
const courtStatusMap = {
  Trong:    { label: 'Trống',     color: '#10B981', emoji: '✅' },
  DangDung: { label: 'Đang dùng', color: '#F97316', emoji: '⏳' },
  BaoTri:   { label: 'Bảo trì',   color: '#EF4444', emoji: '🔧' },
}

// Animation Variants
const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVars = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revenuePeriod, setRevenuePeriod] = useState('7days')
  const [revenueData, setRevenueData] = useState(null)
  const [loadingRevenue, setLoadingRevenue] = useState(false)
  const [courtStats, setCourtStats] = useState([])
  const [revenueBreakdown, setRevenueBreakdown] = useState(null)
  const [advStats, setAdvStats] = useState(null)

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  const user = getStoredUser({})

  const loadRevenue = (period) => {
    setLoadingRevenue(true)
    const to = new Date()
    const from = new Date()
    if (period === '7days') {
      from.setDate(to.getDate() - 6)
    } else {
      from.setDate(to.getDate() - 29)
    }
    
    api.get('/reports/revenue', {
      params: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0]
      }
    }).then(res => {
      setRevenueData(res.data)
    }).catch(console.error)
      .finally(() => setLoadingRevenue(false))
  }

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
    api.get('/reports/court-stats').then(r => setCourtStats(r.data)).catch(() => {})
    api.get('/reports/revenue-breakdown').then(r => setRevenueBreakdown(r.data)).catch(() => {})
    api.get('/reports/advanced-stats').then(r => setAdvStats(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadRevenue(revenuePeriod), 0)
    return () => window.clearTimeout(timer)
  }, [revenuePeriod])

  const handleExportExcel = async (type) => {
    try {
      const res = await api.get(`/reports/export-excel?type=${type}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `bao-cao-${type}-${new Date().getTime()}.xlsx`)
      document.body.appendChild(link)
      link.click()
    } catch {
      alert("Lỗi xuất báo cáo Excel")
    }
  }

  if (loading) return (
    <AdminLayout title="Tổng quan hệ thống">
      <div style={{ padding: 60, textAlign: 'center', color: '#64748b', fontWeight: 600 }}>⏳ Đang tải dữ liệu...</div>
    </AdminLayout>
  )

  const stats = data ? [
    { label: 'Doanh thu tháng', value: `${Number(data.stats.doanhThuThang || 0).toLocaleString('vi-VN')}đ`, change: 'Tháng này', icon: CreditCard, color: '#10B981' },
    { label: 'Thành viên', value: data.stats.tongThanhVien.toString(), change: advStats ? `Tháng này: +${advStats.members.newThisMonth} mới` : 'Đang hoạt động', icon: Users, color: '#0EA5E9' },
    { label: 'Đặt sân hôm nay', value: data.stats.tongDatHomNay.toString(), change: advStats ? `Lượt đặt tháng: ${advStats.services.bookingsThisMonth}` : 'Lịch đặt', icon: Building2, color: '#F97316' },
    { label: 'Giải đấu', value: data.stats.giaiDauSapDen.toString(), change: 'Sắp / đang diễn ra', icon: Trophy, color: '#8B5CF6' },
  ] : []

  // SVG Chart Logic
  const getDaysArray = (period) => {
    const arr = []
    const limit = period === '7days' ? 7 : 30
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      arr.push(d.toISOString().split('T')[0])
    }
    return arr
  }

  const days = getDaysArray(revenuePeriod)
  const chartPoints = days.map(day => ({
    label: new Date(day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    val: revenueData?.byDay?.[day] || 0
  }))

  const maxVal = Math.max(...chartPoints.map(p => p.val), 100000)
  const width = 800
  const height = 230
  const topPadding = 25
  const bottomPadding = 35
  const leftPadding = 70
  const rightPadding = 20
  const chartWidth = width - leftPadding - rightPadding
  const chartHeight = height - topPadding - bottomPadding

  const points = chartPoints.map((p, i) => {
    const x = leftPadding + (i / (chartPoints.length - 1)) * chartWidth
    const y = topPadding + chartHeight - (p.val / maxVal) * chartHeight
    return { x, y, ...p }
  })

  const linePath = points.map(p => `${p.x},${p.y}`).join(' L ')
  const areaPath = points.length > 0 ? `M ${leftPadding},${topPadding + chartHeight} L ${linePath} L ${leftPadding + chartWidth},${topPadding + chartHeight} Z` : ''

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <AdminLayout title="Tổng quan hệ thống">
      <div className={styles.page}>
        <div className={styles.meshBackground} />

        <motion.div 
          className={styles.contentWrapper}
          variants={containerVars}
          initial="hidden"
          animate="show"
        >
          {/* Welcome banner */}
          <motion.div className={`${styles.welcomeBanner} ${styles.glassPanel}`} variants={itemVars}>
            <div className={styles.welcomeContent}>
              <div className={styles.welcomeTitle}>{greeting}, <span>{user.hoTen || 'Admin'}!</span></div>
              <div className={styles.welcomeDate}>{today}</div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            {stats.map(({ label, value, change, icon: Icon, color }) => (
              <motion.div 
                className={`${styles.statCard} ${styles.glassPanel}`} 
                key={label} 
                variants={itemVars}
                whileHover={{ scale: 1.02 }}
              >
                <div className={styles.statCardTop}>
                  <div className={styles.statIconWrap} style={{ background: `${color}22`, color }}>
                    <Icon size={20} strokeWidth={2.5} />
                  </div>
                </div>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
                <div className={styles.statChange}>{change}</div>
                <div className={styles.statHighlight} style={{ background: `linear-gradient(90deg, ${color}44, ${color})` }}/>
              </motion.div>
            ))}
          </div>

          {/* Revenue Chart */}
          <motion.div className={styles.glassPanel} variants={itemVars}>
            <div className={styles.tableHeader}>
              <div>
                <h3 className={styles.tableTitle}>📈 Biểu đồ Doanh thu Hệ thống</h3>
                <p className={styles.tableSub}>Doanh thu thực tế đã thu từ các lượt đặt sân và dịch vụ</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleExportExcel('revenue')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, cursor: 'pointer', fontWeight: 700
                  }}>
                  <Download size={14}/> Xuất Excel
                </button>
                <div style={{ width: 1, background: 'rgba(0,0,0,0.1)', margin: '0 4px' }}/>
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: 10, padding: 3 }}>
                  <button className={`${styles.periodBtn} ${revenuePeriod === '7days' ? styles.periodActive : ''}`} onClick={() => setRevenuePeriod('7days')}>
                    7 ngày
                  </button>
                  <button className={`${styles.periodBtn} ${revenuePeriod === '30days' ? styles.periodActive : ''}`} onClick={() => setRevenuePeriod('30days')}>
                    30 ngày
                  </button>
                </div>
              </div>
            </div>

            {loadingRevenue ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontWeight: 600 }}>⏳ Đang vẽ biểu đồ...</div>
            ) : (
              <div style={{ position: 'relative', width: '100%', padding: '20px 24px' }}>
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = topPadding + chartHeight - ratio * chartHeight
                    const labelVal = maxVal * ratio
                    return (
                      <g key={index}>
                        <line x1={leftPadding} y1={y} x2={leftPadding + chartWidth} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth="1.5" />
                        <text x={leftPadding - 10} y={y + 4} textAnchor="end" style={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                          {labelVal.toLocaleString('vi-VN')} đ
                        </text>
                      </g>
                    )
                  })}

                  {/* Shaded Area */}
                  {points.length > 0 && areaPath && (
                    <path d={areaPath} fill="url(#areaGradient)" />
                  )}

                  {/* Trend line */}
                  {points.length > 0 && linePath && (
                    <path d={`M ${linePath}`} fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 6px rgba(16,185,129,0.3))' }} />
                  )}

                  {/* Dot markers */}
                  {points.map((p, i) => {
                    if (revenuePeriod === '30days' && i % 3 !== 0) return null
                    return (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#10B981" strokeWidth="3" />
                        <text x={p.x} y={p.y - 12} textAnchor="middle" style={{ fontSize: 10, fill: '#0f172a', fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
                          {p.val > 0 ? `${p.val.toLocaleString('vi-VN')}đ` : ''}
                        </text>
                      </g>
                    )
                  })}

                  {/* X labels */}
                  {points.map((p, i) => {
                    const showLabel = revenuePeriod === '7days' ? true : i % 4 === 0
                    if (!showLabel) return null
                    return (
                      <text key={i} x={p.x} y={topPadding + chartHeight + 24} textAnchor="middle" style={{ fontSize: 11, fill: '#64748b', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                        {p.label}
                      </text>
                    )
                  })}
                </svg>
              </div>
            )}
          </motion.div>

          {/* Row 2: Court utilization + Donut */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            
            {/* Court Utilization */}
            <motion.div className={styles.glassPanel} variants={itemVars}>
              <div className={styles.tableHeader}>
                <h3 className={styles.tableTitle}>🏸 Hiệu Suất Sử Dụng Sân</h3>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {courtStats.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Chưa có dữ liệu</div>
                ) : (() => {
                  const maxVal = Math.max(...courtStats.map(c => c.SoLuotDat), 1)
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {courtStats.map((c, i) => {
                        const pct = Math.round(c.SoLuotDat / maxVal * 100)
                        const colors = ['#10B981', '#0EA5E9', '#F97316', '#8B5CF6', '#EC4899', '#EAB308']
                        const color = colors[i % colors.length]
                        return (
                          <div key={c.MaSan}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.TenSan}</span>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: 14, fontWeight: 900, color }}>{c.SoLuotDat} lượt</span>
                              </div>
                            </div>
                            <div style={{ height: 10, background: 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                              <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: `${pct}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                style={{ height: '100%', background: color, borderRadius: 99 }} 
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </motion.div>

            {/* Revenue Donut */}
            <motion.div className={styles.glassPanel} variants={itemVars}>
              <div className={styles.tableHeader}>
                <h3 className={styles.tableTitle}>💰 Phân Bổ Doanh Thu</h3>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {!revenueBreakdown ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Đang tải...</div>
                ) : (() => {
                  const { sanBaoCau = 0, dungCu = 0, giaiDau = 0 } = revenueBreakdown
                  const total = sanBaoCau + dungCu + giaiDau || 1
                  const segments = [
                    { label: 'Thuê sân', val: sanBaoCau, color: '#10B981' },
                    { label: 'Thuê đồ', val: dungCu, color: '#0EA5E9' },
                    { label: 'Lệ phí giải đấu', val: giaiDau, color: '#8B5CF6' },
                  ]
                  
                  const cx = 80, cy = 80, r = 60, strokeW = 24
                  const circumference = 2 * Math.PI * r
                  let accOffset = 0
                  const arcs = segments.map(s => {
                    const pct = s.val / total
                    const dash = pct * circumference
                    const offset = circumference - accOffset
                    accOffset += dash
                    return { ...s, dash, offset, pct }
                  })

                  return (
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <svg width="160" height="160" viewBox="0 0 160 160" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}>
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={strokeW} />
                        {arcs.map((arc, i) => (
                          <motion.circle key={i} cx={cx} cy={cy} r={r} fill="none"
                            stroke={arc.color} strokeWidth={strokeW}
                            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                            strokeDashoffset={arc.offset}
                            transform="rotate(-90 80 80)"
                            initial={{ strokeDasharray: `0 ${circumference}` }}
                            whileInView={{ strokeDasharray: `${arc.dash} ${circumference - arc.dash}` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            strokeLinecap="round"
                          />
                        ))}
                      </svg>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {segments.map(s => (
                          <div key={s.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }} />
                                <span style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>{s.label}</span>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{Math.round(s.val / total * 100)}%</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.val.toLocaleString('vi-VN')}đ</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </motion.div>

          </div>

          {/* Conflicts Warning */}
          {(data?.conflicts || []).length > 0 && (
            <motion.div className={styles.glassPanel} variants={itemVars} style={{ borderLeft: '4px solid #EF4444' }}>
              <div className={styles.tableHeader}>
                <div>
                  <h3 className={styles.tableTitle}>⚠️ Cảnh báo trùng lịch hôm nay</h3>
                  <p className={styles.tableSub}>Các lịch đặt bị chồng chéo giờ trên cùng sân</p>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 100 }}>
                  {data.conflicts.length} xung đột
                </span>
              </div>
              <div style={{ padding: '0 24px 20px' }}>
                {data.conflicts.map((c, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12,
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: i % 2 === 0 ? 'rgba(239,68,68,0.04)' : 'transparent',
                    borderRadius: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{c.Khach1}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>{c.San} · {c.Gio1}</div>
                    </div>
                    <div style={{ fontSize: 18, color: '#EF4444', fontWeight: 900 }}>⚡</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{c.Khach2}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>{c.San} · {c.Gio2}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Bottom row: Recent bookings + Court status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

            {/* Recent bookings */}
            <motion.div className={styles.glassPanel} variants={itemVars}>
              <div className={styles.tableHeader}>
                <div>
                  <h3 className={styles.tableTitle}>Đặt sân gần đây</h3>
                  <p className={styles.tableSub}>Các lịch đặt sân mới nhất</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <a href="/admin/bookings" style={{ fontSize: 13, fontWeight: 800, color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Xem tất cả <ArrowUpRight size={14}/>
                  </a>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {['Thành viên', 'Sân', 'Ngày', 'Số tiền', 'Trạng thái'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.datGanDay || []).map(b => {
                      const st = statusMap[b.TrangThai] || statusMap.ChoXacNhan
                      return (
                        <tr key={b.MaLichDat}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {b.KhachHang?.NguoiDung?.HoTen?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{b.KhachHang?.NguoiDung?.HoTen || 'Khách'}</div>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{b.KhachHang?.NguoiDung?.Email || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 800, color: '#10b981' }}>{b.San?.TenSan}</td>
                          <td style={{ fontSize: 12, fontWeight: 600 }}>{new Date(b.NgayDat).toLocaleDateString('vi-VN')}</td>
                          <td style={{ fontWeight: 900, color: '#0f172a' }}>{b.TongTien?.toLocaleString('vi-VN')}đ</td>
                          <td>
                            <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 800, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {(data?.datGanDay || []).length === 0 && (
                      <tr><td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Chưa có lịch đặt nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Court status — LIVE */}
            <motion.div className={styles.glassPanel} variants={itemVars}>
              <div className={styles.tableHeader}>
                <div>
                  <h3 className={styles.tableTitle}>Trạng thái sân hôm nay</h3>
                  <p className={styles.tableSub}>Cập nhật theo lịch đặt thực tế</p>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                  LIVE
                </span>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {(data?.sanTrangThai || []).map(c => {
                  const live = c.LiveStatus || c.TrangThai || 'Trong'
                  const st = courtStatusMap[live] || courtStatusMap.Trong
                  const totalHours = 16 // 06:00 - 22:00
                  const usagePct = Math.min(100, Math.round((c.BookedHours || 0) / totalHours * 100))
                  return (
                    <div key={c.MaSan} className={styles.courtRow}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: st.color, flexShrink: 0, boxShadow: `0 0 8px ${st.color}88`, marginRight: 16 }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{c.TenSan}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {c.BookedHours > 0 && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#f1f5f9', color: '#475569' }}>
                                {c.BookedHours}h/{totalHours}h
                              </span>
                            )}
                            <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 10px', borderRadius: 100, background: `${st.color}22`, color: st.color }}>
                              {st.emoji} {st.label}
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: c.Slots?.length > 0 ? 10 : 0 }}>
                          <div style={{ width: `${usagePct}%`, height: '100%', background: `linear-gradient(90deg, ${st.color}88, ${st.color})`, borderRadius: 4, transition: 'width 0.6s ease' }}/>
                        </div>
                        {/* Show today's booking slots */}
                        {(c.Slots || []).length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {c.Slots.map((sl, idx) => {
                              const slStatus = sl.TrangThai === 'Đã xác nhận' ? { color: '#10B981', bg: 'rgba(16,185,129,0.08)' }
                                : sl.TrangThai === 'Hoàn thành' ? { color: '#6366F1', bg: 'rgba(99,102,241,0.08)' }
                                : { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' }
                              return (
                                <div key={idx} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '6px 10px', borderRadius: 8,
                                  background: slStatus.bg,
                                  fontSize: 11, fontWeight: 700,
                                }}>
                                  <span style={{ color: '#475569' }}>
                                    🕐 {sl.Gio}
                                  </span>
                                  <span style={{ color: slStatus.color, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {sl.KhachHang}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {(data?.sanTrangThai || []).length === 0 && (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Chưa có dữ liệu sân</div>
                )}
              </div>
            </motion.div>

          </div>

        </motion.div>
      </div>
    </AdminLayout>
  )
}

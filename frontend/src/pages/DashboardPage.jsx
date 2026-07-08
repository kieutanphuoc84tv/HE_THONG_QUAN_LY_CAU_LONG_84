import { TrendingUp, TrendingDown, Users, Building2, Trophy, DollarSign, Calendar, Bell, ArrowRight, MoreHorizontal } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import styles from './DashboardPage.module.css'

const stats = [
  { label: 'Tổng doanh thu', value: '24.5M', unit: 'đ', icon: DollarSign, color: '#00D4AA', change: '+12.5%', up: true },
  { label: 'Thành viên', value: '342', icon: Users, color: '#6C63FF', change: '+8 tháng này', up: true },
  { label: 'Sân hoạt động', value: '10/12', icon: Building2, color: '#FFD60A', change: '2 đang bảo trì', up: false },
  { label: 'Giải đấu đang diễn ra', value: '3', icon: Trophy, color: '#FF4D6D', change: '5 sắp tới', up: true },
]

const bookings = [
  { id: 'BK001', member: 'Nguyễn Văn A', court: 'Sân 3', time: '08:00 - 09:30', date: '09/05/2026', status: 'confirmed', amount: '135.000đ' },
  { id: 'BK002', member: 'Trần Thị B', court: 'Sân 1', time: '10:00 - 11:30', date: '09/05/2026', status: 'pending', amount: '120.000đ' },
  { id: 'BK003', member: 'Lê Văn C', court: 'Sân 5', time: '14:00 - 16:00', date: '09/05/2026', status: 'confirmed', amount: '200.000đ' },
  { id: 'BK004', member: 'Phạm Thị D', court: 'Sân 2', time: '17:00 - 18:30', date: '09/05/2026', status: 'cancelled', amount: '135.000đ' },
  { id: 'BK005', member: 'Hoàng Văn E', court: 'Sân 7', time: '19:00 - 21:00', date: '09/05/2026', status: 'confirmed', amount: '240.000đ' },
]

const courts = [
  { name: 'Sân 1', status: 'occupied', until: '11:30', type: 'Tiêu chuẩn' },
  { name: 'Sân 2', status: 'available', type: 'Tiêu chuẩn' },
  { name: 'Sân 3', status: 'occupied', until: '09:30', type: 'VIP' },
  { name: 'Sân 4', status: 'available', type: 'VIP' },
  { name: 'Sân 5', status: 'occupied', until: '16:00', type: 'Tiêu chuẩn' },
  { name: 'Sân 6', status: 'maintenance', type: 'Tiêu chuẩn' },
  { name: 'Sân 7', status: 'available', type: 'Tiêu chuẩn' },
  { name: 'Sân 8', status: 'occupied', until: '20:00', type: 'VIP' },
]

const notifications = [
  { icon: '📅', text: 'Nguyễn Văn A đặt sân 3 lúc 08:00 ngày mai', time: '2 phút trước', read: false },
  { icon: '💳', text: 'Thanh toán 200.000đ từ Lê Văn C - Thành công', time: '15 phút trước', read: false },
  { icon: '🏆', text: 'Giải đấu "CLB Mở Rộng 2026" còn 3 ngày nữa', time: '1 giờ trước', read: true },
  { icon: '👤', text: 'Thành viên mới đăng ký: Phạm Thị E', time: '2 giờ trước', read: true },
]

const statusMap = {
  confirmed: { label: 'Đã xác nhận', cls: 'badge-success' },
  pending: { label: 'Chờ xác nhận', cls: 'badge-warning' },
  cancelled: { label: 'Đã hủy', cls: 'badge-danger' },
}

const courtStatusMap = {
  occupied: { label: 'Đang sử dụng', color: '#FF4D6D' },
  available: { label: 'Trống', color: '#00D4AA' },
  maintenance: { label: 'Bảo trì', color: '#FF9F1C' },
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Tổng quan hệ thống</h1>
            <p className={styles.subtitle}>Thứ Sáu, 09/05/2026 • Chào buổi sáng, Admin! 👋</p>
          </div>
          <div className={styles.headerActions}>
            <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }}>
              <Bell size={16} />
              <span className={styles.notifDot} />
              Thông báo
            </button>
            <button className="btn btn-primary btn-sm">
              <Calendar size={16} /> Đặt sân mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-icon" style={{ background: `${s.color}18` }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
                  {s.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {s.change}
                </div>
              </div>
              <div className="stat-value">{s.value}<span style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: 500 }}> {s.unit}</span></div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.grid2}>
          {/* Recent bookings */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Đặt sân gần đây</h2>
              <a href="/booking" className={styles.seeAll}>Xem tất cả <ArrowRight size={14} /></a>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Sân</th>
                    <th>Giờ</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                            {b.member.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{b.member}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{b.court}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{b.time}</td>
                      <td style={{ fontWeight: 600 }}>{b.amount}</td>
                      <td>
                        <span className={`badge ${statusMap[b.status].cls}`}>
                          {statusMap[b.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Court status */}
            <div className="card" style={{ padding: '24px' }}>
              <div className={styles.cardHeader} style={{ marginBottom: '16px' }}>
                <h2 className={styles.cardTitle}>Trạng thái sân</h2>
                <span className={styles.liveBadge}><span className="dot dot-green" />LIVE</span>
              </div>
              <div className={styles.courtsGrid}>
                {courts.map(c => (
                  <div key={c.name} className={styles.courtItem} style={{ borderColor: `${courtStatusMap[c.status].color}30` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className={styles.courtName}>{c.name}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: `${courtStatusMap[c.status].color}18`, color: courtStatusMap[c.status].color, fontWeight: 600 }}>
                        {c.status === 'occupied' ? `đến ${c.until}` : courtStatusMap[c.status].label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{c.type}</div>
                    <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--bg-surface)', marginTop: 10 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: c.status === 'occupied' ? '100%' : c.status === 'maintenance' ? '40%' : '0%', background: courtStatusMap[c.status].color, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="card" style={{ padding: '24px' }}>
              <div className={styles.cardHeader} style={{ marginBottom: '16px' }}>
                <h2 className={styles.cardTitle}>Thông báo</h2>
                <button className={styles.seeAll}>Đánh dấu đọc tất cả</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.map((n, i) => (
                  <div key={i} className={styles.notifItem} style={{ opacity: n.read ? 0.6 : 1 }}>
                    <span style={{ fontSize: 20 }}>{n.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, lineHeight: 1.5 }}>{n.text}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{n.time}</p>
                    </div>
                    {!n.read && <div className="dot dot-green" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

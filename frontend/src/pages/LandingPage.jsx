import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Shield, Zap, Users, Trophy, Calendar, BarChart3, Bell, ChevronRight } from 'lucide-react'
import styles from './LandingPage.module.css'

const features = [
  {
    icon: '👤',
    title: 'Quản lý thành viên',
    desc: 'Đăng ký, đăng nhập, phân quyền. Quản lý hồ sơ và lịch sử hoạt động đầy đủ.',
    color: '#00D4AA',
  },
  {
    icon: '🏟️',
    title: 'Quản lý sân',
    desc: 'Thêm/sửa/xóa sân, đặt lịch sân, kiểm tra tình trạng sân theo thời gian thực.',
    color: '#6C63FF',
  },
  {
    icon: '🏆',
    title: 'Quản lý giải đấu',
    desc: 'Tạo giải, đăng ký thi đấu, quản lý bảng đấu, cập nhật kết quả tự động.',
    color: '#FFD60A',
  },
  {
    icon: '💳',
    title: 'Thanh toán trực tuyến',
    desc: 'Tích hợp VNPay, MoMo. Xuất hóa đơn PDF và theo dõi công nợ.',
    color: '#FF9F1C',
  },
  {
    icon: '📊',
    title: 'Thống kê & Báo cáo',
    desc: 'Báo cáo doanh thu, thống kê sử dụng sân, bảng xếp hạng vận động viên.',
    color: '#FF4D6D',
  },
  {
    icon: '🔔',
    title: 'Thông báo tự động',
    desc: 'Gửi thông báo khi đặt sân thành công, nhắc lịch thi đấu qua email.',
    color: '#2EC4B6',
  },
]

const stats = [
  { value: '500+', label: 'Thành viên', icon: '👥' },
  { value: '12', label: 'Sân cầu lông', icon: '🏟️' },
  { value: '50+', label: 'Giải đấu', icon: '🏆' },
  { value: '99.9%', label: 'Uptime', icon: '⚡' },
]

const users = [
  { role: 'Quản lý CLB', color: '#00D4AA', icon: '👑', desc: 'Quản lý toàn bộ hệ thống, phân quyền, báo cáo doanh thu' },
  { role: 'Huấn luyện viên', color: '#6C63FF', icon: '🎯', desc: 'Quản lý lịch dạy, theo dõi học viên và kết quả tập luyện' },
  { role: 'Thành viên', color: '#FFD60A', icon: '🏸', desc: 'Đặt sân, đăng ký giải đấu, xem lịch và theo dõi kết quả' },
  { role: 'Khách vãng lai', color: '#FF9F1C', icon: '🚶', desc: 'Đặt sân theo nhu cầu, không cần tạo tài khoản thành viên' },
]

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div className={styles.navLogo}>
            <span className={styles.navLogoIcon}>
              <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" />
            </span>
            <span className={styles.navLogoText}>CẦU LÔNG <span className="text-primary">84</span></span>
          </div>
          <div className={styles.navLinks}>
            <a href="#features">Tính năng</a>
            <a href="#users">Đối tượng</a>
            <a href="#stats">Thống kê</a>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            <Link to="/login" className="btn btn-ghost btn-sm">Đăng nhập</Link>
            <Link to="/dashboard" className="btn btn-primary btn-sm">Dùng thử →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroOrb1} />
          <div className={styles.heroOrb2} />
          <div className={styles.heroOrb3} />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className={styles.heroBadge}>
            <span className="dot dot-green" />
            Hệ thống quản lý cầu lông thế hệ mới
          </div>
          <h1 className={styles.heroTitle}>
            Quản lý câu lạc bộ<br />
            <span className="glow-text">cầu lông chuyên nghiệp</span>
          </h1>
          <p className={styles.heroDesc}>
            Giải pháp toàn diện cho câu lạc bộ cầu lông — từ đặt sân, quản lý thành viên,
            tổ chức giải đấu đến thanh toán trực tuyến. Tất cả trong một nền tảng duy nhất.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Khám phá hệ thống <ArrowRight size={18} />
            </Link>
            <Link to="/booking" className="btn btn-outline btn-lg">
              Đặt sân ngay
            </Link>
          </div>
          <div className={styles.heroChecks}>
            {['Miễn phí dùng thử', 'Hỗ trợ 24/7', 'Bảo mật tuyệt đối'].map(t => (
              <div key={t} className={styles.heroCheck}>
                <CheckCircle size={15} color="var(--primary)" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map(s => (
              <div key={s.label} className={styles.statItem}>
                <div className={styles.statEmoji}>{s.icon}</div>
                <div className={styles.statNum}>{s.value}</div>
                <div className={styles.statLbl}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className={styles.sectionBadge}>Tính năng hệ thống</div>
            <h2 className="section-title" style={{ marginTop: '12px' }}>
              Mọi thứ bạn cần để<br />
              <span className="glow-text">vận hành câu lạc bộ</span>
            </h2>
            <p className="section-subtitle" style={{ margin: '16px auto 0' }}>
              Được thiết kế dành riêng cho câu lạc bộ cầu lông tại Trà Vinh,
              đáp ứng đầy đủ nhu cầu thực tế.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map(f => (
              <div key={f.title} className={styles.featureCard} style={{ '--accent-color': f.color }}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
                <div className={styles.featureArrow}>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Users */}
      <section id="users" className={styles.usersSection}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className={styles.sectionBadge}>Đối tượng sử dụng</div>
            <h2 className="section-title" style={{ marginTop: '12px' }}>
              Phục vụ <span className="glow-text">mọi đối tượng</span>
            </h2>
          </div>
          <div className={styles.usersGrid}>
            {users.map(u => (
              <div key={u.role} className={styles.userCard} style={{ '--user-color': u.color }}>
                <div className={styles.userIcon}>{u.icon}</div>
                <h3 className={styles.userRole}>{u.role}</h3>
                <p className={styles.userDesc}>{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaOrb} />
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>
                Sẵn sàng nâng cấp<br />câu lạc bộ của bạn?
              </h2>
              <p className={styles.ctaDesc}>
                Đăng ký ngay hôm nay và trải nghiệm sự khác biệt trong quản lý câu lạc bộ cầu lông.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/login" className="btn btn-primary btn-lg">
                  Bắt đầu ngay <ArrowRight size={18} />
                </Link>
                <Link to="/dashboard" className="btn btn-ghost btn-lg">
                  Xem demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div>
              <div className={styles.navLogo} style={{ marginBottom: '8px' }}>
                <span className={styles.navLogoIcon}>
                  <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" />
                </span>
                <span className={styles.navLogoText}>CẦU LÔNG <span className="text-primary">84</span></span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Hệ thống quản lý câu lạc bộ cầu lông<br />tại Trà Vinh
              </p>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              © 2026 Cầu Lông 84. Đồ án tốt nghiệp.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

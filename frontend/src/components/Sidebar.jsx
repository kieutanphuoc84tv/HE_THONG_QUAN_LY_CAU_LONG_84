import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Calendar, Trophy, Users,
  LogOut, X, ChevronRight
} from 'lucide-react'
import styles from './Sidebar.module.css'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { path: '/courts', icon: Building2, label: 'Quản lý sân' },
  { path: '/booking', icon: Calendar, label: 'Đặt lịch sân' },
  { path: '/tournaments', icon: Trophy, label: 'Giải đấu' },
  { path: '/members', icon: Users, label: 'Thành viên' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <>
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" className={styles.logoImage} />
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoName}>CẦU LÔNG 84</span>
              <span className={styles.logoSub}>Management System</span>
            </div>
          )}
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={16} /> : <X size={16} />}
          </button>
        </div>

        <div className={styles.divider} />

        {/* Nav */}
        <nav className={styles.nav}>
          {!collapsed && <span className={styles.navGroup}>MENU CHÍNH</span>}
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`${styles.navItem} ${location.pathname === path ? styles.active : ''}`}
              title={collapsed ? label : ''}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && location.pathname === path && (
                <div className={styles.activeIndicator} />
              )}
            </Link>
          ))}
        </nav>

        <div className={styles.spacer} />

        {/* Bottom */}
        <div className={styles.bottom}>
          {!collapsed && (
            <div className={styles.userCard}>
              <div className={styles.userAvatar}>AD</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>Admin CLB 84</span>
                <span className={styles.userRole}>Quản lý hệ thống</span>
              </div>
            </div>
          )}
          <button className={styles.logoutBtn} onClick={() => navigate('/login')} title="Đăng xuất">
            <LogOut size={18} />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

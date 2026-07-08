import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, CalendarDays, Users,
  Trophy, CreditCard, LogOut, ChevronLeft, ChevronRight,
  Bell, Globe, ShoppingBag, Package, BarChart3, X, Award,
  Gift, Box, Menu
} from 'lucide-react'
import styles from './AdminLayout.module.css'
import api from '../services/api'
import { clearStoredAuth, getStoredUser } from '../utils/authStorage'

const NAV = [
  { path: '/admin/dashboard',   icon: LayoutDashboard, label: 'Tổng quan',     roles: ['Admin', 'QuanLy'] },
  { path: '/admin/courts',      icon: Building2,        label: 'Quản lý sân',     roles: ['Admin', 'QuanLy'] },
  { path: '/admin/bookings',    icon: CalendarDays,     label: 'Đặt lịch sân',    roles: ['Admin', 'QuanLy'] },
  { path: '/admin/members',     icon: Users,            label: 'Thành viên',      roles: ['Admin', 'QuanLy'] },
  { path: '/admin/memberships', icon: Award,            label: 'KH Hội viên',     roles: ['Admin', 'QuanLy'] },
  { path: '/admin/coaches',     icon: Users,            label: 'Huấn luyện viên', roles: ['Admin', 'QuanLy'] },
  { path: '/admin/tournaments', icon: Trophy,           label: 'Giải đấu',        roles: ['Admin', 'QuanLy'] },
  
  // DỊCH VỤ & KHÁC
  { path: '/admin/packages',    icon: Box,              label: 'Cấu hình gói',    roles: ['Admin'] },
  { path: '/admin/vouchers',    icon: Gift,             label: 'Khuyến mãi',      roles: ['Admin', 'QuanLy'] },
  { path: '/admin/payments',    icon: CreditCard,       label: 'Thanh toán',      roles: ['Admin', 'QuanLy'] },
  { path: '/admin/services',    icon: ShoppingBag,      label: 'Dịch vụ',         roles: ['Admin', 'QuanLy'] },
  { path: '/admin/rentals',     icon: Package,          label: 'Quản lý thuê đồ', roles: ['Admin', 'QuanLy'] },
  { path: '/admin/reports',     icon: BarChart3,        label: 'Báo cáo',         roles: ['Admin', 'QuanLy'] },
]

const SERVICE_START_INDEX = NAV.findIndex(item => item.path === '/admin/packages')

export default function AdminLayout({ children, title }) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [bellOpen,   setBellOpen]   = useState(false)
  const [notifs,     setNotifs]     = useState([])

  // Fetch real notifications from the backend
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications')
        const mapped = res.data.map(n => ({
          id: n.id_thongbao,
          icon: n.loai === 'tournament' ? '🏆' : n.loai === 'tournament_cancel' ? '❌' : '🔔',
          type: n.loai,
          title: n.tieude,
          desc: n.noidung,
          time: new Date(n.ngaytao).toLocaleString('vi-VN'),
          read: n.dadoct,
          link: n.link
        }))
        setNotifs(mapped)
      } catch (err) {
        console.error('Lỗi lấy thông báo', err)
      }
    }
    
    fetchNotifs()
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchNotifs, 10000)
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifs(n => n.map(x => ({ ...x, read: true })))
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả thông báo', err)
    }
  }

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
    } catch (err) {
      console.error('Lỗi đánh dấu thông báo', err)
    }
  }

  const dismiss = (id, e) => { 
    e.stopPropagation()
    // We don't delete from DB, just hide from UI for this session
    setNotifs(n => n.filter(x => x.id !== id)) 
  }

  const location = useLocation()
  const navigate = useNavigate()
  const bellRef  = useRef(null)
  const user     = getStoredUser({})
  const unread   = notifs.filter(n => !n.read).length

  const handleLogout = () => {
    clearStoredAuth()
    navigate('/login')
  }

  /* Close on outside click */
  useEffect(() => {
    const handle = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])



  return (
    <div className={styles.layout}>
      {/* ══ SIDEBAR ══ */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" className={styles.brandLogoImage} />
          </div>
          {!collapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>CẦU LÔNG 84</span>
              <span className={styles.brandSub}>Admin Panel</span>
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          {!collapsed && <p className={styles.navSection}>QUẢN LÝ</p>}
          {NAV.slice(0, SERVICE_START_INDEX).filter(item => item.roles.includes(user.role || 'Admin')).map(({ path, icon: Icon, label }) => (
            <Link
              key={path} to={path}
              className={`${styles.navLink} ${location.pathname === path ? styles.active : ''}`}
              title={collapsed ? label : ''}
            >
              <Icon size={18} strokeWidth={2}/>
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}

          {!collapsed && <p className={styles.navSection} style={{ marginTop: 8 }}>DỊCH VỤ</p>}
          {NAV.slice(SERVICE_START_INDEX).filter(item => item.roles.includes(user.role || 'Admin')).map(({ path, icon: Icon, label }) => (
            <Link
              key={path} to={path}
              className={`${styles.navLink} ${location.pathname === path ? styles.active : ''}`}
              title={collapsed ? label : ''}
            >
              <Icon size={18} strokeWidth={2}/>
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          {!collapsed && (
            <div className={styles.userCard}>
              <div className={styles.avatar}>
                {user.hoTen?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className={styles.userName}>{user.hoTen || 'Admin'}</div>
                <div className={styles.userRole}>{user.role || 'Quản trị viên'}</div>
              </div>
            </div>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout} title={collapsed ? 'Đăng xuất' : ''}>
            <LogOut size={16}/>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className={`${styles.main} ${collapsed ? styles.mainCollapsed : ''}`}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.toggleBtn} onClick={() => setCollapsed(!collapsed)}>
              <Menu size={20} />
            </button>
            <div className={styles.breadcrumb}>
              Home <span>/</span> <span className={styles.pageTitle} style={{ fontSize: '14px', marginLeft: 0 }}>{title || 'Dashboard'}</span>
            </div>
          </div>
          <div className={styles.topActions}>

            {/* ── Bell Notification ── */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button
                className={styles.notifBtn}
                onClick={() => setBellOpen(!bellOpen)}
                style={{ position: 'relative' }}
                title="Thông báo"
              >
                <Bell size={17}/>
                {unread > 0 && (
                  <span className={styles.notifBadge} style={{
                    position: 'absolute', top: -5, right: -5,
                    background: '#ef4444', color: '#fff',
                    fontSize: 9, fontWeight: 900,
                    minWidth: 17, height: 17, borderRadius: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff', padding: '0 3px',
                    animation: 'bellPulse 2s ease-in-out infinite',
                  }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </button>

              {/* Notification panel */}
              {bellOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                  width: 380, background: '#fff',
                  border: '1px solid #e8edf5', borderRadius: 20,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)',
                  zIndex: 500, overflow: 'hidden',
                  animation: 'notifDropIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  fontFamily: '"Be Vietnam Pro", sans-serif',
                }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 18px 12px',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Thông báo</span>
                      {unread > 0 && (
                        <span style={{
                          background: '#ef4444', color: '#fff',
                          fontSize: 10, fontWeight: 900, padding: '2px 8px',
                          borderRadius: 100,
                        }}>{unread} mới</span>
                      )}
                    </div>
                    {unread > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{
                          fontSize: 11, fontWeight: 700, color: '#10b981',
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: '"Be Vietnam Pro", sans-serif',
                          padding: '4px 8px', borderRadius: 6,
                        }}
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>Không có thông báo nào</p>
                      </div>
                    ) : notifs.map(n => (
                      <div
                        key={n.id}
                        onClick={() => { markRead(n.id); navigate(n.link); setBellOpen(false) }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '13px 18px', cursor: 'pointer',
                          background: !n.read ? 'rgba(16,185,129,0.04)' : '#fff',
                          borderBottom: '1px solid #f8fafc',
                          transition: 'background 0.15s', position: 'relative',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = !n.read ? 'rgba(16,185,129,0.04)' : '#fff'}
                      >
                        {/* Icon */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 11,
                          background: '#f1f5f9', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>{n.icon}</div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.4, fontWeight: 500 }}>{n.desc}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: 600 }}>{n.time}</div>
                        </div>

                        {/* Unread dot */}
                        {!n.read && (
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#10b981', flexShrink: 0, marginTop: 4,
                          }}/>
                        )}

                        {/* Dismiss */}
                        <button
                          onClick={(e) => dismiss(n.id, e)}
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: '#cbd5e1', fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: 0, transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = 0 }}
                        >
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Link
                      to="/admin/bookings"
                      onClick={() => setBellOpen(false)}
                      style={{ fontSize: 13, fontWeight: 700, color: '#10b981', textDecoration: 'none' }}
                    >
                      Xem tất cả đặt lịch →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/" className={styles.viewSite} target="_blank">
              <Globe size={14}/> Xem trang web
            </Link>
            <div className={styles.adminInfo}>
              <div className={styles.adminAvatar}>
                {user.hoTen?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <span className={styles.adminName}>{user.hoTen || 'Admin'}</span>
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>

      <style>{`
        @keyframes notifDropIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bellPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}

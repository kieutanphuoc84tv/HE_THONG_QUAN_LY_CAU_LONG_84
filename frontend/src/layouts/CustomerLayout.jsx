import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, X, User, CalendarDays, Trophy, ChevronDown,
  LogOut, Package, Bell, Settings, Phone,
  MapPin, Clock, Mail
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import styles from './CustomerLayout.module.css'
import { gsap } from 'gsap'
import { API_BASE_URL } from '../services/api'
import socket from '../services/socket'
import { clearStoredAuth, getStoredToken, getStoredUser } from '../utils/authStorage'
import { FacebookIcon, InstagramIcon, YoutubeIcon } from '../components/SocialIcons'

const NAV = [
  { path: '/',           label: 'Trang chủ' },
  { 
    label: 'Dịch vụ',
    items: [
      { path: '/rental',   label: 'Thuê dụng cụ' },
      { path: '/training', label: 'Luyện tập' }
    ]
  },
  { path: '/courts',     label: 'Đặt sân' },
  {
    label: 'Giải đấu',
    items: [
      { path: '/tournaments', label: 'Danh sách giải' },
      { path: '/tournaments/results', label: 'Kết quả thi đấu' }
    ]
  },
  { path: '/pricing',    label: 'Gói Hội Viên' },
  { path: '/promotions', label: 'Khuyến mãi' },
  { path: '/services',   label: 'Giới thiệu' }
]

export default function CustomerLayout({ children }) {
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [userOpen,  setUserOpen]  = useState(false)
  const [bellOpen,  setBellOpen]  = useState(false)
  const [notifs,    setNotifs]    = useState([])
  const [scrolled,  setScrolled]  = useState(false)
  const [activeRentals, setActiveRentals] = useState(0)

  const location = useLocation()
  const navigate  = useNavigate()
  const bellRef   = useRef(null)
  const userRef   = useRef(null)

  const [currentUser, setCurrentUser] = useState(getStoredUser())
  const token      = getStoredToken()
  const isLoggedIn = !!(token && currentUser)
  const unread     = notifs.filter(n => !n.read).length

  useEffect(() => {
    const handleStorage = () => {
      setCurrentUser(getStoredUser())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleLogout = () => {
    clearStoredAuth()
    navigate('/login')
  }

  useEffect(() => {
    if (!isLoggedIn || !currentUser) return
    
    socket.connect()
    socket.emit('join', currentUser.id)

    socket.on('new_notification', (n) => {
      const mapped = {
        id: n.id_thongbao,
        icon: n.loai === 'chat' || n.loai === 'coach_message' ? '💬' : n.loai === 'tournament' ? '🏆' : n.loai === 'tournament_cancel' ? '❌' : '🔔',
        type: n.loai,
        title: n.tieude,
        desc: n.noidung,
        time: new Date(n.ngaytao).toLocaleString('vi-VN'),
        read: n.dadoct,
        link: n.link
      }
      setNotifs(prev => [mapped, ...prev])
    })

    import('../services/api').then(({ default: api }) => {
      api.get('/notifications')
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : []
          const realNotifs = data.map(n => ({
            id: n.id_thongbao,
            icon: n.loai === 'chat' || n.loai === 'coach_message' ? '💬' : n.loai === 'tournament' ? '🏆' : n.loai === 'tournament_cancel' ? '❌' : '🔔',
            type: n.loai,
            title: n.tieude,
            desc: n.noidung,
            time: new Date(n.ngaytao).toLocaleString('vi-VN'),
            read: n.dadoct,
            link: n.link
          }))
          setNotifs(realNotifs)
        })
        .catch(err => console.error("Error fetching notifications", err))

      api.get('/rentals/my-orders')
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : []
          const count = data.filter(x => x.TrangThai === 'DangThue').length
          setActiveRentals(count)
        })
        .catch(err => console.error("Error fetching rentals", err))
    })

    return () => {
      socket.disconnect()
    }
  }, [isLoggedIn, currentUser])

  /* Scroll handler */
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* Slide down navbar & Logo hover animations */
  useEffect(() => {
    gsap.fromTo(`.${styles.navbar}`,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.8)', delay: 0.2 }
    )

    const logoIcon = document.querySelector(`.${styles.logoIconWrap}`)
    if (logoIcon) {
      const handleMouseEnter = () => {
        gsap.to(logoIcon, {
          rotation: "+=360",
          scale: 1.3,
          duration: 0.4,
          ease: 'back.out(1.7)',
          yoyo: true,
          repeat: 1
        })
      }
      logoIcon.addEventListener('mouseenter', handleMouseEnter)
      return () => {
        logoIcon.removeEventListener('mouseenter', handleMouseEnter)
      }
    }
  }, [])

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handle = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const markAllRead = async () => {
    try {
      const api = (await import('../services/api')).default;
      await api.put('/notifications/read-all');
      setNotifs(n => n.map(x => ({ ...x, read: true })));
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả thông báo', err)
    }
  }
  const markRead = async (id) => {
    try {
      const api = (await import('../services/api')).default;
      await api.put(`/notifications/${id}/read`);
      setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    } catch (err) {
      console.error('Lỗi đánh dấu thông báo', err)
    }
  }
  const openNotification = async (n) => {
    await markRead(n.id)
    if (n.link) {
      setBellOpen(false)
      navigate(n.link)
    }
  }

  return (
    <div className={styles.root}>
      {/* ══════════ NAVBAR ══════════ */}
      <header className={`sticky top-0 left-0 right-0 z-[200] w-full flex justify-center px-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-5'}`}>
        <motion.div 
          className="flex items-center justify-between px-4 sm:px-8 py-2.5 sm:py-3.5 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-[98%] max-w-[1580px] border border-slate-100/60 transition-all duration-300"
          whileHover={{ y: -2, boxShadow: '0 20px 45px rgba(0,0,0,0.12)', backgroundColor: 'rgba(255, 255, 255, 1)' }}
          transition={{ duration: 0.3 }}
        >
          
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0 mr-4 lg:mr-8 xl:mr-10">
            <motion.div
              className="w-9 h-9 sm:w-11 sm:h-11 mr-2.5 sm:mr-3.5 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.3 }}
            >
              <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" className="w-full h-full object-contain" />
            </motion.div>
            <div className="hidden lg:flex flex-col">
              <span className="text-slate-900 font-black text-lg leading-none tracking-tight whitespace-nowrap">
                CẦU LÔNG <span className="text-[#10b981]">84</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-2">
            {NAV.map((item) => {
              const isActive = item.items 
                ? item.items.some(i => location.pathname.startsWith(i.path))
                : (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path));

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative group shrink-0"
                >
                  {item.items ? (
                    <>
                      <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer select-none ${isActive ? 'bg-emerald-50 text-[#10b981] shadow-sm' : 'text-slate-700 hover:bg-slate-100 hover:text-[#10b981]'}`}>
                        {item.label} <ChevronDown size={15} className="group-hover:rotate-180 transition-transform duration-200 text-slate-400 group-hover:text-[#10b981]" />
                      </div>
                      <div className="absolute top-full left-0 mt-2 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2.5 border border-slate-100 z-50">
                        {item.items.map(subItem => (
                          <Link key={subItem.path} to={subItem.path} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#10b981] transition-colors font-bold">
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link to={item.path} className={`px-3.5 py-2 rounded-xl text-sm font-extrabold transition-all block select-none ${isActive ? 'bg-emerald-50 text-[#10b981] shadow-sm' : 'text-slate-700 hover:bg-slate-100 hover:text-[#10b981]'}`}>
                      {item.label}
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isLoggedIn ? (
              <>
                <Link to="/messages" className="hidden sm:flex text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                  <Phone size={18}/>
                </Link>

                <div className="relative" ref={bellRef}>
                  <button
                    className={`relative p-2 rounded-full transition-colors ${bellOpen ? 'bg-emerald-50 text-[#10b981]' : 'text-slate-600 hover:bg-slate-100'}`}
                    onClick={() => { setBellOpen(!bellOpen); setUserOpen(false) }}
                  >
                    <Bell size={18}/>
                    {unread > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {bellOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={styles.notifPanel}
                      >
                        <div className={styles.notifHeader}>
                          <span className={styles.notifTitle}>
                            Thông báo {unread > 0 && <span className={styles.notifCount}>{unread} mới</span>}
                          </span>
                          {unread > 0 && (
                            <button className={styles.notifMarkAll} onClick={markAllRead}>
                              Đánh dấu tất cả đã đọc
                            </button>
                          )}
                        </div>

                        <div className={styles.notifList}>
                          {notifs.length === 0 ? (
                            <div className={styles.notifEmpty}>
                              <span style={{ fontSize: 36 }}>🔔</span>
                              <p>Không có thông báo nào</p>
                            </div>
                          ) : notifs.map(n => (
                            <div
                              key={n.id}
                              className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}
                              onClick={() => openNotification(n)}
                            >
                              <div className={styles.notifIcon}>{n.icon}</div>
                              <div className={styles.notifContent}>
                                <div className={styles.notifItemTitle}>{n.title}</div>
                                <div className={styles.notifDesc}>{n.desc}</div>
                                <div className={styles.notifTime}>{n.time}</div>
                              </div>
                              {!n.read && <div className={styles.notifDot}/>}
                            </div>
                          ))}
                        </div>

                        <div className={styles.notifFooter}>
                          <Link to="/my-bookings" onClick={() => setBellOpen(false)} className={styles.notifFooterLink}>
                            Xem tất cả lịch đặt →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div 
                  className="hidden sm:flex items-center gap-2 p-1 pr-3 rounded-full border bg-slate-50 border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => { setUserOpen(!userOpen); setBellOpen(false); }}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
                    {currentUser?.avatar 
                      ? <img src={currentUser.avatar.startsWith('http') ? currentUser.avatar : `${API_BASE_URL}${currentUser.avatar}`} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.hoTen || 'KH')}&background=10b981&color=fff` }} /> 
                      : <div className="w-full h-full bg-[#10b981] text-white flex items-center justify-center text-xs font-bold">{currentUser?.hoTen?.substring(0, 2).toUpperCase() || 'KH'}</div>}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 truncate max-w-[100px]">{currentUser?.hoTen?.split(' ').pop() || 'Khách'}</span>
                </div>
              </>
            ) : (
              <motion.div
                className="hidden xl:flex items-center gap-3 shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Link to="/login" className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-extrabold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">Đăng nhập</Link>
                <Link to="/login?tab=register" className="inline-flex items-center justify-center px-6 py-2.5 text-sm text-white bg-slate-900 rounded-full hover:bg-slate-800 transition-colors font-extrabold shadow-md hover:shadow-lg">
                  Đăng ký
                </Link>
              </motion.div>
            )}

            {/* Menu Button (Mobile Fullscreen / Desktop Dropdown) */}
            <div className={`relative ${!isLoggedIn ? 'xl:hidden' : ''}`} ref={userRef}>
              <motion.button 
                className={`flex items-center p-2 rounded-full transition-colors ${userOpen ? 'bg-slate-100 text-[#10b981]' : 'text-slate-700 hover:bg-slate-100'}`}
                onClick={() => {
                  if (isLoggedIn && window.innerWidth >= 1280) {
                    setUserOpen(!userOpen);
                    setBellOpen(false);
                  } else {
                    setMenuOpen(!menuOpen);
                  }
                }} 
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="h-6 w-6" />
              </motion.button>

              {isLoggedIn && (
                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={styles.dropdown}
                    >
                      <div className={styles.dropHeader}>
                        <div className={styles.dropAvatar}>
                          {currentUser?.avatar 
                            ? <img src={currentUser.avatar.startsWith('http') ? currentUser.avatar : `${API_BASE_URL}${currentUser.avatar}`} alt="avatar" style={{width: 40, height: 40, borderRadius: '50%', objectFit: 'cover'}} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.hoTen || 'KH')}&background=10b981&color=fff` }} /> 
                            : (currentUser?.hoTen?.substring(0, 2).toUpperCase() || 'KH')}
                        </div>
                        <div>
                          <div className={styles.dropName}>{currentUser?.hoTen}</div>
                          <div className={styles.dropEmail}>{currentUser?.email || 'Khách hàng thành viên'}</div>
                        </div>
                      </div>
                      {currentUser?.role === 'HuanLuyenVien' && (
                        <Link to="/coach/dashboard" className={styles.dropItem} style={{ color: '#10b981' }} onClick={() => setUserOpen(false)}><Settings size={15}/> Bảng điều khiển HLV</Link>
                      )}
                      <div className={styles.dropDivider}/>
                      <Link to="/profile"     className={styles.dropItem} onClick={() => setUserOpen(false)}><User size={15}/> Hồ sơ cá nhân</Link>
                      <Link to="/messages"    className={styles.dropItem} onClick={() => setUserOpen(false)}><Phone size={15}/> Liên hệ</Link>
                      <Link to="/my-bookings" className={styles.dropItem} onClick={() => setUserOpen(false)}><CalendarDays size={15}/> Lịch đặt sân</Link>
                      <Link to="/my-trainings" className={styles.dropItem} onClick={() => setUserOpen(false)}><CalendarDays size={15}/> Lịch tập luyện</Link>
                      <Link to="/my-rentals"  className={styles.dropItem} onClick={() => setUserOpen(false)}>
                        <Package size={15}/> Đơn thuê của tôi
                        {activeRentals > 0 && (
                          <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                            {activeRentals}
                          </span>
                        )}
                      </Link>
                      <Link to="/tournaments" className={styles.dropItem} onClick={() => setUserOpen(false)}><Trophy size={15}/> Giải đấu</Link>
                      <div className={styles.dropDivider}/>
                      {['Admin', 'QuanLy'].includes(currentUser?.role) && (
                        <Link to="/admin/dashboard" className={styles.dropItem} style={{ color: '#10b981' }} onClick={() => setUserOpen(false)}>
                          ⚙️ Trang Quản Lý
                        </Link>
                      )}
                      <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                        <LogOut size={15}/> Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="fixed inset-0 bg-white z-[300] pt-24 px-6 md:hidden overflow-y-auto"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <motion.button
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-700"
                onClick={() => setMenuOpen(false)}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.button>
              
              <div className="flex flex-col space-y-6 pb-12">
                {NAV.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.1 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    {item.items ? (
                      <div className="flex flex-col space-y-3">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                        <div className="flex flex-col pl-4 space-y-4 border-l-2 border-slate-100">
                          {item.items.map(subItem => (
                            <Link key={subItem.path} to={subItem.path} className="text-lg font-bold text-slate-800" onClick={() => setMenuOpen(false)}>
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link to={item.path} className="text-xl font-bold text-slate-800 block" onClick={() => setMenuOpen(false)}>
                        {item.label}
                      </Link>
                    )}
                  </motion.div>
                ))}

                {isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="pt-6 border-t border-slate-100 flex flex-col space-y-4"
                  >
                    <Link to="/profile" className="text-lg font-bold text-slate-700" onClick={() => setMenuOpen(false)}>Hồ sơ cá nhân</Link>
                    <Link to="/messages" className="text-lg font-bold text-slate-700" onClick={() => setMenuOpen(false)}>Liên hệ</Link>
                    <Link to="/my-bookings" className="text-lg font-bold text-slate-700" onClick={() => setMenuOpen(false)}>Lịch đặt sân</Link>
                    <Link to="/my-trainings" className="text-lg font-bold text-slate-700" onClick={() => setMenuOpen(false)}>Lịch tập luyện</Link>
                    <Link to="/my-rentals" className="text-lg font-bold text-slate-700" onClick={() => setMenuOpen(false)}>Đơn thuê của tôi</Link>
                    
                    {['Admin', 'QuanLy'].includes(currentUser?.role) && (
                      <Link to="/admin/dashboard" className="text-lg font-bold text-[#10b981]" onClick={() => setMenuOpen(false)}>Trang Quản Lý</Link>
                    )}
                    {currentUser?.role === 'HuanLuyenVien' && (
                      <Link to="/coach/dashboard" className="text-lg font-bold text-[#10b981]" onClick={() => setMenuOpen(false)}>Trang HLV</Link>
                    )}
                    <button className="text-lg font-bold text-red-500 text-left" onClick={() => { handleLogout(); setMenuOpen(false) }}>Đăng xuất</button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="pt-6"
                  >
                    <Link
                      to="/login"
                      className="flex items-center justify-center w-full px-5 py-4 mb-3 text-lg font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/login?tab=register"
                      className="flex items-center justify-center w-full px-5 py-4 text-lg font-bold text-white bg-slate-900 rounded-2xl transition-colors shadow-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Đăng ký ngay
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page content */}
      <main className={styles.main}>{children}</main>

      {/* ══════════ FOOTER ══════════ */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogoWrap}>
              <div className={styles.footerLogoIcon}>
                <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" className={styles.logoImage} />
              </div>
              <div className={styles.footerLogoName}>CẦU LÔNG <span>84</span></div>
            </div>
            <p className={styles.footerTagline}>
              Hệ thống quản lý sân cầu lông chuyên nghiệp tại Trà Vinh. Đặt sân nhanh chóng, trải nghiệm tuyệt vời.
            </p>
            <div className={styles.footerSocials}>
              <a href="#" className={styles.socialBtn} aria-label="Facebook">
                <FacebookIcon size={17} />
              </a>
              <a href="#" className={styles.socialBtn} aria-label="Instagram">
                <InstagramIcon size={17} />
              </a>
              <a href="#" className={styles.socialBtn} aria-label="YouTube">
                <YoutubeIcon size={18} />
              </a>
            </div>
          </div>

          <div className={styles.footerCol}>
            <div className={styles.footerTitle}>Dịch vụ</div>
            <Link to="/courts"      className={styles.footerLink}>Xem sân cầu lông</Link>
            <Link to="/booking"     className={styles.footerLink}>Đặt sân online</Link>
            <Link to="/rental"      className={styles.footerLink}>Thuê dụng cụ</Link>
            <Link to="/tournaments" className={styles.footerLink}>Giải đấu</Link>
            <Link to="/promotions"  className={styles.footerLink}>Khuyến mãi & Ưu đãi</Link>
          </div>

          <div className={styles.footerCol}>
            <div className={styles.footerTitle}>Tài khoản</div>
            <Link to="/login"       className={styles.footerLink}>Đăng nhập</Link>
            <Link to="/register"    className={styles.footerLink}>Đăng ký</Link>
            <Link to="/my-bookings" className={styles.footerLink}>Lịch đặt sân</Link>
            <Link to="/profile"     className={styles.footerLink}>Hồ sơ cá nhân</Link>
          </div>

          <div className={styles.footerCol}>
            <div className={styles.footerTitle}>Liên hệ</div>
            <a href="tel:0123456789" className={styles.footerLink}>
              <Phone className={styles.footerLinkIcon} size={15} /> 0123 456 789
            </a>
            <a href="#" className={styles.footerLink}>
              <MapPin className={styles.footerLinkIcon} size={15} /> Trà Vinh, Việt Nam
            </a>
            <a href="#" className={styles.footerLink}>
              <Clock className={styles.footerLinkIcon} size={15} /> 06:00 – 22:00
            </a>
            <a href="mailto:caulong84@gmail.com" className={styles.footerLink}>
              <Mail className={styles.footerLinkIcon} size={15} /> caulong84@gmail.com
            </a>
          </div>

          <div className={styles.footerCol} style={{ gap: 8 }}>
            <div className={styles.footerTitle}>Bản đồ</div>
            <div style={{ width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15694.04153915152!2d106.33535915!3d9.9328229!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0175ea296facb%3A0x55def92a29068a97!2zVHAuIFRyw6AgVmluaCwgVHLDoCBWaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1718090000000!5m2!1svi!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© 2026 Cầu Lông 84. Được phát triển tại Trà Vinh.</span>
        </div>
      </footer>
    </div>
  )
}

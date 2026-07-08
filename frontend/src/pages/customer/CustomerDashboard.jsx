import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CalendarDays, Package, ArrowRight, Activity, Clock, PlayCircle, Trophy, Zap, Users } from 'lucide-react'
import gsap from 'gsap'
import CustomerLayout from '../../layouts/CustomerLayout'
import api from '../../services/api'
import styles from './CustomerDashboard.module.css'
import { getStoredUser } from '../../utils/authStorage'

export default function CustomerDashboard() {
  const [data, setData] = useState({
    upcomingBookings: [],
    activeRentals: [],
    upcomingTrainings: [],
    totalBookings: 0,
    totalRentals: 0,
    totalTrainings: 0,
  })
  const [loading, setLoading] = useState(true)
  
  const user = getStoredUser({})
  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  // GSAP refs
  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const gridRef = useRef(null)
  const shuttleRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, rentalsRes, trainingsRes] = await Promise.all([
          api.get('/bookings/my-bookings'),
          api.get('/rentals/my-orders'),
          api.get('/training/my-trainings')
        ])

        const allBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : []
        const allRentals = Array.isArray(rentalsRes.data) ? rentalsRes.data : []
        const allTrainings = Array.isArray(trainingsRes.data) ? trainingsRes.data : []

        // Filter upcoming/active
        const upcomingBookings = allBookings
          .filter(b => b.TrangThai === 'DaXacNhan' || b.TrangThai === 'ChoXacNhan')
          .sort((a, b) => new Date(a.NgayDat) - new Date(b.NgayDat))
          .slice(0, 3)

        const activeRentals = allRentals
          .filter(r => r.TrangThai === 'DangThue' || r.TrangThai === 'ChoDuyet')
          .slice(0, 5)

        const upcomingTrainings = allTrainings
          .filter(t => t.TrangThai === 'DaXepLich' || t.TrangThai === 'DangDienRa')
          .sort((a, b) => new Date(a.NgayTap) - new Date(b.NgayTap))
          .slice(0, 3)

        setData({
          upcomingBookings,
          activeRentals,
          upcomingTrainings,
          totalBookings: allBookings.length,
          totalRentals: allRentals.filter(r => r.TrangThai === 'DangThue' || r.TrangThai === 'ChoDuyet').length,
          totalTrainings: allTrainings.length,
        })
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu dashboard", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // GSAP animations after data loaded
  useLayoutEffect(() => {
    if (loading) return

    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.from(heroRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })

      // Stats cards stagger
      gsap.from(`.${styles.statCard}`, {
        y: 40,
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.5)',
        delay: 0.3,
      })

      // Stats number count-up
      document.querySelectorAll(`.${styles.statValue}`).forEach(el => {
        const target = parseInt(el.dataset.value || '0', 10)
        if (target > 0) {
          gsap.fromTo(el, 
            { innerText: 0 },
            {
              innerText: target,
              duration: 1.2,
              delay: 0.6,
              ease: 'power2.out',
              snap: { innerText: 1 },
            }
          )
        }
      })

      // Bento cells stagger
      gsap.from(`.${styles.bentoCell}`, {
        y: 50,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.5,
      })

      // Floating shuttlecock
      if (shuttleRef.current) {
        gsap.to(shuttleRef.current, {
          y: -20,
          rotation: 15,
          duration: 3,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      }
    })

    return () => ctx.revert()
  }, [loading])

  if (loading) {
    return (
      <CustomerLayout>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Đang chuẩn bị bảng điều khiển...</p>
        </div>
      </CustomerLayout>
    )
  }

  const { upcomingBookings, activeRentals, upcomingTrainings, totalBookings, totalRentals, totalTrainings } = data

  const stats = [
    {
      icon: <CalendarDays size={20} />,
      value: totalBookings,
      label: 'Lịch đặt sân',
      bg: 'rgba(16, 185, 129, 0.12)',
      color: '#34d399',
    },
    {
      icon: <Package size={20} />,
      value: totalRentals,
      label: 'Đơn thuê active',
      bg: 'rgba(59, 130, 246, 0.12)',
      color: '#60a5fa',
    },
    {
      icon: <Activity size={20} />,
      value: totalTrainings,
      label: 'Buổi tập luyện',
      bg: 'rgba(249, 115, 22, 0.12)',
      color: '#fb923c',
    },
    {
      icon: <Trophy size={20} />,
      value: upcomingBookings.length + activeRentals.length + upcomingTrainings.length,
      label: 'Hoạt động sắp tới',
      bg: 'rgba(168, 85, 247, 0.12)',
      color: '#a78bfa',
    },
  ]

  return (
    <CustomerLayout>
      <div className={styles.pageWrap}>
        
        {/* Floating Decoration */}
        <div ref={shuttleRef} className={styles.floatingShuttle}>🏸</div>

        {/* ── Hero ──────────────────────────────────────── */}
        <div className={styles.hero} ref={heroRef}>
          <div className={styles.heroContent}>
            <div className={styles.heroLeft}>
              <div className={styles.heroLabel}>
                <Zap size={13} />
                Bảng điều khiển
              </div>
              <h1 className={styles.heroTitle}>
                {greeting}, <span>{user.hoTen?.split(' ').pop() || 'bạn'}!</span> <span className={styles.wave}>👋</span>
              </h1>
              <p className={styles.heroSub}>
                Theo dõi lịch đặt sân, đơn thuê dụng cụ và lịch tập luyện của bạn tại đây.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          {/* ── Stats Bar ──────────────────────────────── */}
          <div className={styles.statsBar} ref={statsRef}>
            {stats.map((s, i) => (
              <div key={i} className={styles.statCard}>
                <div className={styles.statIconWrap} style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue} data-value={s.value}>{s.value}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Bento Grid ─────────────────────────────── */}
          <div className={styles.bentoGrid} ref={gridRef}>
            
            {/* Cell 1: Next Booking (Primary - span 2) */}
            <div className={`${styles.bentoCell} ${styles.cellPrimary}`}>
              <div className={styles.cellHeader}>
                <div className={styles.cellIconWrap} style={{ background: 'rgba(255,255,255,0.12)', color: '#34d399' }}>
                  <CalendarDays size={20} />
                </div>
                <span className={styles.cellTitle}>Lịch Đặt Sân Tới</span>
              </div>
              
              {upcomingBookings.length > 0 ? (
                <div className={styles.bookingList}>
                  {upcomingBookings.map((b) => (
                    <div key={b.MaLichDat} className={styles.bookingItem}>
                      <div className={styles.bookingDate}>
                        <div className={styles.bookingMonth}>T{new Date(b.NgayDat).getMonth() + 1}</div>
                        <div className={styles.bookingDay}>{new Date(b.NgayDat).getDate()}</div>
                      </div>
                      <div className={styles.bookingInfo}>
                        <h4>{b.San?.TenSan || 'Đang cập nhật'}</h4>
                        <p><Clock size={12}/> {b.GioBatDau?.slice(0,5)} - {b.GioKetThuc?.slice(0,5)}</p>
                      </div>
                      <span className={`${styles.bookingBadge} ${b.TrangThai === 'DaXacNhan' ? styles.badgeConfirmed : styles.badgePending}`}>
                        {b.TrangThai === 'DaXacNhan' ? '✓ Đã xác nhận' : '⏳ Chờ duyệt'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyStateContainer}>
                  <span className={styles.emptyEmoji}>🏸</span>
                  <p>Chưa có lịch đặt nào sắp tới.</p>
                </div>
              )}
              
              <Link to="/booking" className={styles.cellLinkAction} style={{ background: 'rgba(255,255,255,0.08)', color: '#34d399', borderColor: 'rgba(255,255,255,0.1)' }}>
                <span>Đặt sân mới</span> <ArrowRight size={16} />
              </Link>
            </div>

            {/* Cell 2: Active Rentals */}
            <div className={styles.bentoCell}>
              <div className={styles.cellHeader}>
                <div className={styles.cellIconWrap} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
                  <Package size={20} />
                </div>
                <span className={styles.cellTitle}>Đơn Thuê Đang Hoạt Động</span>
              </div>

              {activeRentals.length > 0 ? (
                <div className={styles.listWrap}>
                  {activeRentals.map(r => {
                    const isWaiting = r.TrangThai === 'ChoDuyet'
                    return (
                      <div key={r.MaDonThue} className={styles.listItem}>
                        {r.HinhAnh ? (
                          <img src={r.HinhAnh} alt="" className={styles.itemImage} />
                        ) : (
                          <div className={styles.itemEmoji}>{isWaiting ? '⏳' : '📦'}</div>
                        )}
                        <div className={styles.itemInfo}>
                          <h4>{r.TenSanPham || 'Đơn thuê dụng cụ'}</h4>
                          <p>
                            SL: {r.SoLuong || 1} • {r.SoGio ? `${r.SoGio}h` : ''} • {(r.TongTien || 0).toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                        <span className={`${styles.rentalBadge} ${isWaiting ? styles.rentalWaiting : styles.rentalActive}`}>
                          {isWaiting ? 'Chờ xác nhận' : 'Đang thuê'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.emptyStateContainer}>
                  <span className={styles.emptyEmoji}>📦</span>
                  <p>Không có đơn thuê nào đang diễn ra.</p>
                </div>
              )}

              <Link to="/my-rentals" className={styles.cellLinkAction}>
                <span>Xem tất cả đơn thuê</span> <ArrowRight size={16} />
              </Link>
            </div>

            {/* Cell 3: Training Progress */}
            <div className={styles.bentoCell}>
              <div className={styles.cellHeader}>
                <div className={styles.cellIconWrap} style={{ background: 'rgba(249, 115, 22, 0.12)', color: '#fb923c' }}>
                  <Activity size={20} />
                </div>
                <span className={styles.cellTitle}>Lịch Tập Luyện</span>
              </div>

              {upcomingTrainings.length > 0 ? (
                <div className={styles.listWrap}>
                  {upcomingTrainings.map(t => (
                    <div key={t.MaLichTap} className={styles.listItem}>
                      <div className={styles.itemEmoji}>🎯</div>
                      <div className={styles.itemInfo}>
                        <h4>{t.HuanLuyenVien?.HoTen || 'Buổi tập'}</h4>
                        <p>{new Date(t.NgayTap).toLocaleDateString('vi-VN')} • {t.GioBatDau?.slice(0,5)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyStateContainer}>
                  <span className={styles.emptyEmoji}>🏆</span>
                  <p>Bạn chưa đăng ký lịch tập nào.</p>
                </div>
              )}

              <Link to="/training" className={styles.cellLinkAction}>
                <span>Xem khóa học</span> <ArrowRight size={16} />
              </Link>
            </div>

            {/* Cell 4: Quick Actions Banner */}
            <div className={`${styles.bentoCell} ${styles.cellFullWidth}`}>
              <div className={styles.quickActionsWrap}>
                <div className={styles.quickText}>
                  <h3>⚡ Sẵn sàng ra sân?</h3>
                  <p>Khám phá các dịch vụ và giải đấu sắp tới của chúng tôi.</p>
                </div>
                <div className={styles.quickButtons}>
                  <Link to="/courts" className={styles.actionBtn}>
                    <PlayCircle size={18}/> Xem danh sách sân
                  </Link>
                  <Link to="/tournaments" className={`${styles.actionBtn} ${styles.actionBtnOutline}`}>
                    <Trophy size={16}/> Tham gia giải đấu
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </CustomerLayout>
  )
}

import { useState, useEffect } from 'react'
import CustomerLayout from '../../layouts/CustomerLayout'
import { User, Phone, Mail, Star, Edit2, Save, X, Camera, CalendarDays, Package, ShieldCheck, Trophy, Crown } from 'lucide-react'
import api, { API_BASE_URL } from '../../services/api'
import styles from './ProfilePage.module.css'
import { getStoredUser, updateStoredUser } from '../../utils/authStorage'

export default function ProfilePage() {
  const [edit, setEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ HoTen: '', SoDienThoai: '' })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const loadProfile = async () => {
    setLoading(true)
    try {
      const r = await api.get('/members/profile')
      setProfile(r.data)
      setForm({ HoTen: r.data.HoTen || '', SoDienThoai: r.data.SoDienThoai || '' })
    } catch {
      setError('Không thể tải hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchProfile = async () => { await loadProfile() }
    fetchProfile()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchProfile()
    }
    window.addEventListener('focus', handleVisibility)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', handleVisibility)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put('/members/profile', form)
      setProfile(res.data)
      const user = getStoredUser({})
      updateStoredUser({
        ...user,
        hoTen: res.data.HoTen,
        soDienThoai: res.data.SoDienThoai,
      })
      setEdit(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setForm({ HoTen: profile?.HoTen || '', SoDienThoai: profile?.SoDienThoai || '' })
    setError('')
    setEdit(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    setUploadingAvatar(true)
    try {
      const res = await api.post('/members/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfile(res.data.user)
      const user = getStoredUser({})
      updateStoredUser({ ...user, avatar: res.data.user.Avatar })
      // Cập nhật lại custom event để Header tự update
      window.dispatchEvent(new Event('storage'))
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi tải ảnh lên')
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) return (
    <CustomerLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', color: '#64748b' }}>
        <div>⏳ Đang tải hồ sơ...</div>
      </div>
    </CustomerLayout>
  )

  const khachHang = profile?.KhachHang
  const bookings = khachHang?.LichDatSans || []
  const rentals = profile?.DonThues || []
  const avatarText = (profile?.HoTen || 'KH').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
  const points = khachHang?.DiemTichLuy || 0
  const activeBookings = bookings.filter(b => b.TrangThai !== 'DaHuy').length
  const paidBookings = bookings.filter(b => b.HoaDon?.TrangThai === 'DaThanhToan').length
  const totalRental = rentals.reduce((sum, item) => sum + (Number(item.TongTien) || 0), 0)
  const memberLevel = points >= 500 ? 'Hạng kim cương' : points >= 200 ? 'Hạng vàng' : points >= 80 ? 'Hạng bạc' : 'Hạng xanh'
  const membershipName = khachHang?.capbac || 'Khách vãng lai'
  const profileType = {
    Admin: 'Quản trị viên',
    QuanLy: 'Quản lý',
    ChuSan: 'Chủ sân',
    HuanLuyenVien: 'Huấn luyện viên',
  }[profile?.vaitro] || membershipName
  const membershipFee = khachHang?.phihoivien || 0
  const membershipExpiry = khachHang?.NgayHetHan ? new Date(khachHang.NgayHetHan).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
  const nextTarget = points >= 500 ? 500 : points >= 200 ? 500 : points >= 80 ? 200 : 80
  const pointProgress = nextTarget ? Math.min(100, Math.round((points / nextTarget) * 100)) : 100

  const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`
  const bookingStatus = (status) => ({
    DaXacNhan: { label: 'Đã xác nhận', cls: styles.statusSuccess },
    HoanThanh: { label: 'Hoàn thành', cls: styles.statusInfo },
    DaHuy: { label: 'Đã hủy', cls: styles.statusDanger },
    ChoXacNhan: { label: 'Chờ xác nhận', cls: styles.statusWarning },
  }[status] || { label: status || 'Chờ xác nhận', cls: styles.statusWarning })
  const rentalStatus = (status) => ({
    DangThue: { label: 'Đang xử lý', cls: styles.statusWarning },
    DaTraHang: { label: 'Đã hoàn tất', cls: styles.statusSuccess },
    DaHuy: { label: 'Đã hủy', cls: styles.statusDanger },
  }[status] || { label: status || 'Đang xử lý', cls: styles.statusWarning })

  return (
    <CustomerLayout>
      <div className={styles.page}>
        <section className={styles.heroCard}>
          <div>
            <p className={styles.eyebrow}>Hồ sơ thành viên</p>
            <h1>Xin chào, {profile?.HoTen || 'thành viên'}</h1>
            <p>Quản lý thông tin cá nhân, điểm tích lũy, lịch đặt sân và các đơn thuê dụng cụ của bạn.</p>
          </div>
          <div className={styles.heroBadges}>
            <div className={styles.heroBadge}>
              <Crown size={18} />
              <span>{membershipName}</span>
            </div>
            <div className={styles.heroBadge}>
              <Trophy size={18} />
              <span>{memberLevel}</span>
            </div>
          </div>
        </section>

        <div className={styles.grid}>
          {/* Profile card */}
          <div className={styles.profileCard}>
            <div className={styles.avatarWrap} onClick={() => document.getElementById('avatar-input').click()} style={{ cursor: 'pointer', position: 'relative' }}>
              {profile?.Avatar
                ? <img src={profile.Avatar.startsWith('http') ? profile.Avatar : `${API_BASE_URL}${profile.Avatar}`} alt="avatar" className={styles.avatarImg} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.HoTen || 'KH')}&background=10b981&color=fff` }} />
                : <div className={styles.avatar}>{avatarText}</div>
              }
              <div className={styles.avatarOverlay}>
                <Camera size={24} color="#fff" />
              </div>
              <input 
                id="avatar-input" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleAvatarUpload} 
              />
              {uploadingAvatar && <div className={styles.avatarLoading}>⏳</div>}
            </div>
            <div className={styles.profileName}>{profile?.HoTen}</div>
            <div className={styles.profileType}>
              {profileType}
            </div>
            <div className={styles.memberPlanCard}>
              <div className={styles.memberPlanIcon}><Crown size={18} /></div>
              <div>
                <strong>{membershipName}</strong>
                <span>Hạn dùng: {membershipExpiry}</span>
              </div>
            </div>
            <div className={styles.pointsCard}>
              <div className={styles.pointsIcon}><Star size={18} fill="currentColor" /></div>
              <div>
                <strong>{points}</strong>
                <span>điểm tích lũy</span>
              </div>
            </div>
            <div className={styles.progressWrap}>
              <div className={styles.progressMeta}>
                <span>{memberLevel}</span>
                <span>{points}/{nextTarget} điểm</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${pointProgress}%` }} />
              </div>
            </div>
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <strong>{activeBookings}</strong>
                <span>Lịch đặt</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <strong>{rentals.length}</strong>
                <span>Đơn thuê</span>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className={styles.detailCard}>
            <div className={styles.detailHead}>
              <h3>Thông tin cá nhân</h3>
              {edit ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                    <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button className={styles.cancelBtn} onClick={handleCancelEdit}><X size={14} /></button>
                </div>
              ) : (
                <button className={styles.editBtn} onClick={() => setEdit(true)}>
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
              )}
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <div className={styles.fieldGrid}>
              {[
                { label: 'Họ và tên', key: 'HoTen', icon: <User size={15} />, editable: true },
                { label: 'Số điện thoại', key: 'SoDienThoai', icon: <Phone size={15} />, editable: true },
                { label: 'Email', key: 'Email', icon: <Mail size={15} />, value: profile?.Email, editable: false },
                { label: 'Loại tài khoản', key: 'OAuthProvider', icon: <User size={15} />, value: profile?.OAuthProvider ? `OAuth (${profile.OAuthProvider})` : 'Email/Mật khẩu', editable: false },
              ].map(f => (
                <div className={styles.field} key={f.key}>
                  <label className={styles.inputLabel}>{f.label}</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>{f.icon}</span>
                    <input
                      className={styles.inputField}
                      value={f.value !== undefined ? f.value : (form[f.key] || '')}
                      disabled={!edit || !f.editable}
                      onChange={e => {
                        const val = f.key === 'SoDienThoai' ? e.target.value.replace(/\D/g, '') : e.target.value;
                        setForm(p => ({ ...p, [f.key]: val }));
                      }}
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <Crown size={20} />
            <div>
              <strong>{membershipName}</strong>
              <span>{membershipFee ? `${formatMoney(membershipFee)} · hết hạn ${membershipExpiry}` : `Hết hạn ${membershipExpiry}`}</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <CalendarDays size={20} />
            <div>
              <strong>{activeBookings}</strong>
              <span>Lịch sân gần đây</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <ShieldCheck size={20} />
            <div>
              <strong>{paidBookings}</strong>
              <span>Lịch đã thanh toán</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <Package size={20} />
            <div>
              <strong>{formatMoney(totalRental)}</strong>
              <span>Chi tiêu thuê</span>
            </div>
          </div>
        </div>

        {/* Booking history */}
        <div className={styles.historyGrid}>
          <div className={styles.historyCard}>
            <h3 className={styles.historyTitle}>Lịch sử đặt sân gần đây</h3>
            {bookings.length === 0 ? (
              <div className={styles.emptyState}>Bạn chưa có lịch đặt sân nào</div>
            ) : (
              <div className={styles.timelineList}>
                {bookings.map(b => {
                  const st = bookingStatus(b.TrangThai)
                  return (
                    <div className={styles.timelineItem} key={b.MaLichDat}>
                      <div className={styles.timelineIcon}><CalendarDays size={16} /></div>
                      <div className={styles.timelineBody}>
                        <div className={styles.timelineTop}>
                          <strong>{b.San?.TenSan || 'Sân cầu lông'}</strong>
                          <span className={`${styles.statusBadge} ${st.cls}`}>{st.label}</span>
                        </div>
                        <p>
                          {new Date(b.NgayDat).toLocaleDateString('vi-VN')} · {new Date(b.GioBatDau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(b.GioKetThuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span>{formatMoney(b.TongTien)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className={styles.historyCard}>
            <h3 className={styles.historyTitle}>Đơn thuê gần đây</h3>
            {rentals.length === 0 ? (
              <div className={styles.emptyState}>Bạn chưa có đơn thuê dụng cụ nào</div>
            ) : (
              <div className={styles.timelineList}>
                {rentals.map(r => {
                  const st = rentalStatus(r.TrangThai)
                  return (
                    <div className={styles.timelineItem} key={r.MaDonThue}>
                      <div className={styles.timelineIcon}><Package size={16} /></div>
                      <div className={styles.timelineBody}>
                        <div className={styles.timelineTop}>
                          <strong>{r.TenSanPham}</strong>
                          <span className={`${styles.statusBadge} ${st.cls}`}>{st.label}</span>
                        </div>
                        <p>
                          SL: {r.SoLuong}{r.SoGio ? ` · ${r.SoGio} giờ` : ''} · {r.NgayTao ? new Date(r.NgayTao).toLocaleDateString('vi-VN') : '—'}
                        </p>
                        <span>{formatMoney(r.TongTien)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

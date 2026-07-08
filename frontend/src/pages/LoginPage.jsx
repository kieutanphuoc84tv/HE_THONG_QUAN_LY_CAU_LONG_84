import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react'
import api, { API_BASE_URL } from '../services/api'
import styles from './LoginPage.module.css'
import { setStoredAuth } from '../utils/authStorage'

// SVG icons
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const OAUTH_ERROR_MESSAGES = {
  google: 'Đăng nhập Google thất bại. Vui lòng thử lại.',
  facebook: 'Đăng nhập Facebook thất bại. Vui lòng thử lại.',
  facebook_server: 'Lỗi server khi đăng nhập Facebook. Thử lại sau.',
  facebook_nouser: 'Không thể tạo tài khoản từ Facebook. Thử lại.',
}

function getPostLoginPath(user) {
  if (user?.role === 'Admin' || user?.role === 'QuanLy') return '/admin/dashboard'
  if (user?.role === 'HuanLuyenVien') return '/coach/dashboard'
  return '/'
}

function SocialBtns() {
  return (
    <div className={styles.socialBtns}>
      <a href={`${API_BASE_URL}/api/auth/google`} className={styles.socialBtn}>
        <GoogleIcon />
        <span>Google</span>
      </a>
      <a href={`${API_BASE_URL}/api/auth/facebook`} className={styles.socialBtn}>
        <FacebookIcon />
        <span>Facebook</span>
      </a>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const [tab, setTab]             = useState(initialTab)
  const [email, setEmail]         = useState('')
  const [matKhau, setMatKhau]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [hoTen, setHoTen]         = useState('')
  const [soDienThoai, setSoDienThoai] = useState('')
  const [reMatKhau, setReMatKhau] = useState('')
  const [loading, setLoading]     = useState(false)
  const [errorMsg, setErrorMsg]   = useState('')
  const [toast, setToast]         = useState(null)
  const [rememberLogin, setRememberLogin] = useState(false)

  // Xử lý lỗi OAuth redirect về
  useEffect(() => {
    const err = searchParams.get('error')
    if (err) {
      const timer = window.setTimeout(() => {
        setErrorMsg(OAUTH_ERROR_MESSAGES[err] || 'Đăng nhập thất bại. Vui lòng thử lại.')
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [searchParams])

  const showToast = (type, title, message, onClose) =>
    setToast({ type, title, message, onClose })

  const closeToast = () => {
    const currentToast = toast
    setToast(null)
    if (currentToast?.onClose) currentToast.onClose()
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        identifier: email, matKhau
      })
      const { token, user } = res.data
      setStoredAuth(token, user, rememberLogin)
      navigate(getPostLoginPath(user), { replace: true })
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Email/SĐT hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (matKhau !== reMatKhau) return setErrorMsg('Mật khẩu nhập lại không khớp!')
    if (matKhau.length < 6) return setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự!')
    setLoading(true)
    try {
      await api.post('/auth/register', {
        hoTen, email, soDienThoai, matKhau
      })
      showToast('success', 'Đăng ký thành công! ✅', 'Tài khoản của bạn đã được tạo. Bạn có thể đăng nhập ngay bây giờ.', () => {
        setTab('login')
        setMatKhau('')
        setReMatKhau('')
      })
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>

      {/* ── Left Branding Panel ── */}
      <div className={styles.left}>
        {/* Background image — người đánh cầu lông */}
        <img
          src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=900&auto=format&fit=crop&q=80"
          alt="Badminton player"
          className={styles.bgImage}
        />

        {/* Stripe overlays */}
        <div className={styles.stripes}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.stripe} />
          ))}
        </div>

        {/* Dark gradient top */}
        <div className={styles.gradientTop} />
        {/* Dark gradient bottom */}
        <div className={styles.gradientBottom} />

        {/* Glow ball decoration */}
        <div className={styles.glowBall} />

        {/* Content */}
        <Link to="/" className={styles.backBtn}>← Về trang chủ</Link>

        <div className={styles.leftContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" className={styles.logoImage} />
            </div>
            <div className={styles.logoText}>Cầu Lông <span className={styles.logoHighlight}>84</span></div>
          </div>
          <h2 className={styles.tagline}>Trải nghiệm<br />đẳng cấp mới</h2>
          <p className={styles.taglineSub}>Đặt sân, tham gia giải đấu và quản lý thành viên — tất cả trong một nền tảng.</p>
          <div className={styles.featureList}>
            {[
              { icon: '🏸', title: 'Đặt sân thông minh', desc: 'Đặt sân theo giờ, kiểm tra lịch trống thời gian thực' },
              { icon: '🏆', title: 'Giải đấu chuyên nghiệp', desc: 'Đăng ký và theo dõi kết quả giải đấu' },
              { icon: '💳', title: 'Thanh toán an toàn', desc: 'Hỗ trợ tiền mặt, chuyển khoản, VNPay' },
              { icon: '📊', title: 'Điểm tích lũy', desc: 'Nhận điểm mỗi lần đặt sân, đổi ưu đãi hấp dẫn' },
            ].map(f => (
              <div className={styles.featureItem} key={f.title}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <div className={styles.featureText}>
                  <div className={styles.featureTitle}>{f.title}</div>
                  <div className={styles.featureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>
              {tab === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
            </h1>
            <p className={styles.cardSub}>
              {tab === 'login'
                ? 'Đăng nhập để tiếp tục sử dụng hệ thống'
                : 'Điền thông tin bên dưới để đăng ký thành viên'}
            </p>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'login' ? styles.activeTab : ''}`}
              onClick={() => { setTab('login'); setErrorMsg('') }}>
              Đăng nhập
            </button>
            <button className={`${styles.tab} ${tab === 'register' ? styles.activeTab : ''}`}
              onClick={() => { setTab('register'); setErrorMsg('') }}>
              Đăng ký
            </button>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className={styles.errorBox}>
              <AlertCircle size={15} />
              {errorMsg}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Email hoặc số điện thoại</label>
                <div className={styles.inputWrap}>
                  <Mail size={15} className={styles.inputIcon} />
                  <input type="text" className={styles.inputField}
                    placeholder="email@example.com hoặc 09xx..."
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Mật khẩu</label>
                <div className={styles.inputWrap}>
                  <Lock size={15} className={styles.inputIcon} />
                  <input type={showPass ? 'text' : 'password'} className={styles.inputField}
                    placeholder="Nhập mật khẩu của bạn"
                    value={matKhau} onChange={e => setMatKhau(e.target.value)} required
                    style={{ paddingRight: 44 }} />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className={styles.rowSpace}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={rememberLogin}
                    onChange={(e) => setRememberLogin(e.target.checked)}
                  /> Ghi nhớ đăng nhập
                </label>
                <Link to="/forgot-password" className={styles.forgotLink}>Quên mật khẩu?</Link>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              <div className={styles.divider}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerText}>hoặc tiếp tục với</span>
                <span className={styles.dividerLine} />
              </div>
              <SocialBtns />
            </form>

          ) : (
            /* ── REGISTER FORM ── */
            <form onSubmit={handleRegister}>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Họ và tên</label>
                  <div className={styles.inputWrap}>
                    <User size={15} className={styles.inputIcon} />
                    <input type="text" className={styles.inputField}
                      placeholder="Nguyễn Văn A"
                      value={hoTen} onChange={e => setHoTen(e.target.value)} required />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Số điện thoại</label>
                  <div className={styles.inputWrap}>
                    <Phone size={15} className={styles.inputIcon} />
                    <input type="tel" className={styles.inputField}
                      placeholder="0901 234 567"
                      value={soDienThoai} onChange={e => setSoDienThoai(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Email</label>
                <div className={styles.inputWrap}>
                  <Mail size={15} className={styles.inputIcon} />
                  <input type="email" className={styles.inputField}
                    placeholder="email@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Mật khẩu</label>
                <div className={styles.inputWrap}>
                  <Lock size={15} className={styles.inputIcon} />
                  <input type={showPass ? 'text' : 'password'} className={styles.inputField}
                    placeholder="Tối thiểu 6 ký tự"
                    value={matKhau} onChange={e => setMatKhau(e.target.value)} required
                    style={{ paddingRight: 44 }} />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Nhập lại mật khẩu</label>
                <div className={styles.inputWrap}>
                  <Lock size={15} className={styles.inputIcon} />
                  <input type={showPass ? 'text' : 'password'} className={styles.inputField}
                    placeholder="Nhập lại mật khẩu"
                    value={reMatKhau} onChange={e => setReMatKhau(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
              </button>

              <div className={styles.divider}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerText}>hoặc đăng ký với</span>
                <span className={styles.dividerLine} />
              </div>
              <SocialBtns />
            </form>
          )}
        </div>
      </div>

      {/* ── TOAST BUBBLE ── */}
      {toast && (
        <div className={styles.toastOverlay} onClick={closeToast}>
          <div className={styles.toastBubble} onClick={e => e.stopPropagation()}>
            <div className={`${styles.toastIcon} ${toast.type === 'success' ? styles.toastIconSuccess : styles.toastIconError}`}>
              {toast.type === 'success' ? '✅' : '❌'}
            </div>
            <div className={styles.toastTitle}>{toast.title}</div>
            <div className={styles.toastMsg}>{toast.message}</div>
            <button className={styles.toastBtn} onClick={closeToast}>Tiếp tục →</button>
          </div>
        </div>
      )}
    </div>
  )
}

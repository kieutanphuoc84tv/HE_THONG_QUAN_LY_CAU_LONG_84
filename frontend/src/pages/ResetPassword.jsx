import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import api from '../services/api'
import styles from './LoginPage.module.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [rePassword, setRePassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) return setMsg({ type: 'error', text: 'Thiếu mã xác thực (token).' })
    if (password !== rePassword) return setMsg({ type: 'error', text: 'Mật khẩu không khớp!' })
    if (password.length < 6) return setMsg({ type: 'error', text: 'Mật khẩu phải từ 6 ký tự.' })

    setLoading(true)
    setMsg({ type: '', text: '' })
    try {
      await api.post('/auth/reset-password', { token, newPassword: password })
      alert('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.')
      navigate('/login')
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Lỗi đặt lại mật khẩu' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftContent} style={{ justifyContent: 'center' }}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" className={styles.logoImage} />
            </div>
            <div className={styles.logoText}>Cầu Lông <span className={styles.logoHighlight}>84</span></div>
          </div>
          <h2 className={styles.tagline}>Bảo mật tài khoản</h2>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card} style={{ maxWidth: 460 }}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Tạo mật khẩu mới</h1>
            <p className={styles.cardSub}>Nhập mật khẩu mới của bạn để hoàn tất việc khôi phục.</p>
          </div>

          {msg.text && (
            <div className={styles.errorBox} style={{ background: '#fef2f2', color: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <AlertCircle size={18} /> {msg.text}
            </div>
          )}

          {!token ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#ef4444', marginBottom: 20 }}>Link đặt lại mật khẩu không hợp lệ.</p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Về trang Đăng nhập</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Mật khẩu mới</label>
                <div className={styles.inputWrap}>
                  <Lock size={15} className={styles.inputIcon} />
                  <input type={showPass ? 'text' : 'password'} className={styles.inputField}
                    placeholder="Tối thiểu 6 ký tự"
                    value={password} onChange={e => setPassword(e.target.value)} required
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
                    value={rePassword} onChange={e => setRePassword(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Xác nhận đặt lại'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../services/api'
import styles from './LoginPage.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg({ type: '', text: '' })
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setMsg({ type: 'success', text: res.data.message || 'Đã gửi link khôi phục qua email của bạn.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Lỗi gửi yêu cầu' })
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
          <h2 className={styles.tagline}>Khôi phục tài khoản</h2>
          <p className={styles.taglineSub}>Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập.</p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card} style={{ maxWidth: 460 }}>
          <Link to="/login" className={styles.backBtn} style={{ position: 'static', marginBottom: 20, display: 'inline-flex' }}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} /> Quay lại Đăng nhập
          </Link>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Quên mật khẩu?</h1>
            <p className={styles.cardSub}>Nhập địa chỉ email mà bạn đã đăng ký, chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu.</p>
          </div>

          {msg.text && (
            <div className={msg.type === 'error' ? styles.errorBox : styles.successBox} style={{ background: msg.type === 'error' ? '#fef2f2' : '#f0fdf4', color: msg.type === 'error' ? '#ef4444' : '#16a34a', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Email của bạn</label>
              <div className={styles.inputWrap}>
                <Mail size={15} className={styles.inputIcon} />
                <input type="email" className={styles.inputField}
                  placeholder="email@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Gửi liên kết khôi phục'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

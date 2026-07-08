import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import CustomerLayout from '../../layouts/CustomerLayout'
import api from '../../services/api'
import './PricingPage.css'
import { getStoredToken, getStoredUser, updateStoredUser } from '../../utils/authStorage'

export default function PricingPage() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const user = getStoredUser()
  const isLoggedIn = !!(token && user)
  const storedPhone = user?.soDienThoai || user?.SoDienThoai || ''
  
  const [packages, setPackages] = useState([])
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [phoneInput, setPhoneInput] = useState(storedPhone)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    api.get('/packages').then(res => {
      setPackages(res.data.filter(p => p.trangthai === 'Đang bán'))
    }).catch(console.error)
  }, [])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const submitUpgrade = async (e) => {
    e.preventDefault()
    if (!phoneInput || phoneInput.trim() === '') {
      alert('Bạn bắt buộc phải cung cấp số điện thoại để đăng ký hội viên nhằm nâng cao bảo mật.')
      return
    }
    try {
      const res = await api.put('/members/profile/upgrade', { capbac: selectedPlan?.tengoi, sdt: phoneInput.trim() })
      const localUser = getStoredUser({})
      if (localUser) {
        if (!localUser.thanhVienClb) localUser.thanhVienClb = {}
        localUser.thanhVienClb.capbac = selectedPlan?.tengoi
        localUser.thanhVienClb.trangthai = 'Hoạt động'
        localUser.soDienThoai = phoneInput.trim()
        updateStoredUser(localUser)
      }
      showToast(res.data.message || 'Đăng ký thành công! 🎉')
      setIsMemberModalOpen(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Đăng ký lỗi. Vui lòng thử lại.')
    }
  }

  const handleRegister = (planObj) => {
    if (!isLoggedIn) {
      navigate('/login')
    } else {
      setSelectedPlan(planObj)
      setPhoneInput(storedPhone)
      setIsMemberModalOpen(true)
    }
  }

  const THEMES = [
    { bg: 'linear-gradient(135deg, #F59E0B, #D97706)', isPopular: true },
    { bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', isPopular: false },
    { bg: 'linear-gradient(135deg, #10b981, #047857)', isPopular: false },
  ]

  return (
    <CustomerLayout>
      <div className="pricing-page">

        {/* HERO */}
        <section className="pricing-hero">
          <div className="pricing-hero-inner">
            <p className="pricing-label">Bảng giá</p>
            <h1 className="pricing-title">Chọn gói phù hợp với bạn</h1>
            <p className="pricing-subtitle">
              Từ khách lẻ đến hội viên CLB — Cầu Lông 84 có gói dịch vụ phù hợp cho mọi nhu cầu.
            </p>
          </div>
        </section>

        {/* MEMBERSHIP PLANS */}
        <section className="pricing-plans">
          <div className="pricing-container">
            <div className="pricing-section-head">
              <p className="pricing-label">Đăng ký hội viên</p>
              <h2 className="pricing-section-title">Các gói hội viên</h2>
            </div>

            <div className="pricing-cards-grid">

              {/* Khách lẻ (Cố định) */}
              <div className="pricing-card pricing-card-khachle">
                <div className="pricing-card-body">
                  <h3 className="pricing-plan-name">Khách lẻ</h3>
                  <div className="pricing-price-wrap">
                    <span className="pricing-price-val">80K</span>
                    <span className="pricing-price-unit"> /giờ</span>
                  </div>
                  <p className="pricing-plan-desc">Phù hợp người chơi tự do, đặt sân theo giờ.</p>
                  <ul className="pricing-features-list">
                    <li><span className="pricing-check">✓</span> Đặt sân online</li>
                    <li><span className="pricing-check">✓</span> Thanh toán tại quầy</li>
                    <li><span className="pricing-check">✓</span> Thuê dụng cụ tại quầy</li>
                  </ul>
                  <button className="pricing-btn pricing-btn-outline" onClick={() => handleRegister({tengoi: 'Khách lẻ', giatien: 0})}>
                    Đăng ký hội viên
                  </button>
                </div>
              </div>

              {/* Gói Sinh Viên */}
              <div className="pricing-card pricing-card-sinhvien">
                <div className="pricing-popular-badge">Phổ biến</div>
                <div className="pricing-card-body">
                  <h3 className="pricing-plan-name">Gói Sinh Viên (1 Tháng)</h3>
                  <div className="pricing-price-wrap">
                    <span className="pricing-price-val">300K</span>
                    <span className="pricing-price-unit"> /tháng</span>
                  </div>
                  <p className="pricing-plan-desc">1 tháng quyền lợi cao cấp, ưu đãi hấp dẫn.</p>
                  <ul className="pricing-features-list">
                    <li><span className="pricing-check">✓</span> Giảm 10% tiền thuê sân, tặng 1 nước suối/buổi</li>
                  </ul>
                  <button className="pricing-btn pricing-btn-primary" onClick={() => handleRegister({tengoi: 'Gói Sinh Viên (1 Tháng)', giatien: 300000})}>
                    Đăng ký hội viên
                  </button>
                </div>
              </div>

              {/* Gói Phổ Thông */}
              <div className="pricing-card pricing-card-phothong">
                <div className="pricing-card-body">
                  <h3 className="pricing-plan-name">Gói Phổ Thông (3 Tháng)</h3>
                  <div className="pricing-price-wrap">
                    <span className="pricing-price-val">850K</span>
                    <span className="pricing-price-unit"> /tháng</span>
                  </div>
                  <p className="pricing-plan-desc">3 tháng quyền lợi cao cấp.</p>
                  <ul className="pricing-features-list">
                    <li><span className="pricing-check">✓</span> Giảm 15% tiền thuê sân, ưu tiên đặt sân giờ vàng</li>
                  </ul>
                  <button className="pricing-btn pricing-btn-outline" onClick={() => handleRegister({tengoi: 'Gói Phổ Thông (3 Tháng)', giatien: 850000})}>
                    Đăng ký hội viên
                  </button>
                </div>
              </div>

              {/* Gói VIP */}
              <div className="pricing-card pricing-card-vip">
                <div className="pricing-card-body">
                  <h3 className="pricing-plan-name">Gói VIP (1 Năm)</h3>
                  <div className="pricing-price-wrap">
                    <span className="pricing-price-val">3000K</span>
                    <span className="pricing-price-unit"> /tháng</span>
                  </div>
                  <p className="pricing-plan-desc">12 tháng quyền lợi cao cấp.</p>
                  <ul className="pricing-features-list">
                    <li><span className="pricing-check">✓</span> Giảm 30% tiền thuê sân, tặng 1 áo CLB, miễn phí giữ xe</li>
                  </ul>
                  <button className="pricing-btn pricing-btn-outline" onClick={() => handleRegister({tengoi: 'Gói VIP (1 Năm)', giatien: 3000000})}>
                    Đăng ký hội viên
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* RENTAL PRICING */}
        <section className="pricing-rental">
          <div className="pricing-container">
            <div className="pricing-section-head">
              <p className="pricing-label">Cho thuê dụng cụ</p>
              <h2 className="pricing-section-title">Bảng giá thuê dụng cụ</h2>
            </div>
            <div className="pricing-rental-grid">
              {[
                { icon: '🏟️', name: 'Thuê sân', price: '30.000đ/giờ', note: 'Sân tiêu chuẩn thi đấu' },
                { icon: '🏸', name: 'Thuê vợt', price: '20.000đ/giờ', note: 'Yonex, Victor, Lining' },
                { icon: '👟', name: 'Thuê giày', price: '20.000đ/giờ', note: 'Nhiều size, chính hãng' },
                { icon: '🔧', name: 'Đan vợt', price: 'Theo yêu cầu', note: 'Hỗ trợ tại quầy' },
                { icon: '🔩', name: 'Thay gen vợt', price: '190.000đ/bộ', note: 'Thợ lành nghề' },
                { icon: '👞', name: 'Thay đế giày', price: '350.000đ', note: 'Bảo hành chất lượng' },
                { icon: '🧹', name: 'Vệ sinh giày', price: '90.000đ', note: 'Sạch như mới' },
                { icon: '🛠️', name: 'Sửa giày', price: '50K - 100K', note: 'Tùy mức độ hư hỏng' },
              ].map((item) => (
                <div className="pricing-rental-card" key={item.name}>
                  <div className="pricing-rental-icon">{item.icon}</div>
                  <div className="pricing-rental-info">
                    <h4>{item.name}</h4>
                    <div className="pricing-rental-price">{item.price}</div>
                    <p>{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRAINING */}
        <section className="pricing-training">
          <div className="pricing-container">
            <div className="pricing-section-head">
              <p className="pricing-label">Khóa học</p>
              <h2 className="pricing-section-title">Bảng giá khóa học cầu lông</h2>
            </div>
            <div className="pricing-training-grid">
              <div className="pricing-training-card">
                <div className="pricing-training-icon">👥</div>
                <h3>Lớp nhóm lớn</h3>
                <p className="pricing-training-size">6-8 học viên / HLV / sân</p>
                <p className="pricing-training-desc">Phù hợp người mới bắt đầu, học cùng bạn bè, chi phí tiết kiệm.</p>
                <a href="tel:0783838484" className="pricing-training-contact">Liên hệ báo giá</a>
              </div>
              <div className="pricing-training-card pricing-training-featured">
                <div className="pricing-training-icon">🎯</div>
                <h3>Lớp nhóm nhỏ</h3>
                <p className="pricing-training-size">2-3 học viên / HLV / sân</p>
                <p className="pricing-training-desc">Được chú ý nhiều hơn, tiến bộ nhanh hơn với lớp học nhỏ.</p>
                <a href="tel:0783838484" className="pricing-training-contact">Liên hệ báo giá</a>
              </div>
            </div>
            <div className="pricing-training-note">
              <span>📞</span>
              <span>Liên hệ Thầy Phong để được tư vấn: <strong>078.383.8484</strong></span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pricing-cta">
          <div className="pricing-container">
            <div className="pricing-cta-box">
              <h2>Bắt đầu ngay hôm nay</h2>
              <p>Đặt sân hoặc đăng ký hội viên để nhận ưu đãi tốt nhất.</p>
              <div className="pricing-cta-btns">
                <Link to="/booking" className="pricing-cta-primary">Đặt sân ngay</Link>
                <a href="tel:0794258484" className="pricing-cta-secondary">Gọi: 079.425.8484</a>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* MEMBERSHIP MODAL */}
      {isMemberModalOpen && (
        <div className="pricing-modal-overlay" onClick={() => setIsMemberModalOpen(false)}>
          <div className="pricing-modal" onClick={(e) => e.stopPropagation()}>
            <button className="pricing-modal-close" onClick={() => setIsMemberModalOpen(false)}>✕</button>
            <p className="pricing-label">Đăng ký</p>
            <h2 className="pricing-modal-title">Hội viên câu lạc bộ</h2>

            <div className="pricing-modal-plan">
              <div>
                <div className="pricing-modal-plan-label">Gói đăng ký</div>
                <div className="pricing-modal-plan-name">{selectedPlan?.tengoi}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="pricing-modal-plan-label">Lệ phí</div>
                <div className="pricing-modal-plan-price">
                  {Number(selectedPlan?.giatien || 0).toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>

            <form onSubmit={submitUpgrade} className="pricing-modal-form">
              <div className="pricing-modal-field">
                <label>Họ và tên</label>
                <input type="text" readOnly value={user?.hoTen || ''} className="pricing-modal-input disabled" />
              </div>
              <div className="pricing-modal-field">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập số điện thoại của bạn..."
                  className="pricing-modal-input"
                />
              </div>
              <div className="pricing-modal-note">
                👉 Nếu bạn cập nhật số điện thoại ở đây, hệ thống sẽ tự động cập nhật vào tài khoản cá nhân của bạn.
              </div>
              <div className="pricing-modal-actions">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="pricing-modal-cancel">Hủy bỏ</button>
                <button type="submit" className="pricing-modal-submit">Xác nhận đăng ký</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div className="pricing-toast">{toastMsg}</div>
      )}

    </CustomerLayout>
  )
}

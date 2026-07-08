import CustomerLayout from '../../layouts/CustomerLayout'
import { Link } from 'react-router-dom'
import './AboutPage.css'

export default function AboutPage() {
  return (
    <CustomerLayout>
      <div className="about-page">

        {/* HERO */}
        <section className="about-hero">
          <div className="about-hero-inner">
            <p className="about-label">Về chúng tôi</p>
            <h1 className="about-title">Cầu Lông 84 — Đồng hành cùng đam mê cầu lông của bạn</h1>
            <p className="about-subtitle">
              Hệ thống sân cầu lông tiêu chuẩn thi đấu và cho thuê dụng cụ chuyên nghiệp tại Trà Vinh.
            </p>
          </div>
        </section>

        {/* STORY */}
        <section className="about-story">
          <div className="about-container">
            <div className="about-story-grid">
              <div className="about-story-text">
                <p className="about-label">Câu chuyện của chúng tôi</p>
                <h2 className="about-section-title">Hơn 3 năm đồng hành cùng cộng đồng cầu lông</h2>
                <p>
                  Cầu Lông 84 là hệ thống chuyên vận hành sân cầu lông tiêu chuẩn thi đấu và cho thuê dụng cụ chuyên nghiệp. Bên cạnh đó, chúng tôi còn vận hành hệ thống sân cầu lông tiêu chuẩn thi đấu phục vụ cho người chơi phong trào và chuyên nghiệp tại Trà Vinh.
                </p>
                <p>
                  Với hơn 3 chi nhánh trên địa bàn tỉnh Trà Vinh, Cầu Lông 84 tự hào mang đến trải nghiệm tập luyện và thi đấu trọn vẹn: từ cho thuê vợt - giày chất lượng cao, dịch vụ đan vợt – sửa giày chuyên nghiệp, cho đến cho thuê sân với mức giá hợp lý và các khóa huấn luyện cho mọi trình độ.
                </p>
                <div className="about-stats-grid">
                  <div className="about-stat-card">
                    <div className="about-stat-value">3+</div>
                    <div className="about-stat-label">Chi nhánh tại Trà Vinh</div>
                  </div>
                  <div className="about-stat-card">
                    <div className="about-stat-value">Chuẩn</div>
                    <div className="about-stat-label">Sân đạt chuẩn thi đấu</div>
                  </div>
                  <div className="about-stat-card">
                    <div className="about-stat-value">10+</div>
                    <div className="about-stat-label">Sân cầu lông tiêu chuẩn</div>
                  </div>
                  <div className="about-stat-card">
                    <div className="about-stat-value">5K+</div>
                    <div className="about-stat-label">Khách hàng tin tưởng</div>
                  </div>
                </div>
              </div>
              <div className="about-story-img">
                <img
                  src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80"
                  alt="Sân Cầu Lông 84"
                />
              </div>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="about-values">
          <div className="about-container">
            <div className="about-section-head">
              <p className="about-label">Giá trị cốt lõi</p>
              <h2 className="about-section-title">Những điều chúng tôi cam kết</h2>
            </div>
            <div className="about-values-grid">
              {[
                { icon: '🏆', title: 'Chất lượng hàng đầu', desc: 'Sân tập sạch sẽ, đèn sáng, mặt sân tốt. Dụng cụ chính hãng từ các thương hiệu uy tín.' },
                { icon: '💚', title: 'Tận tâm phục vụ', desc: 'Đội ngũ nhân viên nhiệt tình, am hiểu chuyên môn, luôn sẵn sàng hỗ trợ khách hàng.' },
                { icon: '💰', title: 'Giá cả hợp lý', desc: 'Cam kết mức giá cạnh tranh nhất thị trường, nhiều ưu đãi cho khách hàng thân thiết.' },
                { icon: '🌱', title: 'Phát triển cộng đồng', desc: 'Tổ chức giải đấu, khóa học, góp phần phát triển phong trào cầu lông tại địa phương.' },
              ].map((v) => (
                <div className="about-value-card" key={v.title}>
                  <div className="about-value-icon">{v.icon}</div>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section className="about-team">
          <div className="about-container">
            <div className="about-section-head">
              <p className="about-label">Đội ngũ</p>
              <h2 className="about-section-title">Huấn luyện viên của chúng tôi</h2>
            </div>
            <div className="about-team-grid">
              <div className="about-team-card">
                <div className="about-team-avatar">🏸</div>
                <h3>Thầy Phong</h3>
                <p className="about-team-role">Huấn luyện viên trưởng</p>
                <p className="about-team-desc">Hơn 10 năm kinh nghiệm huấn luyện cầu lông từ cơ bản đến nâng cao.</p>
                <a href="tel:0783838484" className="about-team-contact">📞 078.383.8484</a>
              </div>
              <div className="about-team-card">
                <div className="about-team-avatar">🎯</div>
                <h3>Đội ngũ HLV</h3>
                <p className="about-team-role">Huấn luyện viên</p>
                <p className="about-team-desc">Các HLV giàu kinh nghiệm, tận tâm với từng học viên ở mọi trình độ.</p>
                <a href="tel:0794258484" className="about-team-contact">📞 079.425.8484</a>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="about-contact">
          <div className="about-container">
            <div className="about-contact-grid">
              <div className="about-contact-info">
                <p className="about-label">Liên hệ</p>
                <h2 className="about-section-title">Tìm chúng tôi ở đây</h2>
                <div className="about-contact-items">
                  <div className="about-contact-item">
                    <span className="about-contact-icon">📍</span>
                    <span>Hẻm 93 Đường Đồng Khởi, Khóm 9, Phường 6, TP. Trà Vinh</span>
                  </div>
                  <div className="about-contact-item">
                    <span className="about-contact-icon">☎</span>
                    <span>079 425 8484 — 078 383 8484</span>
                  </div>
                  <div className="about-contact-item">
                    <span className="about-contact-icon">⏰</span>
                    <span>Mở cửa: 05:00 - 23:00 hàng ngày</span>
                  </div>
                </div>
                <div className="about-contact-btns">
                  <Link to="/booking" className="about-btn-primary">Đặt sân ngay</Link>
                  <Link to="/services" className="about-btn-secondary">Xem dịch vụ</Link>
                </div>
              </div>
              <div className="about-map">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.988019973685!2d106.347717!3d9.934898!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0175b9220556f%3A0x6b84000f074213f5!2zU8OibiBD4bqndSBMw7RuZyA4NA!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Bản đồ Cầu Lông 84"
                />
              </div>
            </div>
          </div>
        </section>

      </div>
    </CustomerLayout>
  )
}

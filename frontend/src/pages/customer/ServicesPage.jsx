import CustomerLayout from '../../layouts/CustomerLayout'
import { Link } from 'react-router-dom'
import './ServicesPage.css'

export default function ServicesPage() {
  return (
    <CustomerLayout>
      <div className="services-page">

        {/* HERO */}
        <section className="services-hero">
          <div className="services-hero-inner">
            <p className="services-label">Dịch vụ</p>
            <h1 className="services-title">Các dịch vụ của Cầu Lông 84</h1>
            <p className="services-subtitle">
              Cầu Lông 84 cung cấp đầy đủ dịch vụ từ cho thuê sân, dụng cụ đến sửa chữa và đào tạo chuyên nghiệp.
            </p>
          </div>
        </section>

        {/* QUICK SERVICES */}
        <section className="services-quick">
          <div className="services-container">
            <div className="services-quick-grid">

              <div className="services-quick-card">
                <div className="services-quick-icon">👟</div>
                <div>
                  <h3>Dịch vụ giày</h3>
                  <p>Thay đế giày: 350.000đ — Vệ sinh giày: 90.000đ — Sửa chữa vết nứt rách: 50.000 - 100.000đ</p>
                </div>
              </div>

              <div className="services-quick-card">
                <div className="services-quick-icon">🏸</div>
                <div>
                  <h3>Dịch vụ vợt</h3>
                  <p>Đan vợt: Theo yêu cầu — Thay gen: 190.000đ/bộ — Hàn vợt: 190.000đ/vết</p>
                </div>
              </div>

              <div className="services-quick-card">
                <div className="services-quick-icon">🏟️</div>
                <div>
                  <h3>Dịch vụ sân cầu lông</h3>
                  <p>Thuê sân: 30.000đ/h — Thuê vợt: 20.000đ/h — Thuê giày: 20.000đ/h</p>
                </div>
              </div>

              <div className="services-quick-card">
                <div className="services-quick-icon">🎓</div>
                <div>
                  <h3>Khóa học cầu lông</h3>
                  <p>Lớp 6-8 học viên/HLV/sân — Lớp 2-3 học viên/HLV/sân — Thầy Phong: 07.8383.8484</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* DANH MỤC CHO THUÊ */}
        <section className="services-catalog">
          <div className="services-container">
            <div className="services-section-head">
              <p className="services-label">Cho thuê dụng cụ</p>
              <h2 className="services-section-title">Các dịch vụ cho thuê</h2>
              <p className="services-section-desc">
                Cầu Lông 84 cung cấp dịch vụ cho thuê dụng cụ chất lượng cao từ các thương hiệu: Yonex, Victor, Lining, Mizuno, Kawasaki và nhiều hơn nữa.
              </p>
            </div>

            <div className="services-catalog-grid">
              {[
                { img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80', name: 'Vợt cầu lông', brand: 'Yonex, Victor, Lining' },
                { img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80', name: 'Giày cầu lông', brand: 'Yonex, Mizuno, Victor' },
                { img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', name: 'Quần áo cầu lông', brand: 'Yonex, Victor, Lining' },
                { img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', name: 'Váy cầu lông', brand: 'Nhiều size, nhiều form' },
              ].map((item) => (
                <div className="services-catalog-card" key={item.name}>
                  <div className="services-catalog-img">
                    <img src={item.img} alt={item.name} />
                  </div>
                  <div className="services-catalog-info">
                    <h3>{item.name}</h3>
                    <p>{item.brand}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TẠI SAO CHỌN */}
        <section className="services-why">
          <div className="services-container">
            <div className="services-section-head">
              <p className="services-label">Cam kết</p>
              <h2 className="services-section-title">Tại sao chọn Cầu Lông 84?</h2>
            </div>
            <div className="services-why-grid">
              {[
                { icon: '🏷️', title: 'Giá tốt nhất thị trường', desc: 'Cam kết giá cạnh tranh, nhiều chương trình khuyến mãi hấp dẫn quanh năm cho khách hàng thân thiết.' },
                { icon: '🔧', title: 'Dịch vụ sửa chữa chuyên nghiệp', desc: 'Hỗ trợ đan vợt, hàn vợt, thay gen và sửa giày bởi đội ngũ thợ lành nghề.' },
                { icon: '🏸', title: 'Sân tập tiêu chuẩn', desc: 'Hệ thống sân cầu lông sạch sẽ, đèn sáng, mặt sân tốt. Phù hợp cho cả phong trào lẫn thi đấu chuyên nghiệp.' },
                { icon: '🎓', title: 'Khóa học cầu lông', desc: 'Đội ngũ HLV giàu kinh nghiệm, giảng dạy từ cơ bản đến nâng cao cho mọi lứa tuổi.' },
                { icon: '🚚', title: 'Đặt sân dễ dàng', desc: 'Đặt lịch online nhanh chóng, quản lý lịch chơi dễ dàng và tiện lợi.' },
                { icon: '💬', title: 'Tư vấn tận tâm', desc: 'Đội ngũ am hiểu dịch vụ, tư vấn chọn vợt – giày – dây cước phù hợp với lối chơi của từng người.' },
              ].map((item) => (
                <div className="services-why-card" key={item.title}>
                  <div className="services-why-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="services-cta">
          <div className="services-container">
            <div className="services-cta-box">
              <h2>Sẵn sàng trải nghiệm?</h2>
              <p>Đặt sân ngay hôm nay hoặc liên hệ để được tư vấn miễn phí.</p>
              <div className="services-cta-btns">
                <Link to="/booking" className="services-cta-primary">Đặt sân ngay</Link>
                <a href="tel:0794258484" className="services-cta-secondary">Gọi: 079.425.8484</a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </CustomerLayout>
  )
}

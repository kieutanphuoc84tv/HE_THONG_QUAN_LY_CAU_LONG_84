import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CustomerLayout from '../../layouts/CustomerLayout';
import GooeyText from '../../components/GooeyText';
import ScrollAnimations from '../../components/ScrollAnimations';
import './HomePage.css';
import { getStoredToken, getStoredUser, updateStoredUser } from '../../utils/authStorage';
import { MdLocalOffer, MdBuild, MdEventAvailable, MdSportsTennis } from 'react-icons/md';
import { IoSchool, IoChatbubbles } from 'react-icons/io5';

const heroMorphTexts = [
  'Cầu Lông\n84',
  'Sân tốt nhất\nTrà Vinh',
  'Đặt sân nhanh\n30 giây',
  'Dịch vụ\nchuyên nghiệp',
];

export default function HomePage() {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const navigate = useNavigate();
  const token = getStoredToken();
  const user = getStoredUser();
  const isLoggedIn = !!(token && user);
  const storedPhone = user?.soDienThoai || user?.SoDienThoai || '';
  const [phoneInput, setPhoneInput] = useState(storedPhone);
  const membershipFees = {
    'Khách lẻ': '80.000đ',
    'Gói Sinh Viên (1 Tháng)': '300.000đ',
    'Gói Phổ Thông (3 Tháng)': '850.000đ',
    'Gói VIP (1 Năm)': '3.000.000đ',
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const submitUpgrade = async (e) => {
    e.preventDefault();
    if (!phoneInput || phoneInput.trim() === '') {
      alert('Bạn bắt buộc phải cung cấp số điện thoại để đăng ký hội viên nhằm nâng cao bảo mật.');
      return;
    }
    try {
      const res = await api.put('/members/profile/upgrade', { capbac: selectedPlan, sdt: phoneInput.trim() });

      // Update local storage user info
      const localUser = getStoredUser({});
      if (localUser) {
        if (!localUser.thanhVienClb) localUser.thanhVienClb = {};
        localUser.thanhVienClb.capbac = selectedPlan;
        localUser.thanhVienClb.trangthai = 'Hoạt động';
        localUser.soDienThoai = phoneInput.trim();
        updateStoredUser(localUser);
      }

      showToast(res.data.message || 'Đăng ký thành công! 🎉');
      setIsMemberModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Đăng ký lỗi. Vui lòng thử lại.');
    }
  };

  const openMemberModal = (plan) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setPhoneInput(storedPhone);
    setIsMemberModalOpen(true);
  };

  return (
    <CustomerLayout>
    <div className="home-shell bg-[#f8fafc] text-slate-900 font-['Be_Vietnam_Pro']">
      <ScrollAnimations />

      {/* HERO */}
      <section id="home" className="hero-bg pt-16 pb-24 md:pt-20 md:pb-32">
        <div className="max-w-7xl mx-auto px-5 grid lg:grid-cols-2 gap-10 items-center">
          <div className="hero-copy">
            <div data-animate="hero-badge" className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
              <span className="text-sm font-semibold text-[#10b981]">Cầu Lông 84 xin chào!</span>
            </div>

            <h1 data-animate="hero-title" className="heading hero-gooey-title" aria-label="Cầu Lông 84 - sân cầu lông tốt nhất Trà Vinh">
              <GooeyText
                texts={heroMorphTexts}
                morphTime={1.1}
                cooldownTime={1.05}
                textClassName="hero-gooey-text"
              />
            </h1>

            <p data-animate="hero-desc" className="mt-6 text-slate-700 max-w-xl leading-relaxed">
              Điểm đến cầu lông tốt nhất tại Trà Vinh: sân tập tiêu chuẩn, đặt lịch nhanh và dịch vụ thuê dụng cụ chuyên nghiệp cho mọi trình độ.
            </p>

            <div data-animate="hero-ctas" className="mt-9 flex flex-wrap gap-4">
              <Link to="/services" className="bg-[#10b981] text-white px-7 py-4 rounded-full font-extrabold hover:bg-[#059669]">
                Xem dịch vụ
              </Link>
              <a href="tel:0794258484" className="bg-white border border-slate-200 text-slate-900 px-7 py-4 rounded-full font-extrabold hover:bg-white/20">
                Gọi ngay: 079.425.8484
              </a>
            </div>

          </div>

          <div className="hero-visual hidden lg:block">
            <div className="hero-court-card">
              <img src="/images/hero_bg.png" alt="Sân cầu lông Cầu Lông 84" />
              <div data-animate="hero-panel" className="hero-visual-panel">
                <span>Lịch hôm nay</span>
                <strong>12 sân trống</strong>
                <small>Đặt nhanh trong 30 giây</small>
              </div>
            </div>
            <div data-animate="hero-float-top" className="hero-floating-card hero-floating-card-top">
              <span className="hero-floating-dot"></span>
              Sân tập chuyên nghiệp
            </div>
            <div data-animate="hero-float-bottom" className="hero-floating-card hero-floating-card-bottom">
              <strong>70K</strong>
              <span>/ giờ tiêu chuẩn</span>
            </div>
          </div>
        </div>
      </section>

      {/* STORYTELLING */}
      <section className="story-section">

        {/* Chương 1 */}
        <div data-animate="story-chapter" className="story-chapter story-chapter-light">
          <div className="story-container">
            <div className="story-text-block">
              <span className="story-chapter-num">01</span>
              <h2 className="story-heading">Tất cả bắt đầu từ một đam mê</h2>
              <p className="story-body">
                Năm 2020, giữa những con hẻm nhỏ của Trà Vinh, một sân cầu lông nhỏ ra đời — không hoành tráng, không quảng cáo rầm rộ. Chỉ là tình yêu với môn thể thao này và mong muốn mang đến một nơi tập luyện đàng hoàng cho người dân địa phương.
              </p>
              <p className="story-body">
                Người sáng lập — một tay vợt nghiệp dư — hiểu rõ cảm giác phải chạy khắp nơi tìm sân, thuê vợt cũ kỹ, hay không có ai hướng dẫn kỹ thuật đúng cách. Và từ đó, <strong>Cầu Lông 84</strong> được sinh ra.
              </p>
            </div>
            <div className="story-img-block">
              <img src="/images/story_1_court.png" alt="Sân Cầu Lông 84" />
              <div className="story-img-caption">Sân đầu tiên — nơi mọi thứ bắt đầu</div>
            </div>
          </div>
        </div>

        {/* Chương 2 */}
        <div data-animate="story-chapter" className="story-chapter story-chapter-dark">
          <div className="story-container story-reverse">
            <div className="story-img-block">
              <img src="/images/story_2_community.png" alt="Cộng đồng cầu lông" />
              <div className="story-img-caption story-caption-dark">Cộng đồng ngày càng lớn mạnh</div>
            </div>
            <div className="story-text-block">
              <span className="story-chapter-num story-num-green">02</span>
              <h2 className="story-heading story-heading-white">Từ 1 sân đến cả cộng đồng</h2>
              <p className="story-body story-body-light">
                Chỉ sau vài tháng, tiếng lành đồn xa. Những buổi sáng sớm 5 giờ, sân đã kín người. Học sinh, công nhân, người về hưu — tất cả cùng nhau trên một mặt sân. Cầu Lông 84 không chỉ là nơi tập luyện, mà trở thành điểm hẹn của cả một cộng đồng.
              </p>
              <p className="story-body story-body-light">
                Chúng tôi mở rộng thêm chi nhánh, đầu tư hệ thống đèn LED chuẩn thi đấu, sàn gỗ chống trơn và dụng cụ chính hãng từ Yonex, Victor, Mizuno. Mỗi đồng đầu tư đều hướng đến một mục tiêu: <em>người chơi xứng đáng được trải nghiệm tốt nhất.</em>
              </p>
            </div>
          </div>
        </div>

        {/* Chương 3 — CTA */}
        <div data-animate="story-chapter" className="story-chapter story-chapter-green">
          <div className="story-container story-center">
            <span className="story-chapter-num story-num-white">03</span>
            <h2 className="story-heading story-heading-white" style={{ textAlign: 'center' }}>
              Câu chuyện tiếp theo — là của bạn
            </h2>
            <p className="story-body story-body-light" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 36px' }}>
              Dù bạn là người mới cầm vợt lần đầu hay tay vợt kỳ cựu đang tìm sân chất lượng — Cầu Lông 84 luôn có chỗ cho bạn. Hãy đến và viết tiếp câu chuyện của mình.
            </p>
            <div className="story-cta-btns">
              <Link to="/booking" className="story-btn-primary">Đặt sân ngay</Link>
              <Link to="/about" className="story-btn-secondary">Tìm hiểu thêm</Link>
            </div>
          </div>
        </div>

      </section>

      {/* GIỚI THIỆU */}
      <section id="about" data-animate="about-section" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-[#10b981] font-extrabold text-sm uppercase tracking-widest">Về chúng tôi</p>
              <h2 className="heading text-4xl md:text-5xl mt-3 leading-tight">Cầu Lông 84 — Đồng hành cùng đam mê cầu lông của bạn</h2>
              <p className="text-slate-600 mt-6 leading-relaxed">
                Cầu Lông 84 là hệ thống chuyên vận hành sân cầu lông tiêu chuẩn thi đấu và cho thuê dụng cụ chuyên nghiệp. Bên cạnh đó, chúng tôi còn vận hành hệ thống sân cầu lông tiêu chuẩn thi đấu phục vụ cho người chơi phong trào và chuyên nghiệp tại Trà Vinh.
              </p>
              <p className="text-slate-600 mt-4 leading-relaxed">
                Với hơn 3 chi nhánh trên địa bàn tỉnh Trà Vinh, Cầu Lông 84 tự hào mang đến trải nghiệm tập luyện và thi đấu trọn vẹn: từ cho thuê vợt - giày chất lượng cao, dịch vụ đan vợt – sửa giày chuyên nghiệp, cho đến cho thuê sân với mức giá hợp lý và các khóa huấn luyện cho mọi trình độ.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-8">
                <div className="glass rounded-xl p-4">
                  <div data-animate="stat" data-count="3" data-suffix="+" className="text-[#10b981] font-bold text-2xl">3+</div>
                  <div className="text-sm text-slate-500 mt-1">Chi nhánh tại Trà Vinh</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div data-animate="stat" data-count="Chuẩn" className="text-[#10b981] font-bold text-2xl">Chuẩn</div>
                  <div className="text-sm text-slate-500 mt-1">Sân đạt chuẩn</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div data-animate="stat" data-count="10" data-suffix="+" className="text-[#10b981] font-bold text-2xl">10+</div>
                  <div className="text-sm text-slate-500 mt-1">Sân cầu lông tiêu chuẩn</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div data-animate="stat" data-count="5" data-suffix="K+" className="text-[#10b981] font-bold text-2xl">5K+</div>
                  <div className="text-sm text-slate-500 mt-1">Khách hàng tin tưởng</div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <img className="rounded-[2rem] border border-slate-200 shadow-2xl w-full" src="/images/about_professional_court.png" alt="Sân Cầu Lông 84" />
            </div>
          </div>
        </div>
      </section>

      {/* TẠI SAO CHỌN CẦU LÔNG 84 */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-[#10b981] font-extrabold text-sm uppercase tracking-widest">Cam kết</p>
            <h2 className="heading text-4xl md:text-5xl mt-3">Tại sao chọn Cầu Lông 84?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div data-animate="feature-card" className="glass rounded-2xl p-6 hover:border-lime-400/30 transition-all duration-300">
              <div className="text-[#10b981] text-4xl mb-4">
                <MdLocalOffer />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Giá tốt nhất thị trường</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Cam kết giá cạnh tranh, nhiều chương trình khuyến mãi hấp dẫn quanh năm cho khách hàng thân thiết.</p>
            </div>
            <div data-animate="feature-card" className="glass rounded-2xl p-6 hover:border-lime-400/30 transition-all duration-300">
              <div className="text-[#10b981] text-4xl mb-4">
                <MdBuild />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Dịch vụ sửa chữa chuyên nghiệp</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Hỗ trợ đan vợt, hàn vợt, thay gen và sửa giày bởi đội ngũ thợ lành nghề.</p>
            </div>
            <div data-animate="feature-card" className="glass rounded-2xl p-6 hover:border-lime-400/30 transition-all duration-300">
              <div className="text-[#10b981] text-4xl mb-4">
                <MdSportsTennis />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Sân tập tiêu chuẩn</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Hệ thống sân cầu lông sạch sẽ, đèn sáng, mặt sân tốt. Phù hợp cho cả phong trào lẫn thi đấu chuyên nghiệp.</p>
            </div>
            <div data-animate="feature-card" className="glass rounded-2xl p-6 hover:border-lime-400/30 transition-all duration-300">
              <div className="text-[#10b981] text-4xl mb-4">
                <IoSchool />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Khóa học cầu lông</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Đội ngũ HLV giàu kinh nghiệm, giảng dạy từ cơ bản đến nâng cao cho mọi lứa tuổi.</p>
            </div>
            <div data-animate="feature-card" className="glass rounded-2xl p-6 hover:border-lime-400/30 transition-all duration-300">
              <div className="text-[#10b981] text-4xl mb-4">
                <MdEventAvailable />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Đặt sân dễ dàng</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Đặt lịch online nhanh chóng, quản lý lịch chơi dễ dàng và tiện lợi.</p>
            </div>
            <div data-animate="feature-card" className="glass rounded-2xl p-6 hover:border-lime-400/30 transition-all duration-300">
              <div className="text-[#10b981] text-4xl mb-4">
                <IoChatbubbles />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Tư vấn tận tâm</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Đội ngũ am hiểu dịch vụ, tư vấn chọn vợt – giày – dây cước phù hợp với lối chơi của từng người.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-5">
          <div data-animate="pricing-heading" className="text-center">
            <p className="text-[#10b981] font-extrabold text-sm uppercase tracking-widest">Bảng giá</p>
            <h2 className="heading text-5xl md:text-6xl mt-3">Đăng ký hội viên</h2>
          </div>

          <div className="uv-grid mt-12">

            {/* --- Card 1: Khách lẻ --- */}
            <div data-animate="pricing-card" className="uv-pack">
              <div className="uv-header">
                <p className="uv-title">Khách lẻ</p>
                <div className="uv-price-container">
                  <span className="uv-price-main">80K</span>
                  <span className="uv-price-unit">/giờ</span>
                </div>
              </div>
              <ul className="uv-lists">
                <li className="uv-list" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', paddingBottom: 10, display: 'block' }}>
                  Phù hợp người chơi tự do, đặt sân theo giờ.
                </li>
                {['Đặt sân online', 'Thanh toán tại quầy', 'Thuê dụng cụ tại quầy'].map(f => (
                  <li className="uv-list" key={f}>
                    <span><svg aria-hidden="true" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" fill="none"><path d="M4.5 12.75l6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"/></svg></span>
                    <p>{f}</p>
                  </li>
                ))}
              </ul>
              <div className="uv-btn-wrap">
                <button type="button" onClick={() => openMemberModal('Khách lẻ')}>
                  Đăng ký hội viên
                </button>
              </div>
            </div>

            {/* --- Card 2: Gói Sinh Viên --- */}
            <div data-animate="pricing-card" className="uv-pack uv-pack-popular">
              <div className="uv-popular-badge">Phổ biến</div>
              <div className="uv-header">
                <p className="uv-title">Gói Sinh Viên (1 Tháng)</p>
                <div className="uv-price-container">
                  <span className="uv-price-main">300K</span>
                  <span className="uv-price-unit">/tháng</span>
                </div>
              </div>
              <ul className="uv-lists">
                <li className="uv-list" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', paddingBottom: 10, display: 'block' }}>
                  1 tháng quyền lợi cao cấp.
                </li>
                {['Giảm 10% tiền thuê sân, tặng 1 nước suối/buổi'].map(f => (
                  <li className="uv-list" key={f}>
                    <span><svg aria-hidden="true" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" fill="none"><path d="M4.5 12.75l6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"/></svg></span>
                    <p>{f}</p>
                  </li>
                ))}
              </ul>
              <div className="uv-btn-wrap">
                <button type="button" onClick={() => openMemberModal('Gói Sinh Viên (1 Tháng)')}>Đăng ký hội viên</button>
              </div>
            </div>

            {/* --- Card 3: Gói Phổ Thông --- */}
            <div data-animate="pricing-card" className="uv-pack">
              <div className="uv-header">
                <p className="uv-title">Gói Phổ Thông (3 Tháng)</p>
                <div className="uv-price-container">
                  <span className="uv-price-main">850K</span>
                  <span className="uv-price-unit">/tháng</span>
                </div>
              </div>
              <ul className="uv-lists">
                <li className="uv-list" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', paddingBottom: 10, display: 'block' }}>
                  3 tháng quyền lợi cao cấp.
                </li>
                {['Giảm 15% tiền thuê sân, ưu tiên đặt sân giờ vàng'].map(f => (
                  <li className="uv-list" key={f}>
                    <span><svg aria-hidden="true" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" fill="none"><path d="M4.5 12.75l6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"/></svg></span>
                    <p>{f}</p>
                  </li>
                ))}
              </ul>
              <div className="uv-btn-wrap">
                <button type="button" onClick={() => openMemberModal('Gói Phổ Thông (3 Tháng)')}>Đăng ký hội viên</button>
              </div>
            </div>

            {/* --- Card 4: Gói VIP --- */}
            <div data-animate="pricing-card" className="uv-pack">
              <div className="uv-header">
                <p className="uv-title">Gói VIP (1 Năm)</p>
                <div className="uv-price-container">
                  <span className="uv-price-main">3000K</span>
                  <span className="uv-price-unit">/tháng</span>
                </div>
              </div>
              <ul className="uv-lists">
                <li className="uv-list" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', paddingBottom: 10, display: 'block' }}>
                  12 tháng quyền lợi cao cấp.
                </li>
                {['Giảm 30% tiền thuê sân, tặng 1 áo CLB, miễn phí giữ xe'].map(f => (
                  <li className="uv-list" key={f}>
                    <span><svg aria-hidden="true" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" fill="none"><path d="M4.5 12.75l6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"/></svg></span>
                    <p>{f}</p>
                  </li>
                ))}
              </ul>
              <div className="uv-btn-wrap">
                <button type="button" onClick={() => openMemberModal('Gói VIP (1 Năm)')}>Đăng ký hội viên</button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MEMBERSHIP REGISTRATION MODAL */}
      <div id="memberModal" className={`modal fixed inset-0 z-[9999] items-center justify-center overflow-y-auto bg-black/70 px-5 py-6 ${isMemberModalOpen ? 'show' : ''}`}>
        <div className="bg-[#ffffff] border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative shadow-2xl">
          <button onClick={() => setIsMemberModalOpen(false)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500">
            ✕
          </button>

          <p className="text-[#10b981] font-extrabold text-sm uppercase tracking-widest">Đăng ký</p>
          <h2 className="heading text-4xl mt-2">Hội viên câu lạc bộ</h2>

          <div className="mt-6 bg-emerald-50 border border-emerald-200/50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 uppercase font-extrabold tracking-wider">Gói đăng ký</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{selectedPlan}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase font-extrabold tracking-wider">Lệ phí</div>
              <div className="text-2xl font-extrabold text-[#10b981] mt-1">
                {membershipFees[selectedPlan] || '0đ'}
              </div>
            </div>
          </div>

          <form onSubmit={submitUpgrade} className="space-y-4 mt-6">
            <div>
              <label className="text-sm text-slate-600 font-bold block mb-1">Họ và tên</label>
              <input type="text" readOnly value={user?.hoTen || ''} className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 outline-none text-slate-500 cursor-not-allowed" />
            </div>

            <div>
              <label className="text-sm text-slate-600 font-bold block mb-1">Số điện thoại</label>
              <input type="text" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))} placeholder="Nhập số điện thoại của bạn..." className="w-full bg-white border border-slate-300 focus:border-lime-500 rounded-2xl px-4 py-3 outline-none text-slate-900 transition" />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-xs text-slate-500 leading-relaxed">
                👉 Nếu bạn cập nhật số điện thoại ở đây, hệ thống sẽ tự động cập nhật vào tài khoản cá nhân của bạn.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button type="button" onClick={() => setIsMemberModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl font-bold hover:bg-slate-200 transition">
                Hủy bỏ
              </button>
              <button type="submit" className="flex-1 bg-[#10b981] text-white px-6 py-4 rounded-2xl font-extrabold hover:bg-[#059669] transition shadow-lg shadow-emerald-500/20">
                Xác nhận đăng ký
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TOAST */}
      <div id="toast" className={`toast fixed bottom-5 right-5 z-50 bg-[#10b981] text-white px-6 py-4 rounded-2xl font-extrabold shadow-2xl ${toastMsg ? 'show' : ''}`}>
        {toastMsg}
      </div>

    </div>
    </CustomerLayout>
  );
}

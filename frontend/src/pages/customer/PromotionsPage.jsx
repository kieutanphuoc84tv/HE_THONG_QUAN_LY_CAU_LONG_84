import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Search, Copy, Check, Calendar, Tag, Sparkles, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import api from '../../services/api';
import CustomerLayout from '../../layouts/CustomerLayout';
import styles from './PromotionsPage.module.css';

export default function PromotionsPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const gridRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    api.get('/vouchers')
      .then(res => {
        setVouchers(res.data || []);
      })
      .catch(err => {
        console.error('Lỗi lấy danh sách khuyến mãi:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // GSAP animation cho Hero & Grid cards
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.children,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, []);

  const filteredVouchers = vouchers.filter(v => {
    const matchSearch = (v.makhuyenmai || '').toLowerCase().includes(search.toLowerCase()) ||
                        (v.tenkhuyenmai || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (activeTab === 'ACTIVE') return v.trangthai === 'Đang diễn ra';
    if (activeTab === 'UPCOMING') return v.trangthai === 'Sắp diễn ra';
    if (activeTab === 'EXPIRED') return v.trangthai === 'Hết hạn';
    return true;
  });

  useEffect(() => {
    if (gridRef.current && filteredVouchers.length > 0) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 35, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.07, ease: 'power2.out' }
      );
    }
  }, [filteredVouchers.length, activeTab]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`✅ Đã sao chép mã "${code}"! Hãy dán vào ô Mã khuyến mãi khi đặt sân hoặc thuê dụng cụ!`);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Vô thời hạn';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <CustomerLayout>
      {/* ── HERO BANNER ── */}
      <div className={styles.hero} ref={heroRef}>
        <div className={styles.heroGlow} />
        <div className={styles.heroBadge}>
          <Sparkles size={16} /> Đặc Quyền Khách Hàng Cầu Lông 84
        </div>
        <h1 className={styles.heroTitle}>
          SĂN MÃ <span className={styles.heroTitleHighlight}>KHUYẾN MÃI</span> CỰC SỐC
        </h1>
        <p className={styles.heroSub}>
          Tổng hợp toàn bộ các mã ưu đãi độc quyền đặt sân cầu lông online, thuê dụng cụ & vợt Yonex/Victor. 
          Lưu mã ngay để tận hưởng trải nghiệm thể thao đỉnh cao với chi phí cực tiết kiệm!
        </p>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{vouchers.filter(v => v.trangthai === 'Đang diễn ra').length}+</span>
            <span className={styles.statLabel}>Mã Đang Kích Hoạt</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>30%</span>
            <span className={styles.statLabel}>Mức Giảm Tối Đa</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>0đ</span>
            <span className={styles.statLabel}>Chi Phí Nhận Mã</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTAINER ── */}
      <div className={styles.container}>
        {/* Filter & Search Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Tìm tên khuyến mãi hoặc nhập mã CODE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.tabs}>
            {[
              { id: 'ALL', label: `Tất cả (${vouchers.length})` },
              { id: 'ACTIVE', label: `🟢 Đang diễn ra (${vouchers.filter(v => v.trangthai === 'Đang diễn ra').length})` },
              { id: 'UPCOMING', label: `🟡 Sắp diễn ra (${vouchers.filter(v => v.trangthai === 'Sắp diễn ra').length})` },
              { id: 'EXPIRED', label: `⚪ Hết hạn (${vouchers.filter(v => v.trangthai === 'Hết hạn').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Voucher Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '18px', color: '#64748b', fontWeight: 600 }}>
            <Zap className="animate-spin inline mr-2" /> Đang tải danh sách ưu đãi hấp dẫn...
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <Gift size={48} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Không tìm thấy mã ưu đãi nào</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Vui lòng thử từ khóa tìm kiếm khác hoặc xem tất cả ưu đãi.</p>
          </div>
        ) : (
          <div className={styles.grid} ref={gridRef}>
            {filteredVouchers.map((d) => {
              const isActive = d.trangthai === 'Đang diễn ra';
              const isUpcoming = d.trangthai === 'Sắp diễn ra';
              const isExpired = d.trangthai === 'Hết hạn';

              const ticketLeftClass = `${styles.ticketLeft} ${
                isUpcoming
                  ? styles.ticketLeftUpcoming
                  : isExpired
                  ? styles.ticketLeftExpired
                  : ''
              }`;

              const badgeClass = isUpcoming
                ? styles.badgeUpcoming
                : isExpired
                ? styles.badgeExpired
                : styles.badgeActive;

              const isCopied = copiedCode === d.makhuyenmai;

              return (
                <div key={d.id_khuyenmai} className={styles.card}>
                  {/* Left Ticket Stub */}
                  <div className={ticketLeftClass}>
                    <span className={styles.discountPercent}>{d.phantramgiam}%</span>
                    <span className={styles.discountLabel}>GIẢM GIÁ</span>
                    {d.giamtoida && (
                      <span className={styles.discountMax}>Tối đa {d.giamtoida.toLocaleString('vi-VN')}đ</span>
                    )}
                  </div>

                  {/* Right Content Details */}
                  <div className={styles.ticketRight}>
                    <div>
                      <div className={styles.voucherHeader}>
                        <h4 className={styles.voucherName}>{d.tenkhuyenmai}</h4>
                        <span className={`${styles.statusBadge} ${badgeClass}`}>
                          {d.trangthai}
                        </span>
                      </div>

                      <div className={styles.metaInfo}>
                        <div className={styles.metaRow}>
                          <Calendar size={14} />
                          <span>HSD: {formatDate(d.ngaybatdau)} – {formatDate(d.ngayketthuc)}</span>
                        </div>
                        <div className={styles.metaRow}>
                          <Tag size={14} />
                          <span>Số lượng còn: <strong style={{ color: isActive ? '#10b981' : '#64748b' }}>{d.soluong || 0}</strong> lượt</span>
                        </div>
                      </div>

                      {/* Voucher Code Box */}
                      <div className={`${styles.codeBox} ${isActive ? styles.codeBoxActive : ''}`}>
                        <span className={`${styles.codeText} ${isActive ? styles.codeTextActive : ''}`}>
                          {d.makhuyenmai}
                        </span>
                        <button
                          onClick={() => handleCopy(d.makhuyenmai)}
                          className={styles.copyBtn}
                          disabled={isExpired}
                          style={isExpired ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                          {isCopied ? 'Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      {isActive ? (
                        <Link to={`/booking?voucher=${d.makhuyenmai}`} className={styles.useBtn}>
                          🏸 Đặt sân ngay <ArrowRight size={16} style={{ display: 'inline', verticalAlign: '-2px' }} />
                        </Link>
                      ) : isUpcoming ? (
                        <button className={`${styles.useBtn} ${styles.useBtnDisabled}`} disabled>
                          🕒 Sắp diễn ra
                        </button>
                      ) : (
                        <button className={`${styles.useBtn} ${styles.useBtnDisabled}`} disabled>
                          ❌ Đã hết hạn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── GUIDE SECTION (3 STEPS) ── */}
        <div className={styles.guideSection}>
          <h2 className={styles.guideTitle}>💡 Hướng dẫn sử dụng mã khuyến mãi</h2>
          <p className={styles.guideSub}>Chỉ với 3 bước đơn giản để nhận chiết khấu trực tiếp vào hóa đơn của bạn</p>

          <div className={styles.guideGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNum}>1</div>
              <h4 className={styles.stepTitle}>Lựa chọn & Sao chép mã</h4>
              <p className={styles.stepDesc}>
                Duyệt qua danh sách ưu đãi bên trên, chọn mã có mức giảm phù hợp với nhu cầu và bấm nút <strong>"Sao chép"</strong>.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNum}>2</div>
              <h4 className={styles.stepTitle}>Chọn dịch vụ Sân / Thuê vợt</h4>
              <p className={styles.stepDesc}>
                Truy cập vào trang <strong>Đặt sân online</strong> hoặc <strong>Thuê dụng cụ</strong>, lựa chọn khung giờ và sân đấu cầu lông yêu thích.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNum}>3</div>
              <h4 className={styles.stepTitle}>Dán mã & Nhận chiết khấu</h4>
              <p className={styles.stepDesc}>
                Tại bước thanh toán đơn đặt sân, dán mã vừa sao chép vào ô <strong>"Mã khuyến mãi"</strong> và bấm <strong>"Áp dụng"</strong> để được giảm tiền ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      <div style={{
        position: 'fixed',
        bottom: toastMsg ? '24px' : '-100px',
        right: '24px',
        zIndex: 9999,
        background: '#10b981',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '16px',
        fontWeight: 800,
        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
        transition: 'bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '20px' }}>🎁</span>
        <span>{toastMsg}</span>
      </div>
    </CustomerLayout>
  );
}

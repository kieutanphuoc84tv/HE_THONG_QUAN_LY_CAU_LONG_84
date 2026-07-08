import { useState, useEffect } from 'react'
import CustomerLayout from '../../layouts/CustomerLayout'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { getStoredUser } from '../../utils/authStorage'
import { BookOpen, CheckCircle, Info, User, DollarSign, Calendar, ArrowRight } from 'lucide-react'

export default function TrainingPage() {
  const navigate = useNavigate()
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ id_hlv: '', ghichu: '', lephi: 0 })
  const [hinhThuc, setHinhThuc] = useState('nhom_coban')

  const TRAINING_TYPES = [
    { id: 'nhom_coban', label: 'Học theo nhóm cơ bản', price: 100000, sessions: '2-3 buổi/tuần', icon: '👥', desc: 'Giúp làm quen với kỹ thuật cơ bản.' },
    { id: 'nhom_nangcao', label: 'Học nâng cao/chuyên sâu', price: 150000, sessions: '4-5 buổi/tuần', icon: '🔥', desc: 'Rèn luyện thể lực và chiến thuật thi đấu.' },
    { id: 'kem_rieng', label: 'Kèm riêng (1-1)', price: 300000, sessions: 'Linh hoạt', icon: '⭐', desc: 'Lịch cực kỳ linh hoạt, tiến bộ nhanh nhất.' },
  ]

  const user = getStoredUser(null)

  useEffect(() => {
    api.get('/training/coaches')
      .then((coachRes) => { setCoaches(coachRes.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!form.id_hlv) { message.error('Vui lòng chọn Huấn luyện viên!'); return }
    
    setSubmitting(true)
    try {
      const selectedType = TRAINING_TYPES.find(t => t.id === hinhThuc) || TRAINING_TYPES[0]
      const finalGhichu = `[${selectedType.label}] ${form.ghichu}`
      const finalLephi = selectedType.price
      
      await api.post('/training/register', { ...form, ghichu: finalGhichu, lephi: finalLephi })
      setForm({ id_hlv: '', ghichu: '', lephi: 0 })
      setHinhThuc('nhom_coban')
      
      message.success('Đăng ký lịch học thành công! HLV sẽ sắp xếp lịch cụ thể và báo lại.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/my-trainings');
      }, 2000);
    } catch (err) {
      message.error(err.response?.data?.error || 'Lỗi đăng ký. Vui lòng thử lại.');
    } finally {
      setSubmitting(false)
    }
  }

  const selectedType = TRAINING_TYPES.find(t => t.id === hinhThuc) || TRAINING_TYPES[0]
  const selectedCoach = coaches.find(c => String(c.id_nguoidung) === String(form.id_hlv))

  return (
    <CustomerLayout>
      <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 80px)', padding: '60px 20px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#ecfdf5', color: '#10b981', borderRadius: 100, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              <BookOpen size={16} /> Đăng ký khoá học
            </div>
            <h1 style={{ margin: '0 0 16px', fontSize: 42, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Bắt Đầu Hành Trình Của Bạn</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: 16, maxWidth: 600, marginInline: 'auto', lineHeight: 1.6 }}>
              Lựa chọn Huấn luyện viên chuyên nghiệp và lộ trình phù hợp để nâng cao kỹ năng cầu lông của bạn ngay hôm nay.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }} className="training-layout">
            
            {/* Left Column: Form & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Info Banner */}
              <div style={{ background: '#fff', padding: 28, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 16, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Info size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Thông tin cần biết</h3>
                    <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
                      Vui lòng chọn HLV và hình thức học mong muốn. Lịch học cụ thể (Thứ mấy, Ca Sáng/Chiều) sẽ do <strong>HLV trực tiếp sắp xếp và thảo luận</strong> với bạn sau khi đăng ký để đảm bảo hiệu quả đào tạo tốt nhất.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Form Card */}
              <div style={{ background: '#fff', padding: 40, borderRadius: 24, boxShadow: '0 20px 60px rgba(15, 23, 42, 0.05)', border: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: '0 0 32px', fontSize: 24, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 24, background: '#10b981', borderRadius: 4 }} />
                  Khởi tạo yêu cầu
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  
                  {/* Select Coach */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                      1. Chọn Huấn luyện viên
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={form.id_hlv} 
                        onChange={e => setForm(p => ({ ...p, id_hlv: e.target.value }))} 
                        style={{ 
                          width: '100%', padding: '16px 20px', paddingRight: 40,
                          border: '2px solid #e2e8f0', borderRadius: 16, 
                          fontSize: 15, fontWeight: 600, color: '#0f172a',
                          outline: 'none', background: '#f8fafc', appearance: 'none',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff' }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                      >
                        <option value="">-- Click để chọn HLV --</option>
                        {coaches.map(c => (
                          <option key={c.id_nguoidung} value={c.id_nguoidung}>{c.hoten}</option>
                        ))}
                      </select>
                      <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Select Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                      2. Chọn Hình thức học
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {TRAINING_TYPES.map(t => {
                        const isSelected = hinhThuc === t.id;
                        return (
                          <label key={t.id} style={{
                            display: 'flex', alignItems: 'center', gap: 16, padding: 20,
                            border: isSelected ? '2px solid #10b981' : '2px solid #e2e8f0',
                            borderRadius: 16, background: isSelected ? '#ecfdf5' : '#fff',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 4px 12px rgba(16,185,129,0.1)' : 'none'
                          }}>
                            <input 
                              type="radio" 
                              name="hinhthuc" 
                              value={t.id} 
                              checked={isSelected}
                              onChange={e => setHinhThuc(e.target.value)}
                              style={{ width: 20, height: 20, accentColor: '#10b981' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{t.icon} {t.label}</span>
                                <span style={{ fontSize: 15, fontWeight: 900, color: '#10b981' }}>{t.price.toLocaleString('vi-VN')}đ<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>/buổi</span></span>
                              </div>
                              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{t.desc}</div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                      3. Lời nhắn cho HLV <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 500 }}>(Tùy chọn)</span>
                    </label>
                    <textarea 
                      value={form.ghichu} 
                      onChange={e => setForm(p => ({ ...p, ghichu: e.target.value }))} 
                      rows={4}
                      placeholder="VD: Mình rảnh vào buổi sáng T3, T5; muốn tập trung cải thiện kỹ thuật đập cầu..."
                      style={{ 
                        width: '100%', padding: '16px', border: '2px solid #e2e8f0', 
                        borderRadius: 16, fontSize: 15, color: '#0f172a',
                        outline: 'none', resize: 'vertical', background: '#f8fafc',
                        fontFamily: 'inherit', transition: 'all 0.2s'
                      }} 
                      onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff' }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Right Column: Checkout/Summary Card */}
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{ background: '#0f172a', borderRadius: 24, padding: 32, color: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <h3 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 900, borderBottom: '1px solid #334155', paddingBottom: 20 }}>
                  Tóm tắt đăng ký
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                  {/* Coach Info */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#94a3b8" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Huấn luyện viên</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: selectedCoach ? '#fff' : '#475569' }}>
                        {selectedCoach ? selectedCoach.hoten : 'Chưa chọn'}
                      </div>
                    </div>
                  </div>

                  {/* Course Type Info */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={20} color="#94a3b8" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Hình thức học</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                        {selectedType.label}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Info */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={20} color="#94a3b8" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Tần suất</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                        {selectedType.sessions}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #334155', paddingTop: 24, marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Học phí dự kiến</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
                        {selectedType.price.toLocaleString('vi-VN')}<span style={{ fontSize: 18 }}>đ</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 4 }}>/ mỗi buổi học</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  style={{ 
                    width: '100%', padding: '18px', 
                    background: submitting ? '#475569' : '#10b981', 
                    color: '#fff', border: 'none', borderRadius: 16, 
                    fontWeight: 900, fontSize: 16, cursor: submitting ? 'not-allowed' : 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    boxShadow: submitting ? 'none' : '0 8px 25px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: 1
                  }}
                  onMouseEnter={e => { if(!submitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { if(!submitting) e.currentTarget.style.transform = 'none' }}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận đăng ký'} 
                  {!submitting && <ArrowRight size={20} />}
                </button>
                
                <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#64748b', fontSize: 12, fontWeight: 500 }}>
                  <CheckCircle size={14} /> Thông tin được bảo mật an toàn
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .training-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </CustomerLayout>
  )
}

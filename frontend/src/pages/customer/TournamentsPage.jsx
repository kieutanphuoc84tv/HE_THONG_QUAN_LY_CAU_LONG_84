import { useState, useEffect } from 'react'
import CustomerLayout from '../../layouts/CustomerLayout'
import { Calendar, MapPin, Users, Trophy } from 'lucide-react'
import api from '../../services/api'
import styles from './TournamentsPage.module.css'
import { getStoredUser } from '../../utils/authStorage'

const stMap = {
  SapDienRa:   { label: 'Sắp diễn ra',   cls: 'badge-info',    canReg: true },
  DangDienRa:  { label: 'Đang diễn ra',  cls: 'badge-success', canReg: false },
  KetThuc:     { label: 'Kết thúc',      cls: 'badge-warning', canReg: false },
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(null)

  // State xem sơ đồ đấu
  const [activeBracketId, setActiveBracketId] = useState(null)
  const [bracketMatches, setBracketMatches] = useState([])
  const [loadingBracket, setLoadingBracket] = useState(false)

  const user = getStoredUser({})

  useEffect(() => {
    api.get('/tournaments')
      .then(r => {
        setTournaments(r.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleBracket = async (tournamentId) => {
    if (activeBracketId === tournamentId) {
      setActiveBracketId(null)
      setBracketMatches([])
      return
    }

    setActiveBracketId(tournamentId)
    setLoadingBracket(true)
    try {
      const res = await api.get(`/tournaments/${tournamentId}/matches`)
      setBracketMatches(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingBracket(false)
    }
  }

  const handleRegister = async (id) => {
    if (!user?.id) { window.location.href = '/login'; return }
    setRegistering(id)
    try {
      const res = await api.post(`/tournaments/${id}/register`)
      
      // Cập nhật dữ liệu từ phản hồi của backend vào state
      setTournaments(prev => prev.map(t =>
        t.MaGiaiDau === id
          ? { ...t, DangKyGiaiDaus: [...(t.DangKyGiaiDaus || []), res.data] }
          : t
      ))
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi đăng ký')
    } finally {
      setRegistering(null)
    }
  }

  const handleUnregister = async (id) => {
    if (!window.confirm('Hủy đăng ký giải đấu này?')) return
    setRegistering(id)
    try {
      await api.delete(`/tournaments/${id}/register`)
      // Cập nhật state nội bộ để ẩn nút Hủy và chuyển về trạng thái bình thường
      setTournaments(prev => prev.map(t => {
        if (t.MaGiaiDau === id) {
          return {
            ...t,
            DangKyGiaiDaus: (t.DangKyGiaiDaus || []).map(d => d.MaKhachHang === user?.id ? { ...d, TrangThai: 'DaHuy' } : d)
          }
        }
        return t
      }))
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi hủy')
    } finally {
      setRegistering(null)
    }
  }

  return (
    <CustomerLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>🏆 Giải đấu cầu lông</h1>
          <p>Tham gia các giải đấu hấp dẫn, cọ xát và nâng cao kỹ năng</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Đang tải...</div>
        ) : tournaments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 20 }}>
            Chưa có giải đấu nào
          </div>
        ) : (
          <div className={styles.list}>
            {tournaments.map(t => {
              const st = stMap[t.TrangThai] || stMap.KetThuc
              const userReg = t.DangKyGiaiDaus?.find(d => d.MaKhachHang === user?.id && d.TrangThai !== 'DaHuy')
              const isReg = !!userReg
              const count = t.DangKyGiaiDaus?.filter(d => d.TrangThai !== 'DaHuy').length || 0
              const pct = Math.round(count / t.SoLuongToiDa * 100)
              return (
                <div key={t.MaGiaiDau} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className={styles.card}>
                    <div className={styles.cardLeft}><div className={styles.icon}>🏆</div></div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTop}>
                        <h3>{t.TenGiaiDau}</h3>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </div>
                      <p className={styles.desc}>{t.MoTa || 'Giải đấu cầu lông Cầu Lông 84'}</p>
                      <div className={styles.meta}>
                        <span><Calendar size={13} /> {new Date(t.NgayBatDau).toLocaleDateString('vi-VN')} – {new Date(t.NgayKetThuc).toLocaleDateString('vi-VN')}</span>
                        <span><MapPin size={13} /> {t.DiaDiem}</span>
                        <span><Users size={13} /> {count}/{t.SoLuongToiDa} người</span>
                        <span><Trophy size={13} /> {t.LePhi > 0 ? `${t.LePhi.toLocaleString('vi-VN')} đ` : 'Miễn phí'}</span>
                      </div>
                      <div className={styles.progress}>
                        <div className={styles.progressBar} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Đã đăng ký: {count}/{t.SoLuongToiDa} suất</div>
                    </div>
                    <div className={styles.cardRight} style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <button className="btn btn-outline" onClick={() => toggleBracket(t.MaGiaiDau)}
                        style={{ color: '#10b981', borderColor: '#10b981', background: '#f0fdf4', fontSize: 12, padding: '8px 12px' }}>
                        {activeBracketId === t.MaGiaiDau ? 'Ẩn sơ đồ đấu' : 'Xem sơ đồ đấu'}
                      </button>
                      
                      {isReg ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span className={`badge ${userReg.TrangThai === 'DaXacNhan' ? 'badge-success' : 'badge-warning'}`} style={{ alignSelf: 'center', fontSize: 11, padding: '4px 8px' }}>
                            {userReg.TrangThai === 'DaXacNhan' ? '✅ Đã được duyệt' : '⏳ Đang chờ duyệt'}
                          </span>
                          <button className="btn btn-outline" onClick={() => handleUnregister(t.MaGiaiDau)} disabled={registering === t.MaGiaiDau}
                            style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: 12, padding: '8px 12px' }}>
                            {registering === t.MaGiaiDau ? '...' : '✗ Hủy đăng ký'}
                          </button>
                        </div>
                      ) : st.canReg && count < t.SoLuongToiDa ? (
                        <button className="btn btn-primary" onClick={() => handleRegister(t.MaGiaiDau)} disabled={registering === t.MaGiaiDau}
                          style={{ fontSize: 12, padding: '8px 12px' }}>
                          {registering === t.MaGiaiDau ? '...' : 'Đăng ký'}
                        </button>
                      ) : (
                        <button className="btn btn-outline" disabled style={{ opacity: .5, fontSize: 12, padding: '8px 12px' }}>
                          {count >= t.SoLuongToiDa ? 'Đã đầy' : 'Đã đóng'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Sơ đồ thi đấu */}
      {activeBracketId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '24px 0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', width: '100%', maxWidth: 1100, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => toggleBracket(activeBracketId)} style={{ position: 'absolute', top: 20, right: 24, background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', zIndex: 10 }} onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}>
              ✕
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: 32, padding: '0 24px' }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1 }}>
                 🏆 Sơ đồ thi đấu giải
              </h2>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>Danh sách các vòng đấu được xếp từ trái sang phải</p>
            </div>

            {loadingBracket ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>⏳ Đang tải dữ liệu giải đấu...</div>
            ) : bracketMatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏸</div>
                Giải đấu chưa bốc thăm sơ đồ thi đấu.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 60, overflowX: 'auto', padding: '16px 40px 40px 40px', scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                {Array.from(new Set(bracketMatches.map(m => m.VongDau))).sort((a,b)=>a-b).map((roundNum, rIdx, arr) => {
                  const roundMatches = bracketMatches.filter(m => m.VongDau === roundNum)
                  const getRoundName = (numMatches) => {
                    if (numMatches === 1) return 'Chung kết'
                    if (numMatches === 2) return 'Bán kết'
                    if (numMatches > 2 && numMatches <= 4) return 'Tứ kết'
                    if (numMatches > 4 && numMatches <= 8) return 'Vòng 1/8'
                    return `Vòng ${roundNum}`
                  }

                  return (
                    <div key={roundNum} style={{ minWidth: 280, display: 'flex', flexDirection: 'column', gap: 32, position: 'relative' }}>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {getRoundName(roundMatches.length)}
                        </h4>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, gap: 24, position: 'relative' }}>
                        {roundMatches.map((m, idx) => {
                          const isFinished = m.TrangThai === 'KetThuc'
                          const p1 = m.DoiThu1?.NguoiDung?.HoTen || 'Chờ đối thủ'
                          const p2 = m.DoiThu2?.NguoiDung?.HoTen || 'Chờ đối thủ'
                          const w1 = isFinished && m.MaNguoiThang === m.DoiThu1Id
                          const w2 = isFinished && m.MaNguoiThang === m.DoiThu2Id
                          
                          return (
                            <div key={m.MaTranDau} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', zIndex: 2, transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                              {/* Connector line to next round */}
                              {rIdx < arr.length - 1 && (
                                <div style={{ position: 'absolute', top: '50%', right: -30, width: 30, height: 2, background: '#cbd5e1', zIndex: 1 }} />
                              )}
                              {/* Connector line from previous round */}
                              {rIdx > 0 && (
                                <div style={{ position: 'absolute', top: '50%', left: -30, width: 30, height: 2, background: '#cbd5e1', zIndex: 1 }} />
                              )}
                              
                              {/* Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: 0.5 }}>TRẬN {idx + 1}</span>
                                {m.NgayDienRa && <span style={{ fontSize: 10, color: '#64748b' }}>{new Date(m.NgayDienRa).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit' })}</span>}
                              </div>
                              
                              {/* Body */}
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Player 1 */}
                                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: w1 ? '#f0fdf4' : 'transparent', borderBottom: '1px solid #f1f5f9' }}>
                                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👤</div>
                                    <span style={{ fontSize: 13, fontWeight: w1 ? 700 : 500, color: w1 ? '#0f172a' : '#334155', opacity: isFinished && !w1 ? 0.5 : 1 }}>{p1}</span>
                                  </div>
                                  <div style={{ minWidth: 28, height: 28, borderRadius: 6, background: w1 ? '#10b981' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: w1 ? '#fff' : '#64748b' }}>
                                    {isFinished ? m.DiemDoi1 : '-'}
                                  </div>
                                </div>
                                
                                {/* Player 2 */}
                                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: w2 ? '#f0fdf4' : 'transparent' }}>
                                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👤</div>
                                    <span style={{ fontSize: 13, fontWeight: w2 ? 700 : 500, color: w2 ? '#0f172a' : '#334155', opacity: isFinished && !w2 ? 0.5 : 1 }}>{p2}</span>
                                  </div>
                                  <div style={{ minWidth: 28, height: 28, borderRadius: 6, background: w2 ? '#10b981' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: w2 ? '#fff' : '#64748b' }}>
                                    {isFinished ? m.DiemDoi2 : '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </CustomerLayout>
  )
}

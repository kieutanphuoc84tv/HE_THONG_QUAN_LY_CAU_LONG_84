import { useState, useEffect } from 'react'
import CustomerLayout from '../../layouts/CustomerLayout'
import { Trophy, Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../services/api'

const stMap = {
  SapDienRa: { label: 'Sắp diễn ra', color: '#3b82f6', bg: '#eff6ff' },
  DangDienRa: { label: 'Đang diễn ra', color: '#10b981', bg: '#ecfdf5' },
  KetThuc: { label: 'Kết thúc', color: '#f59e0b', bg: '#fffbeb' },
}

export default function MatchResultsPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(false)

  useEffect(() => {
    api.get('/tournaments').then(r => setTournaments(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setLoadingMatches(true)
    try {
      const res = await api.get(`/tournaments/${id}/matches`)
      setMatches(res.data)
    } catch { setMatches([]) }
    finally { setLoadingMatches(false) }
  }

  const getRoundName = (r, maxR) => {
    if (r < 100) return `Lượt ${r} (Vòng tròn)`
    const ko = r - 100, total = maxR - 100
    if (ko === total) return '🥇 Chung kết'
    if (ko === total - 1) return '🥈 Bán kết'
    if (ko === total - 2) return 'Tứ kết'
    return `Vòng ${Math.pow(2, total - ko + 1)}`
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0f172a' }}>🏆 Kết quả thi đấu</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 15 }}>Theo dõi kết quả và tỷ số các trận đấu</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Đang tải...</div>
        ) : tournaments.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 60, textAlign: 'center', color: '#94a3b8' }}>Chưa có giải đấu nào</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tournaments.map(t => {
              const st = stMap[t.TrangThai] || stMap.KetThuc
              const isExpanded = expandedId === t.MaGiaiDau
              const count = t.DangKyGiaiDaus?.filter(d => d.TrangThai !== 'DaHuy').length || 0

              return (
                <div key={t.MaGiaiDau} style={{ background: '#fff', borderRadius: 16, border: isExpanded ? '2px solid #b7e014' : '1px solid #e2e8f0', overflow: 'hidden', transition: 'all .2s', boxShadow: isExpanded ? '0 8px 24px rgba(183,224,20,.15)' : '0 1px 4px rgba(0,0,0,.04)' }}>
                  {/* Header */}
                  <div onClick={() => toggleExpand(t.MaGiaiDau)}
                    style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background .15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #b7e014, #84cc16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏆</div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{t.TenGiaiDau}</h3>
                        <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> {new Date(t.NgayBatDau).toLocaleDateString('vi-VN')} – {new Date(t.NgayKetThuc).toLocaleDateString('vi-VN')}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} /> {count} VĐV</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                      {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                    </div>
                  </div>

                  {/* Expanded: matches */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #e2e8f0', padding: '20px 24px' }}>
                      {loadingMatches ? (
                        <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>⏳ Đang tải trận đấu...</div>
                      ) : matches.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Giải đấu chưa có trận đấu nào.</div>
                      ) : (
                        <div>
                          {Array.from(new Set(matches.map(m => m.VongDau))).sort((a, b) => a - b).map(roundNum => {
                            const roundMatches = matches.filter(m => m.VongDau === roundNum)
                            const maxRound = Math.max(...matches.map(m => m.VongDau))
                            return (
                              <div key={roundNum} style={{ marginBottom: 24 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 12 }}>
                                  {getRoundName(roundNum, maxRound)} ({roundMatches.length} trận)
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                                  {roundMatches.map(m => {
                                    const isFinished = m.TrangThai === 'KetThuc'
                                    const p1 = m.DoiThu1?.NguoiDung?.HoTen || 'Chờ đối thủ'
                                    const p2 = m.DoiThu2?.NguoiDung?.HoTen || 'Chờ đối thủ'
                                    const isP1Win = m.MaNguoiThang === m.DoiThu1Id && isFinished
                                    const isP2Win = m.MaNguoiThang === m.DoiThu2Id && isFinished

                                    return (
                                      <div key={m.MaTranDau} style={{ background: isFinished ? '#f8fafc' : '#fff', border: `1px solid ${isFinished ? '#10b981' : '#e2e8f0'}`, borderRadius: 12, padding: 14, position: 'relative' }}>
                                        {isFinished && <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 6 }}>✓ Đã kết thúc</div>}
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>TRẬN {m.ThuTu}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: isP1Win ? '#ecfdf5' : 'transparent' }}>
                                            <span style={{ fontWeight: isP1Win ? 800 : 500, color: isP1Win ? '#10b981' : '#334155', fontSize: 14 }}>
                                              {isP1Win && '👑 '}{p1}
                                            </span>
                                            <span style={{ fontWeight: 800, fontSize: 18, color: isP1Win ? '#10b981' : '#64748b' }}>{isFinished ? m.DiemDoi1 : '-'}</span>
                                          </div>
                                          <div style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', fontWeight: 800 }}>VS</div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: isP2Win ? '#ecfdf5' : 'transparent' }}>
                                            <span style={{ fontWeight: isP2Win ? 800 : 500, color: isP2Win ? '#10b981' : '#334155', fontSize: 14 }}>
                                              {isP2Win && '👑 '}{p2}
                                            </span>
                                            <span style={{ fontWeight: 800, fontSize: 18, color: isP2Win ? '#10b981' : '#64748b' }}>{isFinished ? m.DiemDoi2 : '-'}</span>
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
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}

import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Plus, Pencil, Trash2, Users, Calendar, X, Check, Trophy } from 'lucide-react'
import api from '../../services/api'
import styles from './AdminCRUD.module.css'

const stMap = {
  SapDienRa: { label: 'Sắp diễn ra', cls: 'badge-info' },
  DangDienRa: { label: 'Đang diễn ra', cls: 'badge-success' },
  KetThuc: { label: 'Kết thúc', cls: 'badge-warning' }
}

const emptyForm = { TenGiaiDau: '', NgayBatDau: '', NgayKetThuc: '', DiaDiem: 'Sân Cầu Lông 84', LePhi: 0, SoLuongToiDa: 32, MoTa: '', HinhThuc: 'KnockOut' }

export default function AdminTournaments() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  // State quản lý trận đấu giải đấu
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [editingScores, setEditingScores] = useState({}) // { [matchId]: { d1: 0, d2: 0 } }
  
  // State quản lý VĐV đăng ký
  const [participantsTournament, setParticipantsTournament] = useState(null)
  const [participants, setParticipants] = useState([])

  const load = () => {
    api.get('/tournaments').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(emptyForm); setEditing(null); setShowForm(true) }
  const openEdit = (t) => {
    setForm({
      TenGiaiDau: t.TenGiaiDau, NgayBatDau: t.NgayBatDau?.split('T')[0],
      NgayKetThuc: t.NgayKetThuc?.split('T')[0], DiaDiem: t.DiaDiem,
      LePhi: t.LePhi, SoLuongToiDa: t.SoLuongToiDa, MoTa: t.MoTa || '',
      HinhThuc: t.HinhThuc || 'KnockOut'
    })
    setEditing(t.MaGiaiDau)
    setShowForm(true)
  }

  const openMatches = async (tournament) => {
    setSelectedTournament(tournament)
    setLoadingMatches(true)
    try {
      const res = await api.get(`/tournaments/${tournament.MaGiaiDau}/matches`)
      setMatches(res.data)
      const scores = {}
      res.data.forEach(m => {
        scores[m.MaTranDau] = { d1: m.DiemDoi1 || 0, d2: m.DiemDoi2 || 0 }
      })
      setEditingScores(scores)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMatches(false)
    }
  }

  const openParticipants = (tournament) => {
    setParticipantsTournament(tournament)
    setParticipants(tournament.DangKyGiaiDaus || [])
    setSelectedTournament(null)
    setShowForm(false)
  }

  const updateRegistrationStatus = async (regId, status) => {
    try {
      const res = await api.put(`/tournaments/registrations/${regId}/status`, { trangthai: status })
      // Cập nhật lại trong list participants
      setParticipants(prev => prev.map(p => p.MaDangKy === regId ? { ...p, TrangThai: status } : p))
      // Đồng thời cập nhật lại trong data chung
      setData(prev => prev.map(t => {
        if (t.MaGiaiDau === participantsTournament.MaGiaiDau) {
          return {
            ...t,
            DangKyGiaiDaus: (t.DangKyGiaiDaus || []).map(p => p.MaDangKy === regId ? { ...p, TrangThai: status } : p)
          }
        }
        return t
      }))
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi cập nhật')
    }
  }

  const handleGenerateBracket = async () => {
    if (!selectedTournament) return
    const hinhThuc = selectedTournament.HinhThuc || 'KnockOut'
    try {
      if (hinhThuc === 'KnockOut') {
        await api.post(`/tournaments/${selectedTournament.MaGiaiDau}/generate-bracket`)
        alert('✅ Đã tạo sơ đồ thi đấu Knock-out thành công!')
      } else {
        await api.post(`/tournaments/${selectedTournament.MaGiaiDau}/generate-roundrobin`)
        alert('✅ Đã tạo lịch thi đấu vòng tròn thành công!')
      }
      openMatches(selectedTournament)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi tạo sơ đồ thi đấu')
    }
  }

  const handleAdvanceToKnockout = async () => {
    if (!selectedTournament) return
    if (!window.confirm(`Chuyển Top ${selectedTournament.SoVaoDauKnockOut} sang Knock-out? Hành động này không thể hoàn tác!`)) return
    try {
      await api.post(`/tournaments/${selectedTournament.MaGiaiDau}/advance-to-knockout`)
      alert('🏆 Đã chuyển sang giai đoạn Knock-out! Sơ đồ bracket đã được tạo.')
      openMatches(selectedTournament)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi chuyển giai đoạn')
    }
  }

  const handleAdvanceKnockoutRound = async () => {
    if (!selectedTournament) return
    if (!window.confirm('Hệ thống sẽ lấy những người thắng cuộc ở vòng hiện tại để xếp vào vòng tiếp theo. Bạn đã nhập hết điểm số cho vòng hiện tại chưa?')) return
    try {
      await api.post(`/tournaments/${selectedTournament.MaGiaiDau}/advance-knockout-round`)
      alert('✅ Đã tạo thành công vòng đấu tiếp theo!')
      openMatches(selectedTournament)
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi tạo vòng tiếp theo')
    }
  }

  const handleUpdateMatchScore = async (matchId) => {
    const score = editingScores[matchId]
    if (!score) return
    try {
      await api.put(`/tournaments/${selectedTournament.MaGiaiDau}/matches/${matchId}`, {
        DiemDoi1: Number(score.d1),
        DiemDoi2: Number(score.d2),
        TrangThai: 'KetThuc'
      })
      alert('Đã cập nhật tỉ số trận đấu thành công!')
      openMatches(selectedTournament)
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi cập nhật tỷ số')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        const res = await api.put(`/tournaments/${editing}`, form)
        setData(prev => prev.map(t => t.MaGiaiDau === editing ? res.data : t))
      } else {
        const res = await api.post('/tournaments', form)
        setData(prev => [res.data, ...prev])
      }
      setShowForm(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi lưu dữ liệu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa giải đấu này?')) return
    try {
      await api.delete(`/tournaments/${id}`)
      setData(prev => prev.filter(t => t.MaGiaiDau !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi xóa')
    }
  }

  return (
    <AdminLayout title="Quản lý giải đấu">
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Tổng: {data.length} giải đấu</div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tạo giải đấu</button>
        </div>

        {/* Form tạo/sửa */}
        {showForm && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 16px', color: '#0f172a', fontWeight: 800 }}>{editing ? 'Sửa giải đấu' : 'Tạo giải đấu mới'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Tên giải đấu', key: 'TenGiaiDau', type: 'text', col: 2 },
                { label: 'Ngày bắt đầu', key: 'NgayBatDau', type: 'date' },
                { label: 'Ngày kết thúc', key: 'NgayKetThuc', type: 'date' },
                { label: 'Địa điểm', key: 'DiaDiem', type: 'text' },
                { label: 'Số lượng tối đa', key: 'SoLuongToiDa', type: 'number' },
                { label: 'Lệ phí (đ)', key: 'LePhi', type: 'number', col: 2 },
                { label: 'Mô tả', key: 'MoTa', type: 'text', col: 2 },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.col === 2 ? 'span 2' : 'span 1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, marginTop: 4, fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}

              {/* Hình thức thi đấu */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Hình Thức Thi Đấu</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {[
                    { val: 'KnockOut', label: '🏹 Knock-out', desc: 'Thua 1 là bị loại' },
                    { val: 'VongTron', label: '🔄 Vòng tròn', desc: 'Mọi người đấu với nhau' }
                  ].map(opt => (
                    <div key={opt.val} onClick={() => setForm(p => ({ ...p, HinhThuc: opt.val }))}
                      style={{ flex: 1, padding: '12px', border: `2px solid ${form.HinhThuc === opt.val ? '#10b981' : '#e2e8f0'}`, borderRadius: 10, cursor: 'pointer', background: form.HinhThuc === opt.val ? '#ecfdf5' : '#fff', transition: 'all .2s' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: form.HinhThuc === opt.val ? '#10b981' : '#0f172a' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}><X size={14} /> Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Check size={14} /> {saving ? '...' : 'Lưu'}</button>
            </div>
          </div>
        )}

        {/* Quản lý sơ đồ thi đấu */}
        {selectedTournament && (
          <div style={{ background: '#fff', border: '1.5px solid #10b981', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>🏆 Trận đấu & Sơ đồ: {selectedTournament.TenGiaiDau}</h4>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, background: '#f1f5f9', padding: '3px 10px', borderRadius: 20, fontWeight: 700, color: '#475569' }}>
                    {selectedTournament.HinhThuc === 'KnockOut' ? '🏹 Knock-out' : '🔄 Vòng tròn'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {matches.length > 0 && (selectedTournament.HinhThuc === 'KnockOut' || matches.some(m => parseInt(m.VongDau) >= 101)) && (
                  <button className="btn btn-primary" onClick={handleAdvanceKnockoutRound} style={{ background: '#3b82f6', borderColor: '#3b82f6', fontSize: 13, padding: '6px 12px' }}>
                    <Plus size={14} /> Đưa người thắng vào vòng trong
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => setSelectedTournament(null)}><X size={14} /> Đóng sơ đồ</button>
              </div>
            </div>

            {loadingMatches ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>⏳ Đang tải danh sách trận đấu...</div>
            ) : matches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <p style={{ color: '#64748b', marginBottom: 16 }}>Chưa có sơ đồ thi đấu cho giải đấu này.</p>
                <button className="btn btn-primary" onClick={handleGenerateBracket}>
                  <Trophy size={16} /> {selectedTournament.HinhThuc === 'KnockOut' ? 'Sinh sơ đồ Knock-out' : 'Bắt đầu giai đoạn Vòng tròn'}
                </button>
              </div>
            ) : (
              <div>
                {/* Bảng xếp hạng vòng tròn */}
                {(selectedTournament.HinhThuc === 'VongTron') && (() => {
                  // Tính bảng xếp hạng từ các trận đấu
                  const standings = {}
                  matches.forEach(m => {
                    if (!m.DoiThu1Id || !m.DoiThu2Id) return
                    if (!standings[m.DoiThu1Id]) standings[m.DoiThu1Id] = { name: m.DoiThu1?.NguoiDung?.HoTen || 'VĐV', W: 0, D: 0, L: 0, GF: 0, GA: 0 }
                    if (!standings[m.DoiThu2Id]) standings[m.DoiThu2Id] = { name: m.DoiThu2?.NguoiDung?.HoTen || 'VĐV', W: 0, D: 0, L: 0, GF: 0, GA: 0 }
                    if (m.TrangThai === 'KetThuc') {
                      const d1 = m.DiemDoi1 || 0, d2 = m.DiemDoi2 || 0
                      standings[m.DoiThu1Id].GF += d1; standings[m.DoiThu1Id].GA += d2
                      standings[m.DoiThu2Id].GF += d2; standings[m.DoiThu2Id].GA += d1
                      if (d1 > d2) { standings[m.DoiThu1Id].W++; standings[m.DoiThu2Id].L++ }
                      else if (d1 < d2) { standings[m.DoiThu2Id].W++; standings[m.DoiThu1Id].L++ }
                      else { standings[m.DoiThu1Id].D++; standings[m.DoiThu2Id].D++ }
                    }
                  })
                  const sorted = Object.entries(standings).map(([id, s]) => ({
                    id, ...s, Pts: s.W * 3 + s.D, Played: s.W + s.D + s.L, GD: s.GF - s.GA
                  })).sort((a, b) => b.Pts - a.Pts || b.GD - a.GD)

                  return (
                    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                      <h5 style={{ margin: '0 0 12px', fontWeight: 800, color: '#0f172a' }}>📊 Bảng Xếp Hạng Vòng Tròn</h5>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#e2e8f0' }}>
                            {['#', 'VĐV', 'Trận', 'Thắng', 'Hòa', 'Thua', 'Bàn thắng', 'GD', 'Điểm'].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: h === 'VĐV' ? 'left' : 'center', fontWeight: 700, color: '#475569' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((s, idx) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: idx === 0 ? '#f59e0b' : '#475569' }}>{idx + 1}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                                {s.name}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{s.Played}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{s.W}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6366f1' }}>{s.D}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#ef4444' }}>{s.L}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>{s.GF}-{s.GA}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: s.GD >= 0 ? '#10b981' : '#ef4444' }}>{s.GD >= 0 ? '+' : ''}{s.GD}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 900, fontSize: 15, color: '#0f172a' }}>{s.Pts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}

                {/* Phân chia trận đấu theo các Vòng */}
                {Array.from(new Set(matches.map(m => m.VongDau))).sort((a, b) => a - b).map(roundNum => {
                  const roundMatches = matches.filter(m => m.VongDau === roundNum)
                  // VongDau < 100 = vòng tròn, VongDau >= 101 = knockout (offset 100)
                  const isRoundRobinRound = roundNum < 100
                  const knockoutMatches = matches.filter(m => m.VongDau >= 101)
                  const totalKOcRounds = knockoutMatches.length > 0 ? Math.max(...knockoutMatches.map(m => m.VongDau)) : 101
                  const getRoundName = (r) => {
                    if (r < 100) return `Lượt đấu ${r} (Vòng tròn)`
                    
                    const numMatches = roundMatches.length
                    if (numMatches === 1) return 'Chung kết 🥇'
                    if (numMatches === 2) return 'Bán kết 🥈'
                    if (numMatches > 2 && numMatches <= 4) return 'Tứ kết'
                    if (numMatches > 4 && numMatches <= 8) return 'Vòng 1/8'
                    return `Vòng loại (${numMatches} trận)`
                  }

                  return (
                    <div key={roundNum} style={{ marginTop: 20 }}>
                      <h5 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 6, color: '#0f172a', fontWeight: 700 }}>
                        {getRoundName(roundNum)} ({roundMatches.length} trận)
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 12 }}>
                        {roundMatches.map((m, idx) => {
                          const isFinished = m.TrangThai === 'KetThuc'
                          const hasBothPlayers = m.DoiThu1 && m.DoiThu2
                          const p1Name = m.DoiThu1?.NguoiDung?.HoTen || 'Chờ đối thủ...'
                          const p2Name = m.DoiThu2?.NguoiDung?.HoTen || 'Chờ đối thủ...'
                          const score = editingScores[m.MaTranDau] || { d1: 0, d2: 0 }

                          return (
                            <div key={m.MaTranDau} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>TRẬN {idx + 1}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: m.MaNguoiThang === m.DoiThu1Id && isFinished ? 'bold' : 'normal', color: m.MaNguoiThang === m.DoiThu1Id && isFinished ? '#10b981' : '#0f172a' }}>
                                  <span>👤 {p1Name}</span>
                                  <span>{isFinished ? m.DiemDoi1 : ''}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: m.MaNguoiThang === m.DoiThu2Id && isFinished ? 'bold' : 'normal', color: m.MaNguoiThang === m.DoiThu2Id && isFinished ? '#10b981' : '#0f172a' }}>
                                  <span>👤 {p2Name}</span>
                                  <span>{isFinished ? m.DiemDoi2 : ''}</span>
                                </div>
                              </div>

                              {!isFinished && hasBothPlayers && (
                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10, marginTop: 6 }}>
                                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>CẬP NHẬT TỶ SỐ</label>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input type="number" placeholder="Điểm ĐT1" value={score.d1}
                                      onChange={e => setEditingScores(prev => ({ ...prev, [m.MaTranDau]: { ...prev[m.MaTranDau], d1: e.target.value } }))}
                                      style={{ width: '70px', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }} />
                                    <span style={{ color: '#94a3b8' }}>-</span>
                                    <input type="number" placeholder="Điểm ĐT2" value={score.d2}
                                      onChange={e => setEditingScores(prev => ({ ...prev, [m.MaTranDau]: { ...prev[m.MaTranDau], d2: e.target.value } }))}
                                      style={{ width: '70px', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }} />
                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, flex: 1 }}
                                      onClick={() => handleUpdateMatchScore(m.MaTranDau)}>
                                      Ghi nhận
                                    </button>
                                  </div>
                                </div>
                              )}

                              {!hasBothPlayers && !isFinished && (
                                <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 4, textAlign: 'center', background: '#f1f5f9', padding: '6px', borderRadius: 6 }}>
                                  Đang đợi kết quả các vòng đấu trước...
                                </div>
                              )}

                              {isFinished && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981', fontWeight: 700, marginTop: 4, background: '#ecfdf5', padding: '6px 10px', borderRadius: 6 }}>
                                  <Check size={14} /> Đã hoàn thành (Thắng: {m.NguoiThang?.NguoiDung?.HoTen})
                                </div>
                              )}
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

        {/* Danh sách VĐV đăng ký */}
        {participantsTournament && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>VĐV Đăng Ký: {participantsTournament.TenGiaiDau}</h3>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Tổng: {participants.length} / {participantsTournament.SoLuongToiDa} người
                  </div>
                </div>
              </div>
              <button className="btn btn-outline" onClick={() => setParticipantsTournament(null)} style={{ padding: '8px 12px' }}>
                <X size={16} /> Đóng danh sách
              </button>
            </div>

            {participants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Chưa có VĐV nào đăng ký.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Tên VĐV</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>Ngày ĐK</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>Trạng thái</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Xác nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => (
                    <tr key={p.MaDangKy} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{p.KhachHang?.NguoiDung?.HoTen || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{p.KhachHang?.NguoiDung?.Email || 'N/A'}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                        {new Date(p.NgayDangKy).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span className={`badge ${
                          p.TrangThai === 'DaXacNhan' ? 'badge-success' : 
                          p.TrangThai === 'DaHuy' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {p.TrangThai === 'DaXacNhan' ? 'Đã xác nhận' : p.TrangThai === 'DaHuy' ? 'Đã hủy' : 'Chờ xác nhận'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {p.TrangThai === 'ChoXacNhan' && (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => updateRegistrationStatus(p.MaDangKy, 'DaXacNhan')}
                              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Duyệt
                            </button>
                            <button onClick={() => updateRegistrationStatus(p.MaDangKy, 'DaHuy')}
                              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Từ chối
                            </button>
                          </div>
                        )}
                        {p.TrangThai === 'DaXacNhan' && (
                          <button onClick={() => updateRegistrationStatus(p.MaDangKy, 'DaHuy')}
                            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Hủy duyệt
                          </button>
                        )}
                        {p.TrangThai === 'DaHuy' && (
                          <button onClick={() => updateRegistrationStatus(p.MaDangKy, 'DaXacNhan')}
                            style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Khôi phục
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Đang tải...</div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead><tr><th>Tên giải</th><th>Thời gian</th><th>Địa điểm</th><th>Lệ phí</th><th>Người đăng ký</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {data.map(t => (
                  <tr key={t.MaGiaiDau}>
                    <td><strong>{t.TenGiaiDau}</strong></td>
                    <td><Calendar size={13} style={{ display: 'inline', marginRight: 5 }} />{new Date(t.NgayBatDau).toLocaleDateString('vi-VN')} – {new Date(t.NgayKetThuc).toLocaleDateString('vi-VN')}</td>
                    <td>{t.DiaDiem}</td>
                    <td>{t.LePhi > 0 ? `${t.LePhi.toLocaleString('vi-VN')}đ` : 'Miễn phí'}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={13} /><strong>{t.DangKyGiaiDaus?.filter(d => d.TrangThai !== 'DaHuy').length || 0}/{t.SoLuongToiDa}</strong></div></td>
                    <td><span className={`badge ${stMap[t.TrangThai]?.cls || 'badge-warning'}`}>{stMap[t.TrangThai]?.label || t.TrangThai}</span></td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} style={{ background: '#eff6ff', color: '#3b82f6' }} onClick={() => openParticipants(t)} title="Danh sách vận động viên"><Users size={14} /></button>
                        <button className={styles.editBtn} style={{ background: '#ecfdf5', color: '#10b981' }} onClick={() => openMatches(t)} title="Sơ đồ & tỷ số trận đấu"><Trophy size={14} /></button>
                        <button className={styles.editBtn} onClick={() => openEdit(t)} title="Sửa giải đấu"><Pencil size={14} /></button>
                        <button className={styles.delBtn} onClick={() => handleDelete(t.MaGiaiDau)} title="Xóa giải đấu"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

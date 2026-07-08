import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Search, Settings, Check, Edit } from 'lucide-react'
import api from '../../services/api'
import styles from './AdminCRUD.module.css'

function ConfigModal({ onClose }) {
  const [cfg, setCfg] = useState({ fee1: 200000, fee2: 400000, discountBooking: 0, discountRental: 0, discountTournament: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/members/config').then(r => setCfg(r.data || {})).catch(console.error)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/members/config', cfg)
      alert('Đã lưu cấu hình thành công!')
      onClose()
    } catch { alert('Lỗi lưu cấu hình') }
    finally { setSaving(false) }
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 5, display: 'block', textTransform: 'uppercase' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '22px 26px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>⚙️ Cấu hình Hội Viên</h3>
        </div>
        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Phí Hội viên tháng (đ)</label><input type="number" value={cfg.fee1} onChange={e => setCfg({...cfg, fee1: Number(e.target.value)})} style={inp}/></div>
            <div><label style={lbl}>Phí CLB/Đội nhóm (đ)</label><input type="number" value={cfg.fee2} onChange={e => setCfg({...cfg, fee2: Number(e.target.value)})} style={inp}/></div>
          </div>
          <div><label style={lbl}>Giảm giá Đặt sân (%)</label><input type="number" value={cfg.discountBooking} onChange={e => setCfg({...cfg, discountBooking: Number(e.target.value)})} style={inp}/></div>
          <div><label style={lbl}>Giảm giá Dụng cụ (%)</label><input type="number" value={cfg.discountRental} onChange={e => setCfg({...cfg, discountRental: Number(e.target.value)})} style={inp}/></div>
          <div><label style={lbl}>Giảm giá Giải đấu (%)</label><input type="number" value={cfg.discountTournament} onChange={e => setCfg({...cfg, discountTournament: Number(e.target.value)})} style={inp}/></div>
        </div>
        <div style={{ padding: '16px 26px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Hủy</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 26px', borderRadius: 12, border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            {saving ? '⏳ Đang lưu...' : <><Check size={15}/> Lưu thay đổi</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function MemberModal({ member, onClose, onSave }) {
  const isEdit = !!member;
  const [form, setForm] = useState({
    HoTen: member?.HoTen || '',
    Email: member?.Email || '',
    SoDienThoai: member?.SoDienThoai || '',
    MatKhau: '',
    capbac: member?.KhachHang?.capbac || '',
    phihoivien: member?.KhachHang?.phihoivien || 0,
    TrangThai: member?.KhachHang?.TrangThai || 'HoatDong',
  });
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    api.get('/members/config').then(r => setConfig(r.data)).catch(console.error)
  }, [])

  const handlePlanChange = (plan) => {
    let fee = 0;
    if (config) {
      if (plan === 'Khách lẻ') fee = 80000;
      else if (plan === 'Hội viên tháng') fee = config.fee1 || 200000;
      else if (plan === 'CLB / Đội nhóm') fee = config.fee2 || 400000;
    }
    setForm(prev => ({ ...prev, capbac: plan, phihoivien: fee }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        const res = await api.put(`/members/${member.MaNguoiDung}`, form)
        onSave(res.data, 'edit')
      } else {
        const res = await api.post('/members', form)
        onSave(res.data, 'add')
      }
      onClose()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi lưu thành viên')
    } finally {
      setSaving(false)
    }
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 5, display: 'block', textTransform: 'uppercase' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '22px 26px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
            {isEdit ? '✏️ Chỉnh sửa thành viên' : '✨ Thêm thành viên mới'}
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lbl}>Họ tên</label>
              <input required type="text" value={form.HoTen} onChange={e => setForm({...form, HoTen: e.target.value})} style={inp}/>
            </div>
            {!isEdit && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Email</label>
                  <input required type="email" value={form.Email} onChange={e => setForm({...form, Email: e.target.value})} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Mật khẩu (mặc định: 123456)</label>
                  <input type="password" value={form.MatKhau} onChange={e => setForm({...form, MatKhau: e.target.value})} placeholder="123456" style={inp}/>
                </div>
              </div>
            )}
            <div>
              <label style={lbl}>Số điện thoại</label>
              <input type="text" value={form.SoDienThoai} onChange={e => setForm({...form, SoDienThoai: e.target.value})} style={inp}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Gói hội viên</label>
                <select value={form.capbac} onChange={e => handlePlanChange(e.target.value)} style={inp}>
                  <option value="">Thành viên bình thường</option>
                  <option value="Khách lẻ">Khách lẻ</option>
                  <option value="Hội viên tháng">Hội viên tháng</option>
                  <option value="CLB / Đội nhóm">CLB / Đội nhóm</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Phí hội viên (đ)</label>
                <input type="number" value={form.phihoivien} onChange={e => setForm({...form, phihoivien: Number(e.target.value)})} style={inp}/>
              </div>
            </div>
            <div>
              <label style={lbl}>Trạng thái tài khoản</label>
              <select value={form.TrangThai} onChange={e => setForm({...form, TrangThai: e.target.value})} style={inp}>
                <option value="HoatDong">Hoạt động</option>
                <option value="TamKhoa">Tạm khóa</option>
                <option value="Khoa">Khóa</option>
                <option value="ChoDuyet">Chờ duyệt</option>
              </select>
            </div>
          </div>
          <div style={{ padding: '16px 26px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 22px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Hủy</button>
            <button type="submit" disabled={saving} style={{ padding: '10px 26px', borderRadius: 12, border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
              {saving ? '⏳ Đang lưu...' : <><Check size={15}/> Lưu thay đổi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminMembers() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [acting, setActing] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    let active = true
    const t = setTimeout(() => {
      setLoading(true)
      api.get('/members', { params: { page, limit: 20, search: search || undefined } })
        .then(r => {
          if (!active) return
          setData(r.data.data)
          setTotal(r.data.total)
        })
        .catch(console.error)
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 400)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [search, page])

  const updateStatus = async (id, next) => {
    setActing(id)
    try {
      await api.put(`/members/${id}/status`, { TrangThai: next })
      setData(prev => prev.map(m =>
        m.MaNguoiDung === id ? { ...m, KhachHang: { ...m.KhachHang, TrangThai: next } } : m
      ))
    } catch (err) { alert(err.response?.data?.error || 'Lỗi cập nhật trạng thái') }
    finally { setActing(null) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này? Dữ liệu lịch đặt sân có thể bị ảnh hưởng!')) return;
    try {
      await api.delete(`/members/${id}`)
      setData(prev => prev.filter(m => m.MaNguoiDung !== id))
    } catch (err) { alert(err.response?.data?.error || 'Lỗi xóa thành viên') }
  }

  return (
    <AdminLayout title="Quản lý thành viên">
      <div className={styles.page}>
        <div className={styles.toolbar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Tổng: {total} thành viên</div>
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              + Thêm thành viên
            </button>
            <button onClick={() => setShowConfig(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: '#1e293b', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              <Settings size={14}/> Cấu hình Hội Viên
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Tìm tên, email, SĐT..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 36, padding: '8px 14px 8px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', width: 260 }} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Đang tải...</div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>THÀNH VIÊN</th>
                  <th>EMAIL</th>
                  <th>SĐT</th>
                  <th>HỘI VIÊN</th>
                  <th>ĐIỂM</th>
                  <th>NGÀY TẠO</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {data.map(m => {
                  const st = m.KhachHang?.TrangThai
                  return (
                    <tr key={m.MaNguoiDung}>
                      <td>
                        <div className={styles.memberCell}>
                          <div className={styles.mAvatar}>
                            {m.Avatar ? <img src={m.Avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : m.HoTen?.[0] || '?'}
                          </div>
                          <strong>{m.HoTen}</strong>
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{m.Email || '—'}</td>
                      <td>{m.SoDienThoai || '—'}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: m.KhachHang?.capbac ? '#e0f2fe' : '#f1f5f9',
                          color: m.KhachHang?.capbac ? '#0369a1' : '#475569',
                          border: m.KhachHang?.capbac ? '1px solid #bae6fd' : '1px solid #e2e8f0'
                        }}>
                          {m.KhachHang?.capbac || 'Thành viên bình thường'}
                        </span>
                      </td>
                      <td><strong style={{ color: '#10b981' }}>{m.KhachHang?.DiemTichLuy || 0}</strong></td>
                      <td>{new Date(m.NgayTao).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          background:
                            st === 'HoatDong' ? '#d1fae5' :
                            st === 'TamKhoa' ? '#fef3c7' :
                            st === 'ChoDuyet' ? '#dbeafe' : '#fee2e2',
                          color:
                            st === 'HoatDong' ? '#065f46' :
                            st === 'TamKhoa' ? '#d97706' :
                            st === 'ChoDuyet' ? '#1e40af' : '#991b1b'
                        }}>
                          {st === 'HoatDong' ? 'Hoạt động' :
                           st === 'TamKhoa' ? 'Tạm khóa' :
                           st === 'ChoDuyet' ? 'Chờ duyệt' : 'Bị khóa'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <select
                            value={st || 'HoatDong'}
                            onChange={(e) => updateStatus(m.MaNguoiDung, e.target.value)}
                            disabled={acting === m.MaNguoiDung}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              background: '#fff',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#334155',
                              outline: 'none',
                              cursor: 'pointer',
                              fontFamily: '"Be Vietnam Pro", sans-serif',
                              transition: 'all 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#10b981'}
                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                          >
                            <option value="HoatDong">Hoạt động</option>
                            <option value="TamKhoa">Tạm khóa</option>
                            <option value="Khoa">Khóa</option>
                            <option value="ChoDuyet">Chờ duyệt</option>
                          </select>
                          <button
                            onClick={() => setEditingMember(m)}
                            className={styles.editBtn}
                            title="Chỉnh sửa thông tin & thẻ hội viên"
                            style={{ padding: '6px 8px', borderRadius: '8px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(m.MaNguoiDung)}
                            title="Xóa thành viên"
                            style={{ padding: '6px 8px', borderRadius: '8px', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
      {showAdd && (
        <MemberModal
          member={null}
          onClose={() => setShowAdd(false)}
          onSave={(newMember) => {
            setData([newMember, ...data])
            setTotal(total + 1)
          }}
        />
      )}
      {editingMember && (
        <MemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={(updatedMember) => {
            setData(prev => prev.map(m =>
              m.MaNguoiDung === updatedMember.MaNguoiDung ? updatedMember : m
            ))
          }}
        />
      )}
    </AdminLayout>
  )
}

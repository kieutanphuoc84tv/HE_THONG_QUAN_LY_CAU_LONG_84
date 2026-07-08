import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Search, Edit, Check } from 'lucide-react'
import api from '../../services/api'
import styles from './AdminCRUD.module.css'

function EditMembershipModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    capbac: member.capbac || '',
    phihoivien: member.phihoivien || 0,
    ngayhethan: member.ngayhethan ? new Date(member.ngayhethan).toISOString().split('T')[0] : '',
    trangthai: member.trangthai || 'Hoạt động',
    phuongthucthanhtoan: member.phuongthucthanhtoan || '',
  })
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    api.get('/members/config').then(r => setConfig(r.data)).catch(console.error)
  }, [])

  const handlePlanChange = (plan) => {
    let fee = 0;
    let nextDate = form.ngayhethan;
    if (config) {
      if (plan === 'Hội viên tháng') fee = config.fee1 || 200000;
      else if (plan === 'CLB / Đội nhóm') fee = config.fee2 || 400000;
    }
    
    // Nếu chọn gói mà chưa có ngày hết hạn, tự động set +30 ngày
    if (plan && (!nextDate || new Date(nextDate) < new Date())) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      nextDate = d.toISOString().split('T')[0];
    }
    
    setForm(prev => ({ ...prev, capbac: plan, phihoivien: fee, ngayhethan: nextDate }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put(`/members/memberships/${member.id_nguoidung}`, form)
      onSave(res.data)
      onClose()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi cập nhật gói hội viên')
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
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>✏️ Chỉnh sửa Gói Hội Viên</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{member.hoten} ({member.email})</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Gói hội viên</label>
                <select value={form.capbac} onChange={e => handlePlanChange(e.target.value)} style={inp}>
                  <option value="">(Trống)</option>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Ngày hết hạn</label>
                <button type="button" onClick={() => {
                   const d = new Date();
                   d.setDate(d.getDate() + 30);
                   setForm({...form, ngayhethan: d.toISOString().split('T')[0]});
                }} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', cursor: 'pointer', fontWeight: 800 }}>+ 30 ngày từ hôm nay</button>
              </div>
              <input type="date" value={form.ngayhethan} onChange={e => setForm({...form, ngayhethan: e.target.value})} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Trạng thái</label>
              <select value={form.trangthai} onChange={e => setForm({...form, trangthai: e.target.value})} style={inp}>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Tạm khóa">Tạm khóa</option>
                <option value="Khóa">Khóa</option>
              </select>
            </div>
            {form.phihoivien > 0 && (
              <div>
                <label style={lbl}>Phương thức thanh toán</label>
                <select value={form.phuongthucthanhtoan} onChange={e => setForm({...form, phuongthucthanhtoan: e.target.value})} style={inp}>
                  <option value="">(Chưa thanh toán)</option>
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Thẻ/Chuyển khoản">Thẻ / Chuyển khoản</option>
                </select>
              </div>
            )}
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

export default function AdminMemberships() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingMember, setEditingMember] = useState(null)

  useEffect(() => {
    let active = true
    api.get('/members/memberships/list')
      .then(r => {
        if (active) setData(r.data)
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filteredData = data.filter(m => 
    (m.hoten || '').toLowerCase().includes(search.toLowerCase()) || 
    (m.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout title="Quản lý Gói Hội Viên">
      <div className={styles.page}>
        <div className={styles.toolbar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Tổng: {filteredData.length} lượt đăng ký</div>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Tìm tên, email..." value={search}
              onChange={e => setSearch(e.target.value)}
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
                  <th>KHÁCH HÀNG</th>
                  <th>GÓI HỘI VIÊN</th>
                  <th>PHÍ</th>
                  <th>NGÀY ĐĂNG KÝ</th>
                  <th>NGÀY HẾT HẠN</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(m => {
                  const isExpired = m.ngayhethan && new Date(m.ngayhethan) < new Date()
                  const isRetail = !m.capbac || m.capbac === 'Thành viên' || m.capbac === 'Khách lẻ'
                  return (
                    <tr key={m.id_thanhvien}>
                      <td>
                        <div className={styles.memberCell}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: 14 }}>{m.hoten}</strong>
                            <span style={{ fontSize: 12, color: '#64748b' }}>{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isRetail ? (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>—</span>
                        ) : (
                          <span style={{
                            padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: m.capbac ? '#e0f2fe' : '#f1f5f9',
                            color: m.capbac ? '#0369a1' : '#475569',
                            border: m.capbac ? '1px solid #bae6fd' : '1px solid #e2e8f0'
                          }}>
                            {m.capbac || '—'}
                          </span>
                        )}
                      </td>
                      <td>
                        {isRetail ? (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{Number(m.phihoivien || 0).toLocaleString('vi-VN')}đ</span>
                            {m.phuongthucthanhtoan && <span style={{ fontSize: 11, color: '#64748b' }}>({m.phuongthucthanhtoan})</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#475569', fontSize: 13 }}>{m.ngaythamgia ? new Date(m.ngaythamgia).toLocaleDateString('vi-VN') : '—'}</td>
                      <td>
                        {isRetail ? (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>—</span>
                        ) : (
                          <>
                            <span style={{
                              color: isExpired ? '#ef4444' : '#10b981',
                              fontWeight: 700, fontSize: 13
                            }}>
                              {m.ngayhethan ? new Date(m.ngayhethan).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                            </span>
                            {isExpired && <span style={{ marginLeft: 6, fontSize: 10, background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>Hết hạn</span>}
                          </>
                        )}
                      </td>
                      <td>
                        {(!isRetail && isExpired) ? (
                          <span style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: '#fee2e2', color: '#991b1b'
                          }}>Đã hết hạn</span>
                        ) : (
                          <span style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: m.trangthai === 'Hoạt động' ? '#d1fae5' : '#fee2e2',
                            color: m.trangthai === 'Hoạt động' ? '#065f46' : '#991b1b'
                          }}>
                            {m.trangthai}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => setEditingMember(m)}
                          className={styles.editBtn}
                          title="Sửa ngày hết hạn / Gói"
                          style={{ padding: '6px 8px', borderRadius: '8px' }}
                        >
                          <Edit size={14} /> Gia hạn
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editingMember && (
        <EditMembershipModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={(updated) => {
            setData(prev => prev.map(m => m.id_thanhvien === updated.id_thanhvien ? updated : m))
          }}
        />
      )}
    </AdminLayout>
  )
}

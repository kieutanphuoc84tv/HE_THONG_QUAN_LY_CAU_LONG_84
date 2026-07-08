import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Plus, Edit, Trash2, Search, Check } from 'lucide-react'
import api from '../../services/api'
import styles from './AdminCRUD.module.css'

function PackageModal({ pack, onClose, onSave }) {
  const [form, setForm] = useState(pack || {
    tengoi: '', thoihan: 1, giatien: 0, mota: '', trangthai: 'Đang bán'
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (pack?.id_goi) {
        const res = await api.put(`/packages/${pack.id_goi}`, form)
        onSave(res.data, 'update')
      } else {
        const res = await api.post('/packages', form)
        onSave(res.data, 'create')
      }
      onClose()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi lưu gói hội viên')
    } finally {
      setSaving(false)
    }
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 5, display: 'block', textTransform: 'uppercase' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '22px 26px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>{pack ? '✏️ Sửa Gói Hội Viên' : '✨ Thêm Gói Hội Viên'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lbl}>Tên gói</label>
              <input value={form.tengoi} onChange={e => setForm({...form, tengoi: e.target.value})} style={inp} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Thời hạn (Tháng)</label>
                <input type="number" min="1" value={form.thoihan} onChange={e => setForm({...form, thoihan: Number(e.target.value)})} style={inp} required />
              </div>
              <div>
                <label style={lbl}>Giá tiền (VNĐ)</label>
                <input type="number" min="0" value={form.giatien} onChange={e => setForm({...form, giatien: Number(e.target.value)})} style={inp} required />
              </div>
            </div>
            <div>
              <label style={lbl}>Mô tả quyền lợi</label>
              <textarea value={form.mota} onChange={e => setForm({...form, mota: e.target.value})} style={{...inp, height: 80, resize: 'none'}} />
            </div>
            <div>
              <label style={lbl}>Trạng thái</label>
              <select value={form.trangthai} onChange={e => setForm({...form, trangthai: e.target.value})} style={inp}>
                <option value="Đang bán">Đang bán</option>
                <option value="Ngừng bán">Ngừng bán</option>
              </select>
            </div>
          </div>
          <div style={{ padding: '16px 26px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 22px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Hủy</button>
            <button type="submit" disabled={saving} style={{ padding: '10px 26px', borderRadius: 12, border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
              {saving ? '⏳ Đang lưu...' : <><Check size={15}/> Lưu Gói</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminPackages() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalData, setModalData] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/packages')
      setData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa gói này?')) return
    try {
      await api.delete(`/packages/${id}`)
      setData(prev => prev.filter(p => p.id_goi !== id))
    } catch (err) { alert('Lỗi xóa gói hội viên') }
  }

  const handleSave = (item, type) => {
    if (type === 'create') setData([item, ...data])
    else setData(data.map(d => d.id_goi === item.id_goi ? item : d))
  }

  const filteredData = data.filter(d => 
    (d.tengoi || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout title="Quản lý Gói Hội Viên">
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Tìm tên gói..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, padding: '9px 14px 9px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', width: 260 }} />
          </div>
          <button onClick={() => { setModalData(null); setShowModal(true) }} className={styles.btnPrimary}>
            <Plus size={16} /> Thêm Gói Mới
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Đang tải...</div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>TÊN GÓI</th>
                  <th>THỜI HẠN</th>
                  <th>GIÁ TIỀN</th>
                  <th>MÔ TẢ</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(d => (
                  <tr key={d.id_goi}>
                    <td><strong style={{ color: '#0f172a' }}>{d.tengoi}</strong></td>
                    <td>{d.thoihan} Tháng</td>
                    <td><strong style={{ color: '#0ea5e9' }}>{Number(d.giatien || 0).toLocaleString('vi-VN')}đ</strong></td>
                    <td style={{ color: '#64748b', fontSize: 13, maxWidth: 200 }}>{d.mota}</td>
                    <td>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: d.trangthai === 'Đang bán' ? '#dcfce7' : '#f1f5f9',
                        color: d.trangthai === 'Đang bán' ? '#166534' : '#475569'
                      }}>{d.trangthai}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => { setModalData(d); setShowModal(true) }} className={styles.editBtn} title="Sửa"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(d.id_goi)} className={styles.deleteBtn} title="Xóa"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center'}}>Không có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && (
        <PackageModal pack={modalData} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </AdminLayout>
  )
}

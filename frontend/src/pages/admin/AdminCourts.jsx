import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Plus, Pencil, Trash2, Search, X, ImagePlus } from 'lucide-react'
import api from '../../services/api'
import styles from './AdminCRUD.module.css'

const stMap = { Trong: 'badge-success', DangDung: 'badge-warning', BaoTri: 'badge-danger' }
const stLabel = { Trong: 'Trống', DangDung: 'Đang dùng', BaoTri: 'Bảo trì' }

export default function AdminCourts() {
  const [courts, setCourts] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | {mode:'add'|'edit', id}
  const [form, setForm] = useState({ name:'', status:'Trong', note:'', image:'' })

  const fetchCourts = async () => {
    try {
      const res = await api.get('/courts')
      setCourts(res.data)
    } catch {
      alert('Không thể tải danh sách sân')
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(fetchCourts, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const sortedCourts = [...courts]
    .sort((a, b) => a.TenSan.localeCompare(b.TenSan, undefined, { numeric: true }))
    .map((c, i) => ({ ...c, DisplayId: `SAN-${String(i + 1).padStart(2, '0')}` }));

  const filtered = sortedCourts.filter(c =>
    c.TenSan.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setForm({ name:'', status:'Trong', note:'', image:'' }); setModal({ mode:'add' }) }
  const openEdit = c => { setForm({ name: c.TenSan, status: c.TrangThai, note: c.GhiChu || '', image: c.HinhAnh || '' }); setModal({ mode:'edit', id: c.MaSan }) }
  
  const handleImageFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn đúng file hình ảnh.')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh tối đa 2MB. Bạn chọn ảnh nhỏ hơn giúp mình nhé.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => setForm(p => ({ ...p, image: String(reader.result || '') }))
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    const payload = {
      TenSan: form.name,
      TrangThai: form.status,
      GhiChu: form.note,
      HinhAnh: form.image.trim() || null
    }
    try {
      if (modal.mode === 'add') {
        await api.post('/courts', payload)
      } else {
        await api.put(`/courts/${modal.id}`, payload)
      }
      fetchCourts()
      setModal(null)
    } catch {
      alert('Lỗi khi lưu sân')
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Xóa sân này?')) return
    try {
      await api.delete(`/courts/${id}`)
      fetchCourts()
    } catch {
      alert('Lỗi khi xóa sân')
    }
  }

  return (
    <AdminLayout title="Quản lý sân">
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon}/>
            <input className={styles.searchInput} placeholder="Tìm sân..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Thêm sân</button>
        </div>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead><tr><th>Mã sân</th><th>Hình</th><th>Tên sân</th><th>Trạng thái</th><th>Giá/giờ</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.MaSan}>
                  <td className={styles.idCell}><strong>{c.DisplayId}</strong></td>
                  <td>
                    {c.HinhAnh ? (
                      <img
                        src={c.HinhAnh}
                        alt={c.TenSan}
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <ImagePlus size={16} />
                      </div>
                    )}
                  </td>
                  <td><strong>{c.TenSan}</strong></td>
                  <td><span className={`badge ${stMap[c.TrangThai]}`}>{stLabel[c.TrangThai]}</span></td>
                  <td><strong>{c.GiaSieu.toLocaleString('vi-VN')} đ</strong></td>
                  <td className={styles.noteCell}>{c.GhiChu || '—'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => openEdit(c)}><Pencil size={14}/></button>
                      <button className={styles.delBtn} onClick={() => handleDelete(c.MaSan)}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modal && (
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <div className={styles.modalHead}>
                <h3>{modal.mode === 'add' ? 'Thêm sân mới' : 'Chỉnh sửa sân'}</h3>
                <button onClick={() => setModal(null)}><X size={18}/></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label className="input-label">Tên sân</label>
                  <input className="input-field" placeholder="Ví dụ: Sân 1" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}/>
                </div>
                
                <div className={styles.field}>
                  <label className="input-label">Hình ảnh sân</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 14, alignItems: 'stretch' }}>
                    <div style={{
                      minHeight: 96,
                      borderRadius: 16,
                      border: '1.5px dashed #cbd5e1',
                      background: '#f8fafc',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                    }}>
                      {form.image ? (
                        <img src={form.image} alt="Xem trước" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImagePlus size={26} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        className="input-field"
                        placeholder="Dán URL ảnh hoặc chọn file bên dưới"
                        value={form.image}
                        onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                      />
                      <input
                        className="input-field"
                        type="file"
                        accept="image/*"
                        onChange={handleImageFile}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className="input-label">Ghi chú</label>
                  <input className="input-field" placeholder="Thêm ghi chú..." value={form.note} onChange={e => setForm(p => ({...p, note: e.target.value}))}/>
                </div>

                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>
                  Giá cố định: <strong>70.000đ/giờ</strong>
                </p>
                <div className={styles.field}>
                  <label className="input-label">Trạng thái</label>
                  <select className="input-field" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
                    <option value="Trong">Trống</option>
                    <option value="DangDung">Đang dùng</option>
                    <option value="BaoTri">Bảo trì</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalFoot}>
                <button className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSave}>Lưu</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

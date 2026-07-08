import { useCallback, useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { ImagePlus, Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import api from '../../services/api'
import styles from './AdminCRUD.module.css'

const stMap = { ConHang: 'badge-success', HetHang: 'badge-danger' }
const stLabel = { ConHang: 'Còn hàng', HetHang: 'Hết hàng' }
const DANH_MUC = [
  { val: 'Giay', label: '👟 Giày' },
  { val: 'QuanAo', label: '👕 Quần áo' },
  { val: 'Vot', label: '🏸 Vợt' },
  { val: 'Vay', label: '🎽 Váy' },
  { val: 'Khac', label: '📦 Khác' },
]
const danhMucConLabels = {
  VotCauLong: 'Vợt cầu lông',
  VotYonex: 'Yonex',
  VotVictor: 'Victor',
  VotLining: 'Lining',
  VotVS: 'VS',
  VotMizuno: 'Mizuno',
  VotApacs: 'Apacs',
  VotVNB: 'VNB',
  VotProace: 'Proace',
  VotForza: 'Forza',
  VotFlyPower: 'FlyPower',
  VotTenway: 'Tenway',
  VotProKennex: 'Pro Kennex',
  VotBabolat: 'Babolat',
  VotKawasaki: 'Kawasaki',
  VotProtech: 'Protech',
  VotAdonex: 'Adonex',
  VotAdidas: 'Adidas',
  GiayCauLong: 'Giày cầu lông',
}
const danhMucLabels = Object.fromEntries(DANH_MUC.map(item => [item.val, item.label]))

const emptyForm = {
  name: '',
  image: '',
  giaThue: '',
  stock: '10',
  status: 'ConHang',
  danhMuc: 'Giay',
  danhMucCon: '',
  moTa: '',
}

const parseWholeNumber = value => {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return null
  const number = Number(digits)
  return Number.isFinite(number) ? number : null
}

const formatInputNumber = value => {
  const number = parseWholeNumber(value)
  return number == null ? '' : number.toLocaleString('vi-VN')
}

const normalizeText = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

const inferDanhMuc = (value, subcategory = '', name = '') => {
  if (danhMucLabels[value]) return value

  const text = normalizeText(`${value} ${subcategory} ${name}`)
  if (subcategory?.startsWith('Vot') || text.includes('vot')) return 'Vot'
  if (subcategory === 'GiayCauLong' || text.includes('giay')) return 'Giay'
  if (text.includes('vay')) return 'Vay'
  if (text.includes('quan') || text.includes('ao')) return 'QuanAo'
  if (text.includes('tui') || text.includes('day') || text.includes('cuoc')) return 'Khac'
  return 'Khac'
}

const getDanhMucLabel = (value, service) => {
  const inferred = inferDanhMuc(value, service?.DanhMucCon, service?.TenDichVu)
  return danhMucLabels[inferred] || value || 'Chưa phân loại'
}
const getDanhMucConLabel = value => danhMucConLabels[value] || value || ''

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | {mode:'add'|'edit', id}
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/services')
      setServices(res.data)
    } catch (err) {
      console.error('Lỗi lấy dịch vụ:', err)
    }
  }, [])

  useEffect(() => {
    const loadServices = async () => {
      await fetchServices()
    }
    loadServices()
  }, [fetchServices])

  const filtered = services.filter(s => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true

    return [
      s.TenDichVu,
      s.MoTa,
      getDanhMucLabel(s.DanhMuc, s),
      getDanhMucConLabel(s.DanhMucCon),
    ].some(value => String(value || '').toLowerCase().includes(keyword))
  })

  const openAdd = () => {
    setForm(emptyForm)
    setModal({ mode: 'add' })
  }

  const openEdit = s => {
    const rentalDraft = s.GiaThue != null
      ? formatInputNumber(s.GiaThue)
      : Number(s.Gia || 0) > 0 && Number(s.Gia || 0) <= 100000
        ? formatInputNumber(s.Gia)
        : ''

    setForm({
      name: s.TenDichVu,
      image: s.HinhAnh || '',
      giaThue: rentalDraft,
      stock: String(s.SoLuong),
      status: s.TrangThai,
      danhMuc: inferDanhMuc(s.DanhMuc, s.DanhMucCon, s.TenDichVu),
      danhMucCon: s.DanhMucCon || '',
      moTa: s.MoTa || ''
    })
    setModal({ mode: 'edit', id: s.MaDichVu })
  }

  const handleDanhMucChange = e => {
    const nextDanhMuc = e.target.value
    setForm(p => ({
      ...p,
      danhMuc: nextDanhMuc,
      danhMucCon: '',
    }))
  }

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
    const rentalPrice = parseWholeNumber(form.giaThue)
    const stock = parseWholeNumber(form.stock)

    if (!form.name.trim() || rentalPrice == null) {
      alert('Vui lòng điền tên dịch vụ và giá thuê hợp lệ!')
      return
    }

    const payload = {
      TenDichVu: form.name.trim(),
      Gia: 0,
      GiaThue: rentalPrice,
      SoLuong: stock ?? 0,
      TrangThai: form.status,
      DanhMuc: form.danhMuc,
      DanhMucCon: form.danhMucCon || null,
      MoTa: form.moTa,
      HinhAnh: form.image.trim() || null,
    }
    setLoading(true)
    try {
      if (modal.mode === 'add') {
        await api.post('/services', payload)
      } else {
        await api.put(`/services/${modal.id}`, payload)
      }
      fetchServices()
      setModal(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi lưu dịch vụ')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này không?')) return
    try {
      await api.delete(`/services/${id}`)
      fetchServices()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi xóa dịch vụ')
    }
  }

  return (
    <AdminLayout title="Quản lý dịch vụ">
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Tìm dịch vụ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Thêm dịch vụ
          </button>
        </div>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Hình</th>
                <th>Tên dịch vụ</th>
                <th>Danh mục</th>
                <th>Giá thuê/giờ</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    Chưa có dịch vụ nào
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.MaDichVu}>
                    <td className={styles.idCell} style={{ fontWeight: 800, color: '#0f172a' }}>Dịch vụ {i + 1}</td>
                    <td>
                      {s.HinhAnh ? (
                        <img
                          src={s.HinhAnh}
                          alt={s.TenDichVu}
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <ImagePlus size={16} />
                        </div>
                      )}
                    </td>
                    <td><strong>{s.TenDichVu}</strong></td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
                        {getDanhMucLabel(s.DanhMuc, s)}
                      </div>
                      {s.DanhMucCon && (
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 3, fontWeight: 600 }}>
                          {getDanhMucConLabel(s.DanhMucCon)}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>
                        {s.GiaThue != null ? `${s.GiaThue.toLocaleString('vi-VN')} đ/giờ` : 'Chưa nhập'}
                      </strong>
                    </td>
                    <td>{s.SoLuong}</td>
                    <td>
                      <span className={`badge ${stMap[s.TrangThai]}`}>
                        {stLabel[s.TrangThai]}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => openEdit(s)}>
                          <Pencil size={14} />
                        </button>
                        <button className={styles.delBtn} onClick={() => handleDelete(s.MaDichVu)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modal && (
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <div className={styles.modalHead}>
                <h3>{modal.mode === 'add' ? 'Thêm dịch vụ mới' : 'Chỉnh sửa dịch vụ'}</h3>
                <button onClick={() => setModal(null)}><X size={18} /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label className="input-label">Tên dịch vụ / sản phẩm</label>
                  <input className="input-field" placeholder="Ví dụ: Vợt cầu lông Yonex, giày size 42..."
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label className="input-label">Hình ảnh sản phẩm</label>
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
                  <label className="input-label">Danh mục</label>
                  <select className="input-field" value={form.danhMuc} onChange={handleDanhMucChange}>
                    {DANH_MUC.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className="input-label">Mô tả (tùy chọn)</label>
                  <input className="input-field" placeholder="Mô tả ngắn về sản phẩm"
                    value={form.moTa} onChange={e => setForm(p => ({ ...p, moTa: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label className="input-label">Giá thuê/giờ (VNĐ)</label>
                  <input className="input-field" type="text" inputMode="numeric" placeholder="Ví dụ: 20.000"
                    value={form.giaThue}
                    onChange={e => setForm(p => ({ ...p, giaThue: e.target.value }))}
                    onBlur={e => setForm(p => ({ ...p, giaThue: formatInputNumber(e.target.value) }))}
                  />
                </div>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className="input-label">Số lượng nhập kho</label>
                    <input className="input-field" type="text" inputMode="numeric" placeholder="Số lượng"
                      value={form.stock}
                      onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                      onBlur={e => setForm(p => ({ ...p, stock: formatInputNumber(e.target.value) }))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className="input-label">Trạng thái</label>
                    <select className="input-field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="ConHang">Còn hàng</option>
                      <option value="HetHang">Hết hàng</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.modalFoot}>
                <button className="btn btn-outline" onClick={() => setModal(null)} disabled={loading}>
                  Hủy
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

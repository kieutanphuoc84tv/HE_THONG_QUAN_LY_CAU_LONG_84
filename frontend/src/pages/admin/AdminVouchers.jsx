import { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Plus, Edit, Trash2, Search, X, Check, Calendar, Ticket } from 'lucide-react'
import api from '../../services/api'
import styles from './AdminVouchers.module.css'

function VoucherModal({ voucher, onClose, onSave }) {
  const [form, setForm] = useState(voucher ? {
    ...voucher,
    ngaybatdau: voucher.ngaybatdau ? new Date(voucher.ngaybatdau).toISOString().split('T')[0] : '',
    ngayketthuc: voucher.ngayketthuc ? new Date(voucher.ngayketthuc).toISOString().split('T')[0] : ''
  } : {
    makhuyenmai: '', tenkhuyenmai: '', phantramgiam: 0, giamtoida: 0, ngaybatdau: '', ngayketthuc: '', soluong: 100, trangthai: 'Đang diễn ra'
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (voucher?.id_khuyenmai) {
        const res = await api.put(`/vouchers/${voucher.id_khuyenmai}`, form)
        onSave(res.data, 'update')
      } else {
        const res = await api.post('/vouchers', form)
        onSave(res.data, 'create')
      }
      onClose()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi lưu mã khuyến mãi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{voucher ? 'Sửa Mã Khuyến Mãi' : 'Tạo Mã Khuyến Mãi'}</h3>
          <button className={styles.closeModalBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Mã CODE</label>
                <input 
                  value={form.makhuyenmai} 
                  onChange={e => setForm({...form, makhuyenmai: e.target.value.toUpperCase()})} 
                  className={`${styles.formInput} ${styles.code}`} 
                  required 
                  placeholder="VD: SUMMER26" 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Tên Chương Trình</label>
                <input 
                  value={form.tenkhuyenmai} 
                  onChange={e => setForm({...form, tenkhuyenmai: e.target.value})} 
                  className={styles.formInput} 
                  required 
                  placeholder="Giảm giá chào hè..."
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>% Giảm</label>
                <input 
                  type="number" min="0" max="100" 
                  value={form.phantramgiam} 
                  onChange={e => setForm({...form, phantramgiam: Number(e.target.value)})} 
                  className={styles.formInput} 
                  required 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Giảm tối đa (VNĐ)</label>
                <input 
                  type="number" min="0" 
                  value={form.giamtoida} 
                  onChange={e => setForm({...form, giamtoida: Number(e.target.value)})} 
                  className={styles.formInput} 
                  required 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Ngày bắt đầu</label>
                <input 
                  type="date" 
                  value={form.ngaybatdau} 
                  onChange={e => setForm({...form, ngaybatdau: e.target.value})} 
                  className={styles.formInput} 
                  required 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Ngày kết thúc</label>
                <input 
                  type="date" 
                  value={form.ngayketthuc} 
                  onChange={e => setForm({...form, ngayketthuc: e.target.value})} 
                  className={styles.formInput} 
                  required 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Số lượng mã</label>
                <input 
                  type="number" min="1" 
                  value={form.soluong} 
                  onChange={e => setForm({...form, soluong: Number(e.target.value)})} 
                  className={styles.formInput} 
                  required 
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Trạng thái</label>
                <select 
                  value={form.trangthai} 
                  onChange={e => setForm({...form, trangthai: e.target.value})} 
                  className={styles.formInput}
                >
                  <option value="Sắp diễn ra">Sắp diễn ra</option>
                  <option value="Đang diễn ra">Đang diễn ra</option>
                  <option value="Đã kết thúc">Đã kết thúc</option>
                </select>
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Hủy bỏ</button>
            <button type="submit" disabled={saving} className={styles.submitBtn}>
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminVouchers() {
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
      const res = await api.get('/vouchers')
      setData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã này?')) return
    try {
      await api.delete(`/vouchers/${id}`)
      setData(prev => prev.filter(p => p.id_khuyenmai !== id))
    } catch (err) { alert('Lỗi xóa mã khuyến mãi') }
  }

  const handleSave = (item, type) => {
    if (type === 'create') setData([item, ...data])
    else setData(data.map(d => d.id_khuyenmai === item.id_khuyenmai ? item : d))
  }

  const filteredData = data.filter(d => 
    (d.makhuyenmai || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.tenkhuyenmai || '').toLowerCase().includes(search.toLowerCase())
  )

  const getStatusClass = (status) => {
    if (status === 'Đang diễn ra') return styles.statusActive;
    if (status === 'Sắp diễn ra') return styles.statusUpcoming;
    return styles.statusEnded;
  }

  return (
    <AdminLayout title="Quản lý Khuyến Mãi">
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              placeholder="Tìm mã code hoặc tên..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput} 
            />
          </div>
          <button onClick={() => { setModalData(null); setShowModal(true) }} className={styles.addBtn}>
            <Plus size={16} /> Tạo Mã Mới
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Đang tải dữ liệu...</div>
        ) : (
          <div className={styles.voucherList}>
            {filteredData.map(d => (
              <div key={d.id_khuyenmai} className={styles.voucherCard}>
                
                {/* Column 1: Code and Name */}
                <div className={styles.colLeft}>
                  <div className={styles.voucherCode}>
                    <Ticket size={16} style={{display: 'inline', marginRight: 6, verticalAlign: 'text-bottom'}} />
                    {d.makhuyenmai}
                  </div>
                  <h4 className={styles.voucherName}>{d.tenkhuyenmai}</h4>
                </div>

                {/* Column 2: Details */}
                <div className={styles.colCenter}>
                  <div className={styles.discountRow}>
                    <span className={styles.discountPercent}>-{d.phantramgiam}%</span>
                    <span className={styles.discountMax}>Tối đa {Number(d.giamtoida || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className={styles.dateRow}>
                    <Calendar size={14} />
                    <span>{d.ngaybatdau ? new Date(d.ngaybatdau).toLocaleDateString('vi-VN') : ''} — {d.ngayketthuc ? new Date(d.ngayketthuc).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                </div>

                {/* Column 3: Actions and Status */}
                <div className={styles.colRight}>
                  <div className={styles.actions}>
                    <button onClick={() => { setModalData(d); setShowModal(true) }} className={styles.actionBtn} title="Chỉnh sửa">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(d.id_khuyenmai)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Xóa">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className={styles.rightInfo}>
                    <div className={`${styles.statusBadge} ${getStatusClass(d.trangthai)}`}>
                      {d.trangthai}
                    </div>
                    <div className={styles.qtyRow}>
                      Còn lại: <strong>{d.soluong}</strong> mã
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                Không tìm thấy mã khuyến mãi nào.
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <VoucherModal voucher={modalData} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </AdminLayout>
  )
}

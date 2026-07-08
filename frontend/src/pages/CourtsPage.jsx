import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Eye, Wifi } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import styles from './CourtsPage.module.css'

const courts = [
  { id: 1, name: 'Sân 1', type: 'Tiêu chuẩn', status: 'available', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân tiêu chuẩn, ánh sáng tốt' },
  { id: 2, name: 'Sân 2', type: 'Tiêu chuẩn', status: 'occupied', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân tiêu chuẩn, ánh sáng tốt' },
  { id: 3, name: 'Sân 3', type: 'Tiêu chuẩn', status: 'occupied', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân tiêu chuẩn, điều hòa, nội thất đầy đủ' },
  { id: 4, name: 'Sân 4', type: 'Tiêu chuẩn', status: 'available', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân tiêu chuẩn, điều hòa, nội thất đầy đủ' },
  { id: 5, name: 'Sân 5', type: 'Tiêu chuẩn', status: 'occupied', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân tiêu chuẩn tầng 2' },
  { id: 6, name: 'Sân 6', type: 'Tiêu chuẩn', status: 'maintenance', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Đang bảo trì sàn' },
  { id: 7, name: 'Sân 7', type: 'Tiêu chuẩn', status: 'available', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân tiêu chuẩn tầng 2' },
  { id: 8, name: 'Sân 8', type: 'Tiêu chuẩn', status: 'occupied', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân tiêu chuẩn cao cấp' },
  { id: 9, name: 'Sân 9', type: 'Tiêu chuẩn', status: 'available', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân ngoài trời' },
  { id: 10, name: 'Sân 10', type: 'Tiêu chuẩn', status: 'available', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân ngoài trời' },
  { id: 11, name: 'Sân 11', type: 'Tiêu chuẩn', status: 'maintenance', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Đang sơn lại sàn' },
  { id: 12, name: 'Sân 12', type: 'Tiêu chuẩn', status: 'available', price_weekday: 70000, price_weekend: 70000, price_night: 70000, desc: 'Sân tiêu chuẩn tầng 3' },
]

const statusConfig = {
  available: { label: 'Đang trống', color: '#00D4AA', bg: 'rgba(0,212,170,0.12)' },
  occupied: { label: 'Đang sử dụng', color: '#FF4D6D', bg: 'rgba(255,77,109,0.12)' },
  maintenance: { label: 'Bảo trì', color: '#FF9F1C', bg: 'rgba(255,159,28,0.12)' },
}

const fmt = (n) => n.toLocaleString('vi-VN') + 'đ'

export default function CourtsPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')

  const filtered = courts.filter(c =>
    (filter === 'all' || c.status === filter) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const counts = {
    all: courts.length,
    available: courts.filter(c => c.status === 'available').length,
    occupied: courts.filter(c => c.status === 'occupied').length,
    maintenance: courts.filter(c => c.status === 'maintenance').length,
  }

  return (
    <AppLayout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Quản lý sân</h1>
            <p className={styles.subtitle}>{courts.length} sân cầu lông • Cập nhật theo thời gian thực</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-ghost btn-sm"><Wifi size={16} color="var(--primary)" /> Live Monitor</button>
            <button className="btn btn-primary btn-sm"><Plus size={16} /> Thêm sân mới</button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterTabs}>
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'available', label: 'Đang trống' },
              { key: 'occupied', label: 'Đang sử dụng' },
              { key: 'maintenance', label: 'Bảo trì' },
            ].map(f => (
              <button
                key={f.key}
                className={`${styles.filterTab} ${filter === f.key ? styles.activeFilter : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className={styles.filterCount}>{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-field" style={{ paddingLeft: '36px', width: '220px', height: '38px', fontSize: 13 }} placeholder="Tìm sân..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewBtn} ${view === 'grid' ? styles.activeView : ''}`} onClick={() => setView('grid')}>⊞</button>
              <button className={`${styles.viewBtn} ${view === 'list' ? styles.activeView : ''}`} onClick={() => setView('list')}>☰</button>
            </div>
          </div>
        </div>

        {/* Courts Grid */}
        {view === 'grid' ? (
          <div className={styles.courtsGrid}>
            {filtered.map(c => (
              <div key={c.id} className={styles.courtCard}>
                <div className={styles.courtCardTop} style={{ background: `${statusConfig[c.status].color}10` }}>
                  <div className={styles.courtEmoji}>🏟️</div>
                  <span className={styles.courtStatusBadge} style={{ background: statusConfig[c.status].bg, color: statusConfig[c.status].color }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusConfig[c.status].color, display: 'inline-block' }} />
                    {statusConfig[c.status].label}
                  </span>
                </div>
                <div className={styles.courtCardBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 className={styles.courtName}>{c.name}</h3>
                  </div>
                  <p className={styles.courtDesc}>{c.desc}</p>
                  <div className={styles.courtPrices}>
                    <div className={styles.priceItem}>
                      <span>Ngày thường</span>
                      <strong>{fmt(c.price_weekday)}/h</strong>
                    </div>
                    <div className={styles.priceItem}>
                      <span>Cuối tuần</span>
                      <strong>{fmt(c.price_weekend)}/h</strong>
                    </div>
                    <div className={styles.priceItem}>
                      <span>Ban đêm</span>
                      <strong>{fmt(c.price_night)}/h</strong>
                    </div>
                  </div>
                  <div className={styles.courtActions}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>Đặt sân</button>
                    <button className="btn btn-ghost btn-sm"><Edit2 size={14} /></button>
                    <button className="btn btn-ghost btn-sm"><Trash2 size={14} color="var(--danger)" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-wrapper card">
            <table>
              <thead><tr><th>Sân</th><th>Trạng thái</th><th>Ngày thường</th><th>Cuối tuần</th><th>Ban đêm</th><th>Thao tác</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>
                      <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color: statusConfig[c.status].color, fontWeight:600 }}>
                        <span style={{ width:8,height:8,borderRadius:'50%',background:statusConfig[c.status].color,display:'inline-block'}} />
                        {statusConfig[c.status].label}
                      </span>
                    </td>
                    <td>{fmt(c.price_weekday)}</td>
                    <td>{fmt(c.price_weekend)}</td>
                    <td>{fmt(c.price_night)}</td>
                    <td>
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn btn-primary btn-sm">Đặt</button>
                        <button className="btn btn-ghost btn-sm"><Edit2 size={13} /></button>
                        <button className="btn btn-ghost btn-sm"><Trash2 size={13} color="var(--danger)" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

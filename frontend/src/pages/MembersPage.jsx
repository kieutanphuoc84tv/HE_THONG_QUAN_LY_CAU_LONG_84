import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, Phone, Mail, Calendar } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import styles from './MembersPage.module.css'

const members = [
  { id: 1, name: 'Nguyễn Văn An', phone: '0901 234 567', email: 'an.nguyen@gmail.com', role: 'Thành viên', joined: '01/01/2026', bookings: 24, tournaments: 3, status: 'active' },
  { id: 2, name: 'Trần Thị Bích', phone: '0902 345 678', email: 'bich.tran@gmail.com', role: 'Thành viên', joined: '15/01/2026', bookings: 18, tournaments: 2, status: 'active' },
  { id: 3, name: 'Lê Văn Cường', phone: '0903 456 789', email: 'cuong.le@gmail.com', role: 'HLV', joined: '10/11/2025', bookings: 45, tournaments: 8, status: 'active' },
  { id: 4, name: 'Phạm Thị Dung', phone: '0904 567 890', email: 'dung.pham@gmail.com', role: 'Thành viên', joined: '20/02/2026', bookings: 10, tournaments: 1, status: 'active' },
  { id: 5, name: 'Hoàng Văn Em', phone: '0905 678 901', email: 'em.hoang@gmail.com', role: 'Thành viên', joined: '05/03/2026', bookings: 7, tournaments: 0, status: 'inactive' },
  { id: 6, name: 'Vũ Thị Phương', phone: '0906 789 012', email: 'phuong.vu@gmail.com', role: 'Quản lý', joined: '01/10/2025', bookings: 30, tournaments: 5, status: 'active' },
  { id: 7, name: 'Đặng Văn Giang', phone: '0907 890 123', email: 'giang.dang@gmail.com', role: 'Thành viên', joined: '12/04/2026', bookings: 3, tournaments: 1, status: 'active' },
  { id: 8, name: 'Bùi Thị Hoa', phone: '0908 901 234', email: 'hoa.bui@gmail.com', role: 'Thành viên', joined: '18/04/2026', bookings: 2, tournaments: 0, status: 'active' },
]

const roleConf = {
  'Thành viên': { cls: 'badge-info' },
  'HLV': { cls: 'badge-success' },
  'Quản lý': { cls: 'badge-warning' },
}

export default function MembersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) &&
    (roleFilter === 'all' || m.role === roleFilter)
  )

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Quản lý thành viên</h1>
            <p className={styles.subtitle}>{members.length} thành viên • {members.filter(m => m.status === 'active').length} đang hoạt động</p>
          </div>
          <button className="btn btn-primary btn-sm"><Plus size={16} /> Thêm thành viên</button>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { label: 'Tổng thành viên', value: members.length, color: '#00D4AA', icon: '👥' },
            { label: 'Đang hoạt động', value: members.filter(m => m.status === 'active').length, color: '#6C63FF', icon: '✅' },
            { label: 'Huấn luyện viên', value: members.filter(m => m.role === 'HLV').length, color: '#FFD60A', icon: '🎯' },
            { label: 'Thành viên mới tháng này', value: 8, color: '#FF9F1C', icon: '🆕' },
          ].map(s => (
            <div key={s.label} className={styles.statCard} style={{ borderColor: `${s.color}25` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36, width: 280, height: 38, fontSize: 13 }}
              placeholder="Tìm thành viên..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles.roleFilters}>
            {['all', 'Thành viên', 'HLV', 'Quản lý'].map(r => (
              <button key={r} className={`${styles.roleBtn} ${roleFilter === r ? styles.roleBtnActive : ''}`}
                onClick={() => setRoleFilter(r)}>
                {r === 'all' ? 'Tất cả' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper card">
          <table>
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Ngày tham gia</th>
                <th>Số lần đặt sân</th>
                <th>Giải đấu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={styles.avatar}>
                        {m.name.split(' ').slice(-1)[0].charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: #{m.id.toString().padStart(4, '0')}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Phone size={12} /> {m.phone}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                        <Mail size={12} /> {m.email}
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${roleConf[m.role].cls}`}>{m.role}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <Calendar size={12} /> {m.joined}
                    </div>
                  </td>
                  <td><strong>{m.bookings}</strong> <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>lần</span></td>
                  <td><strong>{m.tournaments}</strong> <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>giải</span></td>
                  <td>
                    <span className={m.status === 'active' ? 'badge badge-success' : 'badge badge-danger'}>
                      <span className={`dot ${m.status === 'active' ? 'dot-green' : 'dot-red'}`} />
                      {m.status === 'active' ? 'Hoạt động' : 'Tạm nghỉ'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm"><Edit2 size={13} /></button>
                      <button className="btn btn-ghost btn-sm"><Trash2 size={13} color="var(--danger)" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}

import { useState } from 'react'
import { Plus, Trophy, Users, Calendar, ChevronRight } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import styles from './TournamentsPage.module.css'

const tournaments = [
  {
    id: 1, name: 'CLB Mở Rộng 2026', format: 'Loại trực tiếp', status: 'ongoing',
    start: '05/05/2026', end: '20/05/2026', participants: 16, maxParticipants: 16, fee: 100000,
    desc: 'Giải đấu nội bộ CLB mở rộng, dành cho tất cả thành viên và khách mời.',
  },
  {
    id: 2, name: 'Đôi Nam Trà Vinh 2026', format: 'Vòng tròn', status: 'upcoming',
    start: '25/05/2026', end: '10/06/2026', participants: 8, maxParticipants: 16, fee: 150000,
    desc: 'Giải đấu đôi nam dành cho VĐV tỉnh Trà Vinh.',
  },
  {
    id: 3, name: 'Tứ Hùng Cầu Lông', format: 'Loại trực tiếp', status: 'upcoming',
    start: '01/06/2026', end: '15/06/2026', participants: 4, maxParticipants: 32, fee: 200000,
    desc: 'Giải đấu đối kháng 4 đội mạnh nhất khu vực.',
  },
  {
    id: 4, name: 'Giải Nội Bộ Tháng 4', format: 'Vòng tròn', status: 'completed',
    start: '10/04/2026', end: '30/04/2026', participants: 12, maxParticipants: 12, fee: 50000,
    desc: 'Giải đấu nội bộ hàng tháng.',
  },
]

const bracket = [
  { round: 'Tứ kết', matches: [
    { p1: 'Nguyễn Văn A', p2: 'Trần Văn B', score1: 21, score2: 15, done: true },
    { p1: 'Lê Văn C', p2: 'Phạm Văn D', score1: 21, score2: 18, done: true },
    { p1: 'Hoàng Văn E', p2: 'Vũ Văn F', score1: 19, score2: 21, done: true },
    { p1: 'Đặng Văn G', p2: 'Bùi Văn H', score1: 21, score2: 9, done: true },
  ]},
  { round: 'Bán kết', matches: [
    { p1: 'Nguyễn Văn A', p2: 'Lê Văn C', score1: null, score2: null, done: false },
    { p1: 'Vũ Văn F', p2: 'Đặng Văn G', score1: null, score2: null, done: false },
  ]},
  { round: 'Chung kết', matches: [
    { p1: 'TBD', p2: 'TBD', score1: null, score2: null, done: false },
  ]},
]

const leaderboard = [
  { rank: 1, name: 'Nguyễn Văn A', wins: 8, losses: 1, points: 240, change: 'up' },
  { rank: 2, name: 'Lê Văn C', wins: 7, losses: 2, points: 210, change: 'up' },
  { rank: 3, name: 'Đặng Văn G', wins: 6, losses: 2, points: 190, change: 'same' },
  { rank: 4, name: 'Vũ Văn F', wins: 5, losses: 3, points: 160, change: 'down' },
  { rank: 5, name: 'Trần Văn B', wins: 4, losses: 4, points: 130, change: 'down' },
]

const statusConf = {
  ongoing: { label: 'Đang diễn ra', cls: 'badge-success' },
  upcoming: { label: 'Sắp diễn ra', cls: 'badge-warning' },
  completed: { label: 'Đã kết thúc', cls: 'badge-info' },
}

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [selected, setSelected] = useState(tournaments[0])

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Quản lý giải đấu</h1>
            <p className={styles.subtitle}>{tournaments.length} giải đấu • {tournaments.filter(t => t.status === 'ongoing').length} đang diễn ra</p>
          </div>
          <button className="btn btn-primary btn-sm"><Plus size={16} /> Tạo giải đấu</button>
        </div>

        {/* Tab */}
        <div className={styles.tabs}>
          {[['list', '📋 Danh sách giải'], ['bracket', '🏆 Bảng đấu'], ['leaderboard', '📊 Bảng xếp hạng']].map(([key, label]) => (
            <button key={key} className={`${styles.tab} ${activeTab === key ? styles.activeTab : ''}`} onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {activeTab === 'list' && (
          <div className={styles.tournamentGrid}>
            {tournaments.map(t => (
              <div key={t.id} className={`${styles.tCard} ${selected.id === t.id ? styles.tCardSelected : ''}`}
                onClick={() => setSelected(t)}>
                <div className={styles.tCardTop}>
                  <span className="badge" style={{ fontSize: 36 }}>🏆</span>
                  <span className={`badge ${statusConf[t.status].cls}`}>{statusConf[t.status].label}</span>
                </div>
                <h3 className={styles.tName}>{t.name}</h3>
                <p className={styles.tDesc}>{t.desc}</p>
                <div className={styles.tMeta}>
                  <span><Calendar size={13} /> {t.start} — {t.end}</span>
                  <span><Users size={13} /> {t.participants}/{t.maxParticipants} VĐV</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-surface)', marginTop: 12 }}>
                  <div style={{ width: `${(t.participants / t.maxParticipants) * 100}%`, height: '100%', borderRadius: 2, background: 'var(--primary)' }} />
                </div>
                <div className={styles.tFooter}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>{t.fee.toLocaleString('vi-VN')}đ</span>
                  <button className="btn btn-primary btn-sm">Đăng ký <ChevronRight size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bracket */}
        {activeTab === 'bracket' && (
          <div className={styles.bracketSection}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, marginBottom: 4 }}>CLB Mở Rộng 2026</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Hình thức: Loại trực tiếp • 16 VĐV</p>
            </div>
            <div className={styles.bracket}>
              {bracket.map((round, ri) => (
                <div key={ri} className={styles.roundCol}>
                  <h3 className={styles.roundTitle}>{round.round}</h3>
                  <div className={styles.matches}>
                    {round.matches.map((m, mi) => (
                      <div key={mi} className={styles.matchCard}>
                        <div className={`${styles.player} ${m.done && m.score1 > m.score2 ? styles.winner : ''}`}>
                          <span>{m.p1}</span>
                          <span className={styles.score}>{m.score1 ?? '—'}</span>
                        </div>
                        <div className={styles.matchDivider} />
                        <div className={`${styles.player} ${m.done && m.score2 > m.score1 ? styles.winner : ''}`}>
                          <span>{m.p2}</span>
                          <span className={styles.score}>{m.score2 ?? '—'}</span>
                        </div>
                        {!m.done && (
                          <button className={styles.updateBtn}>Cập nhật kết quả</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontWeight: 800 }}>Bảng xếp hạng vận động viên</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Cập nhật theo kết quả thi đấu</p>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead><tr><th>Hạng</th><th>Vận động viên</th><th>Thắng</th><th>Thua</th><th>Điểm</th><th>Xu hướng</th></tr></thead>
                <tbody>
                  {leaderboard.map(l => (
                    <tr key={l.rank}>
                      <td>
                        <span className={styles.rankBadge} style={{ background: l.rank === 1 ? '#FFD60A22' : l.rank === 2 ? '#C0C0C022' : l.rank === 3 ? '#CD7F3222' : 'var(--bg-surface)', color: l.rank === 1 ? '#FFD60A' : l.rank === 2 ? '#C0C0C0' : l.rank === 3 ? '#CD7F32' : 'var(--text-secondary)' }}>
                          {l.rank === 1 ? '🥇' : l.rank === 2 ? '🥈' : l.rank === 3 ? '🥉' : `#${l.rank}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                            {l.name.charAt(0)}
                          </div>
                          <strong>{l.name}</strong>
                        </div>
                      </td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{l.wins}</td>
                      <td style={{ color: 'var(--danger)' }}>{l.losses}</td>
                      <td><strong style={{ fontSize: 16 }}>{l.points}</strong></td>
                      <td>{l.change === 'up' ? '📈' : l.change === 'down' ? '📉' : '➡️'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function CourtCalendar({ bookings, courts, onSelectEvent }) {
  if (!courts || courts.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>⏳ Đang tải dữ liệu sân...</div>

  const startHour = 6
  const endHour = 22
  const hours = []
  for (let i = startHour; i <= endHour; i++) hours.push(i)

  return (
    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', textAlign: 'center', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
        <thead>
          <tr>
            <th style={{ padding: '16px 10px', borderBottom: '2px solid #e2e8f0', borderRight: '1.5px solid #e2e8f0', background: '#f8fafc', width: 90, position: 'sticky', top: 0, zIndex: 10 }}>Giờ</th>
            {courts.map(c => (
              <th key={c.MaSan} style={{ padding: '16px 10px', borderBottom: '2px solid #e2e8f0', borderRight: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 15, color: '#0f172a', position: 'sticky', top: 0, zIndex: 10 }}>
                {c.TenSan}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map(h => {
            const timeStr = `${h.toString().padStart(2, '0')}:00`
            return (
              <tr key={h}>
                <td style={{ padding: '15px 10px', borderBottom: '1.5px solid #e2e8f0', borderRight: '1.5px solid #e2e8f0', fontWeight: 700, color: '#64748b', fontSize: 14, background: '#f8fafc' }}>
                  {timeStr}
                </td>
                {courts.map(c => {
                  // Lọc các lịch đặt thuộc sân này và nằm trong khung giờ này
                  const cellBookings = bookings.filter(b => {
                    const idSan = b.MaSan || b.id_san || b.San?.id_san;
                    if (idSan !== c.MaSan && idSan !== c.id_san) return false;
                    
                    const start = new Date(b.GioBatDau).getHours();
                    const end = new Date(b.GioKetThuc).getHours();
                    // Nếu end là 12:00, nó không nên hiện ở ô 12:00, mà hiện ở ô trước đó
                    const isEndOnHour = new Date(b.GioKetThuc).getMinutes() === 0;
                    const adjustedEnd = isEndOnHour ? end - 1 : end;
                    
                    return h >= start && h <= adjustedEnd;
                  });

                  return (
                    <td key={c.MaSan} style={{ padding: 10, borderBottom: '1.5px solid #e2e8f0', borderRight: '1.5px solid #e2e8f0', verticalAlign: 'top', minHeight: 100 }}>
                      {cellBookings.map(b => {
                        // Xác định màu sắc dựa trên trạng thái
                        let bg = '#ecfdf5', borderColor = '#10b981', textColor = '#047857';
                        if (b.TrangThai === 'ChoXacNhan') { bg = '#fffbeb'; borderColor = '#f59e0b'; textColor = '#b45309'; }
                        if (b.TrangThai === 'DaHuy') { bg = '#fef2f2'; borderColor = '#ef4444'; textColor = '#b91c1c'; }
                        if (b.TrangThai === 'HoanThanh') { bg = '#eff6ff'; borderColor = '#3b82f6'; textColor = '#1d4ed8'; }

                        return (
                          <div 
                            key={b.MaLichDat || b.id} 
                            onClick={() => onSelectEvent && onSelectEvent({ resource: b })}
                            style={{
                              background: bg,
                              borderLeft: `4px solid ${borderColor}`,
                              padding: '10px 12px',
                              borderRadius: 8,
                              marginBottom: 10,
                              cursor: 'pointer',
                              textAlign: 'left',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                              transition: 'transform 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <div style={{ fontSize: 12, fontWeight: 800, color: textColor, marginBottom: 4 }}>
                              {new Date(b.GioBatDau).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {new Date(b.GioKetThuc).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, marginBottom: 4 }}>
                              {b.KhachHang?.NguoiDung?.HoTen || b.title?.split('-')[1] || 'Khách'}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                              {b.TrangThai}
                            </div>
                          </div>
                        )
                      })}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

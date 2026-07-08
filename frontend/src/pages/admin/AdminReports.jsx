import { useState, useEffect, useRef } from 'react'
import {
  BarChart3, TrendingUp, Building2, FileText,
  Download, FileSpreadsheet, RefreshCw, Calendar,
  DollarSign, Trophy, Package, ArrowUpRight
} from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../services/api'

/* ─── helpers ─── */
const fmt  = (n) => (n || 0).toLocaleString('vi-VN') + ' VND'
const fmtM = (n) => (n || 0).toLocaleString('vi-VN') + ' VND'

/* ─── Export PDF trực tiếp bằng jsPDF html renderer ─── */
async function exportPDF(revenueBreakdown, courtStats, revenueData, period, advStats) {
  const { jsPDF } = await import('jspdf')

  const periodLabel = period === '7days' ? '7 ngày qua' : '30 ngày qua'
  const dateStr = new Date().toLocaleDateString('vi-VN')
  const fmt = (n) => (n || 0).toLocaleString('vi-VN') + 'đ'

  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '0'
  container.style.top = '0'
  container.style.zIndex = '-9999'
  container.style.width = '794px'
  container.style.padding = '24px'
  container.style.background = '#ffffff'
  container.style.fontFamily = 'Arial, sans-serif'
  container.style.color = '#0f172a'

  const courtRows = courtStats.map((c) => `
    <tr>
      <td>${c.TenSan || '—'}</td>
      <td>${c.SoLuotDat || 0}</td>
      <td>${fmt(c.DoanhThu)}</td>
    </tr>
  `).join('')

  const dayRows = Object.entries(revenueData?.byDay || {}).map(([d, v]) => `
    <tr>
      <td>${new Date(d).toLocaleDateString('vi-VN')}</td>
      <td>${fmt(v)}</td>
    </tr>
  `).join('')

  const tournamentRows = (advStats?.tournaments || []).map((t) => {
    let tHtml = `
      <div style="margin-bottom:16px;">
        <h3 style="font-size:14px; font-weight:700; margin:0 0 8px; color:#111827;">Giải: ${t.tengiai} (${t.trangthai})</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
          <thead>
            <tr style="background:#f8fafc; color:#475569; text-align:left; border-bottom:2px solid #e5e7eb;">
              <th style="padding:8px 12px;">Vòng</th>
              <th style="padding:8px 12px;">VĐV 1</th>
              <th style="padding:8px 12px;">VĐV 2</th>
              <th style="padding:8px 12px;">Tỉ số</th>
              <th style="padding:8px 12px;">Thắng</th>
            </tr>
          </thead>
          <tbody>
    `
    if (t.tranDaus && t.tranDaus.length > 0) {
      tHtml += t.tranDaus.map(kq => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 12px;">${kq.vong || '-'}</td>
          <td style="padding:8px 12px; font-weight:600;">${kq.vdv1}</td>
          <td style="padding:8px 12px; font-weight:600;">${kq.vdv2}</td>
          <td style="padding:8px 12px; font-weight:700; color:#3b82f6;">${kq.diemso || '-'}</td>
          <td style="padding:8px 12px; font-weight:700; color:#10b981;">${kq.nguoiThang}</td>
        </tr>
      `).join('')
    } else {
      tHtml += `<tr><td colspan="5" style="padding:8px 12px; text-align:center; color:#94a3b8;">Chưa có trận đấu</td></tr>`
    }
    tHtml += `</tbody></table></div>`
    return tHtml
  }).join('')

  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <div style="font-size:14px; color:#475569;">Cầu Lông 84 · Xuất ngày: ${dateStr}</div>
        <div style="font-size:14px; color:#475569;">Chu kỳ: ${periodLabel}</div>
      </div>
      <h1 style="margin:0; font-size:28px; letter-spacing:0.08em; font-weight:800;">Báo cáo Doanh thu</h1>
      <div style="height:1px; background:#e5e7eb; margin:22px 0;"></div>
      <section style="margin-bottom:24px;">
        <h2 style="margin:0 0 12px; font-size:16px; font-weight:700;">Tổng quan Doanh thu</h2>
        <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px;">
          <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#f8fafc;">
            <div style="font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">Tổng doanh thu</div>
            <div style="font-size:18px; font-weight:800; color:#111827;">${fmt(revenueBreakdown?.tongDoanhThu)}</div>
          </div>
          <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#ffffff;">
            <div style="font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">Thuê sân cầu lông</div>
            <div style="font-size:18px; font-weight:800; color:#111827;">${fmt(revenueBreakdown?.sanBaoCau)}</div>
          </div>
          <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#ffffff;">
            <div style="font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">Thuê dụng cụ</div>
            <div style="font-size:18px; font-weight:800; color:#111827;">${fmt(revenueBreakdown?.dungCu)}</div>
          </div>
          <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#ffffff;">
            <div style="font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">Lệ phí giải đấu</div>
            <div style="font-size:18px; font-weight:800; color:#111827;">${fmt(revenueBreakdown?.giaiDau)}</div>
          </div>
        </div>
      </section>
      <section style="margin-bottom:24px;">
        <h2 style="margin:0 0 12px; font-size:16px; font-weight:700;">Hiệu suất Sử dụng Sân</h2>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#111827; color:#fff; text-align:left;">
              <th style="padding:10px 12px;">Tên sân</th>
              <th style="padding:10px 12px; text-align:center;">Số lượt đặt</th>
              <th style="padding:10px 12px; text-align:right;">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            ${courtRows}
          </tbody>
        </table>
      </section>
      <section style="margin-bottom:24px;">
        <h2 style="margin:0 0 12px; font-size:16px; font-weight:700;">Doanh thu theo Ngày</h2>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#111827; color:#fff; text-align:left;">
              <th style="padding:10px 12px;">Ngày</th>
              <th style="padding:10px 12px; text-align:right;">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            ${dayRows}
          </tbody>
        </table>
      </section>
      <section>
        <h2 style="margin:0 0 12px; font-size:16px; font-weight:700;">Kết quả Các Trận đấu Giải đấu</h2>
        ${tournamentRows}
      </section>
    </div>
  `

  document.body.appendChild(container)

  // Use html2canvas explicitly to capture the container into an image
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  })
  
  const imgData = canvas.toDataURL('image/jpeg', 1.0)
  const doc = new jsPDF('p', 'pt', 'a4')
  const pdfWidth = doc.internal.pageSize.getWidth()
  
  // Add margin
  const margin = 20;
  const innerWidth = pdfWidth - margin * 2;
  const pdfHeight = (canvas.height * innerWidth) / canvas.width
  
  doc.addImage(imgData, 'JPEG', margin, margin, innerWidth, pdfHeight)
  doc.save(`BaoCaoDoanhThu_${new Date().toISOString().slice(0, 10)}.pdf`)

  container.remove()
}

/* ─── Export Excel ─── */
async function exportExcel(revenueBreakdown, courtStats, revenueData, period, advStats) {
  const ExcelJS = await import('exceljs')
  const { saveAs } = await import('file-saver')

  const wb = new ExcelJS.Workbook()
  
  // Sheet 1: Tổng quan
  const ws1 = wb.addWorksheet('Tổng quan')
  ws1.columns = [
    { header: '', key: 'col1', width: 30 },
    { header: '', key: 'col2', width: 25 },
    { header: '', key: 'col3', width: 15 }
  ]
  ws1.mergeCells('A1:C1')
  ws1.getCell('A1').value = 'BÁO CÁO DOANH THU - CẦU LÔNG 84'
  ws1.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
  ws1.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
  ws1.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  
  ws1.addRow(['Chu kỳ', period === '7days' ? '7 ngày qua' : '30 ngày qua'])
  ws1.addRow(['Xuất ngày', new Date().toLocaleDateString('vi-VN')])
  ws1.addRow([]) // empty row
  
  const headerRow1 = ws1.addRow(['Hạng mục', 'Số tiền (VNĐ)', 'Tỷ lệ'])
  headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }
  
  const dataRows1 = [
    ['Tổng doanh thu', revenueBreakdown?.tongDoanhThu || 0, '100%'],
    ['Thuê sân cầu lông', revenueBreakdown?.sanBaoCau || 0, `${Math.round(((revenueBreakdown?.sanBaoCau || 0) / (revenueBreakdown?.tongDoanhThu || 1)) * 100)}%`],
    ['Thuê dụng cụ', revenueBreakdown?.dungCu || 0, `${Math.round(((revenueBreakdown?.dungCu || 0) / (revenueBreakdown?.tongDoanhThu || 1)) * 100)}%`],
    ['Lệ phí giải đấu', revenueBreakdown?.giaiDau || 0, `${Math.round(((revenueBreakdown?.giaiDau || 0) / (revenueBreakdown?.tongDoanhThu || 1)) * 100)}%`]
  ]
  dataRows1.forEach(r => ws1.addRow(r))
  
  ws1.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
    })
  })

  // Sheet 2: Doanh thu theo ngày
  const ws2 = wb.addWorksheet('Doanh thu theo ngày')
  ws2.columns = [
    { header: '', key: 'col1', width: 20 },
    { header: '', key: 'col2', width: 25 }
  ]
  ws2.mergeCells('A1:B1')
  ws2.getCell('A1').value = 'DOANH THU THEO NGÀY'
  ws2.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  ws2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
  ws2.getCell('A1').alignment = { horizontal: 'center' }
  
  const headerRow2 = ws2.addRow(['Ngày', 'Doanh thu (VNĐ)'])
  headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }
  
  Object.entries(revenueData?.byDay || {}).forEach(([d, v]) => {
    ws2.addRow([new Date(d).toLocaleDateString('vi-VN'), v])
  })
  ws2.addRow([])
  const totalRow2 = ws2.addRow(['Tổng cộng', revenueData?.total || 0])
  totalRow2.font = { bold: true }
  
  ws2.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
    })
  })

  // Sheet 3: Hiệu suất sân
  const ws3 = wb.addWorksheet('Hiệu suất sân')
  ws3.columns = [
    { header: '', key: 'col1', width: 15 },
    { header: '', key: 'col2', width: 25 },
    { header: '', key: 'col3', width: 15 },
    { header: '', key: 'col4', width: 25 }
  ]
  ws3.mergeCells('A1:D1')
  ws3.getCell('A1').value = 'HIỆU SUẤT SỬ DỤNG SÂN'
  ws3.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  ws3.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
  ws3.getCell('A1').alignment = { horizontal: 'center' }
  
  const headerRow3 = ws3.addRow(['Mã sân', 'Tên sân', 'Số lượt đặt', 'Doanh thu (VNĐ)'])
  headerRow3.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }
  
  courtStats.forEach(c => {
    ws3.addRow([c.MaSan, c.TenSan, c.SoLuotDat, c.DoanhThu || 0])
  })
  
  ws3.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
    })
  })

  // Sheet 4: Kết quả giải đấu
  const ws4 = wb.addWorksheet('Kết quả giải đấu')
  ws4.columns = [
    { header: '', key: 'col1', width: 30 },
    { header: '', key: 'col2', width: 15 },
    { header: '', key: 'col3', width: 25 },
    { header: '', key: 'col4', width: 25 },
    { header: '', key: 'col5', width: 15 },
    { header: '', key: 'col6', width: 25 }
  ]
  ws4.mergeCells('A1:F1')
  ws4.getCell('A1').value = 'KẾT QUẢ TRẬN ĐẤU GIẢI ĐẤU'
  ws4.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  ws4.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } }
  ws4.getCell('A1').alignment = { horizontal: 'center' }
  
  const headerRow4 = ws4.addRow(['Tên giải đấu', 'Vòng', 'Người chơi 1', 'Người chơi 2', 'Tỉ số', 'Người thắng'])
  headerRow4.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }
  
  ;(advStats?.tournaments || []).forEach(t => {
    if (t.tranDaus && t.tranDaus.length > 0) {
      t.tranDaus.forEach(kq => {
        ws4.addRow([t.tengiai, kq.vong || '-', kq.vdv1, kq.vdv2, kq.diemso || '-', kq.nguoiThang])
      })
    } else {
      ws4.addRow([t.tengiai, '-', '-', '-', '-', 'Chưa có trận đấu'])
    }
  })
  
  ws4.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
    })
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `BaoCaoDoanhThu_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/* ─── SVG Line Chart ─── */
function LineChart({ points, maxVal, loading }) {
  const W = 700, H = 200, PL = 60, PR = 20, PT = 20, PB = 32
  const cW = W - PL - PR, cH = H - PT - PB

  if (loading) return (
    <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
      ⏳ Đang tải biểu đồ...
    </div>
  )
  if (!points.length) return (
    <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
      Không có dữ liệu
    </div>
  )

  const pts = points.map((p, i) => ({
    ...p,
    x: PL + (i / Math.max(points.length - 1, 1)) * cW,
    y: PT + cH - ((p.val / (maxVal || 1)) * cH),
  }))

  const linePath = pts.map(p => `${p.x},${p.y}`).join(' L ')
  const areaPath = `M ${PL},${PT + cH} L ${linePath} L ${PL + cW},${PT + cH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const y = PT + cH - r * cH
        const lv = maxVal * r
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={PL + cW} y2={y} stroke="#f1f5f9" strokeWidth="1.5"/>
            <text x={PL - 8} y={y + 4} textAnchor="end" style={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}>
              {lv >= 1_000_000 ? `${(lv/1e6).toFixed(1)}M` : lv >= 1000 ? `${(lv/1000).toFixed(0)}k` : lv}
            </text>
          </g>
        )
      })}

      {/* Area + Line */}
      <path d={areaPath} fill="url(#rptGrad)"/>
      <path d={`M ${linePath}`} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Dots + Labels */}
      {pts.map((p, i) => {
        const show = points.length <= 10 || i % Math.ceil(points.length / 10) === 0
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#10b981" strokeWidth="2"/>
            {show && (
              <text x={p.x} y={PT + cH + 20} textAnchor="middle" style={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}>
                {p.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* ─── Donut Chart ─── */
function DonutChart({ segments, total }) {
  const cx = 70, cy = 70, r = 54, sw = 20
  const circ = 2 * Math.PI * r
  let acc = 0
  const arcs = segments.map(s => {
    const pct = s.val / (total || 1)
    const dash = pct * circ
    const offset = circ - acc
    acc += dash
    return { ...s, dash, offset, pct }
  })

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw}/>
      {arcs.map((arc, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={arc.color} strokeWidth={sw}
          strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
          strokeDashoffset={arc.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy - 5} textAnchor="middle" style={{ fontSize: 11, fontWeight: 900, fill: '#0f172a' }}>
        {(total || 0).toLocaleString('vi-VN')}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 9, fill: '#94a3b8' }}>
        VND
      </text>
    </svg>
  )
}

/* ─── Two-Sided Bracket with Connector Lines ─── */
function TwoSidedBracket({ matches }) {
  const bracketRef = useRef(null);

  if (!matches || matches.length === 0) {
    return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 600 }}>Chưa có dữ liệu trận đấu</div>;
  }

  /* ── Group matches by round ── */
  const roundsMap = {};
  matches.forEach(m => {
    const r = m.vong || 'Vòng đấu';
    if (!roundsMap[r]) roundsMap[r] = [];
    roundsMap[r].push(m);
  });

  const rounds = Object.entries(roundsMap)
    .sort((a, b) => b[1].length - a[1].length)
    .map(e => ({ name: e[0], matches: e[1] }));

  const leftRounds = [];
  const rightRounds = [];
  let finalMatch = null;

  rounds.forEach((round) => {
    if (round.matches.length === 1) {
      if (!finalMatch) finalMatch = round.matches[0];
    } else {
      const half = Math.ceil(round.matches.length / 2);
      leftRounds.push({ name: round.name, matches: round.matches.slice(0, half) });
      rightRounds.push({ name: round.name, matches: round.matches.slice(half) });
    }
  });

  /* ── Connector Line between rounds ── */
  const Connector = ({ count, side }) => {
    const CARD_H = 82;
    const GAP = 24;
    const totalH = count * CARD_H + (count - 1) * GAP;
    const nextCount = Math.ceil(count / 2);
    const nextH = nextCount * CARD_H + (nextCount - 1) * GAP;
    const W = 32;

    const paths = [];
    for (let i = 0; i < nextCount; i++) {
      const topIdx = i * 2;
      const botIdx = i * 2 + 1;
      const topY = (topIdx * (CARD_H + GAP)) + CARD_H / 2;
      const botY = botIdx < count ? (botIdx * (CARD_H + GAP)) + CARD_H / 2 : topY;
      const midY = (totalH / nextCount) * i + (totalH / nextCount) / 2;

      if (side === 'left') {
        paths.push(`M 0 ${topY} H ${W * 0.6} V ${midY} H ${W}`);
        if (botIdx < count) paths.push(`M 0 ${botY} H ${W * 0.6} V ${midY}`);
      } else {
        paths.push(`M ${W} ${topY} H ${W * 0.4} V ${midY} H 0`);
        if (botIdx < count) paths.push(`M ${W} ${botY} H ${W * 0.4} V ${midY}`);
      }
    }

    return (
      <svg width={W} height={totalH} style={{ display: 'block', flexShrink: 0 }}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        ))}
      </svg>
    );
  };

  /* ── Match Card ── */
  const MatchCard = ({ match, isCenter }) => {
    const s1 = match.diemso ? match.diemso.split('-')[0]?.trim() : '-';
    const s2 = match.diemso ? match.diemso.split('-')[1]?.trim() : '-';
    const win1 = match.nguoiThang === match.vdv1;
    const win2 = match.nguoiThang === match.vdv2;

    const cardStyle = {
      background: isCenter ? 'linear-gradient(135deg, #fefce8 0%, #fff 100%)' : '#fff',
      border: isCenter ? '2px solid #f59e0b' : '1px solid #cbd5e1',
      borderRadius: 10,
      padding: '0',
      width: 210,
      boxShadow: isCenter ? '0 8px 24px rgba(245,158,11,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    };

    const rowStyle = (isWinner) => ({
      display: 'flex', alignItems: 'center', padding: '8px 10px',
      background: isWinner ? 'rgba(16,185,129,0.06)' : 'transparent',
      transition: 'background 0.2s',
    });

    const scoreStyle = (isWinner) => ({
      width: 28, textAlign: 'center',
      fontSize: 14, fontWeight: 900,
      color: isWinner ? '#fff' : '#475569',
      background: isWinner ? '#10b981' : '#f1f5f9',
      borderRadius: 4, padding: '2px 0', marginLeft: 'auto', flexShrink: 0,
    });

    return (
      <div style={cardStyle}>
        {isCenter && (
          <div style={{ background: 'linear-gradient(90deg, #f59e0b, #eab308)', padding: '4px 0', textAlign: 'center', fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: '.12em', textTransform: 'uppercase' }}>
            🏆 Chung Kết
          </div>
        )}
        <div style={rowStyle(win1)}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 900, marginRight: 8, flexShrink: 0 }}>
            {match.vdv1 ? match.vdv1[0] : '?'}
          </div>
          <span style={{ fontSize: 13, fontWeight: win1 ? 800 : 500, color: win1 ? '#0f172a' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{match.vdv1}</span>
          <div style={scoreStyle(win1)}>{s1}</div>
        </div>
        <div style={{ height: 1, background: '#e2e8f0' }} />
        <div style={rowStyle(win2)}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 900, marginRight: 8, flexShrink: 0 }}>
            {match.vdv2 ? match.vdv2[0] : '?'}
          </div>
          <span style={{ fontSize: 13, fontWeight: win2 ? 800 : 500, color: win2 ? '#0f172a' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{match.vdv2}</span>
          <div style={scoreStyle(win2)}>{s2}</div>
        </div>
      </div>
    );
  };

  /* ── Round Column ── */
  const RoundColumn = ({ round, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16, background: '#e2e8f0', padding: '4px 14px', borderRadius: 20 }}>
        {label || round.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 24, flex: 1 }}>
        {round.matches.map(m => <MatchCard key={m.id_ketquatd} match={m} />)}
      </div>
    </div>
  );

  return (
    <div ref={bracketRef} style={{ display: 'flex', minWidth: 'max-content', padding: '40px 60px', gap: 0, justifyContent: 'center', alignItems: 'center' }}>

      {/* ── LEFT WING ── */}
      {leftRounds.map((r, i) => (
        <div key={`left-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
          <RoundColumn round={r} />
          <Connector count={r.matches.length} side="left" />
        </div>
      ))}

      {/* ── CENTER: TROPHY + FINAL ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '0 30px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={48} color="#f59e0b" style={{ filter: 'drop-shadow(0 4px 16px rgba(245,158,11,0.5))' }} />
          </div>
        </div>
        {finalMatch && <MatchCard match={finalMatch} isCenter />}
      </div>

      {/* ── RIGHT WING ── */}
      {[...rightRounds].reverse().map((r, i) => (
        <div key={`right-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
          <Connector count={r.matches.length} side="right" />
          <RoundColumn round={r} />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function AdminReports() {
  const [period, setPeriod]               = useState('7days')
  const [revenueData, setRevenueData]     = useState(null)
  const [revenueBreakdown, setRevBreak]   = useState(null)
  const [courtStats, setCourtStats]       = useState([])
  const [advStats, setAdvStats]           = useState(null)
  const [loading, setLoading]             = useState(true)
  const [loadingRev, setLoadingRev]       = useState(false)
  const [exporting, setExporting]         = useState(null) // 'pdf' | 'excel'
  const [selectedTournament, setSelectedTournament] = useState(null) // Modal state

  /* fetch breakdown + court stats once */
  useEffect(() => {
    Promise.all([
      api.get('/reports/revenue-breakdown'),
      api.get('/reports/court-stats'),
      api.get('/reports/advanced-stats')
    ]).then(([b, c, a]) => {
      setRevBreak(b.data)
      setCourtStats(Array.isArray(c.data) ? c.data : [])
      setAdvStats(a.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  /* fetch revenue by period */
  useEffect(() => {
    setLoadingRev(true)
    const to   = new Date()
    const from = new Date()
    from.setDate(to.getDate() - (period === '7days' ? 6 : 29))
    api.get('/reports/revenue', {
      params: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }
    }).then(r => setRevenueData(r.data))
      .catch(console.error)
      .finally(() => setLoadingRev(false))
  }, [period])

  /* Build chart points */
  const days = Array.from({ length: period === '7days' ? 7 : 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (period === '7days' ? 6 : 29) + i)
    return d.toISOString().split('T')[0]
  })
  const chartPoints = days.map(d => ({
    label: new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    val: revenueData?.byDay?.[d] || 0,
  }))
  const maxVal = Math.max(...chartPoints.map(p => p.val), 100_000)

  /* Revenue breakdown */
  const breakdownSegs = [
    { label: 'Thuê sân',   val: revenueBreakdown?.sanBaoCau || 0, color: '#10b981' },
    { label: 'Thuê đồ',   val: revenueBreakdown?.dungCu    || 0, color: '#3b82f6' },
    { label: 'Giải đấu',  val: revenueBreakdown?.giaiDau   || 0, color: '#8b5cf6' },
  ]
  const totalRevenue = revenueBreakdown?.tongDoanhThu || 0

  /* Court usage */
  const maxBookings = Math.max(...courtStats.map(c => c.SoLuotDat), 1)
  const courtColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899']

  /* Summary cards */
  const cards = [
    { label: 'Tổng doanh thu',  value: fmtM(totalRevenue),                       icon: <DollarSign size={20}/>, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Thuê sân',        value: fmtM(revenueBreakdown?.sanBaoCau),         icon: <Building2 size={20}/>,  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
    { label: 'Thuê dụng cụ',    value: fmtM(revenueBreakdown?.dungCu),            icon: <Package size={20}/>,    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
    { label: 'Lệ phí giải đấu', value: fmtM(revenueBreakdown?.giaiDau),           icon: <Trophy size={20}/>,     color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)'  },
  ]

  /* Export handlers */
  const handleExport = async (type) => {
    setExporting(type)
    try {
      if (type === 'pdf') {
        await exportPDF(revenueBreakdown, courtStats, revenueData, period, advStats)
      } else {
        await exportExcel(revenueBreakdown, courtStats, revenueData, period, advStats)
      }
    } catch (err) {
      console.error(err)
      alert('Xuất file thất bại: ' + err.message)
    } finally {
      setExporting(null)
    }
  }

  const S = { fontFamily: '"Be Vietnam Pro", sans-serif' }

  return (
    <AdminLayout title="Báo cáo & Thống kê">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, ...S }}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0f172a' }}>Báo cáo & Thống kê</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              Phân tích doanh thu và hiệu suất hoạt động
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Period selector */}
            <div style={{ display: 'flex', background: '#f8fafc', border: '1.5px solid #e8edf5', borderRadius: 12, padding: 4, gap: 4 }}>
              {[
                { k: '7days',  l: '7 ngày' },
                { k: '30days', l: '30 ngày' },
              ].map(t => (
                <button key={t.k} onClick={() => setPeriod(t.k)} style={{
                  padding: '7px 16px', borderRadius: 9, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: period === t.k ? '#10b981' : 'transparent',
                  color: period === t.k ? '#fff' : '#64748b',
                  boxShadow: period === t.k ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
                  transition: 'all 0.2s', fontFamily: '"Be Vietnam Pro", sans-serif',
                }}>{t.l}</button>
              ))}
            </div>

            {/* Export buttons */}
            <button
              onClick={() => handleExport('excel')}
              disabled={!!exporting || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 12, border: '1.5px solid #16a34a',
                background: exporting === 'excel' ? '#15803d' : '#fff',
                color: exporting === 'excel' ? '#fff' : '#16a34a',
                fontSize: 13, fontWeight: 800, cursor: exporting ? 'wait' : 'pointer',
                transition: 'all 0.2s', fontFamily: '"Be Vietnam Pro", sans-serif',
              }}
            >
              <FileSpreadsheet size={15}/>
              {exporting === 'excel' ? 'Đang xuất...' : 'Xuất Excel'}
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={!!exporting || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 12, border: 'none',
                background: exporting === 'pdf'
                  ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                  : 'linear-gradient(135deg,#ef4444,#dc2626)',
                color: '#fff', fontSize: 13, fontWeight: 800,
                cursor: exporting ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                transition: 'all 0.2s', fontFamily: '"Be Vietnam Pro", sans-serif',
              }}
            >
              <FileText size={15}/>
              {exporting === 'pdf' ? 'Đang xuất...' : 'Xuất PDF'}
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {cards.map(c => (
            <div key={c.label} style={{
              background: '#fff', borderRadius: 20, padding: '20px 22px',
              border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.25s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.icon}
                </div>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={13}/>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {loading ? '—' : c.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginTop: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* ── Revenue chart ── */}
        <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #e8edf5', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18}/>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Biểu đồ Doanh thu</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                    Doanh thu {period === '7days' ? '7' : '30'} ngày gần đây · Tổng: <strong style={{ color: '#10b981' }}>{fmt(revenueData?.total)}</strong>
                  </p>
                </div>
              </div>
            </div>
            <button onClick={() => { setLoadingRev(true); setPeriod(p => p) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e8edf5', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
              <RefreshCw size={13}/> Làm mới
            </button>
          </div>
          <div style={{ padding: '20px 24px 16px' }}>
            <LineChart points={chartPoints} maxVal={maxVal} loading={loadingRev}/>
          </div>
        </div>

        {/* ── Row 2: Donut + Court bars ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>

          {/* Donut — Phân bổ doanh thu */}
          <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #e8edf5', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={16}/>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Phân bổ Doanh thu</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Tỷ lệ theo nguồn thu</p>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', gap: 20, alignItems: 'center' }}>
              {loading ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>Đang tải...</div>
              ) : (
                <>
                  <DonutChart segments={breakdownSegs} total={totalRevenue}/>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {breakdownSegs.map(s => {
                      const pct = Math.round((s.val / (totalRevenue || 1)) * 100)
                      return (
                        <div key={s.label}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }}/>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{s.label}</span>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 900, color: s.color }}>{pct}%</span>
                          </div>
                          <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 3, transition: 'width 0.8s ease' }}/>
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: 600 }}>{fmt(s.val)}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Court bar chart */}
          <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #e8edf5', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={16}/>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Hiệu suất Sử dụng Sân</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Số lượt đặt và doanh thu từng sân</p>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 22px' }}>
              {loading ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>Đang tải...</div>
              ) : courtStats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>Chưa có dữ liệu</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {courtStats.map((c, i) => {
                    const pct = Math.round((c.SoLuotDat / maxBookings) * 100)
                    const color = courtColors[i % courtColors.length]
                    return (
                      <div key={c.MaSan}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }}/>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{c.TenSan}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color }}>{c.SoLuotDat} lượt</span>
                            {c.DoanhThu > 0 && (
                              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{fmtM(c.DoanhThu)}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 4, transition: 'width 0.8s ease' }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Revenue table ── */}
        <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #e8edf5', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16}/>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Chi tiết Doanh thu theo Ngày</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                  {period === '7days' ? '7' : '30'} ngày gần nhất
                </p>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>
              Tổng: {fmt(revenueData?.total)}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
              <thead>
                <tr>
                  {['Ngày', 'Doanh thu', 'So với hôm qua', 'Tỷ trọng'].map(h => (
                    <th key={h} style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.08em', color: '#94a3b8', padding: '11px 20px', textAlign: h === 'Ngày' ? 'left' : 'right', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartPoints.map((p, i) => {
                  const prev = chartPoints[i - 1]?.val || 0
                  const diff = prev ? ((p.val - prev) / prev * 100) : 0
                  const pct = Math.round((p.val / (revenueData?.total || 1)) * 100)
                  return (
                    <tr key={p.label} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        {days[i] ? new Date(days[i]).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }) : p.label}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 900, fontSize: 13, color: p.val > 0 ? '#059669' : '#94a3b8' }}>
                        {p.val > 0 ? fmt(p.val) : '—'}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        {prev > 0 && p.val > 0 ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: diff >= 0 ? '#059669' : '#dc2626' }}>
                            {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}%
                          </span>
                        ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <div style={{ width: 60, height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: 3 }}/>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', minWidth: 28 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Báo cáo Giải đấu ── */}
        {advStats?.tournaments && (
          <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #e8edf5', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={16}/>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Báo cáo kết quả giải đấu</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Thống kê các giải đấu gần đây và VĐV tham gia</p>
                </div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
                <thead>
                  <tr>
                    {['Tên giải đấu', 'Ngày bắt đầu', 'Trạng thái', 'VĐV Tham gia', 'Hành động'].map(h => (
                      <th key={h} style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.08em', color: '#94a3b8', padding: '11px 20px', textAlign: 'left', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {advStats.tournaments.map(t => (
                    <tr key={t.id_giaidau} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{t.tengiai}</td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: '#64748b' }}>{t.ngaybatdau ? new Date(t.ngaybatdau).toLocaleDateString('vi-VN') : 'Chưa định'}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: t.trangthai === 'Đã kết thúc' ? '#10b981' : '#f59e0b' }}>{t.trangthai}</span>
                      </td>
                      <td style={{ padding: '12px 20px', fontWeight: 900, fontSize: 13, color: '#3b82f6' }}>
                        {t.soLuongVdv} / {t.soluongtoida}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <button onClick={() => setSelectedTournament(t)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#3b82f6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Xem trận đấu
                        </button>
                      </td>
                    </tr>
                  ))}
                  {advStats.tournaments.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chưa có dữ liệu giải đấu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Chi tiết Trận đấu */}
        {selectedTournament && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
            <div style={{ background: '#fff', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8edf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={20}/>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff' }}>{selectedTournament.tengiai}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Sơ đồ bảng đấu loại trực tiếp</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTournament(null)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}>&times;</button>
              </div>
              <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
                <TwoSidedBracket matches={selectedTournament.tranDaus} />
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}

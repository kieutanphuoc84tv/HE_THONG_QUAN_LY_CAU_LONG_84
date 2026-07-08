import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Clock, Calendar, Zap, Shield, Star } from 'lucide-react'
import api from '../../services/api'
import CustomerLayout from '../../layouts/CustomerLayout'
import socket from '../../services/socket'
import styles from './BookingPage.module.css'
import { getStoredUser, updateStoredUser } from '../../utils/authStorage'

const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`)
const SLOT_MINUTES = 60

const toSlotMinutes = (hour) => {
  const [h, m = 0] = hour.split(':').map(Number)
  return h * 60 + m
}

const toTimeMinutes = (value) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() * 60 + d.getMinutes()
}

const getBookedSlotHours = (bookings) => {
  const busy = new Set()
  if (!Array.isArray(bookings)) return busy

  bookings.forEach(b => {
    const start = toTimeMinutes(b.GioBatDau)
    const end = toTimeMinutes(b.GioKetThuc)
    if (start == null || end == null) return

    HOURS.forEach(hour => {
      const slotStart = toSlotMinutes(hour)
      const slotEnd = slotStart + SLOT_MINUTES
      if (slotStart < end && slotEnd > start) busy.add(hour)
    })
  })

  return busy
}

const getBookedSlotInfo = (bookings, currentUserId) => {
  const info = new Map()
  if (!Array.isArray(bookings)) return info

  bookings.forEach(b => {
    const start = toTimeMinutes(b.GioBatDau)
    const end = toTimeMinutes(b.GioKetThuc)
    if (start == null || end == null) return

    HOURS.forEach(hour => {
      const slotStart = toSlotMinutes(hour)
      const slotEnd = slotStart + SLOT_MINUTES
      if (slotStart >= end || slotEnd <= start) return

      const isMine = !!currentUserId && String(b.MaKhachHang) === String(currentUserId)
      const existing = info.get(hour)
      info.set(hour, {
        isMine: existing ? existing.isMine && isMine : isMine,
        booking: b,
      })
    })
  })

  return info
}

const sortSlots = (hours) => [...hours].sort((a, b) => toSlotMinutes(a) - toSlotMinutes(b))

const formatSlotList = (hours) => sortSlots(hours).join(', ')

const formatSlotTime = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const getSlotRanges = (hours) => {
  const sorted = sortSlots(hours)
  if (sorted.length === 0) return []

  const ranges = []
  let start = sorted[0]
  let prev = sorted[0]

  const pushRange = () => {
    ranges.push({
      start,
      end: formatSlotTime(toSlotMinutes(prev) + SLOT_MINUTES),
    })
  }

  for (let i = 1; i < sorted.length; i++) {
    if (toSlotMinutes(sorted[i]) - toSlotMinutes(prev) === SLOT_MINUTES) {
      prev = sorted[i]
      continue
    }

    pushRange()
    start = sorted[i]
    prev = sorted[i]
  }

  pushRange()
  return ranges
}

function SlotRangeList({ hours, compact = false }) {
  const ranges = getSlotRanges(hours)
  if (ranges.length === 0) return <span>—</span>

  return (
    <span className={`${styles.slotRangeList} ${compact ? styles.slotRangeListCompact : ''}`}>
      {ranges.map(range => (
        <span key={`${range.start}-${range.end}`} className={styles.slotRangePill}>
          {range.start} - {range.end}
        </span>
      ))}
    </span>
  )
}

function CourtCard({ court, active, onClick, busyBookings = [], selectedDate }) {
  const isVIP = false;
  
  // Calculate if the court is currently busy based on bookings
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const isToday = selectedDate === todayStr;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let isCurrentlyBusy = false;
  const bookedSlots = getBookedSlotHours(busyBookings);
  
  if (isToday) {
    busyBookings.forEach(b => {
      const start = toTimeMinutes(b.GioBatDau);
      const end = toTimeMinutes(b.GioKetThuc);
      if (start != null && end != null && currentMinutes >= start && currentMinutes < end) {
        isCurrentlyBusy = true;
      }
    });
  }

  // Admin status overrides
  let status = court.TrangThai || 'Trong';
  if (status === 'Trong' && isCurrentlyBusy) status = 'DangDung';

  const stMap = {
    Trong: { label: 'Còn trống', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    DangDung: { label: 'Đang dùng', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    BaoTri: { label: 'Bảo trì', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  };
  const st = stMap[status];

  return (
    <div
      className={`${styles.courtCard} ${active ? styles.courtCardActive : ''}`}
      onClick={onClick}
    >
      {/* Visual court diagram or Image */}
      {court.HinhAnh ? (
        <div style={{ position: 'relative', height: 160, width: '100%', overflow: 'hidden', borderRadius: 8, marginBottom: 12 }}>
          <img src={court.HinhAnh} alt={court.TenSan} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {status !== 'Trong' && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 3,
            }}>
              <div style={{
                background: status === 'BaoTri' ? 'rgba(239,68,68,0.9)' : 'rgba(245,158,11,0.9)',
                color: '#fff', fontWeight: 700, fontSize: 12,
                padding: '6px 14px', borderRadius: 100,
              }}>
                {status === 'BaoTri' ? '🔧 Bảo trì' : '⏳ Đang dùng'}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.courtVisual}>
          <span className={styles.courtEmoji}>🏸</span>
        </div>
      )}

      <div className={styles.courtInfo}>
        <div className={styles.courtName}>{court.TenSan}</div>
        <div className={styles.courtType}>{isVIP ? '⭐ Sân VIP cao cấp' : '🏟️ Sân tiêu chuẩn'}</div>
        <div className={styles.courtPrice}>
          <span className={styles.courtPriceNum}>
            {(court.GiaSieu / 1000).toFixed(0)}K
          </span>
          <span className={styles.courtPriceSub}>/giờ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <div className={styles.courtStatusBadge} data-status={status} style={{ margin: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {st.label}
          </div>
          {bookedSlots.size > 0 && (
            <div className={styles.courtStatusBadge} style={{ margin: 0 }}>
              Đã đặt {bookedSlots.size} giờ
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BookingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getStoredUser(null)
  const currentUserId = user?.id || user?.MaNguoiDung || user?.userId

  const [courts, setCourts] = useState([])
  const [courtsError, setCourtsError] = useState(false)
  const [court, setCourt] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [phoneInput, setPhoneInput] = useState(user?.soDienThoai || user?.SoDienThoai || '')
  const [slots, setSlots] = useState([])
  const [extras, setExtras] = useState({ racket: false, shoes: false })
  const [step, setStep] = useState(1)
  const [note, setNote] = useState('')
  const [method, setMethod] = useState('mbbank')
  const [voucherInput, setVoucherInput] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [allBusyBookings, setAllBusyBookings] = useState([])
  const [busyBookings, setBusyBookings] = useState([])
  const [busyLoading, setBusyLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState('error')
  const slotsRef = useRef([])
  const busyBookingsRef = useRef([])

  const bookedSlotSet = useMemo(() => getBookedSlotHours(busyBookings), [busyBookings])
  const bookedSlots = useMemo(() => sortSlots(bookedSlotSet), [bookedSlotSet])
  const bookedSlotInfo = useMemo(() => getBookedSlotInfo(busyBookings, currentUserId), [busyBookings, currentUserId])
  const myBookedSlots = useMemo(
    () => bookedSlots.filter(h => bookedSlotInfo.get(h)?.isMine),
    [bookedSlots, bookedSlotInfo]
  )
  const otherBookedSlots = useMemo(
    () => bookedSlots.filter(h => !bookedSlotInfo.get(h)?.isMine),
    [bookedSlots, bookedSlotInfo]
  )

  useEffect(() => {
    slotsRef.current = slots
  }, [slots])

  useEffect(() => {
    busyBookingsRef.current = busyBookings
  }, [busyBookings])

  const showToast = useCallback((msg, type = 'error') => {
    setToastMsg(msg)
    setToastType(type)
    setTimeout(() => setToastMsg(''), 3000)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('voucher');
    if (code && !appliedVoucher) {
      const cleanCode = code.trim().toUpperCase();
      setVoucherInput(cleanCode);
      api.post('/vouchers/check', { code: cleanCode })
        .then(res => {
          setAppliedVoucher(res.data);
          showToast(`Áp dụng thành công mã ${res.data.makhuyenmai}! Giảm ${res.data.phantramgiam}%`, 'success');
        })
        .catch(() => {});
    }
  }, [location.search, appliedVoucher, showToast]);

  const showBookedSlotMessage = useCallback((hours, slotInfo) => {
    const mine = hours.filter(h => slotInfo.get(h)?.isMine)
    const others = hours.filter(h => !slotInfo.get(h)?.isMine)

    if (mine.length > 0 && others.length === 0) {
      showToast(`Bạn đã đặt giờ này: ${formatSlotList(mine)}.`, 'success')
      return
    }

    if (mine.length > 0) {
      showToast(`Bạn đã đặt giờ ${formatSlotList(mine)}. Khung giờ ${formatSlotList(others)} đã có người đặt.`, 'error')
      return
    }

    showToast(`Khung giờ ${formatSlotList(others)} đã có người đặt. Vui lòng chọn giờ khác.`, 'error')
  }, [showToast])

  // Fetch danh sách sân
  useEffect(() => {
    api.get('/courts')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : []
        const normalized = data.map(c => ({
          ...c,
          LoaiSan: 'TieuChuan',
          GiaSieu: 70000,
        }))
        const valid = normalized.filter(c => c.TenSan && c.GiaSieu)
        if (valid.length > 0) { setCourts(valid); setCourt(valid[0]) }
        else setCourtsError(true)
      })
      .catch(() => setCourtsError(true))
  }, [])

  // Fetch busy slots — tách thành function riêng để tái sử dụng
  const fetchBusySlots = useCallback(async (courtId, dateStr, options = {}) => {
    const { notifyConflicts = false, clearFirst = false } = options
    if (!courtId || !dateStr) return []
    if (clearFirst) {
      setBusyBookings([])
      setAllBusyBookings([])
    }
    setBusyLoading(true)
    try {
      // Load both all bookings for today (to display on court cards) and specific court bookings
      const [resAll, resCourt] = await Promise.all([
        api.get('/bookings/busy-all', { params: { date: dateStr } }),
        api.get('/bookings/busy', { params: { courtId, date: dateStr } })
      ]);
      
      const allBusy = Array.isArray(resAll.data) ? resAll.data : [];
      setAllBusyBookings(allBusy);

      const nextBusyBookings = Array.isArray(resCourt.data) ? resCourt.data : []
      const nextBookedSlotSet = getBookedSlotHours(nextBusyBookings)
      const nextBookedSlotInfo = getBookedSlotInfo(nextBusyBookings, currentUserId)
      const selectedConflicts = slotsRef.current.filter(h => nextBookedSlotSet.has(h))

      setBusyBookings(nextBusyBookings)
      if (selectedConflicts.length > 0) {
        setSlots(current => current.filter(h => !nextBookedSlotSet.has(h)))
        if (notifyConflicts) {
          showBookedSlotMessage(selectedConflicts, nextBookedSlotInfo)
        }
      }

      return nextBusyBookings
    } catch (err) {
      console.error('Lỗi fetch busy slots:', err)
      showToast('Không tải được lịch đã đặt. Vui lòng bấm Làm mới.', 'error')
      return busyBookingsRef.current
    } finally {
      setBusyLoading(false)
    }
  }, [currentUserId, showBookedSlotMessage, showToast])

  // Refetch khi court/date thay đổi
  useEffect(() => {
    if (!court || !date) return
    const courtId = court.MaSan
    const refreshTimer = window.setTimeout(() => {
      fetchBusySlots(courtId, date, { clearFirst: true })
    }, 0)

    // Join real-time room
    socket.connect()
    socket.emit('join_court', courtId)

    const onBookingUpdated = (data) => {
      if (String(data.courtId) === String(courtId)) {
        fetchBusySlots(courtId, date, { notifyConflicts: true })
      }
    }
    
    socket.on('booking_updated', onBookingUpdated)

    return () => {
      window.clearTimeout(refreshTimer)
      socket.off('booking_updated', onBookingUpdated)
      socket.emit('leave_court', courtId)
    }
  }, [court, date, fetchBusySlots])

  // Refetch khi user quay lại tab (sau khi hủy đặt sân ở trang khác)
  useEffect(() => {
    const handleFocus = () => {
      if (court && date) fetchBusySlots(court.MaSan, date, { notifyConflicts: true })
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && court && date) {
        fetchBusySlots(court.MaSan, date, { notifyConflicts: true })
      }
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [court, date, fetchBusySlots])

  const isBooked = h => {
    if (!court || !date) return false
    return bookedSlotSet.has(h)
  }

  const isOwnBooked = h => bookedSlotInfo.get(h)?.isMine || false

  const toggleSlot = h => {
    if (isBooked(h)) {
      showBookedSlotMessage([h], bookedSlotInfo)
      return
    }
    setSlots(s => s.includes(h) ? s.filter(x => x !== h) : [...s, h])
  }
  const toggleExtra = k => setExtras(p => ({ ...p, [k]: !p[k] }))

  const courtPrice = court?.GiaSieu || 0
  const extrasTotal = (extras.racket ? 30000 : 0) + (extras.shoes ? 20000 : 0)
  const baseTotal = (slots.length * courtPrice) + extrasTotal
  
  const discountAmt = appliedVoucher ? Math.min((baseTotal * appliedVoucher.phantramgiam / 100), appliedVoucher.giamtoida || 999999) : 0
  const total = Math.max(0, baseTotal - discountAmt)

  const handleCheckVoucher = async () => {
    if (!voucherInput.trim()) return;
    try {
      const res = await api.post('/vouchers/check', { code: voucherInput.trim().toUpperCase() });
      setAppliedVoucher(res.data);
      showToast(`Áp dụng thành công mã ${res.data.makhuyenmai}! Giảm ${res.data.phantramgiam}%`, 'success');
    } catch (err) {
      setAppliedVoucher(null);
      showToast(err.response?.data?.error || 'Mã khuyến mãi không hợp lệ', 'error');
    }
  };

  const handleContinueToConfirm = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!court || !date || slots.length === 0 || busyLoading) return

    const latestBusyBookings = await fetchBusySlots(court.MaSan, date)
    const latestBookedSlotSet = getBookedSlotHours(latestBusyBookings)
    const latestBookedSlotInfo = getBookedSlotInfo(latestBusyBookings, currentUserId)
    const conflictedSlots = slots.filter(h => latestBookedSlotSet.has(h))
    if (conflictedSlots.length > 0) {
      setSlots(current => current.filter(h => !latestBookedSlotSet.has(h)))
      showBookedSlotMessage(conflictedSlots, latestBookedSlotInfo)
      return
    }

    setStep(2)
  }

  const handleConfirmBooking = async () => {
    if (!phoneInput || phoneInput.trim() === '') {
      showToast('Bạn bắt buộc phải nhập số điện thoại để hệ thống gọi xác nhận đơn đặt sân.', 'error');
      return;
    }
    if (slots.length === 0) return
    const sortedSlots = sortSlots(slots)

    // Group into contiguous chunks
    const chunks = []
    let currentChunk = [sortedSlots[0]]

    for (let i = 1; i < sortedSlots.length; i++) {
      const prevIdx = HOURS.indexOf(sortedSlots[i - 1])
      const currIdx = HOURS.indexOf(sortedSlots[i])
      if (currIdx - prevIdx === 1) {
        currentChunk.push(sortedSlots[i])
      } else {
        chunks.push(currentChunk)
        currentChunk = [sortedSlots[i]]
      }
    }
    chunks.push(currentChunk)

    setBookingLoading(true)
    try {
      const latestBusyBookings = await fetchBusySlots(court.MaSan, date)
      const latestBookedSlotSet = getBookedSlotHours(latestBusyBookings)
      const latestBookedSlotInfo = getBookedSlotInfo(latestBusyBookings, currentUserId)
      const conflictedSlots = sortedSlots.filter(h => latestBookedSlotSet.has(h))
      if (conflictedSlots.length > 0) {
        setSlots(current => current.filter(h => !latestBookedSlotSet.has(h)))
        setStep(1)
        showBookedSlotMessage(conflictedSlots, latestBookedSlotInfo)
        return
      }

      const normalizedPhone = phoneInput.trim()

      const bookingIds = []
      // Send sequential requests for each chunk
      for (const chunk of chunks) {
        const [endHourNum] = chunk[chunk.length - 1].split(':').map(Number)
        const endHour = `${String(endHourNum + 1).padStart(2, '0')}:00`
        const GioBatDau = `${date}T${chunk[0]}:00.000Z`
        const GioKetThuc = `${date}T${endHour}:00.000Z`

        const res = await api.post('/bookings', { 
          MaSan: court.MaSan, 
          NgayDat: `${date}T00:00:00.000Z`, 
          GioBatDau, 
          GioKetThuc,
          SoDienThoai: normalizedPhone,
          ...(method === 'cash' ? { PhuongThucThanhToan: 'TienMat' } : {}),
          ...(appliedVoucher ? { VoucherCode: appliedVoucher.makhuyenmai } : {})
        })
        bookingIds.push(res.data.MaLichDat)
      }

      updateStoredUser({ ...user, soDienThoai: normalizedPhone })

      if (method === 'mbbank' || method === 'momo') {
        navigate(`/payment/checkout?bookingId=${bookingIds.join(',')}&method=${method}&amount=${total}`)
        return
      }
      await fetchBusySlots(court.MaSan, date)
      setStep(3)
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi đặt sân. Vui lòng thử lại.', 'error')
      if (err.response?.status === 409 && court && date) {
        await fetchBusySlots(court.MaSan, date, { notifyConflicts: true })
        setStep(1)
      }
    } finally {
      setBookingLoading(false)
    }
  }

  // ── STEP 3: Done ──
  if (step === 3) return (
    <CustomerLayout>
      <div className={styles.page}>
        <div className={styles.doneWrap}>
          <div className={styles.doneCard}>
            <div className={styles.doneIconWrap}>🎉</div>
            <div className={styles.doneTitle}>Đặt sân thành công!</div>
            <p className={styles.doneSubtitle}>
              Cảm ơn bạn đã chọn Cầu Lông 84.<br />
              Vui lòng đến đúng giờ để được phục vụ tốt nhất.
            </p>
            <div className={styles.doneInfo}>
              <div className={styles.doneRow}><span>Sân</span><strong>{court?.TenSan}</strong></div>
              <div className={styles.doneRow}><span>Ngày</span><strong>{date.split('-').reverse().join('/')}</strong></div>
              <div className={styles.doneRow}><span>Giờ</span><strong className={styles.doneSlotValue}><SlotRangeList hours={slots} /></strong></div>
              <div className={styles.doneRow}><span>Tổng tiền</span><strong style={{ color: '#10b981' }}>{total.toLocaleString('vi-VN')}đ</strong></div>
            </div>
            <button className={styles.btnPrimary} style={{ marginTop: 24, marginRight: 12 }} onClick={() => navigate('/my-bookings')}>
              📅 Xem lịch đặt sân
            </button>
            <button className={styles.btnPrimary} style={{ marginTop: 24 }} onClick={() => navigate('/')}>
              🏠 Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )

  return (
    <CustomerLayout>
      <div className={styles.page}>

        {/* ── Hero ── */}
        <div className={styles.heroSection}>
          <div className={styles.heroBg} />
          <div className={styles.heroGrid} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Đặt lịch <span>Sân Cầu Lông</span>
            </h1>
            <p className={styles.heroSub}>Chọn sân yêu thích → Chọn ngày & giờ → Xác nhận trong 30 giây</p>
            <div className={styles.heroBadges}>
              <div className={styles.heroBadge}><Zap size={12} /> Xác nhận tức thì</div>
              <div className={styles.heroBadge}><Shield size={12} /> Đặt chỗ bảo đảm</div>
              <div className={styles.heroBadge}><Star size={12} /> 5 sân chất lượng cao</div>
            </div>
          </div>
        </div>

        {/* ── Steps ── */}
        <div className={styles.stepsBar}>
          {['Chọn sân & giờ', 'Xác nhận đặt sân'].map((s, i) => (
            <div key={s} className={`${styles.step} ${step === i + 1 ? styles.stepActive : step > i + 1 ? styles.stepDone : ''}`}>
              <div className={styles.stepNum}>{step > i + 1 ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className={styles.layout}>
          {/* ══ MAIN ══ */}
          <div>
            {courtsError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '20px 24px', color: '#dc2626', fontWeight: 700, marginBottom: 20 }}>
                ⚠️ Không thể tải danh sách sân. Vui lòng kiểm tra kết nối backend.
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className={styles.mainCard}>

                {/* Chọn sân */}
                <div className={styles.cardSection}>
                  <div className={styles.sectionLabel}>Chọn sân</div>
                  <div className={styles.courtGrid}>
                    {courts.map(c => {
                      const courtBookings = allBusyBookings.filter(b => b.MaSan === c.MaSan);
                      return (
                        <CourtCard
                          key={c.MaSan}
                          court={c}
                          active={court?.MaSan === c.MaSan}
                          busyBookings={courtBookings}
                          selectedDate={date}
                          onClick={() => { setCourt(c); setSlots([]) }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className={styles.divider} />

                {/* Ngày */}
                <div className={styles.cardSection}>
                  <div className={styles.sectionLabel}>Ngày chơi</div>
                  <div className={styles.dateInputWrap}>
                    <Calendar size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={e => { setDate(e.target.value); setSlots([]) }}
                    />
                  </div>
                </div>

                <div className={styles.divider} />

                {/* Giờ */}
                <div className={styles.cardSection}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={styles.sectionLabel} style={{ marginBottom: 0 }}>Khung giờ</div>
                      {/* Nút làm mới thủ công */}
                      <button
                        onClick={() => court && date && fetchBusySlots(court.MaSan, date, { notifyConflicts: true })}
                        disabled={busyLoading}
                        title="Làm mới khung giờ"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '4px 12px', borderRadius: 8,
                          border: '1.5px solid #e2e8f0',
                          background: busyLoading ? '#f8fafc' : '#fff',
                          color: busyLoading ? '#94a3b8' : '#10b981',
                          fontSize: 12, fontWeight: 700,
                          cursor: busyLoading ? 'not-allowed' : 'pointer',
                          fontFamily: '"Be Vietnam Pro", sans-serif',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { if (!busyLoading) { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#f0fdf4' } }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}
                      >
                        <span style={{
                          display: 'inline-block',
                          animation: busyLoading ? 'spin 0.8s linear infinite' : 'none',
                          fontSize: 13,
                        }}>🔄</span>
                        {busyLoading ? 'Đang tải...' : 'Làm mới'}
                      </button>
                    </div>
                    <div className={styles.legend}>
                      <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotFree}`} /> Còn trống</div>
                      <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotSel}`} /> Đã chọn</div>
                      <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotBooked}`} /> Đã có người đặt</div>
                    </div>
                  </div>

                  {/* Busy slots warning */}
                  {busyLoading && (
                    <div style={{
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0', borderRadius: 16,
                      padding: '14px 20px', marginBottom: 20,
                      display: 'flex', alignItems: 'center', gap: 12,
                      color: '#475569', fontWeight: 700, fontSize: 14,
                    }}>
                      <span style={{
                        display: 'inline-block',
                        animation: 'spin 0.8s linear infinite',
                        fontSize: 20,
                      }}>🔄</span>
                      <div>Đang kiểm tra các khung giờ đã có người đặt...</div>
                    </div>
                  )}

                  {!busyLoading && bookedSlots.length > 0 && (
                    <div style={{
                      background: otherBookedSlots.length > 0
                        ? '#fef2f2'
                        : '#fefce8',
                      border: `1px solid ${otherBookedSlots.length > 0 ? '#fecaca' : '#fef08a'}`, borderRadius: 16,
                      padding: '14px 20px', marginBottom: 20,
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      fontSize: 14,
                    }}>
                      <span style={{ fontSize: 24, marginTop: -2 }}>{otherBookedSlots.length > 0 ? '🔴' : '🟨'}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {myBookedSlots.length > 0 && (
                          <div style={{ color: '#ca8a04', fontWeight: 600 }}>
                            Bạn đã đặt giờ này: {myBookedSlots.join(', ')} 🟨
                          </div>
                        )}
                        {otherBookedSlots.length > 0 && (
                          <div style={{ color: '#ef4444', fontWeight: 600 }}>
                            Người khác đã đặt giờ này: {otherBookedSlots.join(', ')} 🔴
                          </div>
                        )}
                        {otherBookedSlots.length > 0 ? (
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#dc2626' }}>
                            Vui lòng chọn khung giờ khác để tránh trùng lịch.
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#a16207' }}>
                            Lịch này đã được Admin xác nhận.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grouped time periods */}
                  {[
                    { id: 'morning', label: 'Buổi sáng', icon: '🌅', hours: HOURS.filter(h => parseInt(h) < 12) },
                    { id: 'afternoon', label: 'Buổi chiều', icon: '☀️', hours: HOURS.filter(h => { const n = parseInt(h); return n >= 12 && n < 18 }) },
                    { id: 'evening', label: 'Buổi tối', icon: '🌙', hours: HOURS.filter(h => parseInt(h) >= 18) },
                  ].map(period => (
                    <div key={period.id} className={styles.timeGroupWrap}>
                      <div className={styles.timeGroupHeader}>
                        <span className={styles.timeGroupIcon}>{period.icon}</span>
                        {period.label}
                      </div>
                      <div className={styles.timeGrid}>
                        {period.hours.map((h, idx) => {
                          const booked = isBooked(h)
                          const ownBooked = booked && isOwnBooked(h)
                          const sel = slots.includes(h)
                          const conflict = sel && booked
                          const price = court ? `${(court.GiaSieu / 1000).toFixed(0)}K` : '—'

                          let slotClass = styles.timeSlot
                          if (conflict) slotClass += ` ${styles.slotConflict}`
                          else if (booked) slotClass += ownBooked ? ` ${styles.slotOwnBooked}` : ` ${styles.slotBooked}`
                          else if (sel) slotClass += ` ${styles.slotSel}`

                          return (
                            <button
                              key={h}
                              className={slotClass}
                              onClick={() => toggleSlot(h)}
                              type="button"
                              aria-disabled={booked}
                              title={booked ? (ownBooked ? `Bạn đã đặt giờ này: ${h}` : `🔒 ${h} đã có người đặt`) : sel ? 'Nhấn để bỏ chọn' : `Đặt ${h} — ${price}/giờ`}
                            >
                              {sel && !booked && <div className={styles.slotCheckmark}>✓</div>}
                              {booked && !sel && (
                                <span className={styles.slotLockIcon}>
                                  {ownBooked ? '✓' : '🔒'}
                                </span>
                              )}
                              <span className={styles.timeSlotHour}>{h}</span>
                              <span className={styles.timeSlotPrice}>
                                {booked ? (ownBooked ? 'Bạn đặt' : 'Đã đặt') : price + '/h'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Selection summary */}
                  {slots.length > 0 && !slots.some(h => isBooked(h)) && (
                    <div style={{
                      padding: '14px 20px',
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.1))',
                      border: '1.5px solid rgba(16,185,129,0.25)',
                      borderRadius: 14, fontSize: 14,
                      color: '#059669', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12, flexWrap: 'wrap',
                    }}>
                      <span className={styles.selectedSlotsText}>
                        <span>✅ Đã chọn {slots.length} khung giờ:</span>
                        <SlotRangeList hours={slots} />
                      </span>
                      <span style={{ fontWeight: 900, fontSize: 16, color: '#10b981' }}>
                        {(slots.length * (court?.GiaSieu || 0)).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.divider} />

                {/* Dịch vụ thêm */}
                <div className={styles.cardSection} style={{ paddingBottom: 28 }}>
                  <div className={styles.sectionLabel}>Dịch vụ thêm (tuỳ chọn)</div>
                  <div className={styles.extrasGrid}>
                    {[
                      { key: 'racket', icon: '🏸', name: 'Thuê vợt', price: '+30K' },
                      { key: 'shoes', icon: '👟', name: 'Thuê giày', price: '+20K' },
                    ].map(e => (
                      <button
                        key={e.key}
                        className={`${styles.extraBtn} ${extras[e.key] ? styles.extraActive : ''}`}
                        onClick={() => toggleExtra(e.key)}
                      >
                        <span className={styles.extraIcon}>{e.icon}</span>
                        <span className={styles.extraName}>{e.name}</span>
                        <span className={styles.extraPrice}>{e.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className={styles.mainCard}>

                {/* Confirm info */}
                <div className={styles.cardSection} style={{ paddingTop: 28 }}>
                  <div className={styles.sectionLabel}>Xác nhận thông tin</div>
                  <div className={styles.confirmCard}>
                    <div className={styles.confirmHeader}>
                      <div className={styles.confirmHeaderIcon}>🏸</div>
                      <div>
                        <div className={styles.confirmHeaderTitle}>{court?.TenSan}</div>
                        <div className={styles.confirmHeaderSub}>🏟️ Sân tiêu chuẩn · {date.split('-').reverse().join('/')}</div>
                      </div>
                    </div>
                    <div className={styles.confirmBody}>
                      <div className={styles.confirmRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>👤 Khách hàng</span>
                          <strong>{user?.hoTen || 'Khách'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
                          <span>📞 Số điện thoại</span>
                          <span style={{ fontSize: 12, color: '#ef4444' }}>(Bắt buộc)</span>
                        </div>
                        <input 
                          type="text" 
                          value={phoneInput} 
                          onChange={e => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="Nhập số điện thoại để gọi xác nhận..."
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 10,
                            border: '1.5px solid #e2e8f0', outline: 'none',
                            fontSize: 14, fontFamily: '"Be Vietnam Pro", sans-serif',
                            transition: 'all 0.2s', boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#10b981'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                      <div className={styles.confirmRow}>
                        <span>⏰ Khung giờ</span>
                        <strong className={styles.confirmSlotValue}><SlotRangeList hours={slots} /></strong>
                      </div>
                      <div className={styles.confirmRow}>
                        <span>🕐 Số giờ × Đơn giá</span>
                        <strong>{slots.length}h × {courtPrice.toLocaleString('vi-VN')}đ</strong>
                      </div>
                      {extras.racket && <div className={styles.confirmRow}><span>🏸 Thuê vợt</span><strong>+30.000đ</strong></div>}
                      {extras.shoes && <div className={styles.confirmRow}><span>👟 Thuê giày</span><strong>+20.000đ</strong></div>}
                      
                      <div className={styles.confirmRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
                        <span>🎁 Mã khuyến mãi</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input 
                            type="text" 
                            value={voucherInput} 
                            onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                            placeholder="Nhập mã CODE..."
                            style={{
                              flex: 1, padding: '10px 14px', borderRadius: 10,
                              border: '1.5px solid #e2e8f0', outline: 'none',
                              fontSize: 14, fontFamily: '"Be Vietnam Pro", sans-serif',
                            }}
                          />
                          <button onClick={handleCheckVoucher} className={styles.btnPrimary} style={{ padding: '0 20px' }}>
                            Áp dụng
                          </button>
                        </div>
                        {appliedVoucher && (
                          <div style={{ color: '#10b981', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                            ✅ Đã áp dụng mã {appliedVoucher.makhuyenmai} (Giảm {appliedVoucher.phantramgiam}%)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.divider} />

                {/* Phương thức */}
                <div className={styles.cardSection}>
                  <div className={styles.sectionLabel}>Phương thức thanh toán</div>
                  <div className={styles.payGrid}>
                    {[
                      { k: 'mbbank', icon: '🏦', label: 'MB Bank', sub: 'Chuyển khoản' },
                      { k: 'momo', icon: '🟣', label: 'MoMo', sub: 'Ví điện tử' },
                      { k: 'cash', icon: '💵', label: 'Tiền mặt', sub: 'Tại quầy' },
                    ].map(p => (
                      <button
                        key={p.k}
                        className={`${styles.payBtn} ${method === p.k ? styles.payActive : ''}`}
                        onClick={() => setMethod(p.k)}
                      >
                        <span className={styles.payIcon}>{p.icon}</span>
                        <span>{p.label}</span>
                        <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{p.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.divider} />

                {/* Ghi chú */}
                <div className={styles.cardSection} style={{ paddingBottom: 28 }}>
                  <div className={styles.sectionLabel}>Ghi chú</div>
                  <textarea
                    className={styles.noteInput}
                    rows={3}
                    placeholder="Yêu cầu thêm (nếu có)... VD: cần ghế ngồi ngoài, cần điều chỉnh ánh sáng..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ══ SIDEBAR ══ */}
          <div className={styles.sidebar}>
            {court ? (
              <>
                <div className={styles.sidebarHeader}>
                  <div className={styles.sidebarHeaderContent}>
                    <div className={styles.sideTitle}>Tóm tắt đặt sân</div>
                    <div className={styles.sideCourtName}>{court.TenSan}</div>
                    <div className={styles.sideBadge}>
                      🏟️ {court.isVIP ? 'VIP' : 'Tiêu chuẩn'} · {(court.GiaSieu / 1000).toFixed(0)}K/giờ
                    </div>
                  </div>
                </div>

                <div className={styles.sideBody}>
                  <div className={styles.sideRow}>
                    <span><Calendar size={13} /> Ngày</span>
                    <strong>{date.split('-').reverse().join('/')}</strong>
                  </div>
                  <div className={styles.sideRow}>
                    <span><Clock size={13} /> Giờ</span>
                    <strong className={styles.sideSlotValue}><SlotRangeList hours={slots} compact /></strong>
                  </div>
                  <div className={styles.sideRow}>
                    <span>⏱ Số giờ</span>
                    <strong>{slots.length}h</strong>
                  </div>
                  <div className={styles.sideRow}>
                    <span>💰 Tiền sân</span>
                    <strong>{(slots.length * courtPrice).toLocaleString('vi-VN')}đ</strong>
                  </div>
                  {extrasTotal > 0 && (
                    <div className={styles.sideRow}>
                      <span>🎁 Dịch vụ</span>
                      <strong>+{extrasTotal.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  )}
                  {appliedVoucher && (
                    <div className={styles.sideRow} style={{ color: '#ef4444' }}>
                      <span>🎟️ Khuyến mãi</span>
                      <strong>-{discountAmt.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  )}
                </div>

                <div className={styles.totalBox}>
                  <div className={styles.totalLabel}>Tổng cộng</div>
                  <div className={styles.totalAmount}>{total.toLocaleString('vi-VN')}đ</div>
                  <div className={styles.totalNote}>
                    {slots.length === 0 ? 'Chọn khung giờ để tính tiền' : `${slots.length} giờ × ${(courtPrice / 1000).toFixed(0)}K = ${(slots.length * courtPrice / 1000).toFixed(0)}K`}
                  </div>
                </div>

                <div className={styles.btnWrap}>
                  {step === 1 && (
                    <button
                      className={styles.btnPrimary}
                      disabled={slots.length === 0 || busyLoading}
                      onClick={handleContinueToConfirm}
                    >
                      {busyLoading ? 'Đang kiểm tra lịch...' : slots.length === 0 ? '← Chọn khung giờ' : 'Tiếp tục xác nhận →'}
                    </button>
                  )}
                  {step === 2 && (
                    <>
                      <button
                        className={styles.btnPrimary}
                        onClick={handleConfirmBooking}
                        disabled={bookingLoading || busyLoading}
                      >
                        {bookingLoading ? '⏳ Đang xử lý...' : '✅ Xác nhận đặt sân'}
                      </button>
                      <button
                        className={styles.btnGhost}
                        onClick={() => setStep(1)}
                        disabled={bookingLoading}
                      >
                        ← Quay lại chỉnh sửa
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.sideEmpty}>
                <div className={styles.sideEmptyIcon}>🏸</div>
                <div className={styles.sideEmptyText}>Đang tải danh sách sân...</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* TOAST NOTIFICATION */}
      <div style={{
        position: 'fixed',
        bottom: toastMsg ? '24px' : '-100px',
        right: '24px',
        zIndex: 9999,
        background: toastType === 'error' ? '#ef4444' : '#10b981',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '16px',
        fontWeight: 800,
        boxShadow: toastType === 'error' ? '0 10px 25px rgba(239, 68, 68, 0.4)' : '0 10px 25px rgba(16, 185, 129, 0.4)',
        transition: 'bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '20px' }}>{toastType === 'error' ? '⚠️' : '✅'}</span>
        <span>{toastMsg}</span>
      </div>
    </CustomerLayout>
  )
}

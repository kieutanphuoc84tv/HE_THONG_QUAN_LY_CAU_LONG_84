import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, RefreshCw, CreditCard, Smartphone, LockKeyhole } from 'lucide-react'
import api from '../../services/api'

const PAYMENT_METHODS = {
  mbbank: {
    label: 'MB Bank',
    badge: 'Chuyển khoản MB Bank',
    title: 'Thanh toán chuyển khoản',
    description: 'Quét mã VietQR bằng ứng dụng ngân hàng để hoàn tất giao dịch.',
    color: '#1e3a8a',
    icon: CreditCard,
  },
  momo: {
    label: 'MoMo',
    badge: 'Thanh toán qua MoMo',
    title: 'Thanh toán MoMo',
    description: 'Quét mã QR bằng ứng dụng MoMo để hoàn tất giao dịch.',
    color: '#a50064',
    icon: Smartphone,
  },
}

function normalizePaymentMethod(value) {
  const key = String(value || '').toLowerCase()
  if (key === 'momo') return 'MoMo'
  if (key === 'mbbank') return 'ChuyenKhoan'
  return 'ChuyenKhoan'
}

function SecureField({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function QrPattern({ amount, orderId }) {
  return (
    <div className="w-52 h-52 bg-white border-[10px] border-white shadow-inner rounded-[22px] grid grid-cols-11 gap-[3px] p-3">
      {Array.from({ length: 121 }, (_, i) => {
        const row = Math.floor(i / 11)
        const col = i % 11
        const marker =
          (row < 3 && col < 3) ||
          (row < 3 && col > 7) ||
          (row > 7 && col < 3)
        const active = marker || ((row * 7 + col * 11 + amount + String(orderId || '').length) % 5 < 2)
        return (
          <span
            key={i}
            className={`rounded-[2px] ${active ? 'bg-[#a50064]' : 'bg-fuchsia-50'}`}
          />
        )
      })}
    </div>
  )
}

export default function MockPaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const requestedMethod = String(searchParams.get('method') || 'mbbank').toLowerCase()
  const method = PAYMENT_METHODS[requestedMethod] ? requestedMethod : 'mbbank'
  const methodInfo = PAYMENT_METHODS[method]
  const amount = Number(searchParams.get('amount') || 0)

  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [timer, setTimer] = useState(300) // 5 minutes timer
  const [bank, setBank] = useState('NCB')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [otp, setOtp] = useState('')
  const MethodIcon = methodInfo.icon

  const cancelPendingBookings = useCallback(async () => {
    if (!bookingId) return
    const ids = bookingId.split(',').map(id => id.trim()).filter(Boolean)
    await Promise.all(ids.map(id =>
      api.put(`/bookings/${id}/cancel`, { reason: 'Khách hủy giao dịch thanh toán' })
    ))
  }, [bookingId])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(interval)
          cancelPendingBookings().finally(() => {
            alert('Giao dịch đã hết hạn!')
            navigate('/booking')
          })
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [cancelPendingBookings, navigate])

  const formatTimer = () => {
    const m = Math.floor(timer / 60)
    const s = timer % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleClientPay = async (customMethod) => {
    if (!bookingId) {
      alert('Không có mã đặt sân. Vui lòng thử lại.')
      return
    }
    const payMethod = normalizePaymentMethod(customMethod || method)
    setLoading(true)
    try {
      const ids = bookingId.split(',').map(id => id.trim()).filter(Boolean)
      for (const id of ids) {
        await api.post(`/payments/client-pay`, { MaLichDat: id, PhuongThucThanhToan: payMethod })
      }
      navigate(`/payment/result?status=success&orderId=${encodeURIComponent(bookingId)}&method=${method}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi thanh toán.')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelTransaction = async () => {
    setCancelling(true)
    try {
      await cancelPendingBookings()
      navigate('/booking')
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể hủy giao dịch. Vui lòng tải lại trang đặt sân.')
      navigate('/booking')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-['Be_Vietnam_Pro'] text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center font-bold text-white text-lg">
              84
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 leading-none">CẦU LÔNG 84</h1>
              <p className="text-xs text-slate-500">Cổng thanh toán an toàn · {methodInfo.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
            ⏳ Hết hạn sau: {formatTimer()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-5">
          {/* Left panel: Info */}
          <div className="md:col-span-2 bg-[#071528] text-white p-6 md:p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                <LockKeyhole size={13} className="inline-block mr-1" />
                Kết nối bảo mật SSL
              </span>

              <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: methodInfo.color }}>
                  <MethodIcon size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Phương thức</div>
                  <div className="text-lg font-black">{methodInfo.badge}</div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm text-slate-400">Số tiền thanh toán</p>
                <p className="text-4xl font-extrabold text-white mt-1">
                  {amount.toLocaleString('vi-VN')} <span className="text-xl">đ</span>
                </p>
              </div>

              <div className="mt-8 space-y-4 text-sm text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Mã đơn hàng:</span>
                  <span className="font-mono text-white text-xs">{bookingId?.substring(0, 18)}...</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Nhà cung cấp:</span>
                  <span className="font-bold text-white">Sân Cầu Lông 84</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Phương thức:</span>
                  <span className="font-bold text-white">{methodInfo.label}</span>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Thông tin thanh toán được mã hóa trong suốt giao dịch.</span>
            </div>
          </div>

          {/* Right panel: Form input */}
          <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{methodInfo.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">{methodInfo.description}</p>
                </div>
                <div className="hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center text-white shadow-lg" style={{ background: methodInfo.color }}>
                  <MethodIcon size={28} />
                </div>
              </div>

              {method === 'mbbank' ? (
                /* MB Bank VietQR */
                <div className="mt-6 flex flex-col items-center">
                  <div className="bg-white p-4 rounded-3xl border-2 border-blue-100 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-[#1e3a8a]"></div>
                    <img 
                      src={`https://img.vietqr.io/image/mb-0984562210-compact2.png?amount=${amount}&addInfo=Thanh toan san ${String(bookingId || '').slice(0, 8).toUpperCase()}&accountName=CAU LONG 84`}
                      alt="VietQR MB Bank"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                  <div className="mt-6 text-center bg-slate-50 border border-slate-200 rounded-2xl w-full p-4">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Hoặc chuyển khoản thủ công</div>
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="text-xs text-slate-500">Ngân hàng</div>
                        <div className="font-bold text-slate-900">MB Bank</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Số tài khoản</div>
                        <div className="font-black text-[#1e3a8a] text-lg">0984562210</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Chủ tài khoản</div>
                        <div className="font-bold text-slate-900">CAU LONG 84</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Nội dung</div>
                        <div className="font-mono text-sm font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded inline-block">
                          Thanh toan san {String(bookingId || '').slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MoMo QR code */
                <div className="mt-6 grid md:grid-cols-[auto_1fr] gap-6 items-center">
                  <div className="bg-gradient-to-br from-fuchsia-50 to-white border border-fuchsia-100 p-5 rounded-3xl inline-block shadow-sm">
                    <QrPattern amount={amount} orderId={bookingId} />
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Người nhận</div>
                      <div className="mt-1 text-base font-black text-slate-900">CẦU LÔNG 84</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nội dung chuyển khoản</div>
                      <div className="mt-1 text-sm font-mono font-bold text-slate-900">
                        {String(bookingId || '').slice(0, 8).toUpperCase()} CAULONG84
                      </div>
                    </div>
                    <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-4 text-sm text-fuchsia-900 leading-relaxed">
                      Mở ứng dụng MoMo, chọn quét mã và kiểm tra đúng số tiền trước khi xác nhận.
                    </div>
                  </div>
                  <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Số tiền cần thanh toán</div>
                        <div className="mt-1 text-2xl font-black text-[#a50064]">{amount.toLocaleString('vi-VN')}đ</div>
                      </div>
                      <div className="text-xs text-slate-500 text-right">Đơn hàng sẽ tự động ghi nhận sau khi xác nhận.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancelTransaction}
                disabled={cancelling || loading}
                className="w-full sm:w-auto px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center gap-2"
              >
                {cancelling ? <RefreshCw size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
                {cancelling ? 'Đang hủy...' : 'Hủy giao dịch'}
              </button>
              <button
                onClick={() => handleClientPay()}
                disabled={loading}
                className="flex-grow px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
                {loading ? 'Đang xác thực...' : `Xác nhận thanh toán ${methodInfo.label}`}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        Bản quyền thuộc về Hệ thống Cầu Lông 84. Giao dịch được xử lý qua cổng thanh toán bảo mật.
      </footer>
    </div>
  )
}

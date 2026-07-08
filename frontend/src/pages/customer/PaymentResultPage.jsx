import { useSearchParams, Link } from 'react-router-dom'
import CustomerLayout from '../../layouts/CustomerLayout'

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const status  = searchParams.get('status')
  const orderId = searchParams.get('orderId')
  const isSuccess = status === 'success'
  const method = searchParams.get('method')
  const methodLabel = { vnpay: 'VNPay', momo: 'MoMo' }[method] || method

  return (
    <CustomerLayout>
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        fontFamily: '"Be Vietnam Pro", sans-serif',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 28,
          border: `2px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.10)',
          padding: '56px 48px',
          textAlign: 'center',
          maxWidth: 480,
          width: '100%',
          animation: 'fadeIn 0.4s ease',
        }}>
          {/* Icon */}
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: isSuccess ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' : 'linear-gradient(135deg,#fee2e2,#fecaca)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            margin: '0 auto 24px',
            boxShadow: isSuccess
              ? '0 8px 24px rgba(16,185,129,0.25)'
              : '0 8px 24px rgba(239,68,68,0.2)',
          }}>
            {isSuccess ? '✅' : '❌'}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 28,
            fontWeight: 900,
            color: isSuccess ? '#065f46' : '#991b1b',
            margin: '0 0 10px',
          }}>
            {isSuccess ? 'Đặt sân thành công!' : 'Thanh toán thất bại'}
          </h1>

          <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>
            {isSuccess
              ? `Thanh toán${methodLabel ? ` ${methodLabel}` : ''} đã được ghi nhận. Lịch đặt đang chờ Admin xác nhận.`
              : 'Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.'}
          </p>

          {orderId && isSuccess && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #a7f3d0',
              borderRadius: 12,
              padding: '12px 18px',
              marginBottom: 28,
              fontSize: 13,
              color: '#065f46',
              fontWeight: 700,
            }}>
              Mã đơn hàng: <span style={{ fontFamily: 'monospace' }}>{orderId}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isSuccess ? (
              <>
                <Link to="/my-bookings" style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                  transition: 'background 0.18s',
                }}>
                  📅 Xem lịch đặt sân
                </Link>
                <Link to="/" style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: 'none',
                }}>
                  🏠 Về trang chủ
                </Link>
              </>
            ) : (
              <>
                <Link to="/booking" style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
                }}>
                  🔄 Thử lại
                </Link>
                <Link to="/" style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: 'none',
                }}>
                  🏠 Về trang chủ
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </CustomerLayout>
  )
}

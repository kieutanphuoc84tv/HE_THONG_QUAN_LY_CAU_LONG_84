import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader from './components/PageLoader'

// ── Admin pages ──────────────────────────────────────────
import AdminDashboard   from './pages/admin/AdminDashboard'
import AdminCourts      from './pages/admin/AdminCourts'
import AdminBookings    from './pages/admin/AdminBookings'
import AdminMembers     from './pages/admin/AdminMembers'
import AdminMemberships from './pages/admin/AdminMemberships'
import AdminTournaments from './pages/admin/AdminTournaments'
import AdminPayments    from './pages/admin/AdminPayments'
import AdminServices    from './pages/admin/AdminServices'
import AdminReports    from './pages/admin/AdminReports'
import AdminCoaches    from './pages/admin/AdminCoaches'
import AdminPackages   from './pages/admin/AdminPackages'
import AdminVouchers   from './pages/admin/AdminVouchers'


// ── Coach pages ──────────────────────────────────────────
import CoachLayout     from './layouts/CoachLayout'
import CoachDashboard  from './pages/coach/CoachDashboard'
import CoachMembers    from './pages/coach/CoachMembers'
import CoachProfile    from './pages/coach/CoachProfile'
import ChatPage        from './pages/shared/ChatPage'

// ── Customer pages ───────────────────────────────────────
import HomePage         from './pages/customer/HomePage'
import LoginPage        from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ForgotPassword   from './pages/ForgotPassword'
import ResetPassword    from './pages/ResetPassword'
import CourtsPage       from './pages/customer/CourtsPage'
import BookingPage      from './pages/customer/BookingPage'
import TournamentsPage  from './pages/customer/TournamentsPage'
import ProfilePage      from './pages/customer/ProfilePage'
import MyBookingsPage   from './pages/customer/MyBookingsPage'
import MockPaymentPage  from './pages/customer/MockPaymentPage'
import RentalPage       from './pages/customer/RentalPage'
import MyRentalsPage    from './pages/customer/MyRentalsPage'
import PaymentResultPage from './pages/customer/PaymentResultPage'
import ServicesPage     from './pages/customer/ServicesPage'
import AboutPage        from './pages/customer/AboutPage'
import PricingPage      from './pages/customer/PricingPage'
import AdminRentals     from './pages/admin/AdminRentals'
import TrainingPage     from './pages/customer/TrainingPage'
import MyTrainingsPage  from './pages/customer/MyTrainingsPage'
import MatchResultsPage from './pages/customer/MatchResultsPage'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import PromotionsPage   from './pages/customer/PromotionsPage'

function PaymentMockRedirect() {
  const location = useLocation()
  return <Navigate to={`/payment/checkout${location.search}`} replace />
}

export default function App() {
  return (
    <Routes>
      {/* ── Public Routes ── */}
      <Route path="/"              element={<HomePage />} />
      <Route path="/services"      element={<ServicesPage />} />
      <Route path="/about"         element={<AboutPage />} />
      <Route path="/pricing"       element={<PricingPage />} />
      <Route path="/courts"        element={<CourtsPage />} />
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/loader"        element={<PageLoader />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/tournaments"   element={<TournamentsPage />} />
      <Route path="/tournaments/results" element={<MatchResultsPage />} />
      <Route path="/rental"        element={<RentalPage />} />
      <Route path="/payment/result" element={<PaymentResultPage />} />
      <Route path="/promotions"    element={<PromotionsPage />} />
      <Route path="/vouchers"      element={<PromotionsPage />} />
      <Route path="/khuyen-mai"    element={<PromotionsPage />} />

      {/* ── Customer Routes (Protected) ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"   element={<CustomerDashboard />} />
        <Route path="/booking"     element={<BookingPage />} />
        <Route path="/profile"     element={<ProfilePage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/my-rentals"  element={<MyRentalsPage />} />
        <Route path="/my-trainings" element={<MyTrainingsPage />} />
        <Route path="/training"    element={<TrainingPage />} />
        <Route path="/messages"    element={<ChatPage />} />
        <Route path="/payment/checkout" element={<MockPaymentPage />} />
        <Route path="/payment/mock" element={<PaymentMockRedirect />} />
      </Route>

      {/* ── Admin Routes (Protected) ── */}
      <Route element={<ProtectedRoute requireAdmin={true} />}>
        <Route path="/admin"                   element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard"         element={<AdminDashboard />} />
        <Route path="/admin/courts"            element={<AdminCourts />} />
        <Route path="/admin/bookings"          element={<AdminBookings />} />
        <Route path="/admin/members"           element={<AdminMembers />} />
        <Route path="/admin/memberships"       element={<AdminMemberships />} />
        <Route path="/admin/coaches"           element={<AdminCoaches />} />
        <Route path="/admin/tournaments"       element={<AdminTournaments />} />
        <Route path="/admin/payments"          element={<AdminPayments />} />
        <Route path="/admin/services"          element={<AdminServices />} />
        <Route path="/admin/rentals"           element={<AdminRentals />} />
        <Route path="/admin/reports"           element={<AdminReports />} />
        <Route path="/admin/packages"          element={<AdminPackages />} />
        <Route path="/admin/vouchers"          element={<AdminVouchers />} />
        <Route path="/admin/shifts"            element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/employees"         element={<Navigate to="/admin/dashboard" replace />} />

      </Route>

      {/* ── Coach Routes (Protected) ── */}
      <Route element={<ProtectedRoute requireCoach={true} />}>
        <Route element={<CoachLayout />}>
          <Route path="/coach"                   element={<Navigate to="/coach/dashboard" replace />} />
          <Route path="/coach/dashboard"         element={<CoachDashboard />} />
          <Route path="/coach/members"           element={<CoachMembers />} />
          <Route path="/coach/messages"          element={<ChatPage coachMode={true} />} />
          <Route path="/coach/profile"           element={<CoachProfile />} />
        </Route>
      </Route>
    </Routes>
  )
}

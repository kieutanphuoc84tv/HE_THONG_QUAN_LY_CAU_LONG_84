import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredToken, getStoredUser } from '../utils/authStorage';

export default function ProtectedRoute({ requireAdmin, requireCoach }) {
  const location = useLocation();
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !['Admin', 'QuanLy'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requireCoach && user.role !== 'HuanLuyenVien') {
    return <Navigate to="/" replace />;
  }

  const isProfile = location.pathname.startsWith('/profile');

  if (!requireAdmin && !requireCoach && ['Admin', 'QuanLy'].includes(user.role) && !isProfile) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Redirect Coach to their specific profile page if they access /profile
  if (user.role === 'HuanLuyenVien' && isProfile && !location.pathname.startsWith('/coach/profile')) {
    return <Navigate to="/coach/profile" replace />;
  }

  if (!requireAdmin && !requireCoach && user.role === 'HuanLuyenVien' && !isProfile) {
    return <Navigate to="/coach/dashboard" replace />;
  }

  return <Outlet />;
}

import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Calendar, Users, User, Menu, Phone, Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { clearStoredAuth, getStoredUser } from '../utils/authStorage';

const mapNotification = (n) => ({
  id: n.id_thongbao,
  icon: String(n.loai || '').startsWith('training') ? '📅' : n.loai === 'chat' || n.loai === 'coach_message' ? '💬' : '🔔',
  title: n.tieude,
  desc: n.noidung,
  time: n.ngaytao ? new Date(n.ngaytao).toLocaleString('vi-VN') : '',
  read: n.dadoct,
  link: n.link,
});

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const bellRef = useRef(null);
  const currentUser = getStoredUser({});
  const currentUserId = currentUser?.id || currentUser?.id_nguoidung;
  const unread = notifs.filter(n => !n.read).length;

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/login');
  };

  useEffect(() => {
    if (!currentUserId) return undefined;

    api.get('/notifications')
      .then(res => setNotifs((Array.isArray(res.data) ? res.data : []).map(mapNotification)))
      .catch(err => console.error('Lỗi tải thông báo HLV', err));

    socket.connect();
    socket.emit('join', currentUserId);

    const handleNewNotification = (notification) => {
      setNotifs(prev => [mapNotification(notification), ...prev]);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.disconnect();
    };
  }, [currentUserId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs(prev => prev.map(item => ({ ...item, read: true })));
    } catch (err) {
      console.error('Lỗi đánh dấu thông báo HLV', err);
    }
  };

  const openNotification = async (notification) => {
    try {
      await api.put(`/notifications/${notification.id}/read`);
      setNotifs(prev => prev.map(item => item.id === notification.id ? { ...item, read: true } : item));
    } catch (err) {
      console.error('Lỗi đọc thông báo HLV', err);
    }

    setBellOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const navs = [
    { name: 'Lịch Dạy', path: '/coach/dashboard', icon: Calendar },
    { name: 'Học Viên', path: '/coach/members', icon: Users },
    { name: 'Liên hệ', path: '/coach/messages', icon: Phone },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
      {/* ══ HORIZONTAL NAVBAR ══ */}
      <header style={{ 
        background: '#ffffff', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        height: '70px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          {/* Logo */}
          <Link to="/coach/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ background: '#061427', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', overflow: 'hidden' }}>
              <img src="/images/logo-caulong84.png" alt="Cầu Lông 84" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#0f172a', fontWeight: '900', fontSize: '16px', letterSpacing: '0.5px' }}>CẦU LÔNG 84</span>
              <span style={{ color: '#64748b', fontWeight: '600', fontSize: '12px' }}>Coach Portal</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav style={{ display: 'flex', gap: '8px' }} className="hidden-mobile">
            {navs.map((n) => {
              const active = location.pathname.startsWith(n.path);
              const Icon = n.icon;
              return (
                <Link key={n.path} to={n.path} style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  color: active ? '#10b981' : '#64748b', 
                  textDecoration: 'none', fontWeight: '700', fontSize: '14px',
                  padding: '10px 16px', borderRadius: '10px', 
                  background: active ? 'rgba(16, 185, 129, 0.1)' : 'transparent', 
                  transition: 'all 0.2s' 
                }}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {n.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="hidden-mobile">
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setBellOpen(prev => !prev)}
              style={{
                position: 'relative',
                width: 42,
                height: 42,
                borderRadius: 12,
                border: bellOpen ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                background: bellOpen ? '#ecfdf5' : '#fff',
                color: bellOpen ? '#059669' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Thông báo"
            >
              <Bell size={19} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 999,
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {bellOpen && (
              <div style={{
                position: 'absolute',
                top: 50,
                right: 0,
                width: 360,
                maxWidth: 'calc(100vw - 32px)',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                boxShadow: '0 22px 45px rgba(15, 23, 42, 0.16)',
                overflow: 'hidden',
                zIndex: 200,
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 14 }}>
                    Thông báo {unread > 0 ? <span style={{ color: '#10b981' }}>({unread} mới)</span> : ''}
                  </div>
                  {unread > 0 && (
                    <button type="button" onClick={markAllRead} style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                      Đã đọc hết
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 28, textAlign: 'center', color: '#94a3b8', fontWeight: 700, fontSize: 13 }}>
                      Chưa có thông báo
                    </div>
                  ) : notifs.map(notification => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                      style={{
                        width: '100%',
                        border: 'none',
                        borderBottom: '1px solid #f8fafc',
                        background: notification.read ? '#fff' : '#f0fdf4',
                        padding: '12px 16px',
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr auto',
                        gap: 10,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: '"Be Vietnam Pro", sans-serif',
                      }}
                    >
                      <span style={{ width: 32, height: 32, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {notification.icon}
                      </span>
                      <span>
                        <span style={{ display: 'block', color: '#0f172a', fontWeight: 900, fontSize: 13, lineHeight: 1.35 }}>{notification.title}</span>
                        <span style={{ display: 'block', color: '#64748b', fontSize: 12, lineHeight: 1.45, marginTop: 3 }}>{notification.desc}</span>
                        <span style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, marginTop: 5 }}>{notification.time}</span>
                      </span>
                      {!notification.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginTop: 8 }} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/coach/profile" style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', 
            padding: '6px 16px 6px 6px', borderRadius: '50px', 
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            textDecoration: 'none', color: '#0f172a', fontWeight: '700', fontSize: '14px',
            transition: 'all 0.2s'
          }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: '#10b981', color: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '12px'
            }}>
              {currentUser.hoTen?.substring(0, 2)?.toUpperCase() || 'HL'}
            </div>
            {currentUser.hoTen || 'Huấn luyện viên'}
          </Link>

          <button onClick={handleLogout} style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            color: '#ef4444', background: 'transparent', border: 'none', 
            padding: '10px', borderRadius: '10px', fontWeight: '700', 
            cursor: 'pointer', transition: 'all 0.2s' 
          }} title="Đăng xuất">
            <LogOut size={20} />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: '#0f172a', padding: '8px', cursor: 'pointer', display: 'none' }}>
          <Menu size={24} />
        </button>
      </header>

      {/* ══ MOBILE MENU ══ */}
      {menuOpen && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px' }}>
          {navs.map((n) => (
            <Link key={n.path} to={n.path} onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#0f172a', textDecoration: 'none', fontWeight: '600' }}>
              <n.icon size={20} color="#64748b" /> {n.name}
            </Link>
          ))}
          <Link to="/coach/profile" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#0f172a', textDecoration: 'none', fontWeight: '600' }}>
            <User size={20} color="#64748b" /> Hồ Sơ Cá Nhân
          </Link>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#ef4444', background: 'transparent', border: 'none', fontWeight: '600', cursor: 'pointer', textAlign: 'left', fontSize: '16px' }}>
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      )}

      {/* ══ MAIN CONTENT ══ */}
      <main style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Phone, Search, User } from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import api, { API_BASE_URL } from '../../services/api';

function getAvatarUrl(avatar) {
  if (!avatar) return null;
  return avatar.startsWith('http') ? avatar : `${API_BASE_URL}${avatar}`;
}

function initials(name) {
  return (name || 'ND').trim().slice(0, 2).toUpperCase();
}

function ContactAvatar({ user, size = 56 }) {
  const url = getAvatarUrl(user?.avatar);
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#2563eb',
      fontWeight: 900,
      fontSize: size * 0.35,
      overflow: 'hidden',
      flexShrink: 0,
      border: '3px solid #fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      {url ? (
        <img src={url} alt={user?.name || 'avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials(user?.name)
      )}
    </div>
  );
}

function ContactSurface({ coachMode = false }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const targetLabel = coachMode ? 'Học viên' : 'Huấn luyện viên';

  useEffect(() => {
    let active = true;
    api.get('/chat/contacts')
      .then(res => {
        if (!active) return;
        setError('');
        const data = Array.isArray(res.data) ? res.data : [];
        setContacts(data);
      })
      .catch(err => {
        if (active) setError(err.response?.data?.error || 'Không tải được danh sách liên hệ.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredContacts = contacts.filter(contact => (
    contact.name?.toLowerCase().includes(search.toLowerCase()) ||
    contact.phone?.includes(search)
  ));

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: coachMode ? 0 : '32px 20px 64px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ margin: '0 0 6px', color: '#10b981', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Danh bạ liên hệ
        </p>
        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 34, fontWeight: 900 }}>
          {coachMode ? 'Liên hệ Học viên' : 'Liên hệ Huấn luyện viên'}
        </h1>
      </div>

      {error && (
        <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 14, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 24,
        boxShadow: '0 20px 55px rgba(15, 23, 42, 0.04)',
        padding: 32,
        minHeight: 600
      }}>
        <div style={{ position: 'relative', maxWidth: 400, marginBottom: 32 }}>
          <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Tìm kiếm tên hoặc số điện thoại...`}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: '2px solid #e2e8f0',
              borderRadius: 16,
              padding: '14px 16px 14px 46px',
              outline: 'none',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: 15,
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {loading ? (
          <div style={{ padding: 60, color: '#64748b', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>Đang tải danh sách...</div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: 60, color: '#94a3b8', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>
            Không tìm thấy {targetLabel.toLowerCase()} nào.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24
          }}>
            {filteredContacts.map(contact => (
              <div key={contact.id} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 20,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <ContactAvatar user={contact} />
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{contact.name}</h3>
                    <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {targetLabel}
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={20} />
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>SỐ ĐIỆN THOẠI / ZALO</div>
                    <div style={{ color: '#0f172a', fontSize: 16, fontWeight: 800 }}>{contact.phone || 'Chưa cập nhật'}</div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage({ coachMode = false }) {
  const surface = <ContactSurface coachMode={coachMode} />;
  return coachMode ? surface : <CustomerLayout>{surface}</CustomerLayout>;
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Search, MessageSquare, Award, Activity } from 'lucide-react';
import api from '../../services/api';

export default function CoachMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;

    const fetchMembers = async () => {
      try {
        const res = await api.get('/coach/members');
        if (active) setMembers(res.data);
      } catch (error) {
        console.error('Lỗi lấy học viên:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMembers();
    return () => { active = false; };
  }, []);

  const filteredMembers = members.filter(m => 
    m.nguoiDung?.hoten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nguoiDung?.sdt?.includes(searchTerm)
  );

  return (
    <div style={{ padding: '40px 24px', maxWidth: 1280, margin: '0 auto', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, gap: 20 }}>
        <div>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 900, 
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px 0'
          }}>
            Học Viên Của Tôi
          </h1>
          <p style={{ color: '#64748b', fontSize: 16, margin: 0, fontWeight: 500 }}>
            Quản lý và tương tác với các học viên đang theo học
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên hoặc SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '14px 16px 14px 48px', 
              borderRadius: 30, 
              border: '1px solid #e2e8f0',
              background: '#fff',
              fontSize: 15,
              fontWeight: 500,
              color: '#0f172a',
              outline: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 24, border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🏸</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#334155', margin: '0 0 8px' }}>Chưa có học viên nào</h3>
          <p style={{ color: '#94a3b8', margin: 0 }}>Có vẻ như bạn chưa có học viên nào khớp với tìm kiếm.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredMembers.map((m, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: '#fff', 
                borderRadius: 24, 
                padding: 24, 
                border: '1px solid #f1f5f9',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.borderColor = '#bfdbfe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = '#f1f5f9';
              }}
            >
              {/* Background Decoration */}
              <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ 
                  width: 64, height: 64, borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 3, // For ring effect
                  boxShadow: '0 4px 10px rgba(59,130,246,0.2)'
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.nguoiDung?.avatar ? (
                      <img src={m.nguoiDung.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={28} color="#3b82f6" />
                    )}
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    {m.nguoiDung?.hoten}
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ 
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, 
                      background: m.capbac === 'Hội viên tháng' ? '#fdf4ff' : '#f8fafc', 
                      color: m.capbac === 'Hội viên tháng' ? '#c026d3' : '#64748b',
                      border: `1px solid ${m.capbac === 'Hội viên tháng' ? '#f5d0fe' : '#e2e8f0'}`
                    }}>
                      <Award size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }}/>
                      {m.capbac || 'Thành viên'}
                    </span>
                    <span style={{ 
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, 
                      background: m.trangthai === 'Hoạt động' ? '#ecfdf5' : '#fef2f2', 
                      color: m.trangthai === 'Hoạt động' ? '#10b981' : '#ef4444',
                    }}>
                      <Activity size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }}/>
                      {m.trangthai}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, background: '#f8fafc', padding: 16, borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <Phone size={14}/> 
                  </div>
                  {m.nguoiDung?.sdt || 'Chưa cập nhật'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <Mail size={14}/> 
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.nguoiDung?.email || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>

              <button style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: 14, 
                border: 'none', 
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                color: '#fff', 
                fontWeight: 700, 
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)'}
              onClick={() => navigate(`/coach/messages?with=${m.nguoiDung?.id_nguoidung}`)}
              >
                <MessageSquare size={16} /> Gửi Tin Nhắn
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

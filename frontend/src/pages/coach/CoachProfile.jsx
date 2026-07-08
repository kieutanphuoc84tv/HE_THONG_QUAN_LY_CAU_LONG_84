import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Divider, Statistic, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { getStoredUser, updateStoredUser } from '../../utils/authStorage';

export default function CoachProfile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalSchedules: 0, totalStudents: 0 });

  useEffect(() => {
    // Tải thông tin người dùng từ bộ nhớ đăng nhập hiện tại
    const user = getStoredUser({});
    form.setFieldsValue({
      hoten: user.hoTen,
      email: user.email,
      sdt: user.soDienThoai,
      tendangnhap: user.tenDangNhap
    });

    // Lấy thống kê lịch dạy và học viên
    api.get('/coach/schedules').then(res => {
      const schedules = res.data || [];
      const uniqueStudents = new Set(schedules.map(s => s.id_thanhvien));
      setStats({
        totalSchedules: schedules.length,
        totalStudents: uniqueStudents.size
      });
    }).catch(() => {});
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await api.put('/members/profile', { HoTen: values.hoten, SoDienThoai: values.sdt });
      message.success('Cập nhật thông tin thành công!');
      const user = getStoredUser({});
      user.hoTen = values.hoten;
      user.soDienThoai = values.sdt;
      updateStoredUser(user);
      // Tải lại trang để cập nhật tên
      window.location.reload();
    } catch {
      message.error('Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingTop: 20 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 24, textTransform: 'uppercase' }}>Hồ Sơ Huấn Luyện Viên</h1>
      
      <Row gutter={24}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 16, marginBottom: 24 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#10b981', color: '#fff', fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 800 }}>
              {form.getFieldValue('hoten')?.substring(0, 2)?.toUpperCase() || 'HL'}
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{form.getFieldValue('hoten')}</h2>
            <p style={{ color: '#64748b', marginBottom: 24, fontWeight: 500 }}>Huấn luyện viên chính thức</p>
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title={<span style={{fontWeight: 600}}>Học viên</span>} value={stats.totalStudents} valueStyle={{ color: '#0f172a', fontWeight: 800 }} />
              </Col>
              <Col span={12}>
                <Statistic title={<span style={{fontWeight: 600}}>Lịch dạy</span>} value={stats.totalSchedules} valueStyle={{ color: '#10b981', fontWeight: 800 }} />
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} md={16}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
              <SafetyCertificateOutlined style={{ color: '#10b981' }}/> Thông Tin Cá Nhân
            </h3>
            
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="hoten" label={<span style={{fontWeight: 600}}>Họ và tên</span>} rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                    <Input prefix={<UserOutlined style={{color: '#94a3b8'}}/>} size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="tendangnhap" label={<span style={{fontWeight: 600}}>Tên đăng nhập</span>}>
                    <Input disabled size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="email" label={<span style={{fontWeight: 600}}>Email</span>} rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                    <Input prefix={<MailOutlined style={{color: '#94a3b8'}}/>} size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="sdt" label={<span style={{fontWeight: 600}}>Số điện thoại</span>}>
                    <Input prefix={<PhoneOutlined style={{color: '#94a3b8'}}/>} size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider style={{ margin: '16px 0' }} />
              
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 700, padding: '0 32px', borderRadius: 8, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

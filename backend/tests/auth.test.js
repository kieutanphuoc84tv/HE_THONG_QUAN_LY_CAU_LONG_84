const request = require('supertest');
const express = require('express');

// Dummy app for testing route structure
const app = express();
app.use(express.json());
app.post('/api/auth/login', (req, res) => {
  const { identifier, matKhau } = req.body;
  if (identifier === 'admin' && matKhau === '123') {
    return res.json({ token: 'fake-jwt-token', user: { role: 'Admin' } });
  }
  return res.status(401).json({ error: 'Sai tài khoản' });
});

describe('Auth API', () => {
  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin', matKhau: '123' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should fail login with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin', matKhau: 'wrong' });
    
    expect(res.statusCode).toEqual(401);
  });
});

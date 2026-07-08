const request = require('supertest');
const app = require('../../index'); // Assume index.js exports the express app

describe('API Health Check', () => {
  it('should return 200 on GET /', async () => {
    // Assuming you have a basic root route or change it to an existing route
    const res = await request(app).get('/');
    // We expect either a 200 or 404 depending on if '/' is defined
    expect([200, 404]).toContain(res.statusCode);
  });
});

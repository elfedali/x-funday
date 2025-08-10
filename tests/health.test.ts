import request from 'supertest';
import app from '../src/app';

describe('GET /health', () => {
  it('returns 200 OK with expected shape', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('environment', 'test');
  });
});

import request from 'supertest';
import app from '../src/app';

describe('GET /api', () => {
  it('returns API metadata', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: expect.any(String),
      version: expect.any(String),
      description: expect.any(String),
      endpoints: expect.any(Object),
    });
  });
});

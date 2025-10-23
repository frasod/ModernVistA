import request from 'supertest';
import app from '../app';

describe('Health API', () => {
  it('GET /api/v1/health returns healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('service', 'modernvista-api');
  });
});

import request from 'supertest';
import app from '../app';

describe('Patients API', () => {
  it('GET /api/v1/patients/ping returns ok boolean', async () => {
    const res = await request(app).get('/api/v1/patients/ping');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok');
    expect(typeof res.body.ok).toBe('boolean');
  });
});

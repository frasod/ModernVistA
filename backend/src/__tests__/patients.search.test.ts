import request from 'supertest';
import app from '../app';

describe('Structured Patients Search API', () => {
  it('GET /api/v1/patients-search returns schemaVersion and patients array', async () => {
    const res = await request(app).get('/api/v1/patients-search?q=DOE');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('schemaVersion', 1);
    expect(res.body).toHaveProperty('ok', true);
    expect(Array.isArray(res.body.patients)).toBe(true);
    // Expect patient objects to have id and name at minimum
    if (res.body.patients.length) {
      const p = res.body.patients[0];
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
    }
    expect(Array.isArray(res.body.issues)).toBe(true);
  });
});

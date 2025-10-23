// Consolidated end-to-end smoke test.
// Ensures core endpoints respond and metrics exporter is functional.
process.env.ADMIN_METRICS_ENABLE = 'true';
import request from 'supertest';
import app from '../app';

describe('E2E Smoke', () => {
  test('health endpoint', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
  });

  test('patients-search endpoint', async () => {
    const res = await request(app).get('/api/v1/patients-search?q=DOE');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(Array.isArray(res.body.patients)).toBe(true);
  });

  test('nlp intent patient-search', async () => {
    const res = await request(app)
      .post('/api/v1/nlp/intent/patient-search')
      .send({ phrase: 'look up JANE DOE' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('intent', 'patient-search');
  });

  test('metrics endpoint basic lines', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    const text = res.text;
    expect(text).toMatch(/broker_rpc_count/);
    expect(text).toMatch(/broker_session_state/);
    expect(text).toMatch(/broker_mode/);
  });
});

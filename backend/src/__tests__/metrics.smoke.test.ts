import request from 'supertest';

// Important: we need the app AFTER setting env flag so dynamic route mounts metrics
process.env.ADMIN_METRICS_ENABLE = 'true';
const app = require('../app').default;

describe('Prometheus Metrics Smoke Test', () => {
  it('GET /metrics contains key metric lines', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    const text: string = res.text;
    expect(text).toMatch(/broker_rpc_count/);
    expect(text).toMatch(/broker_decode_latency_ms_bucket/);
    expect(text).toMatch(/broker_rpc_e2e_latency_ms_bucket/);
    expect(text).toMatch(/broker_parse_patients_total/);
  });
});

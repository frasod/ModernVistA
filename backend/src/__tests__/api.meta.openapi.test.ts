import request from 'supertest';
import app from '../app';

describe('API index / meta / openapi', () => {
  it('GET /api/v1 returns JSON index by default', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('service', 'modernvista-api');
    expect(res.body).toHaveProperty('sampleEndpoints');
  });

  it('GET /api/v1 with Accept: text/html returns HTML', async () => {
    const res = await request(app).get('/api/v1').set('Accept', 'text/html');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toMatch(/ModernVista API/);
  });

  it('GET /api/v1/openapi.json returns minimal spec', async () => {
    const res = await request(app).get('/api/v1/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body).toHaveProperty('paths');
    expect(res.body.paths).toHaveProperty('/health');
  });

  it('GET /api/v1/meta returns metadata', async () => {
    const res = await request(app).get('/api/v1/meta');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service', 'modernvista-api');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('uptimeMs');
  });
});

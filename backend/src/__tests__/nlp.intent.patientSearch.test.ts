import request from 'supertest';
import app from '../app';

describe('NLP Intent Patient Search', () => {
  it('POST /api/v1/nlp/intent/patient-search extracts last two tokens as term', async () => {
    const phrase = 'find patient JOHN DOE';
    const res = await request(app)
      .post('/api/v1/nlp/intent/patient-search')
      .send({ phrase });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('intent', 'patient-search');
    expect(res.body).toHaveProperty('term');
    expect(res.body.term.toUpperCase()).toBe('JOHN DOE');
  });

  it('POST returns 400 on missing phrase', async () => {
    const res = await request(app)
      .post('/api/v1/nlp/intent/patient-search')
      .send({ });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'MISSING_PHRASE');
  });
});

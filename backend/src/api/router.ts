import { Router } from 'express';
import { asyncHandler } from '../core/middleware/errorHandler';
import { patientsRouter } from './patients';
import { config } from '../config/config';
import { VistaBrokerSession } from '../vista/broker/session';
import { logger } from '../config/logger';
// Import package metadata for dynamic version reporting (tsconfig enables resolveJsonModule)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - json import typing inference
import pkg from '../../package.json';
// Lazy optional import for admin metrics to avoid hard failure if module path issues
let adminMetricsRouter: any;
if (config.admin?.metricsEnable) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    adminMetricsRouter = require('./admin/metrics').adminMetricsRouter;
  } catch (e:any) {
    // eslint-disable-next-line no-console
    console.warn('[ModernVista][Router] Admin metrics disabled - failed to load metrics router:', e.message);
  }
}

/**
 * Main API Router for ModernVista
 * 
 * Clean, organized routing structure following RESTful principles.
 * Modular approach for easy maintenance and extension.
 */

const router = Router();

// API index / capability document (so /api/v1 no longer returns default 404 "Cannot GET")
router.get('/', (req, res) => {
  const version = (pkg && (pkg as any).version) || '0.0.0';
  const payload = {
    service: 'modernvista-api',
    version,
    status: 'ok',
    timestamp: new Date().toISOString(),
    description: 'ModernVista REST gateway over real VistA RPC Broker',
    health: '/api/v1/health',
    docs: {
      quickstart: '/QUICKSTART.md',
      readme: '/README.md'
    },
    sampleEndpoints: {
      patientsSearch: '/api/v1/patients-search?q=DOE',
      labs: '/api/v1/labs/{patientId}',
      medications: '/api/v1/meds/{patientId}',
      vitals: '/api/v1/vitals/{patientId}',
      allergies: '/api/v1/allergies/{patientId}'
    },
    notes: [
      'All patient-centric endpoints require a valid VistA DFN (internal entry number).',
      'Authentication layer is not yet enforced; future /auth routes will issue JWTs.',
      'If clinical endpoints return mock:true investigate VistA connectivity / environment variables.'
    ]
  };

  if (req.accepts(['html', 'json']) === 'html') {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ModernVista API v${payload.version}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.4; color:#222; }
    code { background:#f2f2f2; padding:2px 4px; border-radius:4px; }
    h1 { margin-top:0; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap:1.25rem; }
    .card { border:1px solid #ddd; border-radius:8px; padding:1rem; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.04); }
    ul { padding-left:1.1rem; }
    a { color:#0b61a4; text-decoration:none; }
    a:hover { text-decoration:underline; }
    footer { margin-top:2rem; font-size:0.8rem; color:#666; }
  </style>
  <meta name="robots" content="noindex" />
  <meta name="description" content="ModernVista API index" />
</head>
<body>
  <h1>ModernVista API <small style="font-size:0.55em;font-weight:400;">v${payload.version}</small></h1>
  <p>${payload.description}</p>
  <p>Status: <strong>${payload.status}</strong> | Time: <code>${payload.timestamp}</code></p>
  <div class="grid">
    <div class="card">
      <h2>Docs</h2>
      <ul>
        <li><a href="${payload.docs.quickstart}">Quickstart</a></li>
        <li><a href="${payload.docs.readme}">README</a></li>
      </ul>
    </div>
    <div class="card">
      <h2>Sample Endpoints</h2>
      <ul>
        <li><code>${payload.sampleEndpoints.patientsSearch}</code></li>
        <li><code>${payload.sampleEndpoints.labs}</code></li>
        <li><code>${payload.sampleEndpoints.medications}</code></li>
        <li><code>${payload.sampleEndpoints.vitals}</code></li>
        <li><code>${payload.sampleEndpoints.allergies}</code></li>
      </ul>
    </div>
    <div class="card">
      <h2>Notes</h2>
      <ul>
        ${payload.notes.map(n => `<li>${n}</li>`).join('')}
      </ul>
    </div>
  </div>
  <p>Health: <a href="${payload.health}">${payload.health}</a></p>
  <footer>Generated dynamically • ModernVista</footer>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  res.json(payload);
});

// Health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'modernvista-api',
    version: '0.1.0'
  });
}));

// Minimal OpenAPI specification (incrementally expandable)
router.get('/openapi.json', (req, res) => {
  const version = (pkg && (pkg as any).version) || '0.0.0';
  const spec = {
    openapi: '3.0.1',
    info: {
      title: 'ModernVista API',
      version,
      description: 'Lightweight REST facade over VistA RPC Broker. Spec is minimal and will evolve.'
    },
    servers: [
      { url: '/api/v1', description: 'Primary API base path' }
    ],
    paths: {
      '/': { get: { summary: 'API index', responses: { '200': { description: 'Index payload' } } } },
      '/health': { get: { summary: 'Health check', responses: { '200': { description: 'Health status' } } } },
      '/patients-search': { get: { summary: 'Search patients by name fragment', parameters: [ { name: 'q', in: 'query', required: false, schema: { type: 'string' } } ], responses: { '200': { description: 'Search results' } } } },
      '/labs/{patientId}': { get: { summary: 'Retrieve lab results', parameters: [ { name: 'patientId', in: 'path', required: true, schema: { type: 'string' } } ], responses: { '200': { description: 'Lab list' } } } },
      '/meds/{patientId}': { get: { summary: 'Retrieve active medications', parameters: [ { name: 'patientId', in: 'path', required: true, schema: { type: 'string' } } ], responses: { '200': { description: 'Medication list' } } } },
      '/vitals/{patientId}': { get: { summary: 'Retrieve vitals', parameters: [ { name: 'patientId', in: 'path', required: true, schema: { type: 'string' } } ], responses: { '200': { description: 'Vitals list' } } } },
      '/allergies/{patientId}': { get: { summary: 'Retrieve allergies', parameters: [ { name: 'patientId', in: 'path', required: true, schema: { type: 'string' } } ], responses: { '200': { description: 'Allergy list' } } } }
    }
  };
  res.json(spec);
});

// Runtime / build metadata endpoint
const processStart = Date.now();
router.get('/meta', (req, res) => {
  const version = (pkg && (pkg as any).version) || '0.0.0';
  const uptimeMs = Date.now() - processStart;
  res.json({
    service: 'modernvista-api',
    version,
    uptimeMs,
    uptimeHuman: `${Math.floor(uptimeMs/1000)}s`,
    gitCommit: process.env.GIT_COMMIT || null,
    node: process.version,
    featureFlags: {
      adminMetrics: !!config.admin?.metricsEnable,
      experimentalBroker: true
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
router.use('/auth', (req, res) => {
  res.json({ 
    message: 'Authentication endpoints - Coming soon',
    available_endpoints: [
      'POST /auth/login',
      'POST /auth/logout', 
      'GET /auth/profile',
      'POST /auth/refresh'
    ]
  });
});

// VistA integration routes
router.use('/vista', (req, res) => {
  res.json({ 
    message: 'VistA integration endpoints - Coming soon',
    available_endpoints: [
      'GET /vista/patients',
      'GET /vista/patients/:id',
      'GET /vista/patients/:id/chart',
      'GET /vista/patients/:id/labs',
      'GET /vista/patients/:id/medications'
    ]
  });
});

// Natural Language Processing routes
router.post('/nlp/intent/patient-search', asyncHandler(async (req, res) => {
  const { phrase } = req.body || {};
  if (!phrase || typeof phrase !== 'string') return res.status(400).json({ ok: false, error: 'MISSING_PHRASE' });
  // Very naive extraction: take last two tokens that look like a name pattern
  const tokens = phrase.trim().split(/\s+/);
  let term = '';
  if (tokens.length >= 2) {
    term = tokens.slice(-2).join(' ');
  } else {
    term = tokens[0];
  }
  res.json({ ok: true, intent: 'patient-search', term, schemaVersion: 1 });
}));

// Patient management routes
router.use('/patients', patientsRouter);

// Experimental structured patient search (broker-backed)
router.get('/patients-search', asyncHandler(async (req, res) => {
  const term = (req.query.q as string) || '';
  try {
    const session = new VistaBrokerSession();
    const rpc = 'ORWPT LIST';
    const result = await session.call(rpc, [term, '20']);
    if (!result.ok) {
      logger.error('[API] Patient search broker call failed', { rpc, term, result });
      return res.status(502).json({ ok: false, error: 'BROKER_CALL_FAILED', raw: result.lines });
    }
    res.json({ 
      schemaVersion: 1, 
      ok: true, 
      rpcName: rpc, 
      term, 
      patients: result.structured?.patients || [], 
      issues: result.structured?.issues || [], 
      raw: result.lines, 
      mock: result.mock 
    });
  } catch (error: any) {
    logger.error('[API] Patient search exception', { 
      error: error.message, 
      stack: error.stack,
      term 
    });
    res.status(500).json({ 
      ok: false, 
      error: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Real VistA RPC clinical data endpoints
router.get('/labs/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const rpcName = 'ORWLRR LABS'; 
  
  try {
    const session = new VistaBrokerSession();
    const result = await session.call(rpcName, [patientId, '', '', '']); // patient, location, dateFrom, dateTo
    
    if (result.ok) {
      // Parse VistA lab data format
      const labs = result.lines.map((line, index) => {
        const parts = line.split('^');
        return {
          id: `LAB_${index}`,
          test: parts[1] || 'Unknown Test',
          value: parts[2] || '',
          units: parts[3] || '',
          collected: parts[4] || '',
          reference: parts[5] || '',
          flag: parts[6] || ''
        };
      });
      
      res.json({ 
        ok: true, 
        rpcName, 
        patientId, 
        labs, 
        mock: result.mock, 
        schemaVersion: 1,
        rawLines: result.lines.length 
      });
    } else {
      res.status(500).json({ 
        ok: false, 
        error: 'RPC call failed', 
        rpcName, 
        patientId 
      });
    }
  } catch (error: any) {
    res.status(500).json({ 
      ok: false, 
      error: error.message, 
      rpcName, 
      patientId 
    });
  }
}));

router.get('/meds/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const rpcName = 'ORWPS ACTIVE MEDS';
  
  try {
    const session = new VistaBrokerSession();
    const result = await session.call(rpcName, [patientId]);
    
    if (result.ok) {
      // Parse VistA medication data format
      const medications = result.lines.map((line, index) => {
        const parts = line.split('^');
        return {
          id: `MED_${index}`,
          name: parts[1] || 'Unknown Medication',
          dose: parts[2] || '',
          route: parts[3] || '',
          schedule: parts[4] || '',
          status: parts[5] || 'Active',
          prescriber: parts[6] || '',
          dateOrdered: parts[7] || ''
        };
      });
      
      res.json({ 
        ok: true, 
        rpcName, 
        patientId, 
        medications, 
        mock: result.mock, 
        schemaVersion: 1,
        rawLines: result.lines.length 
      });
    } else {
      res.status(500).json({ 
        ok: false, 
        error: 'RPC call failed', 
        rpcName, 
        patientId 
      });
    }
  } catch (error: any) {
    res.status(500).json({ 
      ok: false, 
      error: error.message, 
      rpcName, 
      patientId 
    });
  }
}));

// Real VistA vitals endpoint
router.get('/vitals/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const rpcName = 'ORQQVI VITALS';
  
  try {
    const session = new VistaBrokerSession();
    const result = await session.call(rpcName, [patientId]);
    
    if (result.ok) {
      // Parse VistA vitals data format
      const vitals = result.lines.map((line, index) => {
        const parts = line.split('^');
        return {
          id: `VITAL_${index}`,
          type: parts[1] || 'Unknown Vital',
          value: parts[2] || '',
          unit: parts[3] || '',
          observed: parts[4] || '',
          location: parts[5] || '',
          enteredBy: parts[6] || ''
        };
      });
      
      res.json({
        ok: true,
        schemaVersion: 1,
        rpcName: rpcName,
        patientId,
        vitals,
        mock: result.mock,
        rawLines: result.lines.length
      });
    } else {
      res.status(500).json({ 
        ok: false, 
        error: 'RPC call failed', 
        rpcName, 
        patientId 
      });
    }
  } catch (error: any) {
    res.status(500).json({ 
      ok: false, 
      error: error.message, 
      rpcName, 
      patientId 
    });
  }
}));

// Real VistA allergies endpoint
router.get('/allergies/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const rpcName = 'ORQQAL ALLERGIES';
  
  try {
    const session = new VistaBrokerSession();
    const result = await session.call(rpcName, [patientId]);
    
    if (result.ok) {
      // Parse VistA allergies data format
      const allergies = result.lines.map((line, index) => {
        const parts = line.split('^');
        return {
          id: `ALLERGY_${index}`,
          allergen: parts[1] || 'Unknown Allergen',
          reaction: parts[2] || '',
          severity: parts[3] || '',
          onset: parts[4] || '',
          status: parts[5] || 'Active',
          type: parts[6] || '',
          verifiedBy: parts[7] || ''
        };
      });
      
      res.json({
        ok: true,
        schemaVersion: 1,
        rpcName: rpcName,
        patientId,
        allergies,
        mock: result.mock,
        rawLines: result.lines.length
      });
    } else {
      res.status(500).json({ 
        ok: false, 
        error: 'RPC call failed', 
        rpcName, 
        patientId 
      });
    }
  } catch (error: any) {
    res.status(500).json({ 
      ok: false, 
      error: error.message, 
      rpcName, 
      patientId 
    });
  }
}));

// Admin / diagnostics (feature-flagged & lazy)
if (config.admin?.metricsEnable && adminMetricsRouter) {
  router.use('/admin', adminMetricsRouter);
}

// Clinical data routes
router.use('/clinical', (req, res) => {
  res.json({ 
    message: 'Clinical data endpoints - Coming soon',
    available_endpoints: [
      'GET /clinical/labs/:patientId',
      'GET /clinical/medications/:patientId',
      'GET /clinical/allergies/:patientId',
      'GET /clinical/vitals/:patientId'
    ]
  });
});

// Orders and scheduling routes
router.use('/orders', (req, res) => {
  res.json({ 
    message: 'Orders management endpoints - Coming soon',
    available_endpoints: [
      'GET /orders/:patientId',
      'POST /orders',
      'PUT /orders/:id',
      'DELETE /orders/:id'
    ]
  });
});

export { router as apiRouter };
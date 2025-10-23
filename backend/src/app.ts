import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRouter } from './api/router';
import { errorHandler } from './core/middleware/errorHandler';
import { requestLogger } from './core/middleware/requestLogger';
import { rateLimiter } from './core/middleware/rateLimiter';
import { apiTimeout } from './core/middleware/requestTimeout';
import { config } from './config/config';
import { logger } from './config/logger';
import { brokerMetrics } from './vista/broker/metrics';

// Create and configure express app (testable instance w/out listening)
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: config.server.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(rateLimiter);
  app.use(apiTimeout);
  app.use(requestLogger);

  // Friendly root landing so hitting http://localhost:3001/ does not show 'Cannot GET /'
  app.get('/', (req, res) => {
    const accept = req.accepts(['html','json']);
    const payload = {
      service: 'modernvista-backend',
      status: 'ok',
      message: 'Backend running. See /api/v1 for REST API index.',
      apiIndex: `${config.server.apiPrefix}/`,
      health: '/health',
      meta: `${config.server.apiPrefix}/meta`,
      openapi: `${config.server.apiPrefix}/openapi.json`,
      timestamp: new Date().toISOString()
    };
    if (accept === 'html') {
      return res.status(200).send(`<!doctype html><html><head><meta charset='utf-8'/><title>ModernVista Backend</title><style>body{font-family:system-ui,Arial,sans-serif;margin:2rem;line-height:1.4;color:#222}code{background:#f5f5f5;padding:2px 4px;border-radius:4px}a{color:#0b61a4;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><h1>ModernVista Backend</h1><p>Service is running.</p><ul><li>API Index: <code><a href='${payload.apiIndex}'>${payload.apiIndex}</a></code></li><li>Health: <code><a href='${payload.health}'>${payload.health}</a></code></li><li>Meta: <code><a href='${payload.meta}'>${payload.meta}</a></code></li><li>OpenAPI: <code><a href='${payload.openapi}'>${payload.openapi}</a></code></li></ul><p>Status: <strong>${payload.status}</strong></p><p style='font-size:0.8em;color:#555'>Timestamp: ${payload.timestamp}</p></body></html>`);
    }
    res.json(payload);
  });

  // Root health (outside prefix) for infra checks
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: config.server.nodeEnv
    });
  });

  // Basic Prometheus-style metrics (text/plain) when enabled
  if (process.env.ADMIN_METRICS_ENABLE === 'true') {
    app.get('/metrics', (req, res) => {
      const snap = brokerMetrics.snapshot();
      const lines: string[] = [];
      lines.push('# HELP broker_rpc_count Total RPC invocations by name');
      lines.push('# TYPE broker_rpc_count counter');
      Object.entries(snap.rpc).forEach(([rpc, data]: any) => {
        lines.push(`broker_rpc_count{rpc="${rpc}"} ${data.count}`);
        lines.push(`broker_rpc_errors_total{rpc="${rpc}"} ${data.errors}`);
        lines.push(`broker_rpc_max_ms{rpc="${rpc}"} ${data.maxMs}`);
        lines.push(`broker_rpc_p95_ms{rpc="${rpc}"} ${data.p95Ms}`);
        lines.push(`broker_rpc_avg_ms{rpc="${rpc}"} ${data.avgMs}`);
      });
      lines.push('# HELP broker_signon_attempts Total sign-on attempts');
      lines.push('# TYPE broker_signon_attempts counter');
      lines.push(`broker_signon_attempts ${snap.signOn.attempts}`);
      lines.push('# HELP broker_signon_errors Total sign-on errors');
      lines.push('# TYPE broker_signon_errors counter');
      lines.push(`broker_signon_errors ${snap.signOn.errors}`);
      lines.push('# HELP broker_frames_seen Total frame chunks observed');
      lines.push('# TYPE broker_frames_seen counter');
      lines.push(`broker_frames_seen ${snap.frames.seen}`);
      lines.push('# HELP broker_frames_complete Frames completed');
      lines.push('# TYPE broker_frames_complete counter');
      lines.push(`broker_frames_complete ${snap.frames.complete}`);
      lines.push('# HELP broker_frames_errors Frame errors');
      lines.push('# TYPE broker_frames_errors counter');
      lines.push(`broker_frames_errors ${snap.frames.errors}`);
      lines.push('# HELP broker_frames_continuations_total Frame continuation (multi-part) segments observed');
      lines.push('# TYPE broker_frames_continuations_total counter');
      lines.push(`broker_frames_continuations_total ${snap.frames.continuations || 0}`);
      if (snap.frames.lastError) {
        lines.push('# HELP broker_frames_last_error_code Last frame error code (1 if present)');
        lines.push('# TYPE broker_frames_last_error_code gauge');
        lines.push(`broker_frames_last_error_code{code="${snap.frames.lastError}"} 1`);
      }
      lines.push('# HELP broker_frames_multipart_exceeded_total Multi-part frames exceeding accumulated size guard');
      lines.push('# TYPE broker_frames_multipart_exceeded_total counter');
      lines.push(`broker_frames_multipart_exceeded_total ${snap.frames.multipartExceeded || 0}`);
      lines.push('# HELP broker_frames_multipart_started_total Multi-part frame sequences started');
      lines.push('# TYPE broker_frames_multipart_started_total counter');
      lines.push(`broker_frames_multipart_started_total ${snap.frames.multipartStarted || 0}`);
      lines.push('# HELP broker_frames_multipart_completed_total Multi-part frame sequences completed');
      lines.push('# TYPE broker_frames_multipart_completed_total counter');
      lines.push(`broker_frames_multipart_completed_total ${snap.frames.multipartCompleted || 0}`);
      if (snap.frames.multipartChecksum) {
        lines.push('# HELP broker_frames_multipart_checksum Last completed multi-part frame checksum (exposed as label)');
        lines.push('# TYPE broker_frames_multipart_checksum gauge');
        lines.push(`broker_frames_multipart_checksum{sha1="${snap.frames.multipartChecksum}"} 1`);
      }
      // Parsing metrics
      lines.push('# HELP broker_parse_patients_total Total patients parsed');
      lines.push('# TYPE broker_parse_patients_total counter');
      lines.push(`broker_parse_patients_total ${snap.parsing.patients}`);
      lines.push('# HELP broker_parse_issues_total Total parse issues encountered');
      lines.push('# TYPE broker_parse_issues_total counter');
      lines.push(`broker_parse_issues_total ${snap.parsing.issues}`);
      Object.entries(snap.parsing.issueReasons).forEach(([reason, count]: any) => {
        lines.push(`broker_parse_issue_reasons_total{reason="${reason}"} ${count}`);
      });
      lines.push('# HELP broker_parse_dob_normalized_total Successfully normalized DOBs to ISO');
      lines.push('# TYPE broker_parse_dob_normalized_total counter');
      lines.push(`broker_parse_dob_normalized_total ${snap.parsing.dobNormalized || 0}`);
      lines.push('# HELP broker_parse_dob_invalid_total Invalid or unparseable DOB strings encountered');
      lines.push('# TYPE broker_parse_dob_invalid_total counter');
      lines.push(`broker_parse_dob_invalid_total ${snap.parsing.dobInvalid || 0}`);
      lines.push('# HELP broker_parse_gender_omitted_total Lines where gender missing/invalid');
      lines.push('# TYPE broker_parse_gender_omitted_total counter');
      lines.push(`broker_parse_gender_omitted_total ${snap.parsing.genderOmitted || 0}`);
  lines.push('# HELP broker_parse_name_split_failed_total Patient name lines missing comma to split');
  lines.push('# TYPE broker_parse_name_split_failed_total counter');
  lines.push(`broker_parse_name_split_failed_total ${snap.parsing.nameSplitFailed || 0}`);
  lines.push('# HELP broker_parse_dropped_strict_dob_total Patients dropped due to strict DOB validation');
  lines.push('# TYPE broker_parse_dropped_strict_dob_total counter');
  lines.push(`broker_parse_dropped_strict_dob_total ${snap.parsing.droppedForStrictDob || 0}`);
      // Header metrics
      lines.push('# HELP broker_header_errors Total header parse errors');
      lines.push('# TYPE broker_header_errors counter');
      lines.push(`broker_header_errors ${snap.header.errors}`);
      Object.entries(snap.header.reasons).forEach(([reason, count]: any) => {
        lines.push(`broker_header_error_reasons_total{reason="${reason}"} ${count}`);
      });
      // Parsing metrics already emitted earlier (patients + issues)
      // Redaction metrics
      lines.push('# HELP broker_redaction_applied Total frames where redaction rules applied');
      lines.push('# TYPE broker_redaction_applied counter');
      lines.push(`broker_redaction_applied ${snap.redaction.applied}`);
      Object.entries(snap.redaction.rules).forEach(([rule, count]: any) => {
        lines.push(`broker_redaction_rule_total{rule="${rule}"} ${count}`);
      });
      // Decode latency histogram (Prometheus format: cumulative buckets)
      lines.push('# HELP broker_decode_latency_ms Decode latency histogram in milliseconds');
      lines.push('# TYPE broker_decode_latency_ms histogram');
      let cumulative = 0;
      for (let i = 0; i < snap.decodeLatency.buckets.length; i++) {
        cumulative += snap.decodeLatency.counts[i];
        const upper = snap.decodeLatency.buckets[i];
        lines.push(`broker_decode_latency_ms_bucket{le="${upper}"} ${cumulative}`);
      }
      // +Inf bucket
      if (snap.decodeLatency.counts.length > snap.decodeLatency.buckets.length) {
        cumulative += snap.decodeLatency.counts[snap.decodeLatency.counts.length - 1];
      }
      lines.push(`broker_decode_latency_ms_bucket{le="+Inf"} ${cumulative}`);
      lines.push(`broker_decode_latency_ms_sum ${snap.decodeLatency.sum}`);
      lines.push(`broker_decode_latency_ms_count ${snap.decodeLatency.count}`);
      // RPC end-to-end latency histogram
      lines.push('# HELP broker_rpc_e2e_latency_ms End-to-end RPC latency histogram in milliseconds');
      lines.push('# TYPE broker_rpc_e2e_latency_ms histogram');
      let rpcCum = 0;
      for (let i = 0; i < snap.rpcE2E.buckets.length; i++) {
        rpcCum += snap.rpcE2E.counts[i];
        const upper = snap.rpcE2E.buckets[i];
        lines.push(`broker_rpc_e2e_latency_ms_bucket{le="${upper}"} ${rpcCum}`);
      }
      if (snap.rpcE2E.counts.length > snap.rpcE2E.buckets.length) {
        rpcCum += snap.rpcE2E.counts[snap.rpcE2E.counts.length - 1];
      }
      lines.push(`broker_rpc_e2e_latency_ms_bucket{le="+Inf"} ${rpcCum}`);
      lines.push(`broker_rpc_e2e_latency_ms_sum ${snap.rpcE2E.sum}`);
      lines.push(`broker_rpc_e2e_latency_ms_count ${snap.rpcE2E.count}`);
      // RPC timeouts
      lines.push('# HELP broker_rpc_timeouts_total RPC read timeouts encountered');
      lines.push('# TYPE broker_rpc_timeouts_total counter');
      lines.push(`broker_rpc_timeouts_total ${snap.rpcTimeouts || 0}`);
      // Broker mode gauge
      lines.push('# HELP broker_mode Current broker operating mode (mock vs experimental)');
      lines.push('# TYPE broker_mode gauge');
      if (snap.mode) {
        lines.push(`broker_mode{mode="${snap.mode}"} 1`);
      }
      // Session state gauge (1 for current state)
      lines.push('# HELP broker_session_state Current session state (value 1 for active state)');
      lines.push('# TYPE broker_session_state gauge');
      if (snap.sessionState) {
        lines.push(`broker_session_state{state="${snap.sessionState}"} 1`);
      }
      // Session state dwell times (ms accumulated)
      if (snap.sessionStateDwellMs) {
        lines.push('# HELP broker_session_state_dwell_ms Total accumulated time spent in session states (ms)');
        lines.push('# TYPE broker_session_state_dwell_ms counter');
        Object.entries(snap.sessionStateDwellMs).forEach(([st, ms]: any) => {
          lines.push(`broker_session_state_dwell_ms{state="${st}"} ${ms}`);
        });
      }
      res.set('Content-Type', 'text/plain; version=0.0.4');
      res.send(lines.join('\n') + '\n');
    });
  }

  app.use(config.server.apiPrefix, apiRouter);
  app.use(errorHandler);
  return app;
}

const app = createApp();
export default app;

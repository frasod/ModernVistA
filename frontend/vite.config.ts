import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only health endpoint so docker-compose and scripts can probe /health
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

const healthPlugin: Plugin = {
  name: 'health-endpoint',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/health', (_req: IncomingMessage, res: ServerResponse) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'ok',
        service: 'modernvista-frontend',
        timestamp: new Date().toISOString()
      }));
    });
  }
};

export default defineConfig({
  plugins: [react(), healthPlugin],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api/v1': 'http://localhost:3001', // Proxy API requests to the backend
      '/patients': 'http://localhost:3001' // Proxy patient search requests to the backend
    }
  },
  preview: {
    port: 4173
  }
});

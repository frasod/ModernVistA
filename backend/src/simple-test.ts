console.log('Starting ModernVista Backend...');

import express from 'express';

const app = express();
const PORT = 3001;

app.get('/health', (req, res) => {
  console.log('Health check accessed');
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'ModernVista Backend is running!'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ModernVista Backend started successfully on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

console.log('Server setup complete, starting listener...');
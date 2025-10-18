// Minimal test server to debug the crash issue
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// CORS
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  console.log('✅ Health check received');
  res.json({ status: 'ok', message: 'Test server running', timestamp: new Date().toISOString() });
});

app.get('/api/companies', (req, res) => {
  console.log('✅ Companies endpoint called');
  res.json({
    companies: [
      { id: '1', name: 'TechFlow AI', industry: 'Enterprise SaaS', stage: 'Series A' },
      { id: '2', name: 'HealthMetrics', industry: 'HealthTech', stage: 'Seed' },
      { id: '3', name: 'GreenChain', industry: 'ClimateTech', stage: 'Pre-Seed' },
      { id: '4', name: 'FinSync', industry: 'FinTech', stage: 'Series A' },
      { id: '5', name: 'EduConnect', industry: 'EdTech', stage: 'Seed' }
    ]
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`✅ Ready to accept requests`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

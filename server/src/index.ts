import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes (will create these next)
import authRoutes from './routes/auth';
import companiesRoutes from './routes/companies';
import decksRoutes from './routes/decks';
import benchmarksRoutes from './routes/benchmarks';
import vcRoutes from './routes/vc';
import adminRoutes from './routes/admin';
import vcContextRoutes from './routes/vc-context';
import vcPreferencesRoutes from './routes/vc-preferences';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configuration for production
app.use(cors({
  origin: true, // Allow all origins in development/testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: any) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  try {
    console.log('✅ Health check called');
    res.json({ 
      status: 'ok', 
      message: 'Startup Scout API is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/decks', decksRoutes);
app.use('/api/benchmarks', benchmarksRoutes);
app.use('/api/vc', vcRoutes);
app.use('/api/vc-context', vcContextRoutes);
app.use('/api/vc-preferences', vcPreferencesRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
  console.log(`💾 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`✅ All systems ready!`);
});

server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process or use a different port.`);
  }
});

export default app;

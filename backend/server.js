import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

import config from './src/config/index.js';
import { testConnection } from './src/config/database.js';
import { runMigrations } from './src/migrations/run.js';
import logger from './src/utils/logger.js';
import errorHandler from './src/middleware/errorHandler.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';

// Services
import { mlAnalytics } from './src/services/mlAnalytics.js';
import { analyticsService } from './src/application/services/AnalyticsService.js';
import { syncOrchestrator } from './src/application/services/SyncOrchestrator.js';

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: config.cors.origins,
    methods: ['GET', 'POST']
  }
});

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));

// Rate limiting
// Rate limiting disabled for local development/debugging visibility
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 200,
//   message: { success: false, message: 'Too many requests, please try again later.' }
// });
// app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Make io accessible to routes
app.set('io', io);

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ProjectPulse API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', projectRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use(errorHandler);

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    logger.info(`Socket ${socket.id} joined project-${projectId}`);
  });

  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ==================== STARTUP ====================

const startServer = async () => {
  try {
    // Test DB connection
    await testConnection();

    // Run migrations
    await runMigrations();
    logger.info('Database migrations completed');

    // Start ML cron job
    cron.schedule(config.ml.retrainCron, async () => {
      try {
        await syncOrchestrator.syncAllProjects();
        await analyticsService.runBatchCompute();
      } catch (e) {
        logger.error('Scheduled ML computation failed:', e);
      }
    });

    // Start Real-time Integration Sync (Every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
      try {
        await syncOrchestrator.syncAllProjects();
      } catch (e) {
        logger.error('Scheduled sync failed:', e);
      }
    });

    // Start server
    server.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 ProjectPulse API v2.0.0 running on port ${config.port}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/api/health`);
      logger.info(`🤖 ML Cron: ${config.ml.retrainCron}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io };

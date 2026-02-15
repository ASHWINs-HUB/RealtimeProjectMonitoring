import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import projectRoutes from './src/routes/projectRoutes.js';
import errorHandler from './src/middleware/errorHandler.js';
import logger from './src/utils/logger.js';
import { initializeDatabase } from './src/config/database.js';

// Initialize database
initializeDatabase().then(async () => {
  logger.info('Database initialized successfully');
  
  // Seed database with sample data (only in development)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { seedDatabase } = await import('./src/utils/seeder.js');
      await seedDatabase();
    } catch (error) {
      logger.warn('Database seeding failed (data might already exist):', error.message);
    }
  }
}).catch(error => {
  logger.error('Failed to initialize database:', error);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/', projectRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 Webhook endpoint: POST http://localhost:${PORT}/create-project`);
});

export default app;

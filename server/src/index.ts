import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware';
import routes from './routes';
import { initializeSocket } from './socket';
import { initializeScheduledJobs } from './services/scheduler.service';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'MERN Platform API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Database connection and server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    // Initialize scheduled jobs for subscription management
    initializeScheduledJobs();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io };

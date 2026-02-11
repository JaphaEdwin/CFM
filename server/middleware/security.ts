import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import type { Application, Request, Response, NextFunction } from 'express';

// Load environment variables
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173'];
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

/**
 * Configure Helmet for security headers
 */
export function configureHelmet(app: Application) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
        connectSrc: ["'self'", "https://maps.googleapis.com", "https://*.googleapis.com"],
        frameSrc: ["'self'", "https://www.google.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding of external resources
  }));
}

/**
 * Configure CORS
 */
export function configureCors(app: Application) {
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (CORS_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        // In development, be more permissive
        if (process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));
}

/**
 * Configure Rate Limiting
 */
export function configureRateLimit(app: Application) {
  // In development, set very high limits to avoid blocking local testing
  const isDev = process.env.NODE_ENV !== 'production';
  const generalLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: isDev ? 10000 : RATE_LIMIT_MAX_REQUESTS,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Stricter rate limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 100 : 10, // much higher in dev
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general limiter to all routes
  app.use(generalLimiter);

  // Apply stricter limiter to auth routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}

/**
 * Configure Compression
 */
export function configureCompression(app: Application) {
  app.use(compression({
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between compression ratio and speed
  }));
}

/**
 * Global Error Handler
 */
export function configureErrorHandler(app: Application) {
  // 404 Handler for API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}:`, err);
    
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(500).json({ 
        error: err.message,
        stack: err.stack 
      });
    }
  });
}

/**
 * Apply all security middleware
 */
export function applySecurityMiddleware(app: Application) {
  configureHelmet(app);
  configureCors(app);
  configureRateLimit(app);
  configureCompression(app);
}

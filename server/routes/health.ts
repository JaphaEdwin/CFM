import { Router } from 'express';
import { db } from '../db/schema';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', (_req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database connectivity
    const dbCheck = db.prepare('SELECT 1 as result').get() as { result: number };
    
    if (dbCheck?.result === 1) {
      res.json({
        ...healthCheck,
        database: 'connected',
      });
    } else {
      throw new Error('Database check failed');
    }
  } catch (error) {
    res.status(503).json({
      ...healthCheck,
      status: 'error',
      database: 'disconnected',
      error: process.env.NODE_ENV === 'production' 
        ? 'Database connection failed' 
        : (error as Error).message,
    });
  }
});

/**
 * Detailed health check (for internal monitoring)
 * GET /api/health/detailed
 */
router.get('/detailed', (_req, res) => {
  try {
    // Get database stats
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    const customerCount = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }).count;
    const salesCount = (db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number }).count;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
      database: {
        status: 'connected',
        stats: {
          users: userCount,
          customers: customerCount,
          sales: salesCount,
        },
      },
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: (error as Error).message,
    });
  }
});

export default router;

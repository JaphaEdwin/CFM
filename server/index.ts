import 'dotenv/config';
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { initializeDatabase } from "./db/schema";
import { applySecurityMiddleware, configureErrorHandler } from "./middleware/security";
import { logger } from "./middleware/logger";

// Import routes
import authRoutes from "./routes/auth";
import customerRoutes from "./routes/customers";
import poultryRoutes from "./routes/poultry";
import salesRoutes from "./routes/sales";
import expenseRoutes from "./routes/expenses";
import dashboardRoutes from "./routes/dashboard";
import settingsRoutes from "./routes/settings";
import mediaRoutes from "./routes/media";
import healthRoutes from "./routes/health";
import orderRoutes from "./routes/orders";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize database
  initializeDatabase();
  logger.info('Database initialized successfully');

  const app = express();
  const server = createServer(app);

  // Apply security middleware (helmet, cors, rate-limit, compression)
  applySecurityMiddleware(app);
  logger.info('Security middleware applied');

  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.httpLogger(req, res, duration);
    });
    next();
  });

  // Health check route (before auth)
  app.use("/api/health", healthRoutes);

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/poultry", poultryRoutes);
  app.use("/api/sales", salesRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/media", mediaRoutes);
  app.use("/api/orders", orderRoutes);

  // Serve uploaded files
  const uploadsPath = process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public", "uploads")
    : path.resolve(__dirname, "..", "client", "public", "uploads");
  app.use("/uploads", express.static(uploadsPath));

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Error handler (must be last)
  configureErrorHandler(app);

  const port = process.env.PORT || 3001;

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`, {
      environment: process.env.NODE_ENV || 'development',
      port: port,
    });
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});

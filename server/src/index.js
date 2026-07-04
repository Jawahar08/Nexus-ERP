import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import inventoryRouter from './routes/inventory.js';
import crmRouter from './routes/crm.js';
import hrRouter from './routes/hr.js';
import financeRouter from './routes/finance.js';
import invoicesRouter from './routes/invoices.js';
import workflowsRouter from './routes/workflows.js';
import adminRouter from './routes/admin.js';
import notificationsRouter from './routes/notifications.js';
import auditRouter from './routes/audit.js';
import aiRouter from './routes/ai.js';
import { authMiddleware } from './middleware/auth.js';
import { logger } from './lib/logger.js';
import { startBackgroundScheduler } from './services/scheduler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS (enable credentials for session cookies)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Parse request bodies
app.use(express.json());

// Global request logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Mount Routes (auth is applied universally, internal paths handle login exemptions)
app.use('/api/auth', authMiddleware, authRouter);
app.use('/api/inventory', authMiddleware, inventoryRouter);
app.use('/api/crm', authMiddleware, crmRouter);
app.use('/api/hr', authMiddleware, hrRouter);
app.use('/api/finance', authMiddleware, financeRouter);
app.use('/api/invoices', authMiddleware, invoicesRouter);
app.use('/api/workflows', authMiddleware, workflowsRouter);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/notifications', authMiddleware, notificationsRouter);
app.use('/api/audit', authMiddleware, auditRouter);
app.use('/api/ai', authMiddleware, aiRouter);

// Standard error fallback handler
app.use((err, req, res, next) => {
  logger.error('Unhandled runtime server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Boot listener
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 STANDALONE NEXUS ERP SERVER RUNNING ON PORT ${PORT}`);
  console.log(`==================================================`);
  startBackgroundScheduler();
});

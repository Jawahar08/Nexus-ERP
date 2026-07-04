import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import inventoryRouter from './routes/inventory';
import crmRouter from './routes/crm';
import hrRouter from './routes/hr';
import financeRouter from './routes/finance';
import invoicesRouter from './routes/invoices';
import workflowsRouter from './routes/workflows';
import adminRouter from './routes/admin';
import notificationsRouter from './routes/notifications';
import auditRouter from './routes/audit';
import aiRouter from './routes/ai';
import { authMiddleware } from './middleware/auth';

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

// Global Logging request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled runtime server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Boot listener
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 STANDALONE NEXUS ERP SERVER RUNNING ON PORT ${PORT}`);
  console.log(`==================================================`);
});

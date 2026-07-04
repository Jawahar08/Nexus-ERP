import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'NEXUS_SUPER_SECRET_KEY_2026_ENTERPRISE';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  tenantId?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Allow login / signup without tokens
  if (req.path.startsWith('/api/auth/login')) {
    return next();
  }

  let token = '';

  // Extract from Auth header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } 
  // Extract from cookies
  else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc: any, c) => {
      const parts = c.trim().split('=');
      const name = parts[0];
      const val = parts.slice(1).join('=');
      acc[name] = val;
      return acc;
    }, {});
    token = cookies['nexus_session'] || '';
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication session token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.userRole = decoded.role;

    // Inject headers to keep compatibility with Next.js header fetches
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-tenant-id'] = decoded.tenantId;
    req.headers['x-user-role'] = decoded.role;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session token invalid or expired' });
  }
}

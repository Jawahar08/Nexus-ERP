import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'NEXUS_SUPER_SECRET_KEY_2026_ENTERPRISE';

export function authMiddleware(req, res, next) {
  // Allow login / tenants / verify-tenant / verify-passkey without tokens
  const publicPaths = ['/login', '/tenants', '/verify-tenant', '/verify-passkey'];
  if (publicPaths.includes(req.path) || (req.originalUrl && (
    req.originalUrl.startsWith('/api/auth/login') ||
    req.originalUrl.startsWith('/api/auth/tenants') ||
    req.originalUrl.startsWith('/api/auth/verify-tenant') ||
    req.originalUrl.startsWith('/api/auth/verify-passkey')
  ))) {
    return next();
  }

  let token = '';

  // Extract from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // Extract from cookies
  else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
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
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.sub;
    req.userId = userId;
    req.tenantId = decoded.tenantId;
    req.userRole = decoded.role;

    // Inject headers to keep compatibility with Next.js header fetches
    req.headers['x-user-id'] = userId;
    req.headers['x-tenant-id'] = decoded.tenantId;
    req.headers['x-user-role'] = decoded.role;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session token invalid or expired' });
  }
}

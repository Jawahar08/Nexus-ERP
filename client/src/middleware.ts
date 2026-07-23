import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Exclude public assets, auth routes, and public shop storefront
  if (
    path.startsWith('/login') ||
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/shop/') ||
    path.startsWith('/shop') ||
    path === '/' ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Extract Token from Cookie or Authorization header
  let token = req.cookies.get('nexus_token')?.value;
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // 2. Gate: If no token present
  if (!token) {
    if (path.startsWith('/api')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required. Token missing.' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    // Redirect web dashboard requests to portal login
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Verify JWT
  const user = await verifyToken(token);
  if (!user) {
    if (path.startsWith('/api')) {
      return new NextResponse(
        JSON.stringify({ error: 'Session invalid or expired. Re-authenticate.' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    // Clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('nexus_token');
    return response;
  }

  // 4. Inject parsed headers for downstream Server Components & API handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-name', user.name);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-tenant-id', user.tenantId);
  requestHeaders.set('x-tenant-name', user.tenantName);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*'
  ],
};

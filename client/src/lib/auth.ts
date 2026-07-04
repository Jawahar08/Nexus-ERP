import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'NEXUS_SUPER_SECRET_KEY_2026_ENTERPRISE'
);

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

export async function signToken(payload: UserPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserPayload;
  } catch (error) {
    return null;
  }
}

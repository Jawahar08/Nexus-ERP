import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'NEXUS_SUPER_SECRET_KEY_2026_ENTERPRISE';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('nexus_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('nexus_session');
  return res.json({ success: true });
});

// POST /api/auth/switch-role
router.post('/switch-role', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { role } = req.body;

    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    const token = jwt.sign(
      { userId: updatedUser.id, tenantId: updatedUser.tenantId, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('nexus_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        tenantId: updatedUser.tenantId
      }
    });
  } catch (error) {
    console.error('Role switch error:', error);
    return res.status(500).json({ error: 'Failed to switch profile roles' });
  }
});

export default router;

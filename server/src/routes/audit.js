import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();

// GET /api/audit
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const list = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    return res.json(list);
  } catch (error) {
    console.error('Audit GET error:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit log feeds' });
  }
});

export default router;

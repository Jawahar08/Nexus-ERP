import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const list = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 15
    });

    return res.json(list);
  } catch (error) {
    console.error('Notifications GET error:', error);
    return res.status(500).json({ error: 'Failed to retrieve warnings alerts' });
  }
});

// DELETE /api/notifications (Dismiss alert)
router.delete('/', async (req, res) => {
  try {
    const { id } = req.query;

    if (id) {
      await prisma.notification.delete({ where: { id: String(id) } });
      return res.json({ success: true });
    }

    // Dismiss all if no id provided
    const userId = req.userId;
    await prisma.notification.deleteMany({ where: { userId } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return res.status(500).json({ error: 'Failed to dismiss alert warnings' });
  }
});

export default router;

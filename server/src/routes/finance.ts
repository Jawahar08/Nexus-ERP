import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// GET /api/finance
router.get('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;

    const transactions = await prisma.transaction.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' }
    });

    return res.json(transactions);
  } catch (error) {
    console.error('Finance GET error:', error);
    return res.status(500).json({ error: 'Failed to retrieve transactions ledger' });
  }
});

// POST /api/finance (Post transaction manual entry)
router.post('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { type, category, amount, description, reference } = req.body;

    if (!type || !category || !amount || !description) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const tx = await prisma.transaction.create({
      data: {
        type,
        category,
        amount: Number(amount) || 0,
        description,
        reference: reference || '',
        tenantId
      }
    });

    await prisma.auditLog.create({
      data: {
        message: `Ledger entry posted: ${type.toUpperCase()} of $${Number(amount).toLocaleString()} for ${description}.`,
        module: 'Finance',
        tenantId,
        userId
      }
    });

    return res.json(tx);
  } catch (error) {
    console.error('Finance POST error:', error);
    return res.status(500).json({ error: 'Failed to record ledger posting' });
  }
});

export default router;

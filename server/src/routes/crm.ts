import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// GET /api/crm
router.get('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });

    const deals = await prisma.deal.findMany({
      where: { tenantId },
      orderBy: { value: 'desc' }
    });

    return res.json({ customers, deals });
  } catch (error) {
    console.error('CRM GET error:', error);
    return res.status(500).json({ error: 'Failed to fetch CRM records' });
  }
});

// POST /api/crm (Add customer or deal)
router.post('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { action } = req.body; // 'customer' | 'deal'

    if (action === 'customer') {
      const { name, email, phone, company } = req.body;
      if (!name || !company) {
        return res.status(400).json({ error: 'Name and Company are required' });
      }

      const cust = await prisma.customer.create({
        data: { name, email, phone, company, tenantId }
      });

      await prisma.auditLog.create({
        data: {
          message: `Registered client contact: ${name} (${company})`,
          module: 'CRM',
          tenantId,
          userId
        }
      });

      return res.json(cust);
    } 
    
    if (action === 'deal') {
      const { company, contact, value, stage, notes } = req.body;
      if (!company || !contact) {
        return res.status(400).json({ error: 'Company and Contact names are required' });
      }

      const dl = await prisma.deal.create({
        data: {
          company,
          contact,
          value: Number(value) || 0,
          stage: stage || 'lead',
          notes: notes || '',
          tenantId
        }
      });

      await prisma.auditLog.create({
        data: {
          message: `Opened contract opportunity: ${company} (Est: $${Number(value).toLocaleString()})`,
          module: 'CRM',
          tenantId,
          userId
        }
      });

      return res.json(dl);
    }

    return res.status(400).json({ error: 'Invalid action parameter' });
  } catch (error) {
    console.error('CRM POST error:', error);
    return res.status(500).json({ error: 'Failed to create CRM record' });
  }
});

// PUT /api/crm (Update deal stage)
router.put('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { id, stage } = req.body;

    if (!id || !stage) {
      return res.status(400).json({ error: 'Deal ID and Stage parameter are required' });
    }

    const deal = await prisma.deal.findFirst({
      where: { id, tenantId }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found in organization context' });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: { stage }
    });

    await prisma.auditLog.create({
      data: {
        message: `Deal for ${deal.company} updated status to stage "${stage}".`,
        module: 'CRM',
        tenantId,
        userId
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('CRM PUT error:', error);
    return res.status(500).json({ error: 'Failed to adjust deal stages' });
  }
});

export default router;

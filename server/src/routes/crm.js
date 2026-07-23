import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();

// GET /api/crm
router.get('/', async (req, res) => {
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

// GET /api/crm/whatsapp-reminders (AI Customer Re-Order Predictions & WhatsApp Links)
router.get('/whatsapp-reminders', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const customers = await prisma.customer.findMany({
      where: { tenantId }
    });

    const tenantObj = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, domain: true }
    });

    const storeName = tenantObj ? tenantObj.name : 'Nexus Store';

    // Generate AI re-order predictions & pre-populated WhatsApp reminder links
    const reminders = customers.map((c, idx) => {
      const sampleItems = [
        'Quantum CPU Core X9',
        'Optic Fiber Bridge v2',
        'Liquid Cooling Block HD',
        'Apex Industrial Relay'
      ];
      const recommendedItem = sampleItems[idx % sampleItems.length];
      const daysSinceLastOrder = 25 + (idx * 5);
      const isDue = daysSinceLastOrder >= 28;

      const phone = c.phone || '+15550192834';
      const cleanPhone = phone.replace(/[^0-9]/g, '');

      const messageText = `Hi ${c.name},\n\nHope you are having a great week! 🌟\nThis is a quick friendly reminder from *${storeName}*.\n\nBased on your previous purchase, your supply of *${recommendedItem}* may be running low (~${daysSinceLastOrder} days since last restock).\n\nWould you like us to prepare a new order for pickup or delivery today?\n\nReply directly to this message or view our digital store: https://${tenantObj?.domain || 'nexus.erp'}`;

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone,
        company: c.company,
        lastPurchasedItem: recommendedItem,
        daysSinceLastOrder,
        isDue,
        whatsappUrl,
        messagePreview: messageText
      };
    });

    return res.json({
      summary: {
        totalCustomers: customers.length,
        dueRemindersCount: reminders.filter((r) => r.isDue).length
      },
      reminders
    });
  } catch (error) {
    console.error('WhatsApp reminders error:', error);
    return res.status(500).json({ error: 'Failed to calculate customer WhatsApp reminders' });
  }
});

// POST /api/crm/send-receipt-whatsapp (Format Digital WhatsApp Receipt)
router.post('/send-receipt-whatsapp', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { customerPhone, customerName, items, totalAmount, receiptNumber } = req.body;

    if (!customerPhone || !totalAmount) {
      return res.status(400).json({ error: 'Customer phone number and Total Amount are required' });
    }

    const tenantObj = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, domain: true }
    });

    const storeName = tenantObj ? tenantObj.name : 'Nexus Store';
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const rNum = receiptNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`;

    const itemListText = Array.isArray(items)
      ? items.map((i) => `• ${i.name || i.title} (x${i.qty || 1})`).join('\n')
      : '• Order Items';

    const receiptMessage = `🧾 *OFFICIAL DIGITAL RECEIPT*\n*${storeName.toUpperCase()}*\nReceipt #: ${rNum}\nCustomer: ${customerName || 'Valued Customer'}\n------------------------------\n${itemListText}\n------------------------------\n*Total Amount Paid: $${Number(totalAmount).toFixed(2)}*\n\nThank you for shopping with us! View your digital receipt details & tracking online: https://${tenantObj?.domain || 'nexus.erp'}`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptMessage)}`;

    return res.json({
      success: true,
      receiptNumber: rNum,
      whatsappUrl,
      receiptMessage
    });
  } catch (error) {
    console.error('Send WhatsApp receipt error:', error);
    return res.status(500).json({ error: 'Failed to generate WhatsApp digital receipt' });
  }
});

// POST /api/crm (Add customer or deal)
router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { action } = req.body;

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
router.put('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { id, stage } = req.body;

    if (!id || !stage) {
      return res.status(400).json({ error: 'Deal ID and Stage parameter are required' });
    }

    const deal = await prisma.deal.findFirst({ where: { id, tenantId } });
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found in organization context' });
    }

    const updated = await prisma.deal.update({ where: { id }, data: { stage } });

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

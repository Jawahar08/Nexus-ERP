import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();

// GET /api/shop/public/:domain (Public Digital Catalog API)
router.get('/public/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    const tenant = await prisma.tenant.findFirst({
      where: { domain: domain.trim() },
      select: { id: true, name: true, domain: true }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        category: true
      }
    });

    return res.json({
      tenant,
      products
    });
  } catch (error) {
    console.error('Public shop GET error:', error);
    return res.status(500).json({ error: 'Failed to retrieve public store catalog' });
  }
});

// POST /api/shop/order (Public Order Placement via WhatsApp)
router.post('/order', async (req, res) => {
  try {
    const { domain, customerName, customerPhone, items, deliveryType, address } = req.body;

    if (!domain || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Store Domain, Customer Phone, and Cart Items are required' });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { domain: domain.trim() },
      select: { id: true, name: true, domain: true }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const orderId = `NEX-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = items.reduce((acc, i) => acc + (i.price * i.qty), 0);

    const itemListText = items.map(i => `• ${i.name} (x${i.qty}) - $${(i.price * i.qty).toFixed(2)}`).join('\n');
    const storePhone = '+15550192834'; // Store owner phone

    const messageText = `🛒 *NEW DIGITAL STORE ORDER (${orderId})*\nStore: ${tenant.name}\nCustomer: ${customerName || 'Valued Buyer'}\nPhone: ${customerPhone}\nType: ${deliveryType === 'delivery' ? '📦 Local Delivery' : '🏪 Store Pickup'}\n${deliveryType === 'delivery' ? `Address: ${address}\n` : ''}\n*ORDER ITEMS:*\n${itemListText}\n\n*TOTAL PAYABLE: $${totalAmount.toFixed(2)}*\n\nPlease process order confirmation!`;

    const cleanStorePhone = storePhone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(messageText)}`;

    return res.json({
      success: true,
      orderId,
      totalAmount,
      whatsappUrl
    });
  } catch (error) {
    console.error('Public shop order error:', error);
    return res.status(500).json({ error: 'Failed to process public e-commerce order' });
  }
});

export default router;

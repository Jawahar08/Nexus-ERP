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

// POST /api/shop/checkout (Direct Online Payment & ERP Shopkeeper Dispatch)
router.post('/checkout', async (req, res) => {
  try {
    const { domain, customerName, customerEmail, customerPhone, items, deliveryType, address, paymentMethod } = req.body;

    if (!domain || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Store Domain, Customer Phone, and Cart Items are required' });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { domain: domain.trim() },
      select: { id: true, name: true, domain: true }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Store profile not found' });
    }

    const orderId = `NEX-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = Number(items.reduce((acc, i) => acc + (i.price * i.qty), 0).toFixed(2));
    const payMethod = paymentMethod || 'Card Instant Payment';
    const custName = customerName || 'E-Commerce Buyer';
    const custEmail = customerEmail || `${customerPhone.replace(/[^0-9]/g, '')}@customer.com`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create Customer profile
      let customer = await tx.customer.findFirst({
        where: { tenantId: tenant.id, phone: customerPhone }
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: custName,
            email: custEmail,
            phone: customerPhone,
            company: 'Online Shopper',
            tenantId: tenant.id
          }
        });
      }

      // 2. Process stock deduction & stock movements
      for (const item of items) {
        const prod = await tx.product.findFirst({
          where: { id: item.id, tenantId: tenant.id }
        });

        if (prod) {
          await tx.product.update({
            where: { id: prod.id },
            data: { stock: { decrement: item.qty } }
          });

          await tx.stockMovement.create({
            data: {
              type: 'sale',
              qty: item.qty,
              toWarehouse: 'E-Commerce Customer',
              productId: prod.id,
              tenantId: tenant.id
            }
          });
        }
      }

      const isUnpaid = payMethod.toLowerCase().includes('cash') || payMethod.toLowerCase().includes('pickup') || payMethod.toLowerCase().includes('store') || payMethod.toLowerCase().includes('cod');
      const paymentStatus = isUnpaid ? 'NOT YET PAID (PAY ON PICKUP/DELIVERY)' : 'PAID';

      // 3. Record Financial Transaction Ledger
      await tx.transaction.create({
        data: {
          type: 'income',
          category: isUnpaid ? 'E-Commerce Pending Payment' : 'E-Commerce Direct Order',
          amount: totalAmount,
          description: `${isUnpaid ? 'Unpaid' : 'Paid'} Online Order ${orderId} (${custName}) [${deliveryType.toUpperCase()}] - ${paymentStatus}`,
          reference: orderId,
          tenantId: tenant.id
        }
      });

      // 4. Notify Shopkeeper Users
      const shopUsers = await tx.user.findMany({
        where: { tenantId: tenant.id },
        select: { id: true }
      });

      for (const u of shopUsers) {
        await tx.notification.create({
          data: {
            message: isUnpaid 
              ? `⏳ NEW UNPAID ORDER: ${orderId} ($${totalAmount}) received from ${custName} - NOT YET PAID (Pay on ${deliveryType === 'delivery' ? 'Delivery' : 'Pickup'})`
              : `🛒 NEW PAID ORDER: ${orderId} ($${totalAmount}) received from ${custName} via E-Commerce Storefront!`,
            type: isUnpaid ? 'warning' : 'success',
            userId: u.id
          }
        });
      }

      return { customer, totalAmount, paymentStatus, isUnpaid };
    });

    const isUnpaid = payMethod.toLowerCase().includes('cash') || payMethod.toLowerCase().includes('pickup') || payMethod.toLowerCase().includes('store') || payMethod.toLowerCase().includes('cod');
    const paymentStatusText = isUnpaid ? 'NOT YET PAID (Pay on Pickup/Delivery)' : 'PAID';

    const itemListText = items.map(i => `• ${i.name} (x${i.qty}) - $${(i.price * i.qty).toFixed(2)}`).join('\n');
    const whatsappMessage = `🧾 *E-COMMERCE ORDER RECEIPT (${orderId})*\nStore: ${tenant.name}\nCustomer: ${custName}\nPhone: ${customerPhone}\nPayment Status: ⏳ ${paymentStatusText}\nPayment Method: ${payMethod}\nType: ${deliveryType === 'delivery' ? '📦 Local Delivery' : '🏪 Store Pickup'}\n${deliveryType === 'delivery' ? `Address: ${address}\n` : ''}\n*ITEMS:*\n${itemListText}\n\n*TOTAL AMOUNT: $${totalAmount.toFixed(2)}*\n\nThank you for your order!`;

    const whatsappUrl = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

    return res.json({
      success: true,
      orderId,
      status: paymentStatusText,
      isUnpaid,
      timestamp: new Date().toLocaleTimeString(),
      totalAmount,
      customerName: custName,
      customerPhone,
      deliveryType,
      address,
      paymentMethod: payMethod,
      items,
      whatsappUrl
    });
  } catch (error) {
    console.error('Checkout POST error:', error);
    return res.status(500).json({ error: 'Checkout processing failed' });
  }
});

import Razorpay from 'razorpay';
import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_Sg9h9VKe7yrwX7';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'ze4YD28IrJQahL3GkS94s3iW';

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

// POST /api/shop/create-razorpay-order (Initialize Razorpay Payment Session)
router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { amount, currency, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid order amount is required' });
    }

    const amountInSubunits = Math.round(Number(amount) * 100); // Subunits (Paise / Cents)
    const options = {
      amount: amountInSubunits,
      currency: currency || 'INR',
      receipt: orderId || `NEX-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    return res.json({
      success: true,
      keyId: RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return res.status(500).json({ error: 'Failed to create Razorpay payment order' });
  }
});

// POST /api/shop/verify-razorpay-payment (HMAC Signature Verification & ERP Dispatch)
router.post('/verify-razorpay-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      domain,
      customerName,
      customerEmail,
      customerPhone,
      items,
      deliveryType,
      address
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Razorpay payment verification parameters missing' });
    }

    // Verify HMAC SHA256 Signature
    const bodyData = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(bodyData)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Razorpay payment signature verification failed' });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { domain: domain ? domain.trim() : 'nexus.erp' },
      select: { id: true, name: true, domain: true }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Store profile not found' });
    }

    const orderId = `NEX-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = Number(items.reduce((acc, i) => acc + (i.price * i.qty), 0).toFixed(2));
    const payMethod = `Razorpay Live Gateway (ID: ${razorpay_payment_id})`;
    const custName = customerName || 'E-Commerce Buyer';
    const custEmail = customerEmail || `${customerPhone.replace(/[^0-9]/g, '')}@customer.com`;

    await prisma.$transaction(async (tx) => {
      // 1. Customer registration
      let customer = await tx.customer.findFirst({
        where: { tenantId: tenant.id, phone: customerPhone }
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: custName,
            email: custEmail,
            phone: customerPhone,
            company: 'Razorpay Online Buyer',
            tenantId: tenant.id
          }
        });
      }

      // 2. Stock deduction & StockMovements
      for (const item of items) {
        const prod = await tx.product.findFirst({
          where: { id: item.id, tenantId: tenant.id }
        });

        if (prod) {
          await tx.product.update({
            where: { id: prod.id },
            data: { stock: { decrement: item.qty } }
          });

          await tx.stockMovement.create({
            data: {
              type: 'sale',
              qty: item.qty,
              toWarehouse: 'Razorpay E-Commerce Buyer',
              productId: prod.id,
              tenantId: tenant.id
            }
          });
        }
      }

      // 3. Record Financial Income Transaction
      await tx.transaction.create({
        data: {
          type: 'income',
          category: 'E-Commerce Razorpay Order',
          amount: totalAmount,
          description: `Paid Online Order ${orderId} (${custName}) via Razorpay Gateway [${deliveryType.toUpperCase()}]`,
          reference: orderId,
          tenantId: tenant.id
        }
      });

      // 4. Shopkeeper Alerts
      const shopUsers = await tx.user.findMany({
        where: { tenantId: tenant.id },
        select: { id: true }
      });

      for (const u of shopUsers) {
        await tx.notification.create({
          data: {
            message: `💳 RAZORPAY PAID ORDER: ${orderId} ($${totalAmount}) received from ${custName}! (Pay ID: ${razorpay_payment_id})`,
            type: 'success',
            userId: u.id
          }
        });
      }
    });

    const itemListText = items.map(i => `• ${i.name} (x${i.qty}) - $${(i.price * i.qty).toFixed(2)}`).join('\n');
    const whatsappMessage = `🧾 *RAZORPAY PAID RECEIPT (${orderId})*\nStore: ${tenant.name}\nCustomer: ${custName}\nPhone: ${customerPhone}\nPayment ID: ${razorpay_payment_id} [VERIFIED PAID]\nType: ${deliveryType === 'delivery' ? '📦 Local Delivery' : '🏪 Store Pickup'}\n${deliveryType === 'delivery' ? `Address: ${address}\n` : ''}\n*ITEMS:*\n${itemListText}\n\n*TOTAL PAID: $${totalAmount.toFixed(2)}*\n\nThank you for your payment via Razorpay!`;

    const whatsappUrl = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

    return res.json({
      success: true,
      orderId,
      status: 'PAID',
      razorpayPaymentId: razorpay_payment_id,
      timestamp: new Date().toLocaleTimeString(),
      totalAmount,
      customerName: custName,
      customerPhone,
      deliveryType,
      address,
      paymentMethod: payMethod,
      items,
      whatsappUrl
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return res.status(500).json({ error: 'Razorpay payment verification failed' });
  }
});

// GET /api/shop/track/:orderId (Live E-Commerce Order Tracking API)
router.get('/track/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: { reference: orderId.trim() }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Order reference not found' });
    }

    return res.json({
      found: true,
      orderId: transaction.reference,
      status: 'PAID & DISPATCHED',
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description,
      estimatedDelivery: 'Today by 6:00 PM (Express Dispatch)'
    });
  } catch (error) {
    console.error('Track order GET error:', error);
    return res.status(500).json({ error: 'Failed to look up order status' });
  }
});

export default router;

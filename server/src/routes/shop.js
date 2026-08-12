import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();

// Store Orders Central Memory Ledger
let storeOrders = [
  {
    orderId: 'NEX-ORD-882190',
    tenantId: 'acme-corp',
    domain: 'nexus.erp',
    customerName: 'Ananya Sharma',
    customerPhone: '+919876543210',
    customerEmail: 'ananya@example.com',
    items: [
      { id: '1', name: 'Britannia - Choco Chill Cake 55g', sku: 'B04-NEXUS', price: 30.00, qty: 2 },
      { id: '2', name: 'Johri - Johri Rice 1 kg', sku: 'R01-NEXUS', price: 40.00, qty: 1 }
    ],
    totalAmount: 100.00,
    deliveryType: 'delivery',
    address: '42 MG Road, Sector 4, Tech City',
    paymentMethod: 'Razorpay Gateway',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'Pending',
    carrierName: 'Unassigned',
    trackingNumber: '',
    trackingUrl: '',
    notes: 'Fragile handling requested',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    orderId: 'NEX-ORD-771204',
    tenantId: 'acme-corp',
    domain: 'nexus.erp',
    customerName: 'Rahul Verma',
    customerPhone: '+919812345678',
    customerEmail: 'rahul@example.com',
    items: [
      { id: '3', name: 'Basmati - Basmati Rice 1 kg', sku: 'R04-NEXUS', price: 70.00, qty: 2 }
    ],
    totalAmount: 140.00,
    deliveryType: 'pickup',
    address: 'Store Counter Pickup',
    paymentMethod: 'Pay at Store',
    paymentStatus: 'NOT YET PAID (Pay on Pickup)',
    fulfillmentStatus: 'Packing',
    carrierName: 'In-House Counter',
    trackingNumber: 'PICKUP-771204',
    trackingUrl: '',
    notes: 'Customer will pick up at 5 PM',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

// Central Store Promotions & Coupons Ledger
let promotionsStore = [
  {
    code: 'SAVE20',
    description: '20% OFF Everything Storewide',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 30,
    maxDiscount: 100,
    usageCount: 42,
    maxUsage: 500,
    expiryDate: '2026-12-31',
    isActive: true,
    bannerHeadline: '🔥 FLASH SALE: 20% OFF STOREWIDE (Use Code: SAVE20)'
  },
  {
    code: 'NEXUS10',
    description: '10% OFF Welcome Bonus',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: 50,
    usageCount: 118,
    maxUsage: 1000,
    expiryDate: '2026-12-31',
    isActive: true,
    bannerHeadline: '🎁 WELCOME DISCOUNT: 10% OFF YOUR ORDER (Use Code: NEXUS10)'
  },
  {
    code: 'FLAT50',
    description: '$50 Flat Instant Savings on Orders Over $150',
    discountType: 'flat',
    discountValue: 50,
    minOrderValue: 150,
    maxDiscount: 50,
    usageCount: 19,
    maxUsage: 200,
    expiryDate: '2026-12-31',
    isActive: true,
    bannerHeadline: '⚡ BIG SAVINGS: Flat $50 OFF on Orders Above $150 (Use Code: FLAT50)'
  }
];

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

    try {
      await prisma.$transaction(async (tx) => {
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
      });
    } catch (dbErr) {
      console.warn('[Checkout DB Fallback] Database unavailable, recording order in central memory ledger:', dbErr.message);
    }

    const isUnpaid = payMethod.toLowerCase().includes('cash') || payMethod.toLowerCase().includes('pickup') || payMethod.toLowerCase().includes('store') || payMethod.toLowerCase().includes('cod');
    const paymentStatusText = isUnpaid ? 'NOT YET PAID (Pay on Pickup/Delivery)' : 'PAID';

    storeOrders.unshift({
      orderId,
      tenantId: tenant.id,
      domain: tenant.domain,
      customerName: custName,
      customerPhone,
      customerEmail: custEmail,
      items,
      totalAmount,
      deliveryType,
      address: address || (deliveryType === 'delivery' ? 'Local Customer Address' : 'Store Counter Pickup'),
      paymentMethod: payMethod,
      paymentStatus: paymentStatusText,
      fulfillmentStatus: 'Pending',
      carrierName: 'Unassigned',
      trackingNumber: '',
      trackingUrl: '',
      notes: '',
      createdAt: new Date().toISOString()
    });

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const whatsappMsg = `Hello ${custName}, your order ${orderId} for ${items.length} items (Total: $${totalAmount}) at ${tenant.name} has been placed successfully!`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

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

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TOudtiPsWOdXEu';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'wC2Hle3V5aO6HH7a7ir2osEf';

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

// GET /api/shop/orders (Get Tenant Storefront & POS Orders)
router.get('/orders', async (req, res) => {
  try {
    return res.json({ orders: storeOrders });
  } catch (error) {
    console.error('Orders GET error:', error);
    return res.status(500).json({ error: 'Failed to retrieve order list' });
  }
});

// POST /api/shop/pos-order (Record POS Counter Bill into Central Store Orders Ledger)
router.post('/pos-order', async (req, res) => {
  try {
    const { invoiceNo, items, subtotal, tax, total, paymentMethod, cashier } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items required' });
    }

    const orderRecord = {
      orderId: invoiceNo || `NX-POS-${Date.now().toString().slice(-6)}`,
      tenantId: 'acme-corp',
      domain: 'nexus.erp',
      customerName: 'Walk-In Store Customer',
      customerPhone: '+919876543210',
      customerEmail: 'pos@nexus.erp',
      items: items.map((i) => ({ name: i.name, sku: i.sku || i.id, price: i.price, qty: i.qty })),
      totalAmount: total || subtotal + tax,
      deliveryType: 'pickup',
      address: 'Store Counter POS',
      paymentMethod: paymentMethod || 'CASH',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'Delivered',
      carrierName: 'In-House POS',
      trackingNumber: invoiceNo,
      trackingUrl: '',
      notes: `Cashier: ${cashier || 'Admin Cashier'}`,
      createdAt: new Date().toISOString()
    };

    storeOrders.unshift(orderRecord);
    return res.json({ success: true, order: orderRecord });
  } catch (error) {
    console.error('POS order POST error:', error);
    return res.status(500).json({ error: 'Failed to record POS order' });
  }
});

// PUT /api/shop/orders/:orderId/fulfillment (Update Order Dispatch & Carrier Info)
router.put('/orders/:orderId/fulfillment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { fulfillmentStatus, carrierName, trackingNumber, notes } = req.body;

    const cleanId = orderId.trim().toUpperCase();
    const orderIndex = storeOrders.findIndex(o => o.orderId.trim().toUpperCase() === cleanId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order reference not found' });
    }

    const currentOrder = storeOrders[orderIndex];

    const carrier = carrierName || currentOrder.carrierName || 'Shiprocket';
    const trkNo = trackingNumber || currentOrder.trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    let trackingUrl = currentOrder.trackingUrl;
    if (carrier.toLowerCase().includes('blue')) {
      trackingUrl = `https://www.bluedart.com/tracking/${trkNo}`;
    } else if (carrier.toLowerCase().includes('shiprocket')) {
      trackingUrl = `https://shiprocket.co/tracking/${trkNo}`;
    } else if (carrier.toLowerCase().includes('fedex')) {
      trackingUrl = `https://www.fedex.com/fedextrack/?tracknumbers=${trkNo}`;
    } else if (carrier.toLowerCase().includes('porter')) {
      trackingUrl = `https://porter.in/track/${trkNo}`;
    } else {
      trackingUrl = `https://nexus-erp.com/track/${trkNo}`;
    }

    storeOrders[orderIndex] = {
      ...currentOrder,
      fulfillmentStatus: fulfillmentStatus || currentOrder.fulfillmentStatus,
      carrierName: carrier,
      trackingNumber: trkNo,
      trackingUrl,
      notes: notes !== undefined ? notes : currentOrder.notes,
      updatedAt: new Date().toISOString()
    };

    const updatedOrder = storeOrders[orderIndex];

    try {
      await prisma.auditLog.create({
        data: {
          message: `Order ${cleanId} fulfillment updated to "${updatedOrder.fulfillmentStatus}" (Carrier: ${carrier}, Tracking #: ${trkNo}).`,
          module: 'Fulfillment',
          tenantId: updatedOrder.tenantId || 'acme-corp'
        }
      });
    } catch (e) {
      // Ignore if audit log creation fails
    }

    return res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Fulfillment PUT error:', error);
    return res.status(500).json({ error: 'Failed to update order fulfillment' });
  }
});

// GET /api/shop/track/:orderId (Live E-Commerce Order Tracking API)
router.get('/track/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const cleanId = orderId.trim().toUpperCase();

    const existingOrder = storeOrders.find(o => o.orderId.trim().toUpperCase() === cleanId);

    if (existingOrder) {
      const stageMap = {
        'Pending': 1,
        'Packing': 2,
        'Dispatched': 3,
        'Out for Delivery': 4,
        'Delivered': 5
      };

      return res.json({
        found: true,
        orderId: existingOrder.orderId,
        fulfillmentStatus: existingOrder.fulfillmentStatus,
        stageStep: stageMap[existingOrder.fulfillmentStatus] || 1,
        carrierName: existingOrder.carrierName,
        trackingNumber: existingOrder.trackingNumber,
        trackingUrl: existingOrder.trackingUrl,
        customerName: existingOrder.customerName,
        deliveryType: existingOrder.deliveryType,
        address: existingOrder.address,
        paymentStatus: existingOrder.paymentStatus,
        amount: existingOrder.totalAmount,
        items: existingOrder.items,
        date: existingOrder.createdAt,
        estimatedDelivery: existingOrder.fulfillmentStatus === 'Delivered' ? 'Delivered' : 'Today by 6:00 PM (Express Courier)'
      });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { reference: cleanId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Order reference not found' });
    }

    return res.json({
      found: true,
      orderId: transaction.reference,
      fulfillmentStatus: 'Dispatched',
      stageStep: 3,
      carrierName: 'Standard Courier',
      trackingNumber: `TRK-${cleanId.replace(/[^0-9]/g, '') || '998210'}`,
      trackingUrl: `https://nexus-erp.com/track/${cleanId}`,
      amount: transaction.amount,
      date: transaction.date,
      estimatedDelivery: 'Today by 6:00 PM (Express Dispatch)'
    });
  } catch (error) {
    console.error('Track order GET error:', error);
    return res.status(500).json({ error: 'Failed to look up order status' });
  }
});

// GET /api/shop/promotions (Get Storefront & POS Promo Codes List & Active Banner)
router.get('/promotions', async (req, res) => {
  try {
    const activeBanner = promotionsStore.find((p) => p.isActive && p.bannerHeadline);
    return res.json({
      promotions: promotionsStore,
      activeBanner: activeBanner ? activeBanner.bannerHeadline : null,
      activeCode: activeBanner ? activeBanner.code : null,
    });
  } catch (error) {
    console.error('Promotions GET error:', error);
    return res.status(500).json({ error: 'Failed to retrieve store promotions' });
  }
});

// POST /api/shop/promotions (Create New Store Promo Code)
router.post('/promotions', async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, maxUsage, expiryDate, bannerHeadline } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ error: 'Promo Code and Discount Value are required' });
    }

    const cleanCode = code.trim().toUpperCase();

    const existingIndex = promotionsStore.findIndex((p) => p.code === cleanCode);

    const newPromo = {
      code: cleanCode,
      description: description || `${discountValue}${discountType === 'percentage' ? '%' : '$'} OFF Promo Code`,
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: Number(maxDiscount) || 100,
      usageCount: 0,
      maxUsage: Number(maxUsage) || 500,
      expiryDate: expiryDate || '2026-12-31',
      isActive: true,
      bannerHeadline: bannerHeadline || `🔥 SPECIAL PROMO: ${cleanCode} for Discount!`
    };

    if (existingIndex !== -1) {
      promotionsStore[existingIndex] = newPromo;
    } else {
      promotionsStore.unshift(newPromo);
    }

    return res.json({ success: true, promotion: newPromo });
  } catch (error) {
    console.error('Promotions POST error:', error);
    return res.status(500).json({ error: 'Failed to create promotion code' });
  }
});

// PUT /api/shop/promotions/:code/toggle (Toggle Active Status of Promo Code)
router.put('/promotions/:code/toggle', async (req, res) => {
  try {
    const { code } = req.params;
    const cleanCode = code.trim().toUpperCase();

    const promoIndex = promotionsStore.findIndex((p) => p.code === cleanCode);

    if (promoIndex === -1) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    promotionsStore[promoIndex].isActive = !promotionsStore[promoIndex].isActive;

    return res.json({ success: true, promotion: promotionsStore[promoIndex] });
  } catch (error) {
    console.error('Promotions toggle error:', error);
    return res.status(500).json({ error: 'Failed to toggle promo code' });
  }
});

// POST /api/shop/promotions/validate (Validate Promo Code against Cart Subtotal)
router.post('/promotions/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Promo Code is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const cartSubtotal = Number(subtotal) || 0;

    const promo = promotionsStore.find((p) => p.code === cleanCode && p.isActive);

    if (!promo) {
      return res.status(404).json({ error: `Promo code "${cleanCode}" is invalid or expired.` });
    }

    if (cartSubtotal < promo.minOrderValue) {
      return res.status(400).json({
        error: `Promo code "${cleanCode}" requires a minimum order value of $${promo.minOrderValue.toFixed(2)}.`
      });
    }

    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      discountAmount = (cartSubtotal * promo.discountValue) / 100;
      if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
        discountAmount = promo.maxDiscount;
      }
    } else {
      discountAmount = promo.discountValue;
    }

    discountAmount = Math.min(cartSubtotal, Number(discountAmount.toFixed(2)));

    // Increment usage count
    promo.usageCount += 1;

    return res.json({
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      message: `Promo code "${cleanCode}" applied! Saved $${discountAmount.toFixed(2)}`
    });
  } catch (error) {
    console.error('Promotions validation error:', error);
    return res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

export default router;

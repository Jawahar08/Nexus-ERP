import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// POST /api/invoices (Transaction-safe POS Checkout billing)
router.post('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { customerId, items, grandTotal } = req.body; // items: Array<{productId, name, qty, price}>

    if (!items || items.length === 0 || !grandTotal) {
      return res.status(400).json({ error: 'Checkout cart is empty or missing details' });
    }

    const reference = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Process each item (deduct stock, record stock movement)
      for (const item of items) {
        const prod = await tx.product.findFirst({
          where: { id: item.productId, tenantId },
          include: { warehouse: true }
        });

        if (!prod) {
          throw new Error(`Product SKU matching "${item.name}" not found`);
        }

        if (prod.stock < item.qty) {
          throw new Error(`Insufficient stock for "${prod.name}" (Requested: ${item.qty}, Stored: ${prod.stock})`);
        }

        // Deduct stock
        const updatedProd = await tx.product.update({
          where: { id: prod.id },
          data: { stock: { decrement: item.qty } }
        });

        // Record stock movement (outtake)
        await tx.stockMovement.create({
          data: {
            type: 'sale',
            qty: item.qty,
            fromWarehouse: prod.warehouse.name,
            productId: prod.id,
            tenantId
          }
        });

        // Trigger low stock warning notice
        if (updatedProd.stock <= updatedProd.minStock) {
          await tx.notification.create({
            data: {
              message: `Critically low stock warning for SKU "${updatedProd.name}": Only ${updatedProd.stock} units remaining in ${prod.warehouse.name}!`,
              type: 'danger',
              userId
            }
          });
        }
      }

      // 2. Post income transaction record to general ledger
      const transaction = await tx.transaction.create({
        data: {
          type: 'income',
          category: 'Sales',
          amount: Number(grandTotal),
          description: `Checkout POS Billing: Reference ${reference}`,
          reference,
          tenantId
        }
      });

      // 3. Log audit trail
      await tx.auditLog.create({
        data: {
          message: `Issued sales invoice ${reference} totaling $${Number(grandTotal).toLocaleString()}.`,
          module: 'Sales',
          tenantId,
          userId
        }
      });

      return { reference, transaction };
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Invoice POS error:', error);
    return res.status(400).json({ error: error.message || 'Invoice transaction checkout failed' });
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const products = await prisma.product.findMany({
      where: { tenantId },
      include: { warehouse: true, supplier: true }
    });

    const warehouses = await prisma.warehouse.findMany({ where: { tenantId } });
    const suppliers = await prisma.supplier.findMany({ where: { tenantId } });

    const movements = await prisma.stockMovement.findMany({
      where: { tenantId },
      include: { product: true },
      orderBy: { date: 'desc' }
    });

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { supplier: true },
      orderBy: { date: 'desc' }
    });

    return res.json({ products, warehouses, suppliers, movements, purchaseOrders });
  } catch (error) {
    console.error('Inventory GET error:', error);
    return res.status(500).json({ error: 'Failed to retrieve inventory datasets' });
  }
});

// POST /api/inventory (Add product)
router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { name, sku, stock, minStock, price, cost, category, warehouseId, supplierId } = req.body;

    if (!name || !sku || !warehouseId || !supplierId) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const product = await prisma.product.create({
      data: {
        name, sku,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 10,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        category: category || 'Default',
        warehouseId, supplierId, tenantId
      }
    });

    await prisma.auditLog.create({
      data: {
        message: `Registered new SKU ${sku}: "${name}" in catalog.`,
        module: 'Inventory',
        tenantId,
        userId
      }
    });

    return res.json(product);
  } catch (error) {
    console.error('Inventory POST error:', error);
    return res.status(500).json({ error: 'Failed to create product SKU' });
  }
});

// POST /api/inventory/movement (Stock movement workflows)
router.post('/movement', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { type, productId, qty, fromWarehouseId, toWarehouseId, supplierId, totalCost } = req.body;
    const parsedQty = Math.max(1, Number(qty));

    if (!type || !productId) {
      return res.status(400).json({ error: 'Movement type and Product ID are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const sourceProduct = await tx.product.findFirst({
        where: { id: productId, tenantId },
        include: { warehouse: true }
      });

      if (!sourceProduct) throw new Error('Product not found in this organisation catalogue.');

      // ==========================================
      // WORKFLOW 1: WAREHOUSE TRANSFERS
      // ==========================================
      if (type === 'transfer') {
        if (!toWarehouseId) throw new Error('Destination warehouse is required for transfers.');
        if (sourceProduct.stock < parsedQty) throw new Error('Insufficient stock for transfer.');

        const destWarehouse = await tx.warehouse.findFirst({ where: { id: toWarehouseId, tenantId } });
        if (!destWarehouse) throw new Error('Destination warehouse not found.');

        const updatedSource = await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: parsedQty } }
        });

        const destSku = `${sourceProduct.sku.split('-')[0]}-${destWarehouse.name.substring(0, 3).toUpperCase()}`;
        let destProduct = await tx.product.findFirst({ where: { sku: destSku, warehouseId: toWarehouseId, tenantId } });

        if (destProduct) {
          await tx.product.update({ where: { id: destProduct.id }, data: { stock: { increment: parsedQty } } });
        } else {
          destProduct = await tx.product.create({
            data: {
              name: sourceProduct.name, sku: destSku, stock: parsedQty,
              minStock: sourceProduct.minStock, price: sourceProduct.price, cost: sourceProduct.cost,
              category: sourceProduct.category, warehouseId: toWarehouseId,
              supplierId: sourceProduct.supplierId, tenantId
            }
          });
        }

        await tx.stockMovement.create({
          data: {
            type: 'transfer', qty: parsedQty,
            fromWarehouse: sourceProduct.warehouse.name,
            toWarehouse: destWarehouse.name,
            productId: sourceProduct.id, tenantId
          }
        });

        await tx.auditLog.create({
          data: {
            message: `Transferred ${parsedQty} units of "${sourceProduct.name}" from ${sourceProduct.warehouse.name} to ${destWarehouse.name}.`,
            module: 'Inventory', tenantId, userId
          }
        });

        return { success: true, product: updatedSource };
      }

      // ==========================================
      // WORKFLOW 2: PURCHASE RESTOCK REPLENISHMENTS
      // ==========================================
      if (type === 'replenish') {
        if (!supplierId || !totalCost) throw new Error('Supplier details and costs are required for replenishment.');

        const cost = Number(totalCost);

        if (cost > 10000) {
          const po = await tx.purchaseOrder.create({
            data: { supplierId, total: cost, status: 'pending', productId, qty: parsedQty, tenantId }
          });

          await tx.notification.create({
            data: {
              message: `High-value PO created for "${sourceProduct.name}" valued at $${cost.toLocaleString()} - Pending approval.`,
              type: 'warning', userId
            }
          });

          await tx.auditLog.create({
            data: {
              message: `Submitted Purchase Order PO-${po.id.substring(0, 5).toUpperCase()} pending approval.`,
              module: 'Inventory', tenantId, userId
            }
          });

          return {
            pending: true,
            message: `Purchase Order submitted. Value $${cost.toLocaleString()} exceeds threshold and is pending manager approval.`
          };
        }

        // Auto-approve if under threshold
        const updated = await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: parsedQty } }
        });

        const po = await tx.purchaseOrder.create({
          data: { supplierId, total: cost, status: 'approved', productId, qty: parsedQty, tenantId }
        });

        await tx.stockMovement.create({
          data: { type: 'intake', qty: parsedQty, toWarehouse: sourceProduct.warehouse.name, productId: sourceProduct.id, tenantId }
        });

        await tx.transaction.create({
          data: {
            type: 'expense', category: 'Purchasing', amount: cost,
            description: `Restock replenishment PO: ${sourceProduct.name} (+${parsedQty} units)`,
            reference: `PO-${po.id.substring(0, 5).toUpperCase()}`, tenantId
          }
        });

        await tx.auditLog.create({
          data: {
            message: `Replenished stock for "${sourceProduct.name}" (+${parsedQty} units) via auto-approved PO.`,
            module: 'Inventory', tenantId, userId
          }
        });

        return { success: true, product: updated };
      }

      // ==========================================
      // WORKFLOW 3: SALES RETURNS
      // ==========================================
      if (type === 'return') {
        const updated = await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: parsedQty } }
        });

        await tx.stockMovement.create({
          data: { type: 'return', qty: parsedQty, toWarehouse: sourceProduct.warehouse.name, productId: sourceProduct.id, tenantId }
        });

        await tx.transaction.create({
          data: {
            type: 'expense', category: 'Sales Return',
            amount: sourceProduct.price * parsedQty,
            description: `Sales Refund: Return of ${sourceProduct.name} (${parsedQty} units)`,
            reference: 'REF-RET', tenantId
          }
        });

        await tx.auditLog.create({
          data: {
            message: `Processed customer return for "${sourceProduct.name}" (+${parsedQty} units).`,
            module: 'Inventory', tenantId, userId
          }
        });

        return { success: true, product: updated };
      }

      throw new Error('Invalid movement type specified.');
    });

    return res.json(result);
  } catch (error) {
    console.error('Movement POST error:', error);
    return res.status(400).json({ error: error.message || 'Movement transaction aborted' });
  }
});

export default router;

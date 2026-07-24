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

// GET /api/inventory/ai-autopilot (Predictive Restocking Analytics)
router.get('/ai-autopilot', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const products = await prisma.product.findMany({
      where: { tenantId },
      include: { supplier: true, warehouse: true }
    });

    const movements = await prisma.stockMovement.findMany({
      where: { tenantId, type: 'sale' },
      orderBy: { date: 'desc' }
    });

    // Compute sales velocity & days of stock remaining for each product
    const autopilotItems = products.map((p) => {
      const productSales = movements.filter((m) => m.productId === p.id);
      const totalSalesQty = productSales.reduce((acc, m) => acc + m.qty, 0);

      // Estimate daily burn rate (units/day)
      const dailyBurnRate = Number((totalSalesQty / 30 || (p.minStock > 0 ? 0.6 : 0.2)).toFixed(2));
      const daysRemaining = Math.max(0, Math.floor(p.stock / (dailyBurnRate || 1)));

      const isLow = p.stock <= p.minStock;
      const isUrgent = daysRemaining <= 7 || isLow;

      const recommendedQty = Math.max(p.minStock * 2 - p.stock, 20);
      const totalCost = Number((recommendedQty * p.cost).toFixed(2));

      // Prefilled supplier order messages
      const supplierName = p.supplier ? p.supplier.name : 'Primary Supplier';
      const supplierPhone = p.supplier?.phone || '+15550192834';
      const supplierEmail = p.supplier?.email || 'orders@supplier.com';

      const poText = `*PURCHASE ORDER REPLENISHMENT*\nItem: ${p.name} (SKU: ${p.sku})\nQty Requested: ${recommendedQty} units\nTarget Delivery WH: ${p.warehouse?.name || 'Main Warehouse'}\nEst. Cost: $${totalCost}`;

      const whatsappUrl = `https://wa.me/${supplierPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${supplierName},\n\nWe would like to place an automated restock order:\n${poText}\n\nPlease confirm availability!`)}`;
      const mailtoUrl = `mailto:${supplierEmail}?subject=${encodeURIComponent(`RESTOCK ORDER: ${p.name}`)}&body=${encodeURIComponent(`Dear ${supplierName},\n\nPlease dispatch the following restocking order:\n\n${poText}\n\nThank you.`)}`;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minStock: p.minStock,
        dailyBurnRate,
        daysRemaining,
        isLow,
        isUrgent,
        recommendedQty,
        estimatedCost: totalCost,
        supplier: p.supplier,
        warehouse: p.warehouse,
        whatsappUrl,
        mailtoUrl
      };
    });

    const urgentRestocks = autopilotItems.filter((i) => i.isUrgent);

    return res.json({
      summary: {
        totalTracked: autopilotItems.length,
        criticalAlertsCount: urgentRestocks.length,
        estimatedTotalRestockBudget: urgentRestocks.reduce((acc, i) => acc + i.estimatedCost, 0)
      },
      items: autopilotItems
    });
  } catch (error) {
    console.error('AI AutoPilot GET error:', error);
    return res.status(500).json({ error: 'Failed to generate AI restocking predictions' });
  }
});

// POST /api/inventory/auto-restock-po (Generate & Auto-Dispatch PO)
router.post('/auto-restock-po', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { productId, qty, supplierId, totalCost } = req.body;

    if (!productId || !qty) {
      return res.status(400).json({ error: 'Product ID and Quantity are required' });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: { supplier: true, warehouse: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product SKU not found' });
    }

    const poSupplierId = supplierId || product.supplierId;
    const poQty = Number(qty);
    const poCost = Number(totalCost || poQty * product.cost);

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId: poSupplierId,
        total: poCost,
        status: 'approved',
        productId: product.id,
        qty: poQty,
        tenantId
      }
    });

    await prisma.auditLog.create({
      data: {
        message: `AI Auto-Pilot dispatched PO-${po.id.substring(0, 5).toUpperCase()} for "${product.name}" (+${poQty} units).`,
        module: 'Inventory',
        tenantId,
        userId
      }
    });

    const supplierPhone = product.supplier?.phone || '+15550192834';
    const supplierEmail = product.supplier?.email || 'orders@supplier.com';
    const supplierName = product.supplier?.name || 'Supplier';

    const poMessage = `*AUTOPILOT PO DISPATCH (PO-${po.id.substring(0, 5).toUpperCase()})*\nProduct: ${product.name}\nQuantity: ${poQty} units\nTotal Value: $${poCost}\nWarehouse: ${product.warehouse?.name || 'Main Warehouse'}`;

    return res.json({
      success: true,
      po,
      whatsappUrl: `https://wa.me/${supplierPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${supplierName},\n\nOfficial Restock Order Placed:\n${poMessage}`)}`,
      mailtoUrl: `mailto:${supplierEmail}?subject=${encodeURIComponent(`OFFICIAL PO: ${product.name}`)}&body=${encodeURIComponent(poMessage)}`
    });
  } catch (error) {
    console.error('Auto Restock PO error:', error);
    return res.status(500).json({ error: 'Failed to dispatch auto-restock PO' });
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

// DELETE /api/inventory/:id (Delete single product SKU)
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { id } = req.params;

    const existing = await prisma.product.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product SKU not found' });
    }

    await prisma.product.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        message: `Deleted product SKU ${existing.sku}: "${existing.name}" from catalog.`,
        module: 'Inventory',
        tenantId,
        userId
      }
    });

    return res.json({ success: true, message: `Product ${existing.name} deleted successfully.` });
  } catch (error) {
    console.error('Inventory DELETE error:', error);
    return res.status(500).json({ error: 'Failed to delete product SKU' });
  }
});

// POST /api/inventory/bulk-import (Bulk CSV/JSON Import Engine for 500-1000+ Items)
router.post('/bulk-import', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Valid array of product items is required for bulk import.' });
    }

    // Get default warehouse and supplier for tenant fallback
    let defaultWh = await prisma.warehouse.findFirst({ where: { tenantId } });
    if (!defaultWh) {
      defaultWh = await prisma.warehouse.create({
        data: { name: 'Main Distribution Center', location: 'HQ', tenantId }
      });
    }

    let defaultSup = await prisma.supplier.findFirst({ where: { tenantId } });
    if (!defaultSup) {
      defaultSup = await prisma.supplier.create({
        data: { name: 'Primary Wholesale Supplier', contact: 'Sales Manager', email: 'wholesale@supplier.com', tenantId }
      });
    }

    const existingProducts = await prisma.product.findMany({
      where: { tenantId },
      select: { id: true, sku: true }
    });

    const existingSkuMap = new Map(existingProducts.map(p => [p.sku, p.id]));

    let importedCount = 0;
    let updatedCount = 0;

    const toCreate = [];

    for (const item of items) {
      // Support Bhagwati Store Excel headers ('BU', 'SKU', 'Brand', 'Model', 'Avg Price') as well as standard headers
      const rawSku = item.sku || item.SKU;
      const rawName = item.name || (item.Brand && item.Model ? `${item.Brand} - ${item.Model}` : item.Model || item.Brand || item.name);
      if (!rawSku || !rawName) continue;

      const sku = String(rawSku).trim();
      const name = String(rawName).trim();
      const category = item.category || item.bu || item.BU ? String(item.category || item.bu || item.BU).trim() : 'General';
      const price = Math.max(0, Number(item.price || item['Avg Price'] || item.avg_price) || 0);
      const cost = Math.max(0, Number(item.cost || Math.round(price * 0.7)) || 0);
      const stock = Math.max(0, Number(item.stock || 50) || 0);
      const minStock = Math.max(0, Number(item.minStock || 10) || 10);

      const existingId = existingSkuMap.get(sku);

      if (existingId) {
        await prisma.product.update({
          where: { id: existingId },
          data: { name, category, price, cost, stock, minStock }
        });
        updatedCount++;
      } else {
        toCreate.push({
          name, sku, category, price, cost, stock, minStock,
          warehouseId: defaultWh.id,
          supplierId: defaultSup.id,
          tenantId
        });
        importedCount++;
      }
    }

    if (toCreate.length > 0) {
      await prisma.product.createMany({
        data: toCreate,
        skipDuplicates: true
      });
    }

    await prisma.auditLog.create({
      data: {
        message: `Bulk Inventory Import: Processed ${items.length} SKUs (${importedCount} created, ${updatedCount} updated).`,
        module: 'Inventory',
        tenantId,
        userId
      }
    });

    return res.json({
      success: true,
      totalProcessed: items.length,
      importedCount,
      updatedCount,
      message: `Successfully processed bulk inventory import of ${items.length} items.`
    });
  } catch (error) {
    console.error('Bulk Import error:', error);
    return res.status(500).json({ error: 'Bulk inventory import failed' });
  }
});

// POST /api/inventory/daily-stock-sync (Daily Physical Stock Count Batch Adjuster)
router.post('/daily-stock-sync', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Array of stock updates is required.' });
    }

    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        if (!update.id) continue;
        const newStock = Math.max(0, Number(update.stock) || 0);

        const prod = await tx.product.findFirst({
          where: { id: update.id, tenantId }
        });

        if (prod) {
          await tx.product.update({
            where: { id: prod.id },
            data: { stock: newStock }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          message: `Daily Stock Sync: Updated inventory stock levels for ${updates.length} items.`,
          module: 'Inventory',
          tenantId,
          userId
        }
      });
    });

    return res.json({
      success: true,
      updatedCount: updates.length,
      message: `Daily stock count updated for ${updates.length} products.`
    });
  } catch (error) {
    console.error('Daily Stock Sync error:', error);
    return res.status(500).json({ error: 'Failed to record daily stock count' });
  }
});

export default router;

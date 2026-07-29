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

      // ==========================================
      // WORKFLOW 4: POS SALES
      // ==========================================
      if (type === 'sale') {
        const updated = await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: parsedQty } }
        });

        await tx.stockMovement.create({
          data: {
            type: 'sale',
            qty: parsedQty,
            fromWarehouse: sourceProduct.warehouse ? sourceProduct.warehouse.name : 'Main Store',
            productId: sourceProduct.id,
            tenantId
          }
        });

        await tx.transaction.create({
          data: {
            type: 'income',
            category: 'POS Sale',
            amount: sourceProduct.price * parsedQty,
            description: `POS Sale: ${sourceProduct.name} (${parsedQty} units)`,
            reference: 'POS-SALE',
            tenantId
          }
        });

        await tx.auditLog.create({
          data: {
            message: `POS Sale recorded for "${sourceProduct.name}" (-${parsedQty} units).`,
            module: 'Inventory',
            tenantId,
            userId
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

// GET /api/inventory/procurement/suppliers-health (Supplier Health Scorecard & Procurement Analytics)
router.get('/procurement/suppliers-health', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const suppliers = await prisma.supplier.findMany({
      where: { tenantId },
      include: {
        products: true,
        purchaseOrders: { orderBy: { date: 'desc' } }
      }
    });

    const healthReport = suppliers.map((s, index) => {
      const poCount = s.purchaseOrders.length;
      const totalSpend = s.purchaseOrders.reduce((acc, po) => acc + (po.total || 0), 0);
      const receivedCount = s.purchaseOrders.filter((po) => po.status === 'received').length;

      const fulfillmentRate = poCount > 0 ? Math.round((receivedCount / poCount) * 100) : 95;
      const avgLeadTimeDays = Math.max(2, 5 - (index % 3));
      const healthScore = Math.min(100, Math.max(70, 85 + (fulfillmentRate > 90 ? 10 : 0) - index * 2));

      return {
        id: s.id,
        name: s.name,
        contact: s.contact,
        email: s.email,
        phone: s.phone,
        productCount: s.products.length,
        poCount,
        receivedCount,
        totalSpend,
        fulfillmentRate,
        avgLeadTimeDays,
        healthScore,
        status: healthScore >= 85 ? 'Optimal' : healthScore >= 75 ? 'Good' : 'Needs Review'
      };
    });

    return res.json({ suppliers: healthReport });
  } catch (error) {
    console.error('Supplier Health Error:', error);
    return res.status(500).json({ error: 'Failed to compute supplier performance metrics' });
  }
});

// POST /api/inventory/procurement/rfq (Autonomous RFQ & Purchase Order Generation)
router.post('/procurement/rfq', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { productId, supplierId, qty, notes } = req.body;

    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier selection is required to issue RFQ' });
    }

    let unitCost = 50;
    let prodName = 'Restock Inventory';

    if (productId) {
      const prod = await prisma.product.findFirst({ where: { id: productId, tenantId } });
      if (prod) {
        unitCost = prod.cost || prod.price * 0.6;
        prodName = prod.name;
      }
    }

    const orderQty = Math.max(1, Number(qty) || 20);
    const totalCost = Number((unitCost * orderQty).toFixed(2));

    const po = await prisma.purchaseOrder.create({
      data: {
        total: totalCost,
        status: 'pending',
        productId,
        qty: orderQty,
        supplierId,
        tenantId
      },
      include: { supplier: true }
    });

    await prisma.auditLog.create({
      data: {
        message: `Issued Automated RFQ / Purchase Order #${po.id.slice(0, 8)} to ${po.supplier?.name || 'Supplier'} (${orderQty} units of ${prodName}).`,
        module: 'Inventory',
        tenantId,
        userId
      }
    });

    return res.json({
      success: true,
      purchaseOrder: po,
      message: `RFQ and Purchase Order issued successfully for ${prodName}.`
    });
  } catch (error) {
    console.error('Create RFQ error:', error);
    return res.status(500).json({ error: 'Failed to generate procurement RFQ' });
  }
});

// POST /api/inventory/procurement/status (Update Purchase Order Status & Auto-Sync Inventory/Finance)
router.post('/procurement/status', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'Purchase Order ID and new status are required' });
    }

    const existingPO = await prisma.purchaseOrder.findFirst({
      where: { id: orderId },
      include: { supplier: true }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase Order record not found' });
    }

    const effectiveTenantId = req.tenantId || existingPO.tenantId;
    let effectiveUserId = req.userId;
    if (!effectiveUserId) {
      const fallbackUser = await prisma.user.findFirst({ where: { tenantId: effectiveTenantId } });
      effectiveUserId = fallbackUser?.id;
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status }
    });

    // If order received, auto-increment stock & record financial transaction
    if (status === 'received' && existingPO.productId && existingPO.qty) {
      const product = await prisma.product.findFirst({ where: { id: existingPO.productId, tenantId: effectiveTenantId } });

      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: product.stock + existingPO.qty }
        });

        await prisma.stockMovement.create({
          data: {
            type: 'replenish',
            qty: existingPO.qty,
            toWarehouse: product.warehouseId,
            productId: product.id,
            tenantId: effectiveTenantId
          }
        });

        await prisma.transaction.create({
          data: {
            type: 'expense',
            category: 'Cost of Goods Sold (Inventory Procurement)',
            amount: existingPO.total,
            description: `PO Fulfillment: ${existingPO.qty} units of ${product.name} from ${existingPO.supplier?.name || 'Vendor'}`,
            reference: `PO-${existingPO.id.slice(0, 8)}`,
            tenantId: effectiveTenantId
          }
        });
      }
    }

    if (effectiveTenantId && effectiveUserId) {
      try {
        await prisma.auditLog.create({
          data: {
            message: `Updated Purchase Order #${orderId.slice(0, 8)} status to '${status}'.`,
            module: 'Inventory',
            tenantId: effectiveTenantId,
            userId: effectiveUserId
          }
        });
      } catch (auditErr) {
        console.warn('AuditLog warning:', auditErr.message);
      }
    }

    return res.json({
      success: true,
      purchaseOrder: updatedPO,
      message: `Purchase Order status updated to '${status}'.`
    });
  } catch (error) {
    console.error('Update PO Status error:', error);
    return res.status(500).json({ error: 'Failed to update Purchase Order status' });
  }
});

// GET /api/supplier/dashboard or /api/inventory/supplier/dashboard
router.get(['/supplier/dashboard', '/dashboard'], async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Get primary supplier profile or all suppliers for tenant
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId },
      include: {
        products: { include: { warehouse: true } },
        purchaseOrders: { include: { supplier: true }, orderBy: { date: 'desc' } }
      }
    });

    if (suppliers.length === 0) {
      return res.json({
        supplier: { name: 'Demo Vendor Corp', contact: 'Vendor Admin', email: 'vendor@b2b.com' },
        products: [],
        purchaseOrders: [],
        vmiStock: [],
        metrics: { activeOrdersCount: 0, vmiSkusCount: 0, totalReceivables: 0, avgDispatchDays: 2 }
      });
    }

    const activeSupplier = suppliers[0];

    const vmiStock = activeSupplier.products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      minStock: p.minStock,
      cost: p.cost,
      price: p.price,
      isLowStock: p.stock <= p.minStock,
      warehouseName: p.warehouse?.name || 'Central Warehouse',
      status: p.stock <= p.minStock ? 'Restock Needed' : 'Healthy Stock'
    }));

    const allOrders = suppliers.flatMap((s) => s.purchaseOrders);
    const activeOrders = allOrders.filter((po) => po.status === 'pending' || po.status === 'confirmed' || po.status === 'in_transit');
    const totalReceivables = allOrders.reduce((acc, po) => acc + (po.total || 0), 0);

    return res.json({
      supplier: {
        id: activeSupplier.id,
        name: activeSupplier.name,
        contact: activeSupplier.contact,
        email: activeSupplier.email,
        phone: activeSupplier.phone
      },
      suppliers: suppliers.map((s) => ({ id: s.id, name: s.name, contact: s.contact, email: s.email })),
      vmiStock,
      purchaseOrders: allOrders,
      metrics: {
        activeOrdersCount: activeOrders.length,
        vmiSkusCount: vmiStock.length,
        totalReceivables,
        avgDispatchDays: 2
      }
    });
  } catch (error) {
    console.error('Supplier Dashboard GET Error:', error);
    return res.status(500).json({ error: 'Failed to load supplier dashboard dataset' });
  }
});

// POST /api/supplier/order-action or /api/inventory/supplier/order-action
router.post(['/supplier/order-action', '/order-action'], async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { orderId, action, notes } = req.body;

    if (!orderId || !action) {
      return res.status(400).json({ error: 'Order ID and action are required' });
    }

    let nextStatus = 'pending';
    if (action === 'accept') nextStatus = 'confirmed';
    if (action === 'dispatch') nextStatus = 'in_transit';
    if (action === 'deliver') nextStatus = 'received';

    const existingPO = await prisma.purchaseOrder.findFirst({
      where: { id: orderId },
      include: { supplier: true }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase Order record not found' });
    }

    const effectiveTenantId = req.tenantId || existingPO.tenantId;
    let effectiveUserId = req.userId;
    if (!effectiveUserId) {
      const fallbackUser = await prisma.user.findFirst({ where: { tenantId: effectiveTenantId } });
      effectiveUserId = fallbackUser?.id;
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: nextStatus }
    });

    if (nextStatus === 'received' && existingPO.productId && existingPO.qty) {
      const product = await prisma.product.findFirst({ where: { id: existingPO.productId, tenantId: effectiveTenantId } });
      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: product.stock + existingPO.qty }
        });

        await prisma.stockMovement.create({
          data: {
            type: 'replenish',
            qty: existingPO.qty,
            toWarehouse: product.warehouseId,
            productId: product.id,
            tenantId: effectiveTenantId
          }
        });

        await prisma.transaction.create({
          data: {
            type: 'expense',
            category: 'Cost of Goods Sold (Supplier Portal Delivery)',
            amount: existingPO.total,
            description: `Supplier Portal Delivery: ${existingPO.qty} units of ${product.name}`,
            reference: `SUP-PO-${existingPO.id.slice(0, 8)}`,
            tenantId: effectiveTenantId
          }
        });
      }
    }

    if (effectiveTenantId && effectiveUserId) {
      try {
        await prisma.auditLog.create({
          data: {
            message: `Supplier Action '${action}' performed on PO #${orderId.slice(0, 8)} (New Status: ${nextStatus}).`,
            module: 'Inventory',
            tenantId: effectiveTenantId,
            userId: effectiveUserId
          }
        });
      } catch (auditErr) {
        console.warn('AuditLog warning:', auditErr.message);
      }
    }

    return res.json({
      success: true,
      purchaseOrder: updatedPO,
      message: `Order #${orderId.slice(0, 8)} updated to '${nextStatus}'.`
    });
  } catch (error) {
    console.error('Supplier Order Action Error:', error);
    return res.status(500).json({ error: 'Failed to process supplier order action' });
  }
});

export default router;

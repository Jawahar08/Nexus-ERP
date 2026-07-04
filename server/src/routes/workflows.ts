import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// GET /api/workflows/approvals
router.get('/approvals', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;

    const pendingPOs = await prisma.purchaseOrder.findMany({
      where: { tenantId, status: 'pending' },
      include: { supplier: true }
    });

    const pendingLeaves = await prisma.leaveRequest.findMany({
      where: { tenantId, status: 'pending' }
    });

    const approvedPOs = await prisma.purchaseOrder.findMany({
      where: { tenantId, status: 'approved' },
      include: { supplier: true },
      take: 10,
      orderBy: { date: 'desc' }
    });

    return res.json({
      pendingPOs,
      pendingLeaves,
      approvedPOs
    });
  } catch (error) {
    console.error('Approvals GET error:', error);
    return res.status(500).json({ error: 'Failed to retrieve workflow items' });
  }
});

// PUT /api/workflows/approvals
router.put('/approvals', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { type, id, status } = req.body;

    if (!type || !id || !status || (status !== 'approved' && status !== 'rejected')) {
      return res.status(400).json({ error: 'Invalid approval payload' });
    }

    const result = await prisma.$transaction(async (tx) => {
      
      // PO approvals workflow
      if (type === 'po') {
        const po = await tx.purchaseOrder.findFirst({
          where: { id, tenantId }
        });

        if (!po) throw new Error('Purchase order not found');
        if (po.status !== 'pending') throw new Error('Purchase order already processed');

        const updatedPO = await tx.purchaseOrder.update({
          where: { id },
          data: { status }
        });

        await tx.auditLog.create({
          data: {
            message: `Purchase Order PO-${id.substring(0, 5).toUpperCase()} was ${status} by Manager.`,
            module: 'Admin',
            tenantId,
            userId
          }
        });

        if (status === 'approved' && po.productId && po.qty) {
          const product = await tx.product.findFirst({
            where: { id: po.productId, tenantId },
            include: { warehouse: true }
          });

          if (product) {
            await tx.product.update({
              where: { id: po.productId },
              data: { stock: { increment: po.qty } }
            });

            await tx.stockMovement.create({
              data: {
                type: 'intake',
                qty: po.qty,
                toWarehouse: product.warehouse.name,
                productId: product.id,
                tenantId
              }
            });

            await tx.transaction.create({
              data: {
                type: 'expense',
                category: 'Purchasing',
                amount: po.total,
                description: `PO approved restocking: ${product.name} (+${po.qty} units)`,
                reference: `PO-${po.id.substring(0, 5).toUpperCase()}`,
                tenantId
              }
            });
          }
        }

        return updatedPO;
      }

      // Sabbatical Leave approval workflow
      if (type === 'leave') {
        const leave = await tx.leaveRequest.findFirst({
          where: { id, tenantId }
        });

        if (!leave) throw new Error('Leave request not found');
        if (leave.status !== 'pending') throw new Error('Leave request already processed');

        const updatedLeave = await tx.leaveRequest.update({
          where: { id },
          data: { status }
        });

        await tx.auditLog.create({
          data: {
            message: `Leave request by ${leave.employeeName} was ${status} by Manager.`,
            module: 'HR',
            tenantId,
            userId
          }
        });

        if (status === 'approved') {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];

            const att = await tx.attendance.findFirst({
              where: { employeeId: leave.employeeId, date: dateStr }
            });

            if (att) {
              await tx.attendance.update({
                where: { id: att.id },
                data: { status: 'leave' }
              });
            } else {
              await tx.attendance.create({
                data: {
                  employeeId: leave.employeeId,
                  date: dateStr,
                  status: 'leave'
                }
              });
            }
          }
        }

        return updatedLeave;
      }

      throw new Error('Invalid workflow context');
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Approvals PUT error:', error);
    return res.status(400).json({ error: error.message || 'Workflow approval execution failed' });
  }
});

export default router;

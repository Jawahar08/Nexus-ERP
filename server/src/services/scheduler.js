import cron from 'node-cron';
import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';

export function startBackgroundScheduler() {
  logger.info('Initializing Node-cron Background Task Scheduler...');

  // ==========================================
  // TASK 1: LOW STOCK DAILY AUDIT SCANS
  // Runs every day at midnight: '0 0 * * *'
  // ==========================================
  cron.schedule('0 0 * * *', async () => {
    await performLowStockAudit();
  });

  // Run an immediate scan on boot
  performLowStockAudit();

  // ==========================================
  // TASK 2: WEEKLY AUDIT TRAIL MAINTENANCE
  // Runs every Sunday at midnight: '0 0 * * 0'
  // ==========================================
  cron.schedule('0 0 * * 0', async () => {
    logger.info('[Scheduler] Running weekly audit trail maintenance...');
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await prisma.auditLog.deleteMany({
        where: { timestamp: { lt: ninetyDaysAgo } }
      });

      logger.info(`[Scheduler] Maintenance complete. Cleaned up ${result.count} historical audit logs.`);
    } catch (error) {
      logger.error('[Scheduler] Audit trail maintenance failed:', error);
    }
  });
}

async function performLowStockAudit() {
  logger.info('[Scheduler] Commencing daily low-stock inventory audit scan...');
  try {
    const products = await prisma.product.findMany({ include: { warehouse: true } });
    let alertCount = 0;

    for (const prod of products) {
      if (prod.stock <= prod.minStock) {
        const tenantUsers = await prisma.user.findMany({ where: { tenantId: prod.tenantId } });

        for (const user of tenantUsers) {
          const exists = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              message: { contains: `low stock warning for SKU "${prod.name}"` }
            }
          });

          if (!exists) {
            await prisma.notification.create({
              data: {
                message: `Scheduler low stock warning for SKU "${prod.name}": Only ${prod.stock} units remaining in ${prod.warehouse.name}!`,
                type: 'danger',
                userId: user.id
              }
            });
            alertCount++;
          }
        }
      }
    }

    logger.info(`[Scheduler] Inventory scan complete. Dispatched ${alertCount} low-stock alerts.`);
  } catch (error) {
    logger.error('[Scheduler] Low-stock inventory audit failed:', error);
  }
}

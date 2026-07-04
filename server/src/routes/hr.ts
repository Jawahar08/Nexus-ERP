import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

// GET /api/hr
router.get('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;

    const employees = await prisma.employee.findMany({
      where: { tenantId },
      include: {
        attendances: true,
        leaveRequests: true
      },
      orderBy: { name: 'asc' }
    });

    const leaves = await prisma.leaveRequest.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' }
    });

    return res.json({ employees, leaves });
  } catch (error) {
    console.error('HR GET error:', error);
    return res.status(500).json({ error: 'Failed to retrieve HR directories' });
  }
});

// POST /api/hr (Add employee, register attendance, file leave requests)
router.post('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { action } = req.body;

    if (action === 'employee') {
      const { name, role, department, salary, email } = req.body;
      if (!name || !role || !department || !email) {
        return res.status(400).json({ error: 'Required fields are missing' });
      }

      const emp = await prisma.employee.create({
        data: {
          name,
          role,
          department,
          salary: Number(salary) || 0,
          email,
          tenantId
        }
      });

      await prisma.auditLog.create({
        data: {
          message: `Onboarded personnel: ${name} (${role} - ${department})`,
          module: 'HR',
          tenantId,
          userId
        }
      });

      return res.json(emp);
    }

    if (action === 'attendance') {
      const { employeeId, date, status } = req.body;
      if (!employeeId || !date) {
        return res.status(400).json({ error: 'Employee ID and Date are required' });
      }

      // Check if attendance already exists
      const existing = await prisma.attendance.findFirst({
        where: { employeeId, date }
      });

      if (status === null) {
        // delete if status is null
        if (existing) {
          await prisma.attendance.delete({
            where: { id: existing.id }
          });
        }
        return res.json({ success: true, message: 'Attendance record deleted' });
      }

      let log;
      if (existing) {
        log = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status }
        });
      } else {
        log = await prisma.attendance.create({
          data: { employeeId, date, status }
        });
      }

      return res.json(log);
    }

    if (action === 'leave') {
      const { employeeId, startDate, endDate, reason } = req.body;
      if (!employeeId || !startDate || !endDate || !reason) {
        return res.status(400).json({ error: 'All sabbatical details are required' });
      }

      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId }
      });
      if (!employee) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }

      const leave = await prisma.leaveRequest.create({
        data: {
          employeeId,
          employeeName: employee.name,
          startDate,
          endDate,
          reason,
          status: 'pending',
          tenantId
        }
      });

      await prisma.auditLog.create({
        data: {
          message: `Sabbatical leave requested by ${employee.name}: "${reason}"`,
          module: 'HR',
          tenantId,
          userId
        }
      });

      return res.json(leave);
    }

    return res.status(400).json({ error: 'Invalid action parameter' });
  } catch (error) {
    console.error('HR POST error:', error);
    return res.status(500).json({ error: 'Failed to post HR logs' });
  }
});

// PUT /api/hr (Approve/Reject leaves directly)
router.put('/', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { id, status } = req.body; // approved, rejected

    if (!id || !status) {
      return res.status(400).json({ error: 'Request ID and Status are required' });
    }

    const leave = await prisma.leaveRequest.findFirst({
      where: { id, tenantId }
    });

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const log = await tx.leaveRequest.update({
        where: { id },
        data: { status }
      });

      // Seed attendance as leave if approved
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

      return log;
    });

    await prisma.auditLog.create({
      data: {
        message: `Leave request by ${leave.employeeName} was ${status}.`,
        module: 'HR',
        tenantId,
        userId
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('HR PUT error:', error);
    return res.status(500).json({ error: 'Failed to update leave request' });
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();

// Keyed by tenantId to allow clean multi-tenant matrix overrides in-memory
const tenantMatrixStore = {};

const defaultMatrix = {
  Admin:     { dashboard: true,  inventory: true,  crm: true,  hr: true,  finance: true,  admin: true  },
  HR:        { dashboard: true,  inventory: false, crm: false, hr: true,  finance: false, admin: false },
  Finance:   { dashboard: true,  inventory: false, crm: true,  hr: false, finance: true,  admin: false },
  Sales:     { dashboard: true,  inventory: true,  crm: true,  hr: false, finance: false, admin: false },
  Inventory: { dashboard: true,  inventory: true,  crm: false, hr: false, finance: false, admin: false },
  Manager:   { dashboard: true,  inventory: true,  crm: true,  hr: true,  finance: true,  admin: false }
};

// GET /api/admin/permissions
router.get('/permissions', (req, res) => {
  const tenantId = req.tenantId || 'default';
  if (!tenantMatrixStore[tenantId]) {
    tenantMatrixStore[tenantId] = JSON.parse(JSON.stringify(defaultMatrix));
  }
  return res.json(tenantMatrixStore[tenantId]);
});

// PUT /api/admin/permissions
router.put('/permissions', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'default';
    const userId = req.userId;
    const { role, module, value } = req.body;

    if (!role || !module || value === undefined) {
      return res.status(400).json({ error: 'Role, Module and Value parameters are required' });
    }

    if (!tenantMatrixStore[tenantId]) {
      tenantMatrixStore[tenantId] = JSON.parse(JSON.stringify(defaultMatrix));
    }

    if (tenantMatrixStore[tenantId][role]) {
      tenantMatrixStore[tenantId][role][module] = value;
    }

    await prisma.auditLog.create({
      data: {
        message: `RBAC Permission adjusted: ${role} access for "${module}" set to ${value}.`,
        module: 'Admin',
        tenantId,
        userId
      }
    });

    return res.json({ success: true, role, module, value });
  } catch (error) {
    console.error('Permissions PUT error:', error);
    return res.status(500).json({ error: 'Failed to update module security privileges' });
  }
});

export default router;

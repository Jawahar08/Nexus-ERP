import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Next.js 15 Database (PostgreSQL)...');

  // Clear existing databases (reverse dependency order)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const pwdHash = bcrypt.hashSync('password123', 10);

  // 1. Create Corporate Tenants (Multi-tenancy isolation)
  const tenantA = await prisma.tenant.create({
    data: {
      id: '41a7f4d5-62b7-45d8-8108-9597ff3852cc',
      name: 'Nexus Global Corp',
      domain: 'nexus.erp'
    }
  });

  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Apex Industries Ltd',
      domain: 'apex.erp'
    }
  });

  console.log(`Created Tenants: \n- ${tenantA.name} (ID: ${tenantA.id})\n- ${tenantB.name} (ID: ${tenantB.id})`);

  // 2. Create Users for Tenant A (Nexus)
  const userA1 = await prisma.user.create({
    data: {
      id: 'dc67a2ec-b9e2-4e59-87b0-26d04da798cc',
      name: 'Admin User',
      email: 'admin@nexus.erp',
      passwordHash: pwdHash,
      role: 'Admin',
      tenantId: tenantA.id
    }
  });

  const userA2 = await prisma.user.create({
    data: {
      id: '18be4a1c-cfe0-4cbd-8719-18ec2e224724',
      name: 'HR Manager',
      email: 'hr@nexus.erp',
      passwordHash: pwdHash,
      role: 'HR',
      tenantId: tenantA.id
    }
  });

  const userA3 = await prisma.user.create({
    data: {
      id: '38c5a563-cee7-4060-bc80-4667070c7ece',
      name: 'Finance Officer',
      email: 'finance@nexus.erp',
      passwordHash: pwdHash,
      role: 'Finance',
      tenantId: tenantA.id
    }
  });

  const userA4 = await prisma.user.create({
    data: {
      id: 'c13a57e7-326a-4d3a-8b81-5d18bfe663ef',
      name: 'Sales Representative',
      email: 'sales@nexus.erp',
      passwordHash: pwdHash,
      role: 'Sales',
      tenantId: tenantA.id
    }
  });

  const userA5 = await prisma.user.create({
    data: {
      name: 'Linus Torvalds',
      email: 'inventory@nexus.erp',
      passwordHash: pwdHash,
      role: 'Inventory',
      tenantId: tenantA.id
    }
  });

  // Create Users for Tenant B (Apex)
  const userB1 = await prisma.user.create({
    data: {
      name: 'Apex Manager',
      email: 'admin@apex.erp',
      passwordHash: pwdHash,
      role: 'Admin',
      tenantId: tenantB.id
    }
  });

  const userB2 = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'sales@apex.erp',
      passwordHash: pwdHash,
      role: 'Sales',
      tenantId: tenantB.id
    }
  });

  // 3. Create Warehouses
  const whA1 = await prisma.warehouse.create({
    data: { name: 'Alpha-Warehouse', location: 'Chicago, IL', tenantId: tenantA.id }
  });

  const whA2 = await prisma.warehouse.create({
    data: { name: 'Beta-Warehouse', location: 'Frankfurt, DE', tenantId: tenantA.id }
  });

  const whB = await prisma.warehouse.create({
    data: { name: 'Apex-Central-Warehouse', location: 'Austin, TX', tenantId: tenantB.id }
  });

  // 4. Create Suppliers
  const supA1 = await prisma.supplier.create({
    data: { name: 'Intelisys Inc.', contact: 'Robert Downey', email: 'robert@intelisys.com', tenantId: tenantA.id }
  });

  const supA2 = await prisma.supplier.create({
    data: { name: 'OptiLink Corp.', contact: 'Bruce Wayne', email: 'bruce@optilink.com', tenantId: tenantA.id }
  });

  const supB = await prisma.supplier.create({
    data: { name: 'Apex Components Co', contact: 'Clark Kent', email: 'clark@apexcomp.com', tenantId: tenantB.id }
  });

  // 5. Create Products
  const prodA1 = await prisma.product.create({
    data: {
      name: 'Quantum CPU Core X9',
      sku: 'CPU-QT-990',
      stock: 120,
      minStock: 25,
      price: 499.00,
      cost: 280.00,
      category: 'Hardware',
      tenantId: tenantA.id,
      warehouseId: whA1.id,
      supplierId: supA1.id
    }
  });

  const prodA2 = await prisma.product.create({
    data: {
      name: 'Optic Fiber Bridge v2',
      sku: 'NET-OFB-02',
      stock: 15,
      minStock: 20,
      price: 189.00,
      cost: 95.00,
      category: 'Networking',
      tenantId: tenantA.id,
      warehouseId: whA2.id,
      supplierId: supA2.id
    }
  });

  const prodA3 = await prisma.product.create({
    data: {
      name: 'Liquid Cooling Block HD',
      sku: 'COOL-LCB-12',
      stock: 68,
      minStock: 15,
      price: 125.00,
      cost: 65.00,
      category: 'Cooling',
      tenantId: tenantA.id,
      warehouseId: whA1.id,
      supplierId: supA2.id
    }
  });

  const prodB1 = await prisma.product.create({
    data: {
      name: 'Apex Industrial Relay',
      sku: 'APEX-REL-01',
      stock: 50,
      minStock: 10,
      price: 45.00,
      cost: 20.00,
      category: 'Industrial',
      tenantId: tenantB.id,
      warehouseId: whB.id,
      supplierId: supB.id
    }
  });

  // 6. Create Stock movements
  await prisma.stockMovement.create({
    data: {
      type: 'intake',
      qty: 120,
      toWarehouse: 'Alpha-Warehouse',
      productId: prodA1.id,
      tenantId: tenantA.id
    }
  });

  await prisma.stockMovement.create({
    data: {
      type: 'intake',
      qty: 50,
      toWarehouse: 'Apex-Central-Warehouse',
      productId: prodB1.id,
      tenantId: tenantB.id
    }
  });

  // 7. Create Customers
  const custA1 = await prisma.customer.create({
    data: { name: 'Sarah Jenkins', email: 's.jenkins@apexglobal.com', company: 'Apex Global Industries', tenantId: tenantA.id }
  });

  const custA2 = await prisma.customer.create({
    data: { name: 'Michael Chen', email: 'mchen@novatech.io', company: 'Nova Technologies Ltd.', tenantId: tenantA.id }
  });

  const custB = await prisma.customer.create({
    data: { name: 'David Miller', email: 'd.miller@horizondev.com', company: 'Horizon Dev Studios', tenantId: tenantB.id }
  });

  // 8. Create CRM Deals
  await prisma.deal.create({
    data: { company: 'Apex Global Industries', contact: 'Sarah Jenkins', value: 85000.00, stage: 'proposal', tenantId: tenantA.id }
  });

  await prisma.deal.create({
    data: { company: 'Nova Technologies Ltd.', contact: 'Michael Chen', value: 34000.00, stage: 'contacted', tenantId: tenantA.id }
  });

  await prisma.deal.create({
    data: { company: 'Horizon Dev Studios', contact: 'David Miller', value: 18000.00, stage: 'won', tenantId: tenantB.id }
  });

  // 9. Create HR Employees & Records
  const empA1 = await prisma.employee.create({
    data: { name: 'Elena Rostova', role: 'Sales Lead', department: 'Sales & Marketing', salary: 6500.00, email: 'elena.r@nexus.erp', tenantId: tenantA.id }
  });

  const empA2 = await prisma.employee.create({
    data: { name: 'Alan Turing', role: 'Solutions Architect', department: 'Operations', salary: 9200.00, email: 'alan.turing@nexus.erp', tenantId: tenantA.id }
  });

  const empB = await prisma.employee.create({
    data: { name: 'John Doe', role: 'Assembly Tech', department: 'Production', salary: 4200.00, email: 'john@apex.erp', tenantId: tenantB.id }
  });

  // Seed employee attendance
  await prisma.attendance.createMany({
    data: [
      { date: '2026-07-01', status: 'present', employeeId: empA1.id },
      { date: '2026-07-02', status: 'present', employeeId: empA1.id },
      { date: '2026-07-03', status: 'present', employeeId: empA1.id },
      { date: '2026-07-01', status: 'present', employeeId: empA2.id },
      { date: '2026-07-02', status: 'leave', employeeId: empA2.id },
      { date: '2026-07-03', status: 'present', employeeId: empA2.id },
      { date: '2026-07-01', status: 'present', employeeId: empB.id }
    ]
  });

  // Seed Leave Request
  await prisma.leaveRequest.create({
    data: {
      startDate: '2026-07-10',
      endDate: '2026-07-12',
      reason: 'Attending computing heritage symposium.',
      status: 'pending',
      employeeName: 'Alan Turing',
      employeeId: empA2.id,
      tenantId: tenantA.id
    }
  });

  // 10. Seed Financial Ledger Transactions
  await prisma.transaction.create({
    data: {
      type: 'income',
      category: 'Sales Invoice',
      amount: 15000.00,
      description: 'Horizon Dev Studios - Custom hardware distribution',
      reference: 'INV-1024',
      tenantId: tenantA.id
    }
  });

  await prisma.transaction.create({
    data: {
      type: 'expense',
      category: 'Infrastructure',
      amount: 3200.00,
      description: 'Amazon Web Services monthly billing',
      reference: 'EXP-992',
      tenantId: tenantA.id
    }
  });

  await prisma.transaction.create({
    data: {
      type: 'expense',
      category: 'Rent',
      amount: 5000.00,
      description: 'HQ Office Monthly Lease',
      reference: 'EXP-993',
      tenantId: tenantA.id
    }
  });

  await prisma.transaction.create({
    data: {
      type: 'income',
      category: 'Sales Invoice',
      amount: 18000.00,
      description: 'Horizon Dev Studios Relay order won',
      reference: 'INV-APEX-01',
      tenantId: tenantB.id
    }
  });

  // 11. Seed Notifications & Audit logs
  await prisma.notification.create({
    data: {
      message: 'Workspace registration complete. System online.',
      type: 'success',
      userId: userA1.id
    }
  });

  await prisma.auditLog.create({
    data: {
      message: 'User Nithesh Kumar bootstrapped the database schema.',
      module: 'Admin',
      tenantId: tenantA.id,
      userId: userA1.id
    }
  });

  console.log('Next.js 15 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

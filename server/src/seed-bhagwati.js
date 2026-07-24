import { prisma } from './lib/db.js';

const bhagwatiItems = [
  { bu: 'Bakery', sku: 'B01', brand: 'Britannia', model: 'Pineapple Cake 55g', price: 25, stock: 45 },
  { bu: 'Bakery', sku: 'B02', brand: 'Britannia', model: 'Fruity Fun Cake 55g', price: 20, stock: 60 },
  { bu: 'Bakery', sku: 'B03', brand: 'Britannia', model: 'Orange Bites Cake 55g', price: 25, stock: 50 },
  { bu: 'Bakery', sku: 'B04', brand: 'Britannia', model: 'Choco Chill Cake 55g', price: 30, stock: 40 },
  { bu: 'Bakery', sku: 'B05', brand: 'Sunfeast', model: 'Caker Trinity Cake', price: 60, stock: 35 },
  { bu: 'Bakery', sku: 'B06', brand: 'Parle', model: 'Happy Happy Cakes', price: 10, stock: 120 },
  { bu: 'Milk', sku: 'M01', brand: 'Amul', model: 'Amul Milk 1/2 Litre', price: 26, stock: 80 },
  { bu: 'Milk', sku: 'M02', brand: 'Mother Dairy', model: 'Mother Dairy Milk 1/2 Litre', price: 28, stock: 75 },
  { bu: 'Milk', sku: 'M03', brand: 'Milk Food', model: 'Milk Food Milk 1/2 Litre', price: 33, stock: 40 },
  { bu: 'Milk', sku: 'M04', brand: 'Doody', model: 'Doody Milk 1/2 Litre', price: 30, stock: 50 },
  { bu: 'Milk', sku: 'M05', brand: 'Cow', model: 'Cow Milk 1/2 Litre', price: 32, stock: 65 },
  { bu: 'Rice', sku: 'R01', brand: 'Johri', model: 'Johri Rice 1 kg', price: 40, stock: 90 },
  { bu: 'Rice', sku: 'R02', brand: 'Satake', model: 'Satake Rice 1 kg', price: 55, stock: 70 },
  { bu: 'Rice', sku: 'R03', brand: 'Green India', model: 'Green India Rice 1 kg', price: 30, stock: 85 },
  { bu: 'Rice', sku: 'R04', brand: 'Basmati', model: 'Basmati Rice 1 kg', price: 70, stock: 110 },
  { bu: 'Rice', sku: 'R05', brand: 'Gia International', model: 'Gia International Rice 1 kg', price: 100, stock: 45 },
  { bu: 'Pulses', sku: 'P01', brand: 'Vedaka', model: 'Chana Daal 1 kg', price: 70, stock: 95 },
  { bu: 'Pulses', sku: 'P02', brand: 'Amazon Brand', model: 'Chole 1 kg', price: 120, stock: 60 },
  { bu: 'Pulses', sku: 'P03', brand: 'Dhiman Agro', model: 'Moong Daal 1 kg', price: 65, stock: 80 },
  { bu: 'Cosmetics', sku: 'C01', brand: 'Kosmetics Lane', model: 'Moisturizer', price: 282, stock: 30 },
  { bu: 'Cosmetics', sku: 'C02', brand: 'Jas Raney and Company', model: 'Matte Waterproof Lipstick', price: 499, stock: 25 },
  { bu: 'Cosmetics', sku: 'C03', brand: 'Vcos Cosmetics', model: 'Skin Tint for Women', price: 319, stock: 40 },
  { bu: 'Cosmetics', sku: 'C04', brand: 'Dove', model: 'Pack of 4, Bath Soap', price: 231, stock: 100 },
  { bu: 'Cosmetics', sku: 'C05', brand: 'Pantene', model: 'Shampoo 1 litre', price: 661, stock: 35 }
];

async function seedRealData() {
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    // Delete old test/sample products
    await prisma.stockMovement.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.product.deleteMany({ where: { tenantId: tenant.id } });

    let wh = await prisma.warehouse.findFirst({ where: { tenantId: tenant.id } });
    if (!wh) {
      wh = await prisma.warehouse.create({ data: { name: 'Main Store Warehouse', location: 'Retail Floor', tenantId: tenant.id } });
    }

    let sup = await prisma.supplier.findFirst({ where: { tenantId: tenant.id } });
    if (!sup) {
      sup = await prisma.supplier.create({ data: { name: 'Bhagwati Wholesale Distributors', contact: 'Store Manager', email: 'orders@bhagwati.com', tenantId: tenant.id } });
    }

    for (const item of bhagwatiItems) {
      const tenantSku = `${item.sku}-${tenant.domain.split('.')[0].toUpperCase()}`;
      await prisma.product.create({
        data: {
          name: `${item.brand} - ${item.model}`,
          sku: tenantSku,
          category: item.bu,
          price: item.price,
          cost: Math.round(item.price * 0.7),
          stock: item.stock,
          minStock: 10,
          warehouseId: wh.id,
          supplierId: sup.id,
          tenantId: tenant.id
        }
      });
    }
    console.log(`Seeded Bhagwati Store Real-Time Items (${bhagwatiItems.length} SKUs) for Tenant: ${tenant.name}`);
  }
}

seedRealData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });

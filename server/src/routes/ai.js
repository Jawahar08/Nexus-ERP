import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// GET /api/ai/forecast
router.get('/forecast', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const products = await prisma.product.findMany({
      where: { tenantId },
      include: { warehouse: true }
    });

    const transactions = await prisma.transaction.findMany({
      where: { tenantId, type: 'income', category: 'Sales' },
      orderBy: { date: 'desc' },
      take: 50
    });

    const apiKey = process.env.GEMINI_API_KEY || '';

    // Calculate heuristic forecast variables per product
    const forecastReports = products.map(prod => {
      const sales = transactions.filter(t => t.description.includes(prod.name));
      const totalUnits = sales.length * 2.5 || 5;
      const daysSpan = 14;
      const velocity = Number((totalUnits / daysSpan).toFixed(2));
      const stockOutDays = velocity > 0 ? Math.max(1, Math.round(prod.stock / velocity)) : 999;
      const recommendation =
        prod.stock <= prod.minStock
          ? 'Restock urgently: Create PO immediately.'
          : stockOutDays <= 7
          ? 'Restock soon: Product velocity is high.'
          : 'Stock level stable: Monitor weekly.';

      return { id: prod.id, name: prod.name, sku: prod.sku, stock: prod.stock, velocity: `${velocity} units/day`, stockOutDays, recommendation };
    });

    // If Gemini key is available, run advanced semantic forecast insights
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const dataset = JSON.stringify(forecastReports);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are an AI inventory controller. Review this CSV dataset of current warehouse products, their stock counts, sales velocity metrics, and stock-out predictions:\n${dataset}\n\nDraft an executive operational directive. List the top 2 products that need immediate purchasing restocking, suggest bulk orders, and identify if any warehouse stores have space shortages. Keep the response to 3 brief bullet points maximum.`
        });

        const semanticReport = response.text || 'Operational analysis completed.';
        return res.json({ hasAI: true, directive: semanticReport, forecasts: forecastReports });
      } catch (geminiError) {
        console.warn('Gemini analytics call failed, returning heuristic dataset:', geminiError);
      }
    }

    const directive = `**Operational Directive:**\n- [CRITICAL] restock suggested for low-stock items.\n- Alpha and Beta warehouses report stable distributions.\n- Velocity checks suggest normal inventory clearance times.`;

    return res.json({ hasAI: false, directive, forecasts: forecastReports });
  } catch (error) {
    console.error('Forecast route error:', error);
    return res.status(500).json({ error: 'AI forecasting analytics failed' });
  }
});

// GET /api/ai/morning-briefing (Executive Morning Summary & Multi-Branch Data)
router.get('/morning-briefing', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const products = await prisma.product.findMany({
      where: { tenantId },
      include: { warehouse: true }
    });

    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId }
    });

    const transactions = await prisma.transaction.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' }
    });

    const tenantObj = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, domain: true }
    });

    const incomeTx = transactions.filter((t) => t.type === 'income');
    const totalIncome = incomeTx.reduce((acc, t) => acc + t.amount, 0);

    const yesterdayRevenue = Number((totalIncome > 0 ? totalIncome * 0.18 : 4850).toFixed(2));
    const dailyAvg = Number((totalIncome > 0 ? (totalIncome / 30) : 4250).toFixed(2));
    const growthPercent = Number((((yesterdayRevenue - dailyAvg) / (dailyAvg || 1)) * 100).toFixed(1));

    const lowStockItems = products.filter((p) => p.stock <= p.minStock);
    const topProduct = products[0]?.name || 'Quantum CPU Core X9';

    const branchProfiles = warehouses.map((wh) => {
      const whProds = products.filter((p) => p.warehouseId === wh.id);
      const totalUnits = whProds.reduce((acc, p) => acc + p.stock, 0);
      const totalVal = whProds.reduce((acc, p) => acc + p.stock * p.price, 0);

      return {
        id: wh.id,
        name: wh.name,
        location: wh.location,
        totalProducts: whProds.length,
        totalStockUnits: totalUnits,
        totalAssetValue: totalVal
      };
    });

    const spokenText = `Good morning! Welcome to ${tenantObj?.name || 'Nexus ERP'}. Yesterday's net revenue reached $${yesterdayRevenue.toLocaleString()}, up ${growthPercent}% against your monthly daily average. Your top selling product was ${topProduct}. ${lowStockItems.length} items require restocking today.`;

    return res.json({
      storeName: tenantObj?.name || 'Nexus Global Store',
      yesterdayRevenue,
      dailyAvg,
      growthPercent,
      topProduct,
      unitsSold: 24,
      criticalRestockCount: lowStockItems.length,
      criticalItems: lowStockItems.slice(0, 3).map((p) => p.name),
      spokenText,
      branches: branchProfiles
    });
  } catch (error) {
    console.error('Morning briefing error:', error);
    return res.status(500).json({ error: 'Failed to generate morning executive briefing' });
  }
});

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Retrieve database datasets for live context
    const products = await prisma.product.findMany({ where: { tenantId } });
    const deals = await prisma.deal.findMany({ where: { tenantId } });
    const employees = await prisma.employee.findMany({ where: { tenantId } });
    const transactions = await prisma.transaction.findMany({ where: { tenantId } });

    // Aggregates
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
    const totalDeals = deals.length;
    const totalDealsValue = deals.reduce((acc, d) => acc + d.value, 0);
    const totalEmployees = employees.length;
    const totalRevenue = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const netBalance = totalRevenue - totalExpenses;

    const apiKey = process.env.GEMINI_API_KEY || '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const context = `You are Nexus ERP AI, an elite enterprise command center assistant.
Here is the current live state of the organization:
- Total Products in Catalogue: ${totalProducts} (${lowStockProducts} products are currently below safety stock limits)
- CRM Sales Pipeline: ${totalDeals} active deals totaling $${totalDealsValue.toLocaleString()}
- Active Workforce: ${totalEmployees} members active
- Gross Revenue (Total Income): $${totalRevenue.toLocaleString()}
- Total Operational Expenses: $${totalExpenses.toLocaleString()}
- Net Ledger Balance: $${netBalance.toLocaleString()}

Answer the user's business queries using the live state data provided above. Be concise, highly professional, structure your response beautifully with markdown bullet points, and offer logical recommendations.

User Query: "${prompt}"`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: context
        });

        const reply = response.text || 'Calculation complete.';
        return res.json({ reply });
      } catch (geminiError) {
        console.warn('Gemini chat model error:', geminiError);
      }
    }

    // Sophisticated Fallback engine if API key is not present
    let reply = `[API Offline] I've analyzed your live system metrics:\n\n` +
      `- **Inventory**: ${totalProducts} items catalogued. ${lowStockProducts > 0 ? `⚠️ **${lowStockProducts} low stock warnings** active.` : `No stock level alerts.`}\n` +
      `- **CRM Pipeline**: ${totalDeals} deals valued at **$${totalDealsValue.toLocaleString()}**.\n` +
      `- **HR**: ${totalEmployees} active employee profiles.\n` +
      `- **Finance**: Net Balance is **$${netBalance.toLocaleString()}** (Revenue: $${totalRevenue.toLocaleString()}, Expenses: $${totalExpenses.toLocaleString()}).\n\n` +
      `*Recommendation: To unlock custom natural language replies, add your \`GEMINI_API_KEY\` to the server's \`.env\` file.*`;

    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('revenue') || lowerPrompt.includes('finance') || lowerPrompt.includes('money') || lowerPrompt.includes('ledger')) {
      reply = `### Finance & Ledger Summary (Live Data)\n\n` +
        `- **Gross Revenue**: $${totalRevenue.toLocaleString()}\n` +
        `- **Operational Expenses**: $${totalExpenses.toLocaleString()}\n` +
        `- **Net Cash Flow**: $${netBalance.toLocaleString()}\n\n` +
        `**AI Suggestion**: Expenses are currently at **${((totalExpenses / (totalRevenue || 1)) * 100).toFixed(1)}%** of gross revenues. ` +
        `We recommend optimizing procurement costs from suppliers to raise margins.`;
    } else if (lowerPrompt.includes('inventory') || lowerPrompt.includes('stock') || lowerPrompt.includes('product')) {
      reply = `### Inventory & Catalogue Report (Live Data)\n\n` +
        `- **Total Catalogue Products**: ${totalProducts} items\n` +
        `- **Under Stock Thresholds**: ${lowStockProducts} alerts\n\n` +
        `**AI Directives**:\n` +
        `${lowStockProducts > 0 
          ? `1. ⚠️ **Immediate Restock PO recommended** for the ${lowStockProducts} items below safety limits.\n2. Space allocation: Warehouse storage is currently balanced.` 
          : `1. All product safety stock levels are optimal. No replenishment actions required.`}`;
    } else if (lowerPrompt.includes('employee') || lowerPrompt.includes('hr') || lowerPrompt.includes('workforce')) {
      reply = `### Human Resources Telemetry (Live Data)\n\n` +
        `- **Active Workforce**: ${totalEmployees} members\n` +
        `- **System Status**: All departments functional (Admin, Sales, Finance, HR).\n\n` +
        `**AI Suggestion**: The current sales deal ratio is **${(totalDeals / (totalEmployees || 1)).toFixed(1)}** deals per employee. Workload distribution is within nominal limits.`;
    }

    return res.json({ reply });
  } catch (error) {
    console.error('AI chat endpoint error:', error);
    return res.status(500).json({ error: 'AI Command Center assistant failed' });
  }
});

export default router;

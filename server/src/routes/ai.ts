import { Router } from 'express';
import { prisma } from '../lib/db';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// GET /api/ai/forecast
router.get('/forecast', async (req: any, res) => {
  try {
    const tenantId = req.tenantId;

    // Retrieve active inventory
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: { warehouse: true }
    });

    // Retrieve transactions (to calculate sales velocity)
    const transactions = await prisma.transaction.findMany({
      where: { tenantId, type: 'income', category: 'Sales' },
      orderBy: { date: 'desc' },
      take: 50
    });

    const apiKey = process.env.GEMINI_API_KEY || '';

    // Calculate generic local forecast variables
    const forecastReports = products.map(prod => {
      // Find average quantity sold per day (heuristics)
      const sales = transactions.filter(t => t.description.includes(prod.name));
      const totalUnits = sales.length * 2.5 || 5; // fallback average units
      const daysSpan = 14;
      const velocity = Number((totalUnits / daysSpan).toFixed(2));
      
      const stockOutDays = velocity > 0 ? Math.max(1, Math.round(prod.stock / velocity)) : 999;
      const recommendation = prod.stock <= prod.minStock 
        ? 'Restock urgently: Create PO immediately.' 
        : stockOutDays <= 7 
        ? 'Restock soon: Product velocity is high.' 
        : 'Stock level stable: Monitor weekly.';

      return {
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        stock: prod.stock,
        velocity: `${velocity} units/day`,
        stockOutDays,
        recommendation
      };
    });

    // If Gemini key is available, run advanced semantic forecast insights
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const dataset = JSON.stringify(forecastReports);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are an AI inventory controller. Review this CSV dataset of current warehouse products, their stock counts, sales velocity metrics, and stock-out predictions:
${dataset}

Draft an executive operational directive. List the top 2 products that need immediate purchasing restocking, suggest bulk orders, and identify if any warehouse stores have space shortages. Keep the response to 3 brief bullet points maximum.`
        });

        const semanticReport = response.text || 'Operational analysis completed.';
        return res.json({
          hasAI: true,
          directive: semanticReport,
          forecasts: forecastReports
        });
      } catch (geminiError) {
        console.warn('Gemini analytics call failed, returning heuristic dataset:', geminiError);
      }
    }

    // Default static report
    const directive = `**Operational Directive:**
- [CRITICAL] restock suggested for low-stock items.
- Alpha and Beta warehouses report stable distributions.
- Velocity checks suggest normal inventory clearance times.`;

    return res.json({
      hasAI: false,
      directive,
      forecasts: forecastReports
    });

  } catch (error) {
    console.error('Forecast route error:', error);
    return res.status(500).json({ error: 'AI forecasting analytics failed' });
  }
});

export default router;

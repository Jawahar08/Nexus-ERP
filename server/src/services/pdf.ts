import PDFDocument from 'pdfkit';
import { Response } from 'express';

export function generateInvoicePDF(invoice: any, res: Response) {
  const doc = new PDFDocument({ margin: 50 });

  // Stream PDF directly to HTTP response
  doc.pipe(res);

  // Logo / Header
  doc.fillColor('#4f46e5')
     .fontSize(20)
     .text('NEXUS GLOBAL ERP', 50, 50);
     
  doc.fontSize(8)
     .fillColor('#64748b')
     .text('Enterprise Operations Ledger Division', 50, 75);

  // Meta details (Invoice ref, Date, Client details)
  doc.fillColor('#1e293b')
     .fontSize(10)
     .text(`Invoice Ref: ${invoice.reference || 'INV-TEMP'}`, 350, 50, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 350, 65, { align: 'right' });

  doc.text('Transaction metadata details:', 50, 110);
  doc.fontSize(9)
     .text(`Category: ${invoice.category}`, 50, 125)
     .text(`Description: ${invoice.description}`, 50, 140)
     .text(`Accounting ID: ${invoice.id.substring(0, 8).toUpperCase()}`, 50, 155);

  // Draw separator line
  doc.moveTo(50, 175)
     .lineTo(550, 175)
     .stroke('#e2e8f0');

  // Items table header
  doc.fontSize(10)
     .text('Description', 50, 195)
     .text('Transaction Type', 300, 195)
     .text('Posting Total', 450, 195, { align: 'right' });

  doc.moveTo(50, 215)
     .lineTo(550, 215)
     .stroke('#e2e8f0');

  // Draw items
  const y = 235;
  doc.fontSize(9)
     .text(`${invoice.description}`, 50, y)
     .text(`${invoice.type.toUpperCase()}`, 300, y)
     .text(`$${invoice.amount.toLocaleString()}`, 450, y, { align: 'right' });

  // Draw double separator lines for total cost
  doc.moveTo(50, y + 25)
     .lineTo(550, y + 25)
     .stroke('#1e293b');

  doc.fontSize(11)
     .text('Grand Total:', 350, y + 40)
     .text(`$${invoice.amount.toLocaleString()}`, 450, y + 40, { align: 'right' });

  // Footer terms
  doc.fontSize(8)
     .fillColor('#94a3b8')
     .text('Thank you for choosing Nexus Global ERP. Reconciled and audited electronically. For queries, contact accounting@nexus.erp.', 50, 650, { align: 'center' });

  doc.end();
}

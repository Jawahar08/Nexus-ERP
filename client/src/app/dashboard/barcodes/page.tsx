'use client';

import React, { useState, useEffect } from 'react';
import BarcodeStudioHub from '@/components/inventory/BarcodeStudioHub';

export default function BarcodeStudioPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products for Barcode Studio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <BarcodeStudioHub products={products} />
    </div>
  );
}

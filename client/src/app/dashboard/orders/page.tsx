'use client';

import React from 'react';
import OrderFulfillmentHub from '@/components/inventory/OrderFulfillmentHub';

export default function OrderDispatchPage() {
  return (
    <div className="flex flex-col gap-6">
      <OrderFulfillmentHub />
    </div>
  );
}

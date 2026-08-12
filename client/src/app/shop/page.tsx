"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShopIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/shop/nexus.erp");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-[#14171F]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5C64ED]" />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShopIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/shop/nexus.erp");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
    </div>
  );
}

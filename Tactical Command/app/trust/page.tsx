"use client";

import UnifiedTrustDashboard from "@/components/ui/unified-trust-dashboard";

export default function TrustDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Constitutional Trust Dashboard</h1>
        <p className="text-neutral-500">Real-time monitoring of agent constitutional compliance</p>
      </div>
      
      <UnifiedTrustDashboard />
    </div>
  );
}
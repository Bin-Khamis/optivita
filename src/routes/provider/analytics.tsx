import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TrendingUp, Calendar, Star, Award, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/provider/analytics")({
  component: ProviderAnalyticsPortal,
});

function ProviderAnalyticsPortal() {
  const [provider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const [dateFilter, setDateFilter] = useState<"7days" | "30days" | "month">("month");

  // Fetch transactions of this provider dynamically
  const providerTx = useMemo(() => {
    if (!provider) return [];
    const raw = localStorage.getItem("optivita_marketplace_transactions");
    let list = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch {}
    }
    return list.filter((t: any) => t.providerId === provider.id);
  }, [provider]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const totalBookings = providerTx.filter((t: any) => t.type === "Booking Payment").length;
    const grossSales = providerTx.filter((t: any) => t.type === "Booking Payment").reduce((sum, t) => sum + t.gross, 0);
    const platformCommission = providerTx.filter((t: any) => t.type === "Booking Payment").reduce((sum, t) => sum + t.commission, 0);
    const netEarnings = grossSales - platformCommission;

    return {
      totalBookings,
      grossSales,
      platformCommission,
      netEarnings,
      avgRating: provider?.rating || 4.9,
      utilizationRate: totalBookings > 0 ? 85 : 0, // mock base utilization
    };
  }, [providerTx, provider]);

  // Strict check: if no provider session is found, block view access
  if (!provider) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-4 text-xs">
        <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground leading-normal">
          You must be logged in as an approved provider to view personal business analytics summaries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 text-xs text-left">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Practice Performance & BI</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Track your patient retention, hourly slot utilization, and client feedback ratings</p>
        </div>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="px-3 py-2 border rounded-xl bg-card font-bold focus:outline-none"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="month">Current Month</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm">
          <span className="text-[9px] font-black text-muted-foreground uppercase">Net Earnings</span>
          <p className="text-xl font-black text-emerald-600">SAR {stats.netEarnings.toFixed(2)}</p>
          <span className="text-[9px] text-slate-400">Total after platform commissions fee splits</span>
        </div>

        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm">
          <span className="text-[9px] font-black text-muted-foreground uppercase">Completed Bookings</span>
          <p className="text-xl font-black text-foreground">{stats.totalBookings} Sessions</p>
          <span className="text-[9px] text-slate-400">Successfully completed consultations</span>
        </div>

        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm">
          <span className="text-[9px] font-black text-muted-foreground uppercase">Slot Utilization</span>
          <p className="text-xl font-black text-foreground">{stats.utilizationRate}% Capacity</p>
          <span className="text-[9px] text-slate-400">Booked slots vs total available inventory</span>
        </div>

        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm">
          <span className="text-[9px] font-black text-muted-foreground uppercase">Practice rating</span>
          <p className="text-xl font-black text-amber-500 flex items-center gap-1">
            <Star className="h-5 w-5 fill-amber-500" />
            <span>{stats.avgRating.toFixed(1)}</span>
          </p>
          <span className="text-[9px] text-slate-400">Average review feedback ratings</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Peak Booking Hours */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-foreground">Peak Booking Hours Distribution</h3>
          <p className="text-[10px] text-muted-foreground">Audits show which hours are most requested by patients</p>

          <div className="space-y-3.5 pt-2">
            {[
              { label: "Morning Sessions (8:00 AM - 12:00 PM)", val: 60 },
              { label: "Afternoon Sessions (12:00 PM - 4:00 PM)", val: 40 },
              { label: "Evening Sessions (4:00 PM - 8:00 PM)", val: 85 },
            ].map((period, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>{period.label}</span>
                  <span>{period.val}% Demand</span>
                </div>
                <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                  <div style={{ width: `${period.val}%` }} className="h-full bg-accent rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Rating Breakout */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1">
            <Award className="h-4.5 w-4.5 text-accent" />
            Client Feedback Breakout
          </h3>

          <div className="space-y-3 pt-2">
            {[
              { stars: 5, pct: 90 },
              { stars: 4, pct: 10 },
              { stars: 3, pct: 0 },
              { stars: 2, pct: 0 },
              { stars: 1, pct: 0 },
            ].map((row) => (
              <div key={row.stars} className="flex items-center gap-3">
                <span className="w-10 font-bold flex items-center gap-0.5 text-slate-500">
                  {row.stars} <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                </span>
                <div className="flex-1 h-2 bg-secondary/20 rounded-full overflow-hidden">
                  <div style={{ width: `${row.pct}%` }} className="h-full bg-amber-500 rounded-full" />
                </div>
                <span className="w-8 text-right font-semibold text-muted-foreground">{row.pct}%</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TrendingUp, Users, DollarSign, Calendar, Star, Download, ChevronRight, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getStoredProviders } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/analytics")({
  component: AdminExecutiveAnalytics,
});

function AdminExecutiveAnalytics() {
  const [providers] = useState(() => getStoredProviders());
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year">("month");
  
  // Sorting options
  const [leaderboardSort, setLeaderboardSort] = useState<"bookings" | "revenue" | "rating">("revenue");
  
  // Drill-down Modal State
  const [drillDownType, setDrillDownType] = useState<string | null>(null);

  const ledgerTransactions = useMemo(() => {
    const raw = localStorage.getItem("optivita_marketplace_transactions");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    // Return mock base data if empty
    return [
      { id: "TXN-101", bookingId: "BKG-2026-001", customerName: "Eleanor Vance", providerName: "Dr. Sarah", providerId: "p1", type: "Booking Payment", gross: 150, commission: 22.5, net: 127.5, status: "Cleared", date: "2026-08-08" },
      { id: "TXN-102", bookingId: "BKG-2026-002", customerName: "John Doe", providerName: "Coach Marcus", providerId: "p2", type: "Booking Payment", gross: 200, commission: 24, net: 176, status: "Cleared", date: "2026-08-09" },
      { id: "TXN-103", bookingId: "BKG-2026-003", customerName: "Sarah Connor", providerName: "Dr. Sarah", providerId: "p1", type: "Booking Payment", gross: 150, commission: 22.5, net: 127.5, status: "Cleared", date: "2026-08-09" },
    ];
  }, []);

  const metrics = useMemo(() => {
    let gross = 0;
    let commission = 0;
    let net = 0;
    let refunds = 0;
    let paidBookingsCount = 0;

    ledgerTransactions.forEach((t: any) => {
      if (t.type === "Booking Payment") {
        gross += t.gross;
        commission += t.commission;
        net += t.net;
        paidBookingsCount++;
      } else if (t.type === "Refund") {
        refunds += Math.abs(t.gross);
      }
    });

    const netPlatformRevenue = commission - refunds;

    return {
      gross,
      commission,
      net,
      refunds,
      paidBookingsCount,
      netPlatformRevenue: netPlatformRevenue >= 0 ? netPlatformRevenue : 0,
      activeCustomers: 45, // mock total
      activeProviders: providers.length,
    };
  }, [ledgerTransactions, providers]);

  // Provider Leaderboard Calculation
  const leaderboard = useMemo(() => {
    const list = providers.map((prov) => {
      const pTx = ledgerTransactions.filter((t: any) => t.providerId === prov.id);
      const gross = pTx.filter((t: any) => t.type === "Booking Payment").reduce((sum, t: any) => sum + t.gross, 0);
      const bookingsCount = pTx.filter((t: any) => t.type === "Booking Payment").length;
      
      return {
        id: prov.id,
        name: prov.name,
        type: prov.type,
        bookings: bookingsCount,
        revenue: gross,
        rating: prov.rating || 4.8,
      };
    });

    // Apply Sorting
    return list.sort((a, b) => {
      if (leaderboardSort === "bookings") return b.bookings - a.bookings;
      if (leaderboardSort === "rating") return b.rating - a.rating;
      return b.revenue - a.revenue;
    });
  }, [providers, ledgerTransactions, leaderboardSort]);

  const handleExportCSV = () => {
    let csv = "Metric,Value\n";
    csv += `Gross Marketplace Value (GMV),SAR ${metrics.gross}\n`;
    csv += `Optivita Platform Commission,SAR ${metrics.commission}\n`;
    csv += `Total Refunds processed,SAR ${metrics.refunds}\n`;
    csv += `Net Platform Revenue,SAR ${metrics.netPlatformRevenue}\n`;
    csv += `Paid Bookings Count,${metrics.paidBookingsCount}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `marketplace_executive_summary_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Executive analytics summary CSV downloaded successfully!");
  };

  return (
    <div className="space-y-10 text-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Marketplace Analytics & BI Center</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Track platform conversions, expert leaderboards, and regional sales distribution</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3.5 py-2 border rounded-xl bg-card border-border/60 font-bold focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Current Month</option>
            <option value="year">This Year</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-accent text-white font-bold shadow-soft hover:opacity-95"
          >
            <Download className="h-4 w-4" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* GMV */}
        <div
          onClick={() => setDrillDownType("gmv")}
          className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm cursor-pointer hover:border-accent/40 transition-all text-left"
        >
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[9px] font-black text-muted-foreground uppercase">Gross Marketplace Value (GMV)</span>
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <p className="text-xl font-black text-foreground">SAR {metrics.gross.toFixed(2)}</p>
          <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+12.4% vs last period</span>
          </div>
        </div>

        {/* Commissions */}
        <div
          onClick={() => setDrillDownType("commission")}
          className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm cursor-pointer hover:border-accent/40 transition-all text-left"
        >
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[9px] font-black text-muted-foreground uppercase">Platform Commissions</span>
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <p className="text-xl font-black text-accent">SAR {metrics.commission.toFixed(2)}</p>
          <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+8.2% vs last period</span>
          </div>
        </div>

        {/* Refunds */}
        <div
          onClick={() => setDrillDownType("refunds")}
          className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm cursor-pointer hover:border-accent/40 transition-all text-left"
        >
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[9px] font-black text-muted-foreground uppercase">Refunds Processed</span>
            <X className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-xl font-black text-foreground">SAR {metrics.refunds.toFixed(2)}</p>
          <div className="flex items-center gap-1 text-[9px] text-red-500 font-bold">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>-2.1% vs last period</span>
          </div>
        </div>

        {/* Revenue */}
        <div
          className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm text-left"
        >
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[9px] font-black text-muted-foreground uppercase">Net Platform Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600">SAR {metrics.netPlatformRevenue.toFixed(2)}</p>
          <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+14.8% vs last period</span>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns: Leaderboard & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* SVG Trend Chart */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-left">
            <h3 className="font-bold text-sm text-foreground">Sales Revenue Trend (SAR)</h3>
            <div className="h-44 w-full relative flex items-end justify-between pt-6 border-b border-l border-border/50 pl-2 pb-1">
              {[35, 48, 40, 65, 58, 80, 95].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div
                    style={{ height: `${val}%` }}
                    className="w-8 sm:w-10 bg-accent/85 rounded-t-lg group-hover:bg-accent transition-all relative flex justify-center"
                  >
                    {/* Tooltip */}
                    <span className="absolute -top-6 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      SAR {val * 10}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-2">Day {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Leaderboard */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground">Provider Leaderboard</h3>
              
              <div className="flex gap-1.5 bg-secondary/35 p-1 rounded-xl">
                {(["revenue", "bookings", "rating"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLeaderboardSort(opt)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold capitalize transition-all ${
                      leaderboardSort === opt ? "bg-accent text-white" : "text-muted-foreground"
                    }`}
                  >
                    By {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card text-left">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
                    <th className="p-4">Provider Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Completed Bookings</th>
                    <th className="p-4">Gross Revenue</th>
                    <th className="p-4">Average Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => (
                    <tr key={item.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-0 transition-colors">
                      <td className="p-4 font-bold text-foreground">{item.name}</td>
                      <td className="p-4 capitalize text-muted-foreground">{item.type}</td>
                      <td className="p-4 text-foreground font-semibold">{item.bookings} Sessions</td>
                      <td className="p-4 text-emerald-600 font-bold">SAR {item.revenue.toFixed(2)}</td>
                      <td className="p-4 flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        <span>{item.rating.toFixed(1)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Category Performance Sheet */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-left">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">Category Performance Breakdown</h3>
          
          <div className="space-y-4">
            {[
              { category: "Nutritionists", bookings: 12, revenue: 1800, rating: 4.9 },
              { category: "Personal Trainers", bookings: 8, revenue: 1600, rating: 4.8 },
              { category: "Wellness Centers", bookings: 4, revenue: 800, rating: 4.7 },
            ].map((cat, idx) => (
              <div key={idx} className="pb-3 border-b border-border/30 last:border-0 last:pb-0 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">{cat.category}</span>
                  <span className="text-emerald-600">SAR {cat.revenue}</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{cat.bookings} Paid Bookings</span>
                  <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    {cat.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* DRILL-DOWN SUB-GRID MODAL */}
      {drillDownType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in text-left">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrillDownType(null)} />
          
          <div className="relative bg-white border rounded-[32px] w-full max-w-3xl p-8 shadow-glow z-10 overflow-hidden text-slate-900 animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-border/40 mb-6">
              <h3 className="font-display font-black text-lg text-[#173B63] capitalize">
                {drillDownType} Drill-down Ledger Detail
              </h3>
              <button onClick={() => setDrillDownType(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 rounded-2xl border">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/20 text-muted-foreground border-b font-bold">
                    <th className="p-4">Tx ID</th>
                    <th className="p-4">Booking Ref</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Gross Value</th>
                    <th className="p-4">Commission</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerTransactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b hover:bg-slate-50 last:border-0 transition-colors">
                      <td className="p-4 font-mono font-bold">{tx.id}</td>
                      <td className="p-4 font-mono text-slate-500">{tx.bookingId}</td>
                      <td className="p-4 font-bold">{tx.customerName}</td>
                      <td className="p-4 text-slate-600">{tx.providerName}</td>
                      <td className="p-4 text-slate-900 font-bold">SAR {tx.gross}</td>
                      <td className="p-4 text-red-500 font-semibold">SAR {tx.commission}</td>
                      <td className="p-4 text-slate-400">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

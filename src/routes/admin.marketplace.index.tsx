import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Users,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  MessageSquare,
  Activity,
  Layers,
} from "lucide-react";
import { getStoredProviders, getStoredServices, getProviderAppointments, getProviderPayouts } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/")({
  component: AdminMarketplaceDashboard,
});

function AdminMarketplaceDashboard() {
  const [providers] = useState(() => getStoredProviders());
  const [services] = useState(() => getStoredServices());

  // Local storage states for disputes/refunds/payouts count badge
  const [disputes] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_disputes");
    return raw ? JSON.parse(raw) : [];
  });

  const [refunds] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_refunds");
    return raw ? JSON.parse(raw) : [];
  });

  // Calculate detailed dashboard stats
  const stats = useMemo(() => {
    let totalBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;
    let grossSales = 0;

    providers.forEach((p) => {
      const appointments = getProviderAppointments(p.id);
      totalBookings += appointments.length;
      completedBookings += appointments.filter((a) => a.status === "Completed").length;
      cancelledBookings += appointments.filter((a) => a.status === "Cancelled" || a.status === "Rejected" || a.status === "Refunded").length;
      grossSales += appointments.filter((a) => a.status === "Completed").length * 150;
    });

    const totalProviders = providers.length;
    const pendingVerification = providers.filter((p) => !p.verified).length;
    const approvedProviders = providers.filter((p) => p.verified).length;
    const suspendedProviders = providers.filter((p) => p.name.includes("(Suspended)")).length;

    const commission = grossSales * 0.15;
    const providerEarnings = grossSales - commission;
    
    // Payout requests outstanding
    let pendingPayouts = 0;
    providers.forEach((p) => {
      const payoutList = getProviderPayouts(p.id);
      pendingPayouts += payoutList.filter((pay) => pay.status === "Pending").reduce((sum, pay) => sum + pay.amount, 0);
    });

    return {
      providers: {
        total: totalProviders,
        pending: pendingVerification,
        approved: approvedProviders,
        suspended: suspendedProviders,
      },
      bookings: {
        today: Math.round(totalBookings * 0.2) || 1,
        upcoming: totalBookings - completedBookings - cancelledBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      financial: {
        gross: grossSales,
        commission,
        earnings: providerEarnings,
        pendingPayout: pendingPayouts,
      },
      activity: {
        activeCustomers: 42,
        newCustomers: 12,
        openDisputes: disputes.filter((d) => d.status === "Open" || d.status === "Under Review").length,
        pendingReviews: 3,
      },
    };
  }, [providers, disputes]);

  // Chart data trend view toggle: "daily", "weekly", "monthly"
  const [trendView, setTrendView] = useState<"daily" | "weekly" | "monthly">("monthly");

  const trendData = useMemo(() => {
    if (trendView === "daily") {
      return [
        { label: "Sun", bookings: 12, sales: 1800 },
        { label: "Mon", bookings: 18, sales: 2700 },
        { label: "Tue", bookings: 15, sales: 2250 },
        { label: "Wed", bookings: 22, sales: 3300 },
        { label: "Thu", bookings: 25, sales: 3750 },
      ];
    }
    if (trendView === "weekly") {
      return [
        { label: "Week 1", bookings: 45, sales: 6750 },
        { label: "Week 2", bookings: 60, sales: 9000 },
        { label: "Week 3", bookings: 55, sales: 8250 },
        { label: "Week 4", bookings: 75, sales: 11250 },
      ];
    }
    return [
      { label: "Apr", bookings: 120, sales: 18000 },
      { label: "May", bookings: 150, sales: 22500 },
      { label: "Jun", bookings: 180, sales: 27000 },
      { label: "Jul", bookings: 210, sales: 31500 },
      { label: "Aug", bookings: 240, sales: 36000 },
    ];
  }, [trendView]);

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Marketplace Control Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor providers, bookings, revenue, verification and marketplace activity.</p>
        </div>
      </div>

      {/* Action Notification Badges Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Pending Verification", count: stats.providers.pending, link: "/admin/marketplace/verification", color: "text-amber-600 bg-amber-500/10" },
          { label: "Pending Service Reviews", count: services.filter((s) => s.id.startsWith("srv-custom")).length || 1, link: "/admin/marketplace/services", color: "text-blue-600 bg-blue-500/10" },
          { label: "Open Disputes", count: stats.activity.openDisputes, link: "/admin/marketplace/disputes", color: "text-red-600 bg-red-500/10 animate-pulse" },
          { label: "Pending Refunds", count: refunds.filter((r) => r.status === "Requested").length, link: "/admin/marketplace/refunds", color: "text-red-600 bg-red-500/10" },
          { label: "Pending Payouts", count: providers.length > 0 ? 2 : 0, link: "/admin/marketplace/payouts", color: "text-amber-600 bg-amber-500/10" },
          { label: "Flagged Reviews", count: 1, link: "/admin/marketplace/reviews", color: "text-red-600 bg-red-500/10" },
        ].map((badge) => (
          <Link
            key={badge.label}
            to={badge.link}
            className={`p-3.5 rounded-2xl border border-transparent flex flex-col justify-between hover:shadow-soft transition-all duration-200 ${badge.color}`}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider leading-normal">{badge.label}</span>
            <span className="text-xl font-black mt-1.5">{badge.count}</span>
          </Link>
        ))}
      </div>

      {/* Primary KPI Grid Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {/* PROVIDERS */}
        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Providers</span>
            <Users className="h-4.5 w-4.5 text-accent" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Providers</span>
              <span className="font-bold text-foreground">{stats.providers.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Verification</span>
              <span className="font-bold text-amber-500">{stats.providers.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approved Active</span>
              <span className="font-bold text-emerald-600">{stats.providers.approved}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suspended Account</span>
              <span className="font-bold text-red-500">{stats.providers.suspended}</span>
            </div>
          </div>
        </div>

        {/* BOOKINGS */}
        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Bookings</span>
            <Calendar className="h-4.5 w-4.5 text-accent" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Today's Bookings</span>
              <span className="font-bold text-foreground">{stats.bookings.today}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Upcoming Sessions</span>
              <span className="font-bold text-foreground">{stats.bookings.upcoming}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed Sessions</span>
              <span className="font-bold text-emerald-600">{stats.bookings.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancelled/Refunded</span>
              <span className="font-bold text-red-500">{stats.bookings.cancelled}</span>
            </div>
          </div>
        </div>

        {/* FINANCIALS */}
        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Financials</span>
            <DollarSign className="h-4.5 w-4.5 text-accent" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Sales</span>
              <span className="font-bold text-foreground">SAR {stats.financial.gross}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Optivita Commission</span>
              <span className="font-bold text-accent">SAR {stats.financial.commission}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider Share</span>
              <span className="font-bold text-emerald-600">SAR {stats.financial.earnings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Payouts</span>
              <span className="font-bold text-amber-500">SAR {stats.financial.pendingPayout}</span>
            </div>
          </div>
        </div>

        {/* ACTIVITY */}
        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Customer Activity</span>
            <Activity className="h-4.5 w-4.5 text-accent" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Customers</span>
              <span className="font-bold text-foreground">{stats.activity.activeCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Signups</span>
              <span className="font-bold text-foreground">{stats.activity.newCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Disputes</span>
              <span className="font-bold text-red-500">{stats.activity.openDisputes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Reviews</span>
              <span className="font-bold text-amber-500">{stats.activity.pendingReviews}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Overview Trends split */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Bookings & Revenue chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border/60 bg-card space-y-6">
          <div className="flex justify-between items-center pb-3 border-b">
            <h3 className="font-bold text-sm text-foreground">Marketplace Sales Performance</h3>
            <div className="flex gap-1.5 bg-secondary/35 p-1 rounded-xl">
              {(["daily", "weekly", "monthly"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setTrendView(view)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold capitalize transition-all ${
                    trendView === view ? "bg-accent text-white" : "text-muted-foreground"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="h-48 flex items-end gap-3.5 pt-4">
            {trendData.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full bg-secondary/35 rounded-t-lg relative h-36 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-accent to-emerald-500 rounded-t-lg transition-all duration-500 group-hover:opacity-90"
                    style={{ height: `${(d.sales / Math.max(...trendData.map((x) => x.sales))) * 100}%` }}
                  />
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold bg-slate-900 text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    SAR {d.sales}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Category Performance Sheet */}
        <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4">
          <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b pb-2">
            <Layers className="h-4.5 w-4.5 text-accent" />
            Category Performance
          </h3>
          <div className="space-y-3.5 text-xs">
            {[
              { cat: "🥗 Nutrition", bookings: 140, sales: 21000, prov: 2, rating: "4.9 ★" },
              { cat: "🏋️ Fitness", bookings: 85, sales: 12750, prov: 1, rating: "4.8 ★" },
              { cat: "🏢 Gyms", bookings: 12, sales: 1800, prov: 1, rating: "4.5 ★" },
              { cat: "🧘 Wellness", bookings: 3, sales: 450, prov: 1, rating: "5.0 ★" },
            ].map((perf) => (
              <div key={perf.cat} className="pb-3 border-b last:border-0 last:pb-0 space-y-1">
                <div className="flex justify-between font-bold text-foreground">
                  <span>{perf.cat}</span>
                  <span>SAR {perf.sales}</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{perf.bookings} bookings • {perf.prov} providers</span>
                  <span className="font-bold text-amber-500">{perf.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

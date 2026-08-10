import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calendar,
  Users,
  DollarSign,
  Star,
  Clock,
  Video,
  MapPin,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { getProviderAppointments } from "@/lib/marketplaceData";

export const Route = createFileRoute("/provider/")({
  component: ProviderDashboardHome,
});

function ProviderDashboardHome() {
  const [provider, setProvider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const appointments = useMemo(() => {
    return provider ? getProviderAppointments(provider.id) : [];
  }, [provider]);

  // Compute Dashboard Metrics
  const metrics = useMemo(() => {
    const upcoming = appointments.filter((a) => a.status === "Upcoming" || a.status === "Pending").length;
    const completed = appointments.filter((a) => a.status === "Completed").length;
    const rating = provider?.rating || 4.9;
    const totalRevenue = completed * 150; // Mock calculation based on SAR 150/session
    
    return {
      upcomingCount: upcoming,
      totalClients: completed + upcoming + 5, // Mock total
      monthlyRevenue: totalRevenue + 1200, // Add initial base
      payoutPending: totalRevenue * 0.85, // Net after 15% commission split
      avgRating: rating,
    };
  }, [appointments, provider]);

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">
            Good Day, {provider?.name || "Provider"} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here is your practice summary and upcoming client schedule for today.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Appointments */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between shadow-sm">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Upcoming Sessions</span>
            <p className="text-2xl font-black text-foreground">{metrics.upcomingCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2: Total Clients */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between shadow-sm">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Clients</span>
            <p className="text-2xl font-black text-foreground">{metrics.totalClients}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3: Monthly Revenue */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between shadow-sm">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Gross Earnings</span>
            <p className="text-2xl font-black text-foreground">SAR {metrics.monthlyRevenue}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4: Average Rating */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between shadow-sm">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Avg Rating</span>
            <p className="text-2xl font-black text-foreground">{metrics.avgRating} ★</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Star className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main split view: Appointments + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left: Schedule list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Today's Scheduled Consultations</h3>
            <Link to="/provider/appointments" className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1">
              <span>View All Calendar</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {appointments.slice(0, 3).map((apt) => (
              <div key={apt.id} className="p-4.5 rounded-2xl border border-border/60 bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary/40 flex items-center justify-center text-muted-foreground">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-foreground">{apt.customerName}</h4>
                    <p className="text-[10px] text-muted-foreground">{apt.serviceTitle}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                      <span className="font-semibold text-foreground">{apt.time}</span>
                      <span>•</span>
                      <span>{apt.duration} mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                  {apt.type === "online" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <Video className="h-3.5 w-3.5" />
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                      <MapPin className="h-3.5 w-3.5" />
                      In-Person
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                    apt.status === "Upcoming" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <p className="text-xs text-muted-foreground py-8 text-center bg-card rounded-2xl border border-dashed">
                No appointments scheduled for today.
              </p>
            )}
          </div>
        </div>

        {/* Right: Revenue Split Information */}
        <aside className="p-6 rounded-2xl border border-border/60 bg-card space-y-6">
          <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
            <TrendingUp className="h-4.5 w-4.5 text-accent" />
            Optivita Revenue Split
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All bookings transacted on the platform are subject to the default commission split.
          </p>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Standard Commission Split</span>
              <span className="font-semibold text-foreground">15% Optivita</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider Share</span>
              <span className="font-semibold text-foreground">85% Earnings</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-border/30">
              <span className="text-muted-foreground">Net Payout Accrued</span>
              <span className="font-black text-accent">SAR {metrics.payoutPending}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border/30">
            <Link to="/provider/earnings" className="w-full py-2.5 rounded-xl bg-accent text-white font-bold text-xs flex items-center justify-center gap-1 shadow-soft hover:opacity-90">
              <span>View Financial Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Clock, Video, MapPin, Check, X, Calendar, RefreshCw } from "lucide-react";
import { getProviderAppointments, saveProviderAppointments } from "@/lib/marketplaceData";

export const Route = createFileRoute("/provider/appointments")({
  component: ProviderAppointmentsList,
});

function ProviderAppointmentsList() {
  const [provider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const [appointments, setAppointments] = useState<any[]>(() => {
    return provider ? getProviderAppointments(provider.id) : [];
  }, [provider]);

  // Tab filter: "all", "upcoming", "pending", "completed", "cancelled"
  const [activeTab, setActiveTab] = useState("upcoming");

  const filteredList = useMemo(() => {
    if (activeTab === "all") return appointments;
    if (activeTab === "upcoming") {
      return appointments.filter((a) => a.status === "Upcoming");
    }
    if (activeTab === "pending") {
      return appointments.filter((a) => a.status === "Pending");
    }
    if (activeTab === "completed") {
      return appointments.filter((a) => a.status === "Completed");
    }
    if (activeTab === "cancelled") {
      return appointments.filter((a) => a.status === "Cancelled" || a.status === "Rejected");
    }
    return appointments;
  }, [activeTab, appointments]);

  const updateAppointmentStatus = (id: string, newStatus: string) => {
    if (!provider) return;
    const updated = appointments.map((a) => {
      if (a.id === id) {
        return { ...a, status: newStatus };
      }
      return a;
    });
    saveProviderAppointments(provider.id, updated);
    setAppointments(updated);
    toast.success(`Booking status marked as: ${newStatus}`);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Appointment Ledger</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Approve incoming requests, join sessions, and manage statuses</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {[
          { id: "upcoming", label: "Upcoming" },
          { id: "pending", label: "Pending Approvals" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled / Rejected" },
          { id: "all", label: "All Sessions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeTab === tab.id
                ? "bg-accent border-accent text-white shadow-soft"
                : "bg-card border-border/60 hover:bg-secondary/20 text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredList.map((apt) => (
          <div
            key={apt.id}
            className="p-5 rounded-2xl border border-border/60 bg-card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-soft transition-all duration-300"
          >
            {/* Left Content */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-secondary/40 flex items-center justify-center text-muted-foreground shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-sm text-foreground">{apt.customerName}</h3>
                  <span className="text-[9px] font-mono bg-secondary/45 text-foreground px-2 py-0.5 rounded">
                    {apt.id}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{apt.serviceTitle}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground pt-1.5">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    <span className="font-semibold text-foreground">{apt.date}</span>
                    <span>at</span>
                    <span className="font-semibold text-foreground">{apt.time}</span>
                  </div>
                  <span>•</span>
                  <span>{apt.duration} mins</span>
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-border/30">
              {/* Type tag */}
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                {apt.type === "online" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Video className="h-4 w-4" />
                    Online Video Meet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                    <MapPin className="h-4 w-4" />
                    In-Person visit
                  </span>
                )}
                
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                  apt.status === "Completed"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : apt.status === "Cancelled" || apt.status === "Rejected"
                    ? "bg-red-500/10 text-red-600"
                    : apt.status === "Pending"
                    ? "bg-amber-500/10 text-amber-600 animate-pulse"
                    : "bg-sky-500/10 text-sky-600"
                }`}>
                  {apt.status}
                </span>
              </div>

              {/* Action Buttons */}
              {apt.status === "Pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateAppointmentStatus(apt.id, "Upcoming")}
                    className="flex-grow py-2 px-4 rounded-xl bg-accent text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus(apt.id, "Rejected")}
                    className="py-2 px-3.5 rounded-xl border border-border/60 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 text-xs font-bold"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {apt.status === "Upcoming" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateAppointmentStatus(apt.id, "Completed")}
                    className="flex-grow py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Complete</span>
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus(apt.id, "Cancelled")}
                    className="py-2 px-3.5 rounded-xl border border-border/60 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 text-xs font-bold"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {filteredList.length === 0 && (
          <p className="text-xs text-muted-foreground py-16 text-center bg-card rounded-2xl border border-dashed">
            No consultations found matching the status: <span className="font-bold capitalize text-foreground">{activeTab}</span>.
          </p>
        )}
      </div>
    </div>
  );
}

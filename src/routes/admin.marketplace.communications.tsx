import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Mail, MessageSquare, AlertCircle, RefreshCw, Send, Check, Settings } from "lucide-react";

export const Route = createFileRoute("/admin/marketplace/communications")({
  component: AdminCommunicationsCenter,
});

function AdminCommunicationsCenter() {
  const [activeSubTab, setActiveSubTab] = useState<"logs" | "templates" | "automations">("logs");

  const [commLogs, setCommLogs] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_communication_logs");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const initial = [
      {
        id: "COM-801",
        recipientId: "cust-1",
        channel: "email",
        event: "booking.confirmed",
        templateId: "booking.confirmed",
        sentAt: "2026-08-09T12:00:00Z",
        status: "Delivered",
      },
      {
        id: "COM-802",
        recipientId: "prov-3",
        channel: "email",
        event: "payout.paid",
        templateId: "payout.paid",
        sentAt: "2026-08-09T13:30:00Z",
        status: "Failed",
        failureReason: "SMTP connection pool exhausted",
      },
      {
        id: "COM-803",
        recipientId: "cust-1",
        channel: "whatsapp",
        event: "payment.success",
        templateId: "payment.success",
        sentAt: "2026-08-09T14:15:00Z",
        status: "Delivered",
      },
    ];
    localStorage.setItem("optivita_marketplace_communication_logs", JSON.stringify(initial));
    return initial;
  });

  const stats = useMemo(() => {
    const total = commLogs.length;
    const emails = commLogs.filter((l) => l.channel === "email").length;
    const whatsapp = commLogs.filter((l) => l.channel === "whatsapp").length;
    const failed = commLogs.filter((l) => l.status === "Failed").length;

    return { total, emails, whatsapp, failed };
  }, [commLogs]);

  const handleRetryDelivery = (id: string) => {
    const updated = commLogs.map((l) => {
      if (l.id === id) {
        return { ...l, status: "Delivered", failureReason: undefined };
      }
      return l;
    });
    setCommLogs(updated);
    localStorage.setItem("optivita_marketplace_communication_logs", JSON.stringify(updated));

    // Audit logs
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action: "Retried Communication Delivery",
      entityType: "Communication",
      entityId: id,
      previousState: "Failed",
      newState: "Delivered",
      reason: "Manually re-queued message SMTP dispatch.",
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    toast.success(`Message delivery retry triggered successfully for job ${id}!`);
  };

  return (
    <div className="space-y-10 text-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Communications Automation Center</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction notification dispatches, verify signature templates, and manage WhatsApp event rules</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-secondary/35 p-1 rounded-xl">
          {[
            { id: "logs", label: "Delivery Logs" },
            { id: "templates", label: "Templates" },
            { id: "automations", label: "Automation Rules" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
                activeSubTab === tab.id ? "bg-accent text-white" : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === "logs" && (
        <>
          {/* Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm">
              <span className="text-[9px] font-black text-muted-foreground uppercase">Total Dispatched</span>
              <p className="text-xl font-black text-foreground">{stats.total} Messages</p>
            </div>
            <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm">
              <span className="text-[9px] font-black text-muted-foreground uppercase">Email Deliveries</span>
              <p className="text-xl font-black text-foreground">{stats.emails} Sent</p>
            </div>
            <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm">
              <span className="text-[9px] font-black text-muted-foreground uppercase">WhatsApp Deliveries</span>
              <p className="text-xl font-black text-foreground">{stats.whatsapp} Sent</p>
            </div>
            <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm">
              <span className="text-[9px] font-black text-red-500 uppercase">Failed jobs</span>
              <p className="text-xl font-black text-red-500">{stats.failed} Errors</p>
            </div>
          </div>

          {/* Delivery Table */}
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
                  <th className="p-4">Delivery ID</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Trigger Event</th>
                  <th className="p-4">Dispatched Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commLogs.map((l) => (
                  <tr key={l.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-0 transition-colors">
                    <td className="p-4 font-mono font-bold text-foreground">{l.id}</td>
                    <td className="p-4 font-semibold text-foreground">{l.recipientId}</td>
                    <td className="p-4 capitalize text-muted-foreground">{l.channel}</td>
                    <td className="p-4 text-foreground font-mono">{l.event}</td>
                    <td className="p-4 text-muted-foreground">{new Date(l.sentAt).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        l.status === "Delivered" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
                      }`}>
                        {l.status}
                      </span>
                      {l.failureReason && (
                        <span className="block text-[9px] text-red-400 mt-1">“{l.failureReason}”</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {l.status === "Failed" && (
                        <button
                          onClick={() => handleRetryDelivery(l.id)}
                          className="px-3 py-1.5 rounded-full border border-border hover:bg-secondary text-accent font-bold"
                        >
                          Retry Dispatch
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeSubTab === "templates" && (
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {[
            { id: "booking.confirmed", label: "Booking Confirmation Template" },
            { id: "payment.success", label: "Payment success Template" },
            { id: "payout.paid", label: "Payout confirmation Template" },
          ].map((t) => (
            <div key={t.id} className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-foreground pb-2 border-b">{t.label}</h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">English Preview</span>
                  <p className="p-3 bg-secondary/15 rounded-xl border border-border/30">
                    Subject: Appointment Confirmed<br/>
                    Hi {"{customerName}"}, your session is scheduled.
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Arabic Preview (RTL)</span>
                  <p className="p-3 bg-secondary/15 rounded-xl border border-border/30" dir="rtl">
                    الموضوع: تأكيد الموعد<br/>
                    مرحباً {"{customerName}"}، تم جدولة جلستك بنجاح.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === "automations" && (
        <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm max-w-xl">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 pb-2 border-b">
            <Settings className="h-4.5 w-4.5 text-accent" />
            Notification Automation Mappings
          </h3>

          <div className="space-y-4">
            {[
              { event: "booking.confirmed", action: "Notify Customer & Provider", channels: ["Email", "In-App"] },
              { event: "payment.success", action: "Log Ledger Entry & Invoice Receipt", channels: ["Email", "WhatsApp"] },
              { event: "payout.paid", action: "Send Security Transfer Alert", channels: ["In-App", "SMS-Ready"] },
            ].map((rule, idx) => (
              <div key={idx} className="flex justify-between items-center pb-3 border-b border-border/30 last:border-0 last:pb-0">
                <div>
                  <span className="font-bold text-foreground block">{rule.event}</span>
                  <span className="text-[10px] text-muted-foreground">{rule.action}</span>
                </div>
                <div className="flex gap-2">
                  {rule.channels.map((chan) => (
                    <span key={chan} className="px-2 py-0.5 bg-accent/10 text-accent font-bold text-[8px] rounded uppercase">
                      {chan}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

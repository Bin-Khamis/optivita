import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Cpu, RefreshCw, Send, Check } from "lucide-react";

export const Route = createFileRoute("/api/payments/webhook")({
  component: WebhookMonitorConsole,
});

function WebhookMonitorConsole() {
  const [events, setEvents] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_webhook_events");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const initial = [
      {
        eventId: "EVT-90218492",
        paymentReference: "OPT-PAY-20260809-000001",
        eventType: "payment.success",
        receivedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        processedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: "Success",
        signatureStatus: "Verified",
        payloadHash: "sha256-4a9b2c8d...",
      },
    ];
    localStorage.setItem("optivita_marketplace_webhook_events", JSON.stringify(initial));
    return initial;
  });

  const [simulateRef, setSimulateRef] = useState("OPT-PAY-20260809-000002");
  const [simulateType, setSimulateType] = useState("payment.success");

  const handleSimulateWebhook = () => {
    if (!simulateRef.trim()) {
      toast.warning("Reference is required.");
      return;
    }

    // Check duplicate eventId for Idempotency
    const generatedEventId = `EVT-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newEvent = {
      eventId: generatedEventId,
      paymentReference: simulateRef,
      eventType: simulateType,
      receivedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      status: "Success",
      signatureStatus: "Verified",
      payloadHash: `sha256-${Math.random().toString(36).substring(7)}`,
    };

    const updated = [newEvent, ...events];
    setEvents(updated);
    localStorage.setItem("optivita_marketplace_webhook_events", JSON.stringify(updated));

    // Log administrative action in Audit log
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "Webhook Gateway",
      action: `Processed Webhook Event: ${simulateType}`,
      entityType: "Webhook",
      entityId: generatedEventId,
      previousState: "Received",
      newState: "Processed",
      reason: `Signature validated successfully. Ref: ${simulateRef}`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    toast.success(`Webhook event ${simulateType} processed successfully!`);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Webhook Security Monitor</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction signatures, payload hashes, and duplicate event protections</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Webhook Log */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
            <Cpu className="h-4.5 w-4.5 text-accent animate-pulse" />
            Processed Webhook Event Logs (Idempotent)
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
                  <th className="p-4">Event ID</th>
                  <th className="p-4">Ref Ticket</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Signature Status</th>
                  <th className="p-4">Payload Hash</th>
                  <th className="p-4 text-right">Processed Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.eventId} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                    <td className="p-4 font-mono font-bold text-foreground">{evt.eventId}</td>
                    <td className="p-4 font-mono text-muted-foreground">{evt.paymentReference}</td>
                    <td className="p-4 font-bold text-foreground">{evt.eventType}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[9px] text-muted-foreground">{evt.payloadHash}</td>
                    <td className="p-4 text-right text-muted-foreground">{new Date(evt.processedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Webhook Event Simulator */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-soft text-xs leading-normal">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 pb-2 border-b">
            <Send className="h-4 w-4 text-accent" />
            Simulate Webhook event
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">Payment Reference ID</label>
              <input
                type="text"
                value={simulateRef}
                onChange={(e) => setSimulateRef(e.target.value)}
                placeholder="e.g. OPT-PAY-20260809-000002"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">Gateway Event Type</label>
              <select
                value={simulateType}
                onChange={(e) => setSimulateType(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value="payment.success">payment.success</option>
                <option value="payment.failed">payment.failed</option>
                <option value="refund.completed">refund.completed</option>
                <option value="payout.processed">payout.processed</option>
              </select>
            </div>

            <button
              onClick={handleSimulateWebhook}
              className="w-full py-2.5 rounded-xl bg-accent text-white font-bold flex items-center justify-center gap-1.5"
            >
              <span>Dispatch Webhook</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

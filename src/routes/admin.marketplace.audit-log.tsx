import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Calendar, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/marketplace/audit-log")({
  component: AdminAuditTrailLog,
});

function AdminAuditTrailLog() {
  const [search, setSearch] = useState("");

  const auditLogs = useMemo(() => {
    const raw = localStorage.getItem("optivita_marketplace_audit_logs");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const initial = [
      {
        id: "AUD-801",
        adminId: "John Admin",
        action: "Approved Provider Verification",
        entityType: "Provider",
        entityId: "prov-101",
        previousState: "Under Review",
        newState: "Approved",
        reason: "Professional SCHS credentials validated successfully.",
        timestamp: "2026-08-09T10:30:15Z",
      },
      {
        id: "AUD-802",
        adminId: "Sarah Admin",
        action: "Commission Rate Adjusted",
        entityType: "Commission",
        entityId: "commission-nutritionist",
        previousState: "15%",
        newState: "12%",
        reason: "Metabolic care promotion discount adjustments.",
        timestamp: "2026-08-08T14:45:00Z",
      },
    ];
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(initial));
    return initial;
  }, []);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.adminId.toLowerCase().includes(search.toLowerCase()) ||
        log.reason.toLowerCase().includes(search.toLowerCase()) ||
        log.entityId.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [auditLogs, search]);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Marketplace Audit Logs Trail</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit administrative actions, policy adjustments, and system status logs</p>
        </div>
      </div>

      {/* Control row */}
      <div className="flex gap-3 justify-between max-w-md">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, admin name, entity ref..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Logs Trail Feed */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <div key={log.id} className="p-4.5 rounded-2xl border border-border/60 bg-card space-y-2.5 shadow-sm text-xs">
            <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b pb-2">
              <span className="font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Admin Ref: {log.adminId}
              </span>
              <span>{new Date(log.timestamp).toLocaleString()}</span>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Action Type</span>
                <span className="font-bold text-foreground">{log.action}</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">State Change</span>
                <span className="font-mono">{log.previousState} ➔ {log.newState}</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-1.5">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Entity Reference</span>
                <span className="font-mono text-muted-foreground capitalize">{log.entityType} ({log.entityId})</span>
              </div>
              {log.reason && (
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Justification Reason</span>
                  <p className="italic text-muted-foreground">“{log.reason}”</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <p className="text-xs text-muted-foreground py-16 text-center bg-card rounded-2xl border border-dashed">
            No audit records matched search query.
          </p>
        )}
      </div>
    </div>
  );
}

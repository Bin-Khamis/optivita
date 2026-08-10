import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Shield, ShieldAlert, ShieldAlert as ShieldWarning, Search, Calendar, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/security/audit-log")({
  component: AdminSecurityAuditLog,
});

function AdminSecurityAuditLog() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const [logs, setLogs] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_audit_logs");
    if (raw) {
      try {
        const list = JSON.parse(raw);
        // Append mock severity levels to existing logs
        return list.map((l: any, idx: number) => {
          let level = "INFO";
          if (l.action.includes("Suspended") || l.action.includes("Bank")) {
            level = "CRITICAL";
          } else if (l.action.includes("Rejected") || l.action.includes("Settings")) {
            level = "WARNING";
          }
          return {
            id: l.id || `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
            actor: l.adminId || "System Gateway",
            action: l.action,
            entityType: l.entityType || "System",
            entityId: l.entityId || "-",
            reason: l.reason || "Operational audit verification trail.",
            timestamp: l.timestamp || new Date().toISOString(),
            level,
          };
        });
      } catch {}
    }
    const initial = [
      {
        id: "AUD-7001",
        actor: "John Admin",
        action: "Updated Payout Bank Details",
        entityType: "Provider",
        entityId: "prov-3",
        reason: "Provider updated destination IBAN details.",
        timestamp: new Date().toISOString(),
        level: "CRITICAL",
      },
      {
        id: "AUD-7002",
        actor: "System Gateway",
        action: "Processed Webhook Signature check",
        entityType: "Webhook",
        entityId: "EVT-9028",
        reason: "Webhook signature verified successfully.",
        timestamp: new Date().toISOString(),
        level: "INFO",
      },
    ];
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(initial));
    return initial;
  });

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        l.actor.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.id.toLowerCase().includes(search.toLowerCase());

      const matchLevel = levelFilter === "all" || l.level.toLowerCase() === levelFilter.toLowerCase();
      return matchSearch && matchLevel;
    });
  }, [logs, search, levelFilter]);

  return (
    <div className="space-y-8 text-xs text-left">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Security Audit Trail</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Track administrator operations, verify configuration changes, and monitor credential edits</p>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Actor, Action, reference ID..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full bg-secondary/15 border-border/60 focus:outline-none"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3.5 py-2 border rounded-xl bg-card border-border/60 focus:outline-none"
        >
          <option value="all">All Severity Levels</option>
          <option value="info">INFO</option>
          <option value="warning">WARNING</option>
          <option value="critical">CRITICAL</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
              <th className="p-4">Audit ID</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Action Event</th>
              <th className="p-4">Entity Type / ID</th>
              <th className="p-4">Reason / Notes</th>
              <th className="p-4">Timestamp</th>
              <th className="p-4 text-right">Severity</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((l) => (
              <tr key={l.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-0 transition-colors">
                <td className="p-4 font-mono font-bold text-foreground">{l.id}</td>
                <td className="p-4 font-semibold text-foreground">{l.actor}</td>
                <td className="p-4 text-foreground">{l.action}</td>
                <td className="p-4">
                  <span className="font-bold text-foreground block">{l.entityType}</span>
                  <span className="text-[9px] text-muted-foreground font-mono block">{l.entityId}</span>
                </td>
                <td className="p-4 text-muted-foreground max-w-xs truncate" title={l.reason}>
                  “{l.reason}”
                </td>
                <td className="p-4 text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="p-4 text-right">
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    l.level === "CRITICAL"
                      ? "bg-red-500/10 text-red-500"
                      : l.level === "WARNING"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}>
                    {l.level}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No security audit logs found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

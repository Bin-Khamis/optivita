import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, ShieldAlert, Check, X, ShieldCheck, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/admin/marketplace/reconciliation")({
  component: AdminReconciliationDesk,
});

function AdminReconciliationDesk() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [mismatches, setMismatches] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_reconciliation");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const initial = [
      {
        id: "REC-401",
        date: "2026-08-08",
        entity: "Booking payment mismatch",
        expectedAmount: 150,
        actualAmount: 0,
        difference: 150,
        ref: "BKG-2026-118492",
        status: "Warning",
        type: "Payment missing but booking exists",
      },
      {
        id: "REC-402",
        date: "2026-08-09",
        entity: "Payout amount limit violation",
        expectedAmount: 500,
        actualAmount: 600,
        difference: 100,
        ref: "PAY-904",
        status: "Mismatch",
        type: "Payout request exceeds available balance share",
      },
    ];
    localStorage.setItem("optivita_marketplace_reconciliation", JSON.stringify(initial));
    return initial;
  });

  const filteredMismatches = useMemo(() => {
    return mismatches.filter((m) => {
      const matchSearch =
        m.entity.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        m.ref.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || m.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [mismatches, search, statusFilter]);

  const handleResolveMismatch = (id: string) => {
    const updated = mismatches.map((m) => {
      if (m.id === id) {
        return { ...m, status: "Matched" };
      }
      return m;
    });
    setMismatches(updated);
    localStorage.setItem("optivita_marketplace_reconciliation", JSON.stringify(updated));

    // Audit logs
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action: "Resolved Reconciliation Discrepancy",
      entityType: "Reconciliation",
      entityId: id,
      previousState: "Mismatch",
      newState: "Matched",
      reason: "Manually adjusted invoice records split values.",
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    toast.success(`Discrepancy record ${id} resolved successfully!`);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Reconciliation Desk</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction invoices, balance mismatches, and trace accounting discrepancies</p>
        </div>
      </div>

      {/* Control row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, Entity, Reference..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border rounded-xl text-xs bg-card border-border/60 focus:outline-none"
        >
          <option value="all">All Discrepancy Status</option>
          <option value="warning">Warning</option>
          <option value="mismatch">Mismatch</option>
          <option value="matched">Matched</option>
        </select>
      </div>

      {/* Reconciliation Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
              <th className="p-4">Rec ID</th>
              <th className="p-4">Entity Type / Date</th>
              <th className="p-4">Reference ID</th>
              <th className="p-4">Expected Value</th>
              <th className="p-4">Actual Value</th>
              <th className="p-4">Difference</th>
              <th className="p-4">Discrepancy Details</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMismatches.map((m) => (
              <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                <td className="p-4 font-mono font-bold text-foreground">{m.id}</td>
                <td className="p-4">
                  <span className="font-bold text-foreground block">{m.entity}</span>
                  <span className="text-[9px] text-muted-foreground block">{m.date}</span>
                </td>
                <td className="p-4 font-mono text-muted-foreground">{m.ref}</td>
                <td className="p-4">SAR {m.expectedAmount}</td>
                <td className="p-4">SAR {m.actualAmount}</td>
                <td className="p-4 text-red-500 font-bold">SAR {m.difference}</td>
                <td className="p-4 text-muted-foreground max-w-xs truncate" title={m.type}>
                  {m.type}
                </td>
                <td className="p-4">
                  {m.status !== "Matched" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleResolveMismatch(m.id)}
                        className="p-1.5 rounded border hover:bg-secondary text-emerald-600 font-bold text-[9px] flex items-center gap-1"
                        title="Mark Resolved"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Resolve</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end items-center gap-1 text-emerald-650 text-[10px] font-bold">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Matched</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredMismatches.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No discrepancy items found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

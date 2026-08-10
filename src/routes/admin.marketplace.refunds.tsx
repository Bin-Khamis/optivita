import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Eye, Check, X, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/marketplace/refunds")({
  component: AdminRefundsLedger,
});

function AdminRefundsLedger() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [refunds, setRefunds] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_refunds");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const initial = [
      {
        id: "REF-501",
        bookingId: "APT-803",
        customerName: "Tariq Mansoor",
        providerName: "Khalid Mansoor",
        originalAmount: 200,
        refundAmount: 200,
        reason: "Trainer cancelled session 1 hour before start.",
        status: "Completed",
        date: "2026-08-05",
      },
      {
        id: "REF-502",
        bookingId: "APT-802",
        customerName: "Amal Al-Otaibi",
        providerName: "Sarah Al-Ghamdi",
        originalAmount: 250,
        refundAmount: 250,
        reason: "Accidental booking double purchase.",
        status: "Requested",
        date: "2026-08-08",
      },
    ];
    localStorage.setItem("optivita_marketplace_refunds", JSON.stringify(initial));
    return initial;
  });

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      const matchSearch =
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.providerName.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [refunds, search, statusFilter]);

  const handleApproveRefund = (id: string) => {
    const updated = refunds.map((r) => {
      if (r.id === id) {
        return { ...r, status: "Completed" };
      }
      return r;
    });
    setRefunds(updated);
    localStorage.setItem("optivita_marketplace_refunds", JSON.stringify(updated));

    // Audit Log entry
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action: "Approved Refund",
      entityType: "Refund",
      entityId: id,
      previousState: "Requested",
      newState: "Completed",
      reason: "Validated cancel policy guidelines.",
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    toast.success(`Refund request ${id} approved successfully!`);
  };

  const handleRejectRefund = (id: string) => {
    const updated = refunds.map((r) => {
      if (r.id === id) {
        return { ...r, status: "Rejected" };
      }
      return r;
    });
    setRefunds(updated);
    localStorage.setItem("optivita_marketplace_refunds", JSON.stringify(updated));
    toast.error(`Refund request ${id} rejected.`);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Refund Claims Desk</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction invoices, commission splits, and complete refunds</p>
        </div>
      </div>

      {/* Control Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Refund ID, Client, Provider..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border rounded-xl text-xs bg-card border-border/60 focus:outline-none"
        >
          <option value="all">All Refund Status</option>
          <option value="requested">Requested</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Refunds Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
              <th className="p-4">Refund ID</th>
              <th className="p-4">Booking Ref</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Refund Value</th>
              <th className="p-4">Reason Notes</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRefunds.map((r) => (
              <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                <td className="p-4 font-mono font-bold text-foreground">{r.id}</td>
                <td className="p-4 font-mono text-muted-foreground">{r.bookingId}</td>
                <td className="p-4 font-semibold text-foreground">{r.customerName}</td>
                <td className="p-4 text-muted-foreground">{r.providerName}</td>
                <td className="p-4">
                  <span className="font-bold block text-red-500">SAR {r.refundAmount}</span>
                  <span className="text-[9px] text-muted-foreground block">Orig: SAR {r.originalAmount}</span>
                </td>
                <td className="p-4 text-muted-foreground max-w-xs truncate" title={r.reason}>
                  “{r.reason}”
                </td>
                <td className="p-4 text-right">
                  {r.status === "Requested" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApproveRefund(r.id)}
                        className="p-1.5 rounded border hover:bg-secondary text-emerald-600"
                        title="Approve Refund"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleRejectRefund(r.id)}
                        className="p-1.5 rounded border hover:bg-red-50 text-red-500"
                        title="Reject Refund"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      r.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                    }`}>
                      {r.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredRefunds.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No refund requests matched filter settings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Check, X, ShieldAlert, CreditCard, Eye, ArrowUpRight } from "lucide-react";
import { getStoredProviders, getProviderPayouts } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/payouts")({
  component: AdminPayoutsManagement,
});

function AdminPayoutsManagement() {
  const [providers] = useState(() => getStoredProviders());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);

  // Compile all payout requests across providers
  const [payouts, setPayouts] = useState<any[]>(() => {
    let list: any[] = [];
    providers.forEach((prov) => {
      const providerPayouts = getProviderPayouts(prov.id).map((pay) => ({
        ...pay,
        providerId: prov.id,
        providerName: prov.name,
        bankIban: "SA03 8000 •••• •••• •••• 9281",
      }));
      list = [...list, ...providerPayouts];
    });
    return list;
  });

  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const matchSearch = p.providerName.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [payouts, search, statusFilter]);

  const handleApprovePayout = (id: string, providerId: string) => {
    // Check if already completed to prevent duplicate clicks
    const current = payouts.find((p) => p.id === id);
    if (current && current.status === "Completed") {
      toast.warning("This payout has already been processed.");
      return;
    }

    const updated = payouts.map((p) => {
      if (p.id === id) {
        return { ...p, status: "Completed", bankRef: `SAR-TXN-${Math.floor(100000 + Math.random() * 900000)}` };
      }
      return p;
    });
    setPayouts(updated);

    // Save to localStorage provider payouts queue
    const key = `optivita_payouts_${providerId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const list = JSON.parse(raw);
        const nextList = list.map((item: any) => {
          if (item.id === id) {
            return { ...item, status: "Completed", bankRef: `SAR-TXN-${Math.floor(100000 + Math.random() * 900000)}` };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(nextList));
      } catch {}
    }

    // Write audit log
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action: "Approved Provider Bank Payout",
      entityType: "Payout",
      entityId: id,
      previousState: "Pending",
      newState: "Completed",
      reason: "Payout balance cleared successfully.",
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    // Write payouts debit transaction record to ledger
    const rawTxns = localStorage.getItem("optivita_marketplace_transactions");
    let txns = [];
    if (rawTxns) {
      try { txns = JSON.parse(rawTxns); } catch {}
    }
    txns.unshift({
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      bookingId: id,
      customerName: "Provider Account Balance Withdrawal",
      providerName: current?.providerName || "Provider",
      providerId,
      type: "Payout",
      gross: -(current?.amount || 150),
      commission: 0,
      net: -(current?.amount || 150),
      status: "Cleared",
      date: new Date().toISOString().split("T")[0],
    });
    localStorage.setItem("optivita_marketplace_transactions", JSON.stringify(txns));

    toast.success(`Payout ${id} marked as completed and transferred!`);
    setSelectedPayout(null);
  };

  const handleCancelPayout = (id: string, providerId: string) => {
    const updated = payouts.map((p) => {
      if (p.id === id) {
        return { ...p, status: "Cancelled" };
      }
      return p;
    });
    setPayouts(updated);

    const key = `optivita_payouts_${providerId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const list = JSON.parse(raw);
        const nextList = list.map((item: any) => {
          if (item.id === id) {
            return { ...item, status: "Cancelled" };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(nextList));
      } catch {}
    }

    toast.error(`Payout request ${id} cancelled.`);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Payout verification queue</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit provider balance transfers and release funds securely</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Payout ID, Provider name..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border rounded-xl text-xs bg-card border-border/60 focus:outline-none"
        >
          <option value="all">All Payout Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Payouts Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
              <th className="p-4">Payout ID</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Masked IBAN Destination</th>
              <th className="p-4">Requested Date</th>
              <th className="p-4">Transfer Amount</th>
              <th className="p-4">Bank Ref</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.map((p) => (
              <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                <td className="p-4 font-mono font-bold text-foreground">{p.id}</td>
                <td className="p-4 font-semibold text-foreground">{p.providerName}</td>
                <td className="p-4 font-mono text-muted-foreground">{p.bankIban}</td>
                <td className="p-4 text-muted-foreground">{p.date}</td>
                <td className="p-4 font-black text-foreground">SAR {p.amount}</td>
                <td className="p-4 font-mono text-muted-foreground">{p.bankRef}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    p.status === "Completed"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : p.status === "Cancelled"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-amber-500/10 text-amber-600 animate-pulse"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedPayout(p)}
                      className="p-1.5 rounded border hover:bg-secondary text-accent"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {p.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleApprovePayout(p.id, p.providerId)}
                          className="p-1.5 rounded border hover:bg-secondary text-emerald-600"
                          title="Complete Transfer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleCancelPayout(p.id, p.providerId)}
                          className="p-1.5 rounded border hover:bg-red-50 text-red-500"
                          title="Cancel Transfer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredPayouts.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No payout transfer records matched search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payout details modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border p-6 space-y-5 shadow-glow text-xs">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-bold text-sm text-foreground">Payout Audit Slip</h3>
              <button onClick={() => setSelectedPayout(null)}>
                <X className="h-5 w-5 hover:text-red-500" />
              </button>
            </div>

            <div className="space-y-3.5 leading-normal">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payout ID</span>
                <span className="font-mono font-bold text-foreground">{selectedPayout.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-bold text-foreground">{selectedPayout.providerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Amount</span>
                <span className="font-black text-accent">SAR {selectedPayout.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Masked IBAN</span>
                <span className="font-mono text-foreground">{selectedPayout.bankIban}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested Date</span>
                <span className="text-foreground">{selectedPayout.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Reference</span>
                <span className="font-mono text-foreground">{selectedPayout.bankRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                  selectedPayout.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                }`}>
                  {selectedPayout.status}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end gap-2">
              {selectedPayout.status === "Pending" && (
                <button
                  onClick={() => handleApprovePayout(selectedPayout.id, selectedPayout.providerId)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Approve Payout
                </button>
              )}
              <button onClick={() => setSelectedPayout(null)} className="px-5 py-2 rounded-xl bg-accent text-white font-bold">
                Close Audit Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

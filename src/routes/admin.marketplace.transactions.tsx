import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, DollarSign, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { getStoredProviders, getProviderAppointments } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/transactions")({
  component: AdminTransactionsLedger,
});

function AdminTransactionsLedger() {
  const [providers] = useState(() => getStoredProviders());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");

  const transactions = useMemo(() => {
    // Check if custom transactions exist in localStorage
    const raw = localStorage.getItem("optivita_marketplace_transactions");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }

    // Default mock transactions generated from bookings
    let list: any[] = [];
    providers.forEach((prov) => {
      const appointments = getProviderAppointments(prov.id).filter((a) => a.status === "Completed" || a.status === "Refunded");
      appointments.forEach((apt, idx) => {
        const isRefund = apt.status === "Refunded";
        const gross = isRefund ? -150 : 150;
        const commission = gross * 0.15;
        const net = gross - commission;

        list.push({
          id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          bookingId: apt.id,
          customerName: apt.customerName,
          providerName: prov.name,
          providerId: prov.id,
          type: isRefund ? "Refund" : "Booking Payment",
          gross,
          commission,
          net,
          status: "Cleared",
          date: apt.date,
        });
      });
    });

    localStorage.setItem("optivita_marketplace_transactions", JSON.stringify(list));
    return list;
  }, [providers]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.customerName.toLowerCase().includes(search.toLowerCase()) ||
        t.providerName.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === "all" || t.type.toLowerCase() === typeFilter.toLowerCase();
      const matchProvider = providerFilter === "all" || t.providerId === providerFilter;

      return matchSearch && matchType && matchProvider;
    });
  }, [transactions, search, typeFilter, providerFilter]);

  const handleExportCSV = () => {
    let csv = "Date,Transaction ID,Booking ID,Customer,Provider,Type,Gross (SAR),Commission (SAR),Net (SAR),Status\n";
    filteredTransactions.forEach((t) => {
      csv += `${t.date},${t.id},${t.bookingId},"${t.customerName}","${t.providerName}",${t.type},${t.gross},${t.commission},${t.net},${t.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `marketplace_financials_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV transaction export download triggered successfully!");
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Financial Transaction Ledger</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction invoices, commission splits, and complete refunds</p>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-border/60 bg-card hover:bg-secondary text-xs font-bold text-foreground shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Control row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, Client, Provider..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 border rounded-xl text-xs bg-card border-border/60 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="booking payment">Booking Payment</option>
            <option value="commission">Commission</option>
            <option value="refund">Refund</option>
            <option value="payout">Payout</option>
          </select>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3.5 py-2 border rounded-xl text-xs bg-card border-border/60 focus:outline-none"
          >
            <option value="all">All Providers</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Booking Ref</th>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Type</th>
              <th className="p-4">Gross Amount</th>
              <th className="p-4">Commission</th>
              <th className="p-4">Net Earned</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                <td className="p-4 font-mono font-bold text-foreground">{t.id}</td>
                <td className="p-4 font-mono text-muted-foreground">{t.bookingId}</td>
                <td className="p-4 font-semibold text-foreground">{t.customerName}</td>
                <td className="p-4 text-muted-foreground">{t.providerName}</td>
                <td className="p-4 capitalize text-muted-foreground">{t.type}</td>
                <td className={`p-4 font-bold ${t.gross < 0 ? "text-red-500" : "text-foreground"}`}>
                  SAR {t.gross}
                </td>
                <td className={`p-4 font-bold ${t.commission < 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {t.commission < 0 ? "+" : "-"}SAR {Math.abs(t.commission)}
                </td>
                <td className={`p-4 font-black ${t.net < 0 ? "text-red-500" : "text-emerald-600"}`}>
                  SAR {t.net}
                </td>
                <td className="p-4 text-muted-foreground">{t.date}</td>
                <td className="p-4 text-right">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase">
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-muted-foreground">
                  No transaction audit records matched criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

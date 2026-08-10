import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Layers, Percent, DollarSign, Calendar, RefreshCw } from "lucide-react";
import { getStoredProviders, getProviderAppointments } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/financial-reports")({
  component: AdminFinancialReports,
});

function AdminFinancialReports() {
  const [activeTab, setActiveTab] = useState<"sales" | "commissions" | "earnings" | "refunds" | "payouts">("sales");
  const [providers] = useState(() => getStoredProviders());

  const ledgerTransactions = useMemo(() => {
    const raw = localStorage.getItem("optivita_marketplace_transactions");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return [];
  }, []);

  const handleExportCSV = () => {
    let csv = "";
    let filename = `marketplace_report_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;

    if (activeTab === "sales") {
      csv = "Booking ID,Customer,Provider,Gross (SAR),Commission (SAR),Provider Net (SAR),Date\n";
      ledgerTransactions.filter((t: any) => t.type === "Booking Payment").forEach((t: any) => {
        csv += `${t.bookingId},"${t.customerName}","${t.providerName}",${t.gross},${t.commission},${t.net},${t.date}\n`;
      });
    } else if (activeTab === "commissions") {
      csv = "Provider,Category,Rate (%),Commission Value (SAR),Booking ID,Date\n";
      ledgerTransactions.filter((t: any) => t.type === "Booking Payment").forEach((t: any) => {
        const rate = Math.round((t.commission / t.gross) * 100) || 15;
        csv += `"${t.providerName}",${t.providerId},${rate}%,${t.commission},${t.bookingId},${t.date}\n`;
      });
    } else if (activeTab === "earnings") {
      csv = "Provider ID,Name,Type,Gross Sales (SAR),Commission Split (SAR),Net Available Balance (SAR)\n";
      providers.forEach((p) => {
        const pTx = ledgerTransactions.filter((t: any) => t.providerId === p.id);
        const gross = pTx.filter((t: any) => t.type === "Booking Payment").reduce((sum, t: any) => sum + t.gross, 0);
        const comm = pTx.filter((t: any) => t.type === "Booking Payment").reduce((sum, t: any) => sum + t.commission, 0);
        const netAvailable = gross - comm;
        csv += `${p.id},"${p.name}",${p.type},${gross},${comm},${netAvailable}\n`;
      });
    } else if (activeTab === "refunds") {
      csv = "Refund ID,Booking ID,Customer,Provider,Refund Amount (SAR),Reason,Status,Date\n";
      const rawRefunds = localStorage.getItem("optivita_marketplace_refunds");
      let refunds = [];
      if (rawRefunds) {
        try { refunds = JSON.parse(rawRefunds); } catch {}
      }
      refunds.forEach((r: any) => {
        csv += `${r.id},${r.bookingId},"${r.customerName}","${r.providerName}",${r.refundAmount},"${r.reason}",${r.status},${r.date}\n`;
      });
    } else {
      csv = "Payout ID,Provider,Bank IBAN,Requested Amount (SAR),Request Date,Status\n";
      providers.forEach((prov) => {
        const key = `optivita_payouts_${prov.id}`;
        let payoutList = [];
        const raw = localStorage.getItem(key);
        if (raw) {
          try { payoutList = JSON.parse(raw); } catch {}
        }
        payoutList.forEach((pay: any) => {
          csv += `${pay.id},"${prov.name}",SA038000••••••••••••9281,${pay.amount},${pay.date},${pay.status}\n`;
        });
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${activeTab.toUpperCase()} report CSV download triggered!`);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Financial Reports</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction invoices, commission splits, and complete refunds</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-soft hover:opacity-95"
        >
          <Download className="h-4 w-4" />
          <span>Export Tab CSV</span>
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 overflow-x-auto border-b border-border/40 pb-2">
        {[
          { id: "sales", label: "Sales Report", icon: FileSpreadsheet },
          { id: "commissions", label: "Commission splits", icon: Percent },
          { id: "earnings", label: "Provider Earnings", icon: DollarSign },
          { id: "refunds", label: "Refund Ledger", icon: RefreshCw },
          { id: "payouts", label: "Payouts Queue", icon: Calendar },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? "bg-accent/15 text-accent border border-accent/25"
                  : "text-muted-foreground hover:bg-secondary/20"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report views */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        {activeTab === "sales" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground border-b font-bold">
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Gross Sales</th>
                <th className="p-4">Platform Fee</th>
                <th className="p-4">Provider Net</th>
                <th className="p-4">Settlement Date</th>
              </tr>
            </thead>
            <tbody>
              {ledgerTransactions.filter((t: any) => t.type === "Booking Payment").map((t: any) => (
                <tr key={t.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-0 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">{t.bookingId}</td>
                  <td className="p-4 font-semibold text-foreground">{t.customerName}</td>
                  <td className="p-4 text-muted-foreground">{t.providerName}</td>
                  <td className="p-4 text-foreground font-bold">SAR {t.gross}</td>
                  <td className="p-4 text-red-500 font-semibold">-SAR {t.commission}</td>
                  <td className="p-4 text-emerald-600 font-bold">SAR {t.net}</td>
                  <td className="p-4 text-muted-foreground">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "commissions" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground border-b font-bold">
                <th className="p-4">Provider Name</th>
                <th className="p-4">Expert Category</th>
                <th className="p-4">Effective Rate</th>
                <th className="p-4">Commission Earned</th>
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {ledgerTransactions.filter((t: any) => t.type === "Booking Payment").map((t: any) => {
                const rate = Math.round((t.commission / t.gross) * 100) || 15;
                return (
                  <tr key={t.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-0 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{t.providerName}</td>
                    <td className="p-4 capitalize text-muted-foreground">{t.providerId}</td>
                    <td className="p-4 text-foreground font-bold">{rate}%</td>
                    <td className="p-4 text-accent font-black">SAR {t.commission}</td>
                    <td className="p-4 font-mono text-muted-foreground">{t.bookingId}</td>
                    <td className="p-4 text-muted-foreground">{t.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === "earnings" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground border-b font-bold">
                <th className="p-4">Provider Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Gross Sales</th>
                <th className="p-4">Platform Commissions</th>
                <th className="p-4">Net Available Payables</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => {
                const pTx = ledgerTransactions.filter((t: any) => t.providerId === p.id);
                const gross = pTx.filter((t: any) => t.type === "Booking Payment").reduce((sum, t: any) => sum + t.gross, 0);
                const comm = pTx.filter((t: any) => t.type === "Booking Payment").reduce((sum, t: any) => sum + t.commission, 0);
                const netAvailable = gross - comm;
                return (
                  <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-0 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{p.name}</td>
                    <td className="p-4 capitalize text-muted-foreground">{p.type}</td>
                    <td className="p-4 text-foreground font-bold">SAR {gross}</td>
                    <td className="p-4 text-red-500 font-semibold">SAR {comm}</td>
                    <td className="p-4 text-emerald-600 font-black">SAR {netAvailable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === "refunds" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground border-b font-bold">
                <th className="p-4">Refund ID</th>
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Refund Amount</th>
                <th className="p-4">Reason Details</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {((): any[] => {
                const rawRefunds = localStorage.getItem("optivita_marketplace_refunds");
                return rawRefunds ? JSON.parse(rawRefunds) : [];
              })().map((r: any) => (
                <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-0 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">{r.id}</td>
                  <td className="p-4 font-mono text-muted-foreground">{r.bookingId}</td>
                  <td className="p-4 font-semibold text-foreground">{r.customerName}</td>
                  <td className="p-4 text-muted-foreground">{r.providerName}</td>
                  <td className="p-4 text-red-500 font-bold">SAR {r.refundAmount}</td>
                  <td className="p-4 text-muted-foreground max-w-xs truncate" title={r.reason}>
                    “{r.reason}”
                  </td>
                  <td className="p-4 text-right">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "payouts" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground border-b font-bold">
                <th className="p-4">Payout ID</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Masked Destination IBAN</th>
                <th className="p-4">Transferred Value</th>
                <th className="p-4">Requested Date</th>
                <th className="p-4 text-right">Clearance status</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((prov) => {
                const key = `optivita_payouts_${prov.id}`;
                const raw = localStorage.getItem(key);
                const payoutsList = raw ? JSON.parse(raw) : [];
                return payoutsList.map((pay: any) => (
                  <tr key={pay.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-0 transition-colors">
                    <td className="p-4 font-mono font-bold text-foreground">{pay.id}</td>
                    <td className="p-4 font-semibold text-foreground">{prov.name}</td>
                    <td className="p-4 font-mono text-muted-foreground">SA03 8000 •••• •••• •••• 9281</td>
                    <td className="p-4 font-black text-foreground">SAR {pay.amount}</td>
                    <td className="p-4 text-muted-foreground">{pay.date}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        pay.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

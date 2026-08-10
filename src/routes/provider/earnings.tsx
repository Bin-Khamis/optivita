import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { DollarSign, FileText, ArrowUpRight, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { getProviderAppointments } from "@/lib/marketplaceData";

export const Route = createFileRoute("/provider/earnings")({
  component: ProviderEarningsLedger,
});

function ProviderEarningsLedger() {
  const [provider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const appointments = useMemo(() => {
    return provider ? getProviderAppointments(provider.id) : [];
  }, [provider]);

  // Fetch transactions dynamically from centralized marketplace transaction ledger
  const transactions = useMemo(() => {
    if (!provider) return [];
    const raw = localStorage.getItem("optivita_marketplace_transactions");
    let list = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {}
    }
    // Filter to transactions of this provider
    const filtered = list.filter((t: any) => t.providerId === provider.id);
    return filtered.map((t: any) => ({
      id: t.id,
      bookingId: t.bookingId,
      date: t.date,
      customerName: t.customerName,
      gross: t.gross,
      commission: t.commission,
      net: t.net,
      status: "Cleared",
    }));
  }, [provider]);

  // Aggregate metrics from filtered transactions
  const financialTotals = useMemo(() => {
    const grossTotal = transactions.reduce((sum, t) => sum + t.gross, 0);
    const commissionTotal = transactions.reduce((sum, t) => sum + t.commission, 0);
    const netTotal = transactions.reduce((sum, t) => sum + t.net, 0);
    
    // Find completed payouts to deduct from available balance
    const payoutsKey = `optivita_payouts_${provider?.id}`;
    let payoutsList = [];
    const rawPayouts = localStorage.getItem(payoutsKey);
    if (rawPayouts) {
      try { payoutsList = JSON.parse(rawPayouts); } catch {}
    }
    const completedPayoutsAmt = payoutsList
      .filter((p: any) => p.status === "Completed")
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const availableBalance = netTotal - completedPayoutsAmt;

    return {
      grossTotal,
      commissionTotal,
      netTotal,
      availableBalance: availableBalance >= 0 ? availableBalance : 0,
    };
  }, [transactions, provider]);

  return (
    <div className="space-y-10">
      {/* Title Bar */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Financial Console</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction logs, net revenues, and payout balances</p>
        </div>
      </div>

      {/* Financial Breakdown KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Total Gross Sales</span>
            <p className="text-xl font-black text-foreground">SAR {financialTotals.grossTotal}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Optivita Commission (15%)</span>
            <p className="text-xl font-black text-red-500">SAR {financialTotals.commissionTotal}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Net Provider Share (85%)</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">SAR {financialTotals.netTotal}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-card flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Available Balance</span>
            <p className="text-xl font-black text-foreground">SAR {financialTotals.availableBalance}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-secondary/40 flex items-center justify-center text-muted-foreground">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Commission Disclaimer banner */}
      <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-xs text-muted-foreground flex gap-3">
        <AlertCircle className="h-5 w-5 text-accent shrink-0" />
        <p className="leading-relaxed">
          <strong>Notice:</strong> Commisions are automatically set at **15%** for all consulting services booked. Payments are cleared instantly into your Provider Account Balance upon marking bookings as completed.
        </p>
      </div>

      {/* Transaction History Log Table */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-foreground">Cleared Transactions History</h3>
        
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Gross Sales</th>
                <th className="p-4">Commission (15%)</th>
                <th className="p-4">Net Earned</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                  <td className="p-4 font-bold text-foreground font-mono">{t.id}</td>
                  <td className="p-4 font-mono text-muted-foreground">{t.bookingId}</td>
                  <td className="p-4 text-muted-foreground">{t.date}</td>
                  <td className="p-4 font-semibold text-foreground">{t.customerName}</td>
                  <td className="p-4 text-foreground">SAR {t.gross}</td>
                  <td className="p-4 text-red-500 font-semibold">-SAR {t.commission}</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-black">SAR {t.net}</td>
                  <td className="p-4 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground bg-card">
                    No transactions generated. Complete active bookings to display cleared revenues.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Reusable CreditCard icon dummy
function CreditCard({ className }: { className?: string }) {
  return <DollarSign className={className} />;
}

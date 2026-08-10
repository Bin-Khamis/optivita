import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { DollarSign, Percent, TrendingUp, Calendar, ArrowRightLeft } from "lucide-react";
import { getStoredProviders } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/settlements")({
  component: AdminMarketplaceSettlements,
});

function AdminMarketplaceSettlements() {
  const [providers] = useState(() => getStoredProviders());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

  const ledgerTransactions = useMemo(() => {
    const raw = localStorage.getItem("optivita_marketplace_transactions");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return [];
  }, []);

  const metrics = useMemo(() => {
    let gross = 0;
    let commission = 0;
    let net = 0;
    let refunds = 0;
    let payouts = 0;

    ledgerTransactions.forEach((t: any) => {
      if (t.type === "Booking Payment") {
        gross += t.gross;
        commission += t.commission;
        net += t.net;
      } else if (t.type === "Refund") {
        refunds += Math.abs(t.gross);
      } else if (t.type === "Payout") {
        payouts += Math.abs(t.gross);
      }
    });

    const outstanding = net - payouts - refunds;

    return {
      gross,
      commission,
      net,
      refunds,
      payouts,
      outstanding: outstanding >= 0 ? outstanding : 0,
    };
  }, [ledgerTransactions]);

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Marketplace Settlement Center</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Manage daily settlements, track platform commissions splits, and reconcile outstanding provider payouts</p>
        </div>
        
        {/* Toggle options */}
        <div className="flex bg-secondary/35 p-1 rounded-xl text-xs self-start sm:self-auto">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                period === p ? "bg-accent text-white" : "text-muted-foreground"
              }`}
            >
              {p} Reports
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm text-xs">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[9px] font-black text-muted-foreground uppercase">Gross Sales Value</span>
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <p className="text-xl font-black text-foreground">SAR {metrics.gross.toFixed(2)}</p>
          <span className="text-[9px] text-muted-foreground">Settled across all expert bookings</span>
        </div>

        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm text-xs">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[9px] font-black text-muted-foreground uppercase">Optivita Commission</span>
            <Percent className="h-4 w-4 text-accent" />
          </div>
          <p className="text-xl font-black text-accent">SAR {metrics.commission.toFixed(2)}</p>
          <span className="text-[9px] text-muted-foreground">Standard platforms fee splits share</span>
        </div>

        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm text-xs">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[9px] font-black text-muted-foreground uppercase">Released Payouts</span>
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <p className="text-xl font-black text-emerald-600">SAR {metrics.payouts.toFixed(2)}</p>
          <span className="text-[9px] text-muted-foreground">Transferred to expert bank accounts</span>
        </div>

        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-2 shadow-sm text-xs">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-[9px] font-black text-muted-foreground uppercase">Outstanding Balance</span>
            <ArrowRightLeft className="h-4 w-4 text-accent" />
          </div>
          <p className="text-xl font-black text-foreground">SAR {metrics.outstanding.toFixed(2)}</p>
          <span className="text-[9px] text-muted-foreground">Accrued available balance payables</span>
        </div>
      </div>

      {/* Historical Daily Settlements Table */}
      <div className="space-y-4 pt-4 border-t border-border/30">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
          <Calendar className="h-4.5 w-4.5 text-accent" />
          Period Settlement Ledger Logs
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
                <th className="p-4">Settlement Period</th>
                <th className="p-4">Gross Sales</th>
                <th className="p-4">Commission</th>
                <th className="p-4">Provider Earnings</th>
                <th className="p-4">Refunds processed</th>
                <th className="p-4">Outstanding Balances</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { period: "09 August 2026", gross: metrics.gross, comm: metrics.commission, net: metrics.net, ref: metrics.refunds, out: metrics.outstanding },
                { period: "08 August 2026", gross: 4200, comm: 630, net: 3570, ref: 150, out: 2120 },
                { period: "07 August 2026", gross: 3100, comm: 465, net: 2635, ref: 0, out: 1435 },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                  <td className="p-4 font-bold text-foreground">{row.period}</td>
                  <td className="p-4 text-foreground">SAR {row.gross}</td>
                  <td className="p-4 text-accent font-semibold">SAR {row.comm}</td>
                  <td className="p-4 text-emerald-600 font-bold">SAR {row.net}</td>
                  <td className="p-4 text-red-500 font-semibold">SAR {row.ref}</td>
                  <td className="p-4 text-foreground">SAR {row.out}</td>
                  <td className="p-4 text-right">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase">
                      Reconciled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

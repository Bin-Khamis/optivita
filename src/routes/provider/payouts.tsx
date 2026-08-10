import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { DollarSign, FileText, Send, CreditCard, ArrowRight } from "lucide-react";
import { getProviderPayouts, savePayoutRequest } from "@/lib/marketplaceData";

export const Route = createFileRoute("/provider/payouts")({
  component: ProviderPayoutsConsole,
});

function ProviderPayoutsConsole() {
  const [provider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const [payouts, setPayouts] = useState<any[]>(() => {
    return provider ? getProviderPayouts(provider.id) : [];
  }, [provider]);

  // Request Form States
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Available balance computed from ledger transactions and payout list states
  const stats = useMemo(() => {
    if (!provider) return { availableBalance: 0, pendingPayout: 0, paidAmount: 0 };

    // Fetch total net earnings from transactions ledger
    const rawLedger = localStorage.getItem("optivita_marketplace_transactions");
    let txList = [];
    if (rawLedger) {
      try { txList = JSON.parse(rawLedger); } catch {}
    }
    const netTotal = txList
      .filter((t: any) => t.providerId === provider.id)
      .reduce((sum: number, t: any) => sum + t.net, 0);

    const pending = payouts.filter((p) => p.status === "Pending" || p.status === "Processing").reduce((sum, p) => sum + p.amount, 0);
    const paid = payouts.filter((p) => p.status === "Completed").reduce((sum, p) => sum + p.amount, 0);
    
    const available = netTotal - pending - paid;

    return {
      availableBalance: available >= 0 ? available : 0,
      pendingPayout: pending,
      paidAmount: paid,
    };
  }, [payouts, provider]);

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;

    // Safety checks: ensure approved and not suspended
    if (!provider.verified) {
      toast.error("Payout request blocked. Your professional credentials verification is still pending audit.");
      return;
    }
    if (provider.name.includes("(Suspended)")) {
      toast.error("Payout request blocked. Your account is temporarily suspended.");
      return;
    }

    const payoutVal = Number(amount);
    if (isNaN(payoutVal) || payoutVal <= 0) {
      toast.error("Please enter a valid payout amount.");
      return;
    }

    if (payoutVal > stats.availableBalance) {
      toast.error("Insufficient account balance.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      savePayoutRequest(provider.id, payoutVal);
      const updated = getProviderPayouts(provider.id);
      setPayouts(updated);
      setAmount("");
      setLoading(false);
      toast.success("Payout request submitted successfully to Admin!");
    }, 1000);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
      {/* Left Column: Metrics & Request Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* KPI Panel */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4.5 rounded-2xl border border-border/60 bg-card space-y-1 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Available Balance</span>
            <p className="text-lg font-black text-foreground">SAR {stats.availableBalance}</p>
          </div>
          <div className="p-4.5 rounded-2xl border border-border/60 bg-card space-y-1 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Pending Payouts</span>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">SAR {stats.pendingPayout}</p>
          </div>
          <div className="p-4.5 rounded-2xl border border-border/60 bg-card space-y-1 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Paid Out</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">SAR {stats.paidAmount}</p>
          </div>
        </div>

        {/* Payout Request Form */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-5 shadow-soft">
          <div className="space-y-1 pb-3 border-b border-border/30">
            <h3 className="font-bold text-sm text-foreground">Request Bank Payout</h3>
            <p className="text-[10px] text-muted-foreground">Transfer cleared earnings directly to your registered bank account</p>
          </div>

          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Payout Amount (SAR)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || stats.availableBalance <= 0}
              className="w-full py-3 rounded-xl bg-accent text-white font-bold text-xs shadow-soft disabled:opacity-50 flex items-center justify-center gap-1.5 hover:opacity-95"
            >
              {loading ? "Submitting Request..." : "Request Bank Transfer"}
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Payout Logs History */}
      <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-6 shadow-sm">
        <h3 className="font-bold text-xs text-foreground pb-3 border-b border-border/30">Payout History</h3>
        
        <div className="space-y-4">
          {payouts.map((pay) => (
            <div key={pay.id} className="pb-4 border-b border-border/30 last:border-b-0 last:pb-0 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-foreground">SAR {pay.amount}</span>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                  pay.status === "Completed"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : pay.status === "Pending"
                    ? "bg-amber-500/10 text-amber-600 animate-pulse"
                    : "bg-red-500/10 text-red-600"
                }`}>
                  {pay.status}
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>Requested: {pay.date}</span>
                <span className="font-mono">Ref: {pay.bankRef}</span>
              </div>
            </div>
          ))}
          {payouts.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-4">No payout transfers requested yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

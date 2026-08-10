import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, DollarSign, Calendar } from "lucide-react";

export const Route = createFileRoute("/portal/wallet")({
  component: CustomerWalletConsole,
});

function CustomerWalletConsole() {
  const [customer] = useState<any>(() => {
    const session = localStorage.getItem("optivita_customer_session");
    return session ? JSON.parse(session) : null;
  });

  const [topUpAmount, setTopUpAmount] = useState("");

  const [walletTransactions, setWalletTransactions] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_wallet_transactions");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const initial = [
      {
        id: "WTX-201",
        date: "2026-08-08",
        type: "Wallet Credit",
        description: "Simulated credit card top-up deposit",
        amount: 500,
        balanceAfter: 500,
      },
      {
        id: "WTX-202",
        date: "2026-08-09",
        type: "Booking Payment",
        description: "Paid for PCOS Diet Consultation session",
        amount: -150,
        balanceAfter: 350,
      },
    ];
    localStorage.setItem("optivita_marketplace_wallet_transactions", JSON.stringify(initial));
    return initial;
  });

  const availableBalance = useMemo(() => {
    if (walletTransactions.length === 0) return 0;
    return walletTransactions[0].balanceAfter;
  }, [walletTransactions]);

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(topUpAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Please enter a valid top-up amount.");
      return;
    }

    const newTx = {
      id: `WTX-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split("T")[0],
      type: "Wallet Credit",
      description: "Simulated credit card top-up deposit",
      amount: amountVal,
      balanceAfter: availableBalance + amountVal,
    };

    const updated = [newTx, ...walletTransactions];
    setWalletTransactions(updated);
    localStorage.setItem("optivita_marketplace_wallet_transactions", JSON.stringify(updated));

    // Also write record to general marketplace financial ledger
    const rawLedger = localStorage.getItem("optivita_marketplace_transactions");
    let ledger = [];
    if (rawLedger) {
      try { ledger = JSON.parse(rawLedger); } catch {}
    }
    ledger.unshift({
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      bookingId: "-",
      customerName: customer?.fullName || "Customer",
      providerName: "-",
      providerId: "-",
      type: "Wallet Credit",
      gross: amountVal,
      commission: 0,
      net: amountVal,
      status: "Cleared",
      date: new Date().toISOString().split("T")[0],
    });
    localStorage.setItem("optivita_marketplace_transactions", JSON.stringify(ledger));

    setTopUpAmount("");
    toast.success(`Successfully topped up SAR ${amountVal} to your wallet!`);
  };

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Marketplace Wallet Balance</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Top up your balance, review credit/debit transaction logs, and pay experts</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Wallet Balance & Top up Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance card */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-xs">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-[10px] font-black text-muted-foreground uppercase">Available Balance</span>
              <Wallet className="h-5 w-5 text-accent" />
            </div>
            <p className="text-3xl font-black text-foreground">SAR {availableBalance.toFixed(2)}</p>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Account ID: {customer?.enrollmentId || "CN-Pending"}</span>
              <span>Currency: Saudi Riyals (SAR)</span>
            </div>
          </div>

          {/* Top-up Form */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-soft text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 pb-2 border-b">
              <Plus className="h-4.5 w-4.5 text-accent" />
              Simulate Balance Top-up
            </h3>
            
            <form onSubmit={handleTopUp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Deposit Amount (SAR)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    required
                    min="10"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full pl-9 pr-4 py-2.5 border rounded-xl bg-secondary/15 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-accent text-white font-bold"
              >
                Deposit Funds to Wallet
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Transaction Log */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-xs">
          <h3 className="font-bold text-foreground flex items-center gap-1.5 pb-2 border-b">
            <Calendar className="h-4.5 w-4.5 text-accent" />
            Wallet Ledger History
          </h3>

          <div className="space-y-4.5 max-h-96 overflow-y-auto pr-1">
            {walletTransactions.map((tx) => (
              <div key={tx.id} className="pb-3.5 border-b border-border/30 last:border-0 last:pb-0 space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">{tx.type}</span>
                  <span className={tx.amount < 0 ? "text-red-500" : "text-emerald-600"}>
                    {tx.amount < 0 ? "" : "+"}SAR {tx.amount.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground italic">“{tx.description}”</p>
                <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                  <span>{tx.date} • Ref: {tx.id}</span>
                  <span>Bal: SAR {tx.balanceAfter.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {walletTransactions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No wallet transactions logged.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { DollarSign, Save, Percent, AlertCircle, History } from "lucide-react";
import { getStoredProviders, getProviderAppointments } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/commissions")({
  component: AdminCommissionsPanel,
});

function AdminCommissionsPanel() {
  const [providers] = useState(() => getStoredProviders());
  
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const raw = localStorage.getItem("optivita_marketplace_commissions");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return {
      nutritionist: 15,
      dietitian: 15,
      trainer: 12,
      coach: 12,
      gym: 10,
      wellness: 15,
    };
  });

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("optivita_marketplace_commissions", JSON.stringify(rates));

    // Audit Log entry
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action: "Adjusted Commission Split Rates",
      entityType: "Commission",
      entityId: "global-rules-engine",
      previousState: "Default splits config",
      newState: JSON.stringify(rates),
      reason: "Optimizing category promotion rates.",
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    toast.success("Commission splits rule configurations updated successfully!");
  };

  // Compile history logs based on rates
  const commissionHistory = useMemo(() => {
    let list: any[] = [];
    providers.forEach((prov) => {
      const appointments = getProviderAppointments(prov.id).filter((a) => a.status === "Completed");
      appointments.forEach((apt) => {
        const rate = rates[prov.type.toLowerCase()] || 15;
        const gross = 150;
        const commission = gross * (rate / 100);
        const net = gross - commission;

        list.push({
          id: apt.id,
          providerName: prov.name,
          category: prov.type,
          gross,
          rate,
          commission,
          net,
          date: apt.date,
        });
      });
    });
    return list;
  }, [providers, rates]);

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Commission Configuration</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Edit category-specific transaction rates and payout splits</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-soft">
          <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b pb-2">
            <Percent className="h-4.5 w-4.5 text-accent" />
            Default split rates per category
          </h3>

          <form onSubmit={handleSaveRates} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: "nutritionist", label: "🥗 Nutritionist Commission (%)" },
                { key: "dietitian", label: "🥗 Registered Dietitian (%)" },
                { key: "trainer", label: "🏋️ Personal Trainer (%)" },
                { key: "coach", label: "🏃 Fitness Coach (%)" },
                { key: "gym", label: "🏢 Gym Facility (%)" },
                { key: "wellness", label: "🧘 Wellness Practitioner (%)" },
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={rates[item.key] || 15}
                      onChange={(e) => setRates({ ...rates, [item.key]: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 focus:outline-none pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-black">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-soft flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Save Rates Config</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Card */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-xs">
          <h3 className="font-bold text-foreground flex items-center gap-1.5 pb-2 border-b border-border/30">
            <AlertCircle className="h-4.5 w-4.5 text-accent" />
            Rules & Splits
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Marketplace transactions are automatically parsed based on category rates at the moment of booking completion.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Changing default rates will affect all future bookings. Existing completed transactions are not modified retrospectively.
          </p>
        </aside>
      </div>

      {/* History table log */}
      <div className="space-y-4 pt-4 border-t border-border/30">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
          <History className="h-4.5 w-4.5 text-accent" />
          Accrued Commissions Ledger
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Category</th>
                <th className="p-4">Gross Amount</th>
                <th className="p-4">Split Rate</th>
                <th className="p-4">Commission Earned</th>
                <th className="p-4">Provider Share</th>
                <th className="p-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {commissionHistory.map((h, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">{h.id}</td>
                  <td className="p-4 font-semibold text-foreground">{h.providerName}</td>
                  <td className="p-4 capitalize text-muted-foreground">{h.category}</td>
                  <td className="p-4 text-foreground">SAR {h.gross}</td>
                  <td className="p-4 font-bold text-foreground">{h.rate}%</td>
                  <td className="p-4 text-accent font-black">SAR {h.commission}</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">SAR {h.net}</td>
                  <td className="p-4 text-right text-muted-foreground">{h.date}</td>
                </tr>
              ))}
              {commissionHistory.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No transactions generated. Complete provider sessions to audit splits.
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

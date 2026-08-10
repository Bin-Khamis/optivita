import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Tag, Plus, PlusCircle, X, HelpCircle, Calendar } from "lucide-react";
import { getProviderPromotions, savePromotion } from "@/lib/marketplaceData";

export const Route = createFileRoute("/provider/promotions")({
  component: ProviderPromotionsLedger,
});

function ProviderPromotionsLedger() {
  const [provider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const [promos, setPromos] = useState<any[]>(() => {
    return provider ? getProviderPromotions(provider.id) : [];
  }, [provider]);

  // Form Fields
  const [showAddForm, setShowAddForm] = useState(false);
  const [promoName, setPromoName] = useState("");
  const [discount, setDiscount] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;

    if (!promoName || !startDate || !endDate) {
      toast.error("Please fill in all campaign fields.");
      return;
    }

    const newPromo = {
      id: `PRM-${Math.floor(600 + Math.random() * 400)}`,
      name: promoName,
      discount: Number(discount),
      startDate,
      endDate,
      status: "Pending Approval", // Requires Admin Review
    };

    savePromotion(provider.id, newPromo);
    
    // Refresh List
    const updated = getProviderPromotions(provider.id);
    setPromos(updated);
    
    setShowAddForm(false);
    setPromoName("");
    setDiscount(10);
    setStartDate("");
    setEndDate("");
    
    toast.success("Promotion campaign submitted to Admin for approval!");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
      {/* Left: Active Promotions list */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-border/30">
          <h3 className="font-bold text-sm text-foreground">Discount Campaigns</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-accent/20 bg-accent/5 rounded-xl text-[10px] font-bold text-accent"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </button>
        </div>

        {/* Promotions list */}
        <div className="space-y-4">
          {promos.map((promo) => (
            <div key={promo.id} className="p-5 rounded-2xl border border-border/60 bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Tag className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-foreground">{promo.name}</h4>
                  <p className="text-[10px] text-muted-foreground">
                    Get <span className="font-bold text-accent">{promo.discount}% Off</span> services consultation
                  </p>
                  <span className="text-[8px] text-muted-foreground block font-mono">ID: {promo.id}</span>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  promo.status === "Approved"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-amber-500/10 text-amber-600 animate-pulse"
                }`}>
                  {promo.status}
                </span>
                
                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Until {promo.endDate}</span>
                </span>
              </div>
            </div>
          ))}
          {promos.length === 0 && (
            <p className="text-xs text-muted-foreground py-16 text-center bg-card rounded-2xl border border-dashed">
              No promotions submitted. Create a discount code above!
            </p>
          )}
        </div>
      </div>

      {/* Right Column: Create Promo Form / Info */}
      <aside className="space-y-6">
        {/* Form Modal/Sidebar */}
        {showAddForm ? (
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-5 shadow-soft animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-border/30">
              <h3 className="font-bold text-xs text-foreground">New Discount Code</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4 hover:text-red-500" />
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="e.g. Back to School Special"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Discount (%)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="50"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-soft hover:opacity-95">
                Submit Campaign
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-xs">
            <h3 className="font-bold text-foreground flex items-center gap-1.5 pb-2 border-b border-border/30">
              <HelpCircle className="h-4.5 w-4.5 text-accent" />
              Campaign Guidelines
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Promotional discount coupons require **Admin approval** before being published on your public marketplace profile.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Discounts are capped at a maximum of **50%** to maintain service quality guidelines on the marketplace.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

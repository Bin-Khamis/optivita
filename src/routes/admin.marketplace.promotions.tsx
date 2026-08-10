import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Tag, Check, X, Star, Award, Heart } from "lucide-react";
import { getStoredProviders, saveProviderToStorage } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/promotions")({
  component: AdminPromotionsPanel,
});

function AdminPromotionsPanel() {
  const [providers, setProviders] = useState(() => getStoredProviders());
  const [search, setSearch] = useState("");

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [providers, search]);

  const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
    const prov = providers.find((p) => p.id === id);
    if (!prov) return;

    // Toggle simulated featured flag by modifying location title
    const updated = {
      ...prov,
      location: currentFeatured ? prov.location.replace(" (Featured)", "") : `${prov.location} (Featured)`
    };
    saveProviderToStorage(updated);
    setProviders(getStoredProviders());
    toast.success(`${prov.name} featured state toggled successfully!`);
  };

  // Mock list of coupon codes awaiting review
  const [coupons, setCoupons] = useState([
    { id: "PRM-501", providerName: "Dr. Ahmed Khalid", code: "SUMMER15", discount: 15, status: "Approved" },
    { id: "PRM-502", providerName: "Sarah Al-Ghamdi", code: "HEALTHY10", discount: 10, status: "Pending Review" },
  ]);

  const handleApproveCoupon = (id: string) => {
    setCoupons(
      coupons.map((c) => {
        if (c.id === id) {
          return { ...c, status: "Approved" };
        }
        return c;
      })
    );
    toast.success("Promo coupon code approved and active!");
  };

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Marketplace Campaigns</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Approve coupon discounts and configure featured provider recommendation lists</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Featured Providers manager */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-border/30">
            <h3 className="font-bold text-xs text-foreground">Featured Providers Recommendation Lists</h3>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search provider name..."
              className="px-3 py-1.5 border rounded-xl text-xs bg-secondary/15 focus:outline-none w-48"
            />
          </div>

          <div className="space-y-4">
            {filteredProviders.map((p) => {
              const isFeatured = p.location.includes("(Featured)");
              return (
                <div key={p.id} className="p-4 rounded-2xl border border-border/60 bg-card flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <img src={p.avatar} alt={p.name} className="h-9 w-9 rounded-xl object-cover" />
                    <div>
                      <span className="font-bold text-foreground block">{p.name}</span>
                      <span className="text-[9px] text-muted-foreground capitalize">{p.type}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFeatured(p.id, isFeatured)}
                    className={`px-3.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                      isFeatured ? "bg-accent border-accent text-white" : "bg-card hover:bg-secondary"
                    }`}
                  >
                    {isFeatured ? "★ Featured" : "Feature Provider"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Coupon Queue */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-6 shadow-sm">
          <h3 className="font-bold text-xs text-foreground pb-3 border-b border-border/30">Discount Vouchers</h3>
          
          <div className="space-y-4">
            {coupons.map((c) => (
              <div key={c.id} className="pb-4 border-b last:border-0 last:pb-0 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span>{c.code} ({c.discount}% Off)</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    c.status === "Approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">Provider: {c.providerName}</p>
                {c.status === "Pending Review" && (
                  <button
                    onClick={() => handleApproveCoupon(c.id)}
                    className="w-full py-1.5 rounded-lg bg-accent text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    <span>Approve Coupon</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

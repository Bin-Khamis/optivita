import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Sparkles, ShieldAlert, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/marketplace/ai-insights")({
  component: AdminAIInsights,
});

function AdminAIInsights() {
  const [anomalies, setAnomalies] = useState<any[]>([
    { id: "ANM-201", severity: "HIGH", description: "Sudden cancellation rate spike detected for Coach Marcus (45%).", action: "Requires Review" },
    { id: "ANM-202", severity: "WARNING", description: "Unusual payout frequency request sequence for Al Rajhi destination accounts.", action: "Requires Review" },
  ]);

  const [forecasts] = useState([
    { category: "Nutritionists", current: 12, predicted: 18, change: "+50% increase" },
    { category: "Fitness Coaches", current: 8, predicted: 11, change: "+37% increase" },
    { category: "Wellness Centers", current: 4, predicted: 6, change: "+50% increase" },
  ]);

  return (
    <div className="space-y-10 text-xs text-left">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground flex items-center gap-2">
            <Sparkles className="h-5.5 w-5.5 text-accent animate-pulse" />
            AI Marketplace Intelligence Center
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Automated demand forecasting, fraud assistance flags, and category growth projection engines</p>
        </div>
      </div>

      {/* Main sections layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left: Anomaly Detection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Automated Anomaly & Fraud Detection
            </h3>
            <p className="text-[10px] text-muted-foreground leading-normal pb-2">
              Unusual booking triggers and repeated transaction failure patterns are flagged for manual admin approval.
            </p>

            <div className="space-y-3">
              {anomalies.map((anm) => (
                <div key={anm.id} className="p-4 border rounded-2xl bg-secondary/15 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{anm.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        anm.severity === "HIGH" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {anm.severity}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed font-medium">{anm.description}</p>
                  </div>

                  <span className="px-3 py-1 bg-card border rounded-xl font-bold text-muted-foreground hover:bg-secondary/15 cursor-pointer text-center shrink-0">
                    {anm.action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Forecasting */}
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Category Demand Projections
            </h3>

            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              {forecasts.map((fc, idx) => (
                <div key={idx} className="p-4 border rounded-2xl bg-secondary/15 space-y-2 text-center">
                  <span className="font-bold text-muted-foreground uppercase text-[9px]">{fc.category}</span>
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-xl font-black text-foreground">{fc.predicted}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">{fc.change}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block">Forecast based on past month</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: LLM config limits */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-5 shadow-soft">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <BarChart3 className="h-4.5 w-4.5 text-accent" />
            AI Cost & Usage Budgets
          </h3>
          
          <div className="space-y-4 text-xs">
            <div className="flex justify-between">
              <span>Daily API Token Count</span>
              <span className="font-bold text-foreground">42,910 / 100,000</span>
            </div>
            <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
              <div style={{ width: "42.9%" }} className="h-full bg-accent rounded-full" />
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between">
                <span>Model Provider</span>
                <span className="font-bold text-foreground">Gemini Flash-Pro</span>
              </div>
              <div className="flex justify-between">
                <span>Response Caching</span>
                <span className="font-bold text-emerald-600">Active (78% Hit)</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

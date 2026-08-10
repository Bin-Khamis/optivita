import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, BarChart3, ShieldAlert, Award, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/corporate/analytics")({
  component: CorporateAnalytics,
});

function CorporateAnalytics() {
  const [utilization] = useState([
    { category: "Nutritionists", sessions: 42, activeUsers: 14, percent: 84 },
    { category: "Fitness Coaches", sessions: 28, activeUsers: 9, percent: 56 },
    { category: "Wellness Centers", sessions: 12, activeUsers: 4, percent: 24 },
  ]);

  return (
    <div className="space-y-10 text-xs text-left">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground flex items-center gap-2">
            <Sparkles className="h-5.5 w-5.5 text-accent animate-pulse" />
            Wellness Engagement & Utilization Analytics
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Aggregated, anonymous, non-sensitive employee participation metrics</p>
        </div>
      </div>

      {/* Main sections layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left: Engagement stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <BarChart3 className="h-5 w-5 text-accent" />
              Benefit Category Utilization Rates
            </h3>

            <div className="space-y-4 pt-2">
              {utilization.map((ut, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>{ut.category}</span>
                    <span>{ut.percent}% Utilization ({ut.sessions} sessions)</span>
                  </div>
                  <div className="h-2.5 w-full bg-secondary/20 rounded-full overflow-hidden">
                    <div style={{ width: `${ut.percent}%` }} className="h-full bg-accent rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forecasting */}
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Engagement Trends & Insights
            </h3>
            <div className="p-4 border rounded-2xl bg-secondary/15 space-y-2">
              <span className="font-bold text-emerald-600 block uppercase text-[9px]">AI Wellness Insight</span>
              <p className="leading-relaxed">
                Online wellness consultations had higher participation than in-person sessions this month. We recommend allocating more budget credits to Nutrition consultations.
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Security info */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-soft">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <ShieldAlert className="h-4.5 w-4.5 text-accent" />
            B2B Data Privacy Guard
          </h3>
          <p className="text-slate-400 leading-relaxed pb-2">
            Optivita strictly enforces HIPAA/GDPR health data privacy boundaries. Private medical consultations records, logs, and therapist chat logs are never visible to company HR administrators.
          </p>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-bold uppercase text-[9px]">
            Privacy Verified
          </span>
        </aside>
      </div>
    </div>
  );
}

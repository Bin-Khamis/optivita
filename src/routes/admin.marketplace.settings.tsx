import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Settings, Save, Lock, ShieldCheck, Globe, Calendar, DollarSign } from "lucide-react";

export const Route = createFileRoute("/admin/marketplace/settings")({
  component: AdminMarketplaceSettings,
});

function AdminMarketplaceSettings() {
  const [enabled, setEnabled] = useState(true);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [requireProviderApproval, setRequireProviderApproval] = useState(true);
  const [requireServiceApproval, setRequireServiceApproval] = useState(true);
  const [requireDocCheck, setRequireDocCheck] = useState(true);
  
  // Booking settings
  const [cancellationWindow, setCancellationWindow] = useState(24); // hours
  const [refundPolicy, setRefundPolicy] = useState("Full refund up to 24 hours before consultation starts.");
  const [refundPercentGt24, setRefundPercentGt24] = useState(100);
  const [refundPercent12To24, setRefundPercent12To24] = useState(50);
  const [refundPercentLt12, setRefundPercentLt12] = useState(0);

  // Financial settings
  const [defaultCommission, setDefaultCommission] = useState(15);
  const [minPayout, setMinPayout] = useState(100);
  const [payoutSchedule, setPayoutSchedule] = useState("weekly");

  // Gateway credentials configurations
  const [paymentEnv, setPaymentEnv] = useState("development");
  const [activeGateway, setActiveGateway] = useState("MockPaymentGateway");
  const [webhookUrl, setWebhookUrl] = useState("https://api.optivita.com/payments/webhook");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage namespace
    const settingsObj = {
      enabled, allowRegistration, requireProviderApproval, requireServiceApproval, requireDocCheck,
      cancellationWindow, refundPolicy, defaultCommission, minPayout, payoutSchedule,
      refundPercentGt24, refundPercent12To24, refundPercentLt12,
      paymentEnv, activeGateway, webhookUrl
    };
    localStorage.setItem("optivita_marketplace_settings", JSON.stringify(settingsObj));

    // Audit Log entry
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action: "Updated Marketplace Settings",
      entityType: "Settings",
      entityId: "global-config",
      previousState: "Existing settings",
      newState: JSON.stringify(settingsObj),
      reason: "Updating general marketplace operations parameters.",
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    toast.success("Marketplace parameters saved successfully!");
  };

  return (
    <div className="max-w-2xl mx-auto rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-soft text-xs text-foreground">
      {/* Title */}
      <div className="space-y-1 pb-4 border-b border-border/30">
        <h2 className="text-lg font-display font-black text-foreground">Marketplace Global Settings</h2>
        <p className="text-[10px] text-muted-foreground">Configure registration policies, service approval checklists, and default commissions</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Section 1: Marketplace controls */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-accent uppercase tracking-wider pb-2 border-b">1. Portal Configurations</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold block">Enable Marketplace Portal</span>
              <p className="text-[10px] text-muted-foreground">Toggle public access to the wellness consulting directory</p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4.5 w-4.5 accent-accent cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/20">
            <div>
              <span className="font-bold block">Allow New Provider Registrations</span>
              <p className="text-[10px] text-muted-foreground">Toggle provider onboarding wizards signups</p>
            </div>
            <input
              type="checkbox"
              checked={allowRegistration}
              onChange={(e) => setAllowRegistration(e.target.checked)}
              className="h-4.5 w-4.5 accent-accent cursor-pointer"
            />
          </div>
        </div>

        {/* Section 2: Booking settings */}
        <div className="space-y-4 pt-4 border-t border-border/20">
          <h3 className="font-bold text-xs text-accent uppercase tracking-wider pb-2 border-b">2. Booking & Cancellations</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Cancellation Window (Hours)</label>
              <input
                type="number"
                value={cancellationWindow}
                onChange={(e) => setCancellationWindow(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Refund Policy Label</label>
              <input
                type="text"
                value={refundPolicy}
                onChange={(e) => setRefundPolicy(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Refund % (&gt;24 Hours Notice)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={refundPercentGt24}
                onChange={(e) => setRefundPercentGt24(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Refund % (12-24 Hours Notice)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={refundPercent12To24}
                onChange={(e) => setRefundPercent12To24(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Refund % (&lt;12 Hours Notice)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={refundPercentLt12}
                onChange={(e) => setRefundPercentLt12(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Financial settings */}
        <div className="space-y-4 pt-4 border-t border-border/20">
          <h3 className="font-bold text-xs text-accent uppercase tracking-wider pb-2 border-b">3. Payouts & Commissions</h3>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Default Platform Commission (%)</label>
              <input
                type="number"
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Min Bank Payout (SAR)</label>
              <input
                type="number"
                value={minPayout}
                onChange={(e) => setMinPayout(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Payout Schedule</label>
              <select
                value={payoutSchedule}
                onChange={(e) => setPayoutSchedule(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Payment Gateway Configuration */}
        <div className="space-y-4 pt-4 border-t border-border/20">
          <h3 className="font-bold text-xs text-accent uppercase tracking-wider pb-2 border-b">4. Payment Gateway Adapter</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Payment Gateway Environment</label>
              <select
                value={paymentEnv}
                onChange={(e) => setPaymentEnv(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15"
              >
                <option value="development">Development (Mock Mode)</option>
                <option value="staging">Staging (Sandbox Mode)</option>
                <option value="production">Production (Live Gateway)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Active Payment Gateway</label>
              <select
                value={activeGateway}
                onChange={(e) => setActiveGateway(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-secondary/15"
              >
                <option value="MockPaymentGateway">Mock Payment Gateway</option>
                <option value="MadaPaymentGateway">Mada Adapter Gateway</option>
                <option value="ApplePayPaymentGateway">Apple Pay Integration Adapter</option>
                <option value="CardPaymentGateway">Standard Card Gateway Adapter</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Webhook Endpoint URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-secondary/15 focus:outline-none"
            />
          </div>

          <div className="p-4 rounded-xl border bg-secondary/10 flex items-center justify-between text-[11px]">
            <div>
              <span className="font-bold block">Gateway Connection Status</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">Secure handshake connectivity diagnostics</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
              paymentEnv === "development" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
            }`}>
              {paymentEnv === "development" ? "Active (Connected)" : "Configuration Required"}
            </span>
          </div>
        </div>

        {/* Section 5: Verifications */}
        <div className="space-y-4 pt-4 border-t border-border/20">
          <h3 className="font-bold text-xs text-accent uppercase tracking-wider pb-2 border-b">5. Audits & Verifications</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold block">Require Provider verification</span>
              <p className="text-[10px] text-muted-foreground">Awaiting admin review audits before appearing publicly</p>
            </div>
            <input
              type="checkbox"
              checked={requireProviderApproval}
              onChange={(e) => setRequireProviderApproval(e.target.checked)}
              className="h-4.5 w-4.5 accent-accent cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/20">
            <div>
              <span className="font-bold block">Require Service Listing Moderation</span>
              <p className="text-[10px] text-muted-foreground">Tutors/Dietitians services require audit before going live</p>
            </div>
            <input
              type="checkbox"
              checked={requireServiceApproval}
              onChange={(e) => setRequireServiceApproval(e.target.checked)}
              className="h-4.5 w-4.5 accent-accent cursor-pointer"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="pt-6 border-t border-border/30 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-soft flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings Parameter</span>
          </button>
        </div>
      </form>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePortal } from "@/lib/portalContext";
import { 
  Trophy, Award, Gift, BadgePercent, Share2, Copy, Download, Printer,
  Sparkles, CheckSquare, AlertCircle, RefreshCw, ChevronRight, X, Lock
} from "lucide-react";
import { toast } from "sonner";
import { 
  getEnrollmentId, getJoiningStatus, getPhone, getEmail, 
  getLoyaltyPoints, getLoyaltyTier, getReferralCode, isWebhookOffline
} from "@/lib/utils";

export const Route = createFileRoute("/portal/loyalty")({
  component: CustomerLoyalty,
});

function CustomerLoyalty() {
  const { data, customer, refreshData } = usePortal();
  const [cardFlip, setCardFlip] = useState(false);
  const [redeemingReward, setRedeemingReward] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const enrollments = data?.["Program Enrollments"] || [];
  const clientEnrollment = enrollments.find((e: any) => {
    const eId = getEnrollmentId(e);
    const ePhone = getPhone(e);
    const eEmail = getEmail(e);
    return (
      (eId && customer?.enrollmentId && String(eId).trim() === String(customer.enrollmentId).trim()) ||
      (ePhone && customer?.phone && String(ePhone).replace(/[^0-9]/g, "").endsWith(String(customer.phone).replace(/[^0-9]/g, "").slice(-9))) ||
      (eEmail && customer?.email && String(eEmail).toLowerCase().trim() === String(customer.email).toLowerCase().trim())
    );
  }) || enrollments[0] || {};
  
  // Check Admin Joining Confirmation Status
  const jStatus = String(getJoiningStatus(clientEnrollment) || "").trim().toLowerCase();
  const cStatus = String(getJoiningStatus(customer) || "").trim().toLowerCase();
  const isConfirmed = 
    jStatus === "confirmed" || 
    jStatus === "enrolled" || 
    jStatus === "active" ||
    cStatus === "confirmed" ||
    cStatus === "enrolled" ||
    cStatus === "active";

  const ledger = data?.["Loyalty Ledger"] || [];
  const clientLedger = ledger.filter((l: any) => {
    const ledgerEnrollId = getEnrollmentId(l);
    return ledgerEnrollId && customer?.enrollmentId && String(ledgerEnrollId).trim() === String(customer.enrollmentId).trim();
  });

  const rewards = data?.["Rewards Catalog"] || [];
  const activeRewards = rewards.filter((r: any) => r.Active);

  const points = getLoyaltyPoints(clientEnrollment) || 500;
  const tier = getLoyaltyTier(clientEnrollment) || "Silver";
  const referralCode = getReferralCode(clientEnrollment) || "OPT-GUEST-1234";

  const handleCopyReferral = () => {
    const origin = window.location.origin;
    const base = import.meta.env.BASE_URL || "/";
    const fullUrl = `${origin}${base.endsWith("/") ? base : base + "/" }?ref=${referralCode}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Referral link copied to clipboard!");
  };

  const handlePrintSection = (elementId: string, isPdf = false) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (isPdf) {
      toast.info("Opening PDF print layout. Please select 'Save as PDF' or 'Microsoft Print to PDF' in the destination dropdown.");
    }

    document.body.classList.add("printing-active");
    element.classList.add("print-section");

    // Trigger window print after layout adjusts
    setTimeout(() => {
      window.print();
      
      const cleanup = () => {
        document.body.classList.remove("printing-active");
        element.classList.remove("print-section");
      };
      
      if ("onafterprint" in window) {
        window.addEventListener("afterprint", cleanup, { once: true });
      } else {
        setTimeout(cleanup, 500);
      }
    }, 100);
  };

  const handleRedeemRewardSubmit = async () => {
    if (!redeemingReward) return;
    setSaving(true);

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      // Mock redeem
      setTimeout(() => {
        if (points < redeemingReward.PointsRequired) {
          toast.error("Insufficient points balance.");
          setSaving(false);
          return;
        }
        clientEnrollment["Loyalty Points"] = points - redeemingReward.PointsRequired;
        toast.success(`Redeemed successfully: ${redeemingReward.RewardName}! Code: OPT-CLAIM-${Math.floor(100000+Math.random()*900000)}`);
        setRedeemingReward(null);
        setSaving(false);
      }, 700);
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "redeemReward",
          enrollmentId: customer?.enrollmentId,
          rewardName: redeemingReward.RewardName,
          pointsRequired: redeemingReward.PointsRequired
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success(`Successfully redeemed ${redeemingReward.RewardName}! Confirmation sent via WhatsApp.`);
        refreshData();
        setRedeemingReward(null);
      } else {
        toast.error(result.message || "Redemption failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Database sync failed.");
    } finally {
      setSaving(false);
    }
  };

  // Simulated Barcode Generator based on Enrollment ID
  const BarcodeRenderer = ({ code }: { code: string }) => {
    const lines = [];
    const hash = code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 0; i < 40; i++) {
      const isBlack = (hash + i * 3) % 2 === 0 || (i % 6 === 0);
      const width = (hash + i * 5) % 3 === 0 ? "w-1" : "w-[2.5px]";
      lines.push(
        <div key={i} className={`h-10 ${isBlack ? "bg-slate-850" : "bg-transparent"} ${width} shrink-0`} />
      );
    }

    return (
      <div className="flex flex-col items-center gap-1.5 mt-2.5 p-2 bg-white rounded-lg border border-slate-200/40 w-fit mx-auto">
        <div className="flex gap-[1.5px] items-center h-10 overflow-hidden bg-white">
          {lines}
        </div>
        <span className="font-mono text-[7px] font-bold text-slate-500 tracking-[3px] uppercase">{code}</span>
      </div>
    );
  };

  if (!isConfirmed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Loyalty Rewards</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review your digital membership card, ledger transactions, and redeem rewards.</p>
        </div>

        <div className="p-12 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 text-center space-y-4 shadow-soft">
          <div className="h-16 w-16 rounded-3xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-slate-100">Loyalty Card Locked</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Your Digital Loyalty Membership Card and Rewards Catalogue will become active as soon as your joining confirmation is approved by your admin coach.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Loyalty Rewards</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review your digital membership card, ledger transactions, and redeem rewards.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Card Visualizer & Referral Link */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <h3 className="font-semibold text-base leading-none">Digital Loyalty Card</h3>

            {/* Interactive Loyalty Card */}
            <div 
              id="loyalty-card-box-portal"
              className={`w-full max-w-sm aspect-[1.6/1] mx-auto rounded-3xl p-6 relative overflow-hidden text-white shadow-soft transition-all duration-500 cursor-pointer loyalty-card-box ${
                cardFlip 
                  ? "bg-slate-850 border border-slate-700" 
                  : "bg-gradient-to-br from-[#064e3b] via-[#0f766e] to-[#0f766e] border border-emerald-400/20"
              }`}
              onClick={() => setCardFlip(!cardFlip)}
            >
              
              <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/20 blur-xl" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-400/40 blur-xl" />
              </div>

              {!cardFlip ? (
                
                /* Front View */
                <div className="h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <img src="/optivita-logo.png" alt="Optivita Logo" className="h-6.5 w-6.5 object-contain filter brightness-0 invert" />
                      <div>
                        <p className="font-display font-black tracking-wider text-sm leading-none">OPTIVITA</p>
                        <p className="text-[7px] text-emerald-250 font-semibold tracking-widest mt-1 uppercase">Your Precision Health Partner</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {tier} Member
                    </span>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-emerald-250 font-semibold leading-none">Card Holder</p>
                    <p className="font-display font-bold text-lg mt-1 truncate">{customer?.fullName}</p>
                    <p className="text-[8px] text-emerald-100/80 mt-0.5 truncate">{customer?.programName}</p>
                  </div>

                  <div className="flex justify-between items-end border-t border-white/10 pt-3">
                    <div>
                      <p className="text-[7px] text-emerald-250/80 uppercase">Enrollment ID</p>
                      <p className="font-mono text-[9px] font-bold mt-0.5">{customer?.enrollmentId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] text-emerald-250/80 uppercase">Points Balance</p>
                      <p className="font-display font-black text-sm text-emerald-350">{points} pts</p>
                    </div>
                  </div>
                </div>
              ) : (
                
                /* Back View */
                <div className="h-full flex flex-col justify-between relative z-10 text-slate-350 text-[8px] leading-relaxed">
                  <div>
                    <p className="font-bold text-slate-200 text-[9px] uppercase mb-1">Terms & Conditions</p>
                    <p>1. Present QR/Barcode on check-ins to claim attendance points.</p>
                    <p>2. Points cannot be redeemed for cash values.</p>
                  </div>

                  <BarcodeRenderer code={customer?.enrollmentId || "OPT-2026-000000"} />

                  <div className="flex justify-between items-center border-t border-slate-800/80 pt-2.5 text-[7px] text-slate-400">
                    <span>Expiry: Dec 2026</span>
                    <span>optivita.com</span>
                  </div>
                </div>
              )}

            </div>

            <p className="text-center text-[10px] text-slate-400">Tap loyalty card to view back details and barcode.</p>

            <div className="flex gap-3">
              <button 
                onClick={() => handlePrintSection("loyalty-card-box-portal")}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300"
              >
                <Printer className="h-3.5 w-3.5" /> Print Card
              </button>
              <button 
                onClick={() => handlePrintSection("loyalty-card-box-portal", true)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-soft"
              >
                <Download className="h-3.5 w-3.5" /> Save PDF
              </button>
            </div>
          </div>

          {/* Referral links card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-4">
            <h3 className="font-semibold text-base leading-none">Share & Earn Points</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Earn <strong>+300 loyalty points</strong> automatically when a friend registers using your code! They also receive a welcome bonus.
            </p>
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{referralCode}</span>
              <button 
                onClick={handleCopyReferral}
                className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Code
              </button>
            </div>
          </div>

        </div>

        {/* Center/Right: Catalog & Points ledger */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Rewards Catalog */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <h3 className="font-semibold text-base leading-none">Rewards Catalogue</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRewards.map((reward: any) => {
                const canClaim = points >= reward.PointsRequired;
                return (
                  <div key={reward.RewardId} className="p-4 border rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-soft transition-all duration-200">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{reward.RewardName}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{reward.Description}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{reward.PointsRequired} pts</span>
                      <button 
                        disabled={!canClaim}
                        onClick={() => setRedeemingReward(reward)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-soft transition-colors ${
                          canClaim 
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" 
                            : "bg-slate-200 dark:bg-slate-850 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        Claim Reward
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Points transaction Ledger Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <h3 className="font-semibold text-base leading-none">Points Ledger History</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Activity</th>
                    <th className="py-3 px-3 text-center">Points Earned</th>
                    <th className="py-3 px-3 text-center">Points Redeemed</th>
                    <th className="py-3 px-3 text-right">Points Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {clientLedger.length > 0 ? (
                    clientLedger.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-3 text-slate-400">{log.Timestamp?.split(",")[0] || "Just now"}</td>
                        <td className="py-3.5 px-3 font-semibold">{log.Activity}</td>
                        <td className="py-3.5 px-3 text-center text-emerald-500 font-bold">+{log["Points Earned"] || 0}</td>
                        <td className="py-3.5 px-3 text-center text-red-500 font-bold">-{log["Points Redeemed"] || 0}</td>
                        <td className="py-3.5 px-3 text-right font-black text-slate-700 dark:text-slate-300">{log["Current Balance"] || 0} pts</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No transactions logged yet. Complete tasks to earn points!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Claim Reward Confirmation modal popup */}
      {redeemingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setRedeemingReward(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up">
            
            <button 
              onClick={() => setRedeemingReward(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1 flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-500" /> Confirm Claim
            </h3>
            <p className="text-xs text-slate-400 mb-5">Would you like to redeem points for this reward?</p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed mb-5">
              <p className="font-bold text-slate-800 dark:text-slate-100">{redeemingReward.RewardName}</p>
              <p className="mt-1">{redeemingReward.Description}</p>
              <p className="mt-3 text-emerald-600 dark:text-emerald-400 font-bold">Cost: {redeemingReward.PointsRequired} Points</p>
            </div>

            <div className="flex gap-3.5">
              <button 
                onClick={() => setRedeemingReward(null)}
                className="flex-1 py-3 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                Cancel
              </button>
              <button 
                onClick={handleRedeemRewardSubmit}
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft disabled:opacity-50"
              >
                {saving ? "Processing Claim..." : "Redeem Points"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

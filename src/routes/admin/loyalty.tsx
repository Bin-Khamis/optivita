import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useCRM } from "@/lib/crmContext";
import { 
  Award, Search, Plus, Minus, ArrowRight, User, ShieldAlert, BadgePercent,
  Download, Printer, Sparkles, AlertCircle, RefreshCw, X
} from "lucide-react";
import { toast } from "sonner";
import { isWebhookOffline } from "@/lib/utils";

export const Route = createFileRoute("/admin/loyalty")({
  component: AdminLoyalty,
});

function AdminLoyalty() {
  const { data, refreshData } = useCRM();
  const [searchTerm, setSearchTerm] = useState("");
  
  // States for adjusting points
  const [adjustingClient, setAdjustingClient] = useState<any | null>(null);
  const [pointsAmount, setPointsAmount] = useState(100);
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [activityText, setActivityText] = useState("Birthday Bonus");
  const [saving, setSaving] = useState(false);

  // States for loyalty card preview
  const [selectedCardClient, setSelectedCardClient] = useState<any | null>(null);
  const [cardFlip, setCardFlip] = useState(false); // Front / Back toggle

  const enrollments = data?.["Program Enrollments"] || [];
  const ledger = data?.["Loyalty Ledger"] || [];

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

  // Filter loyalty members
  const filteredMembers = enrollments.filter((c: any) => {
    if (!c || !c["Enrollment ID"]) return false; // Skip empty rows
    const matchesSearch = 
      (c.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c["Enrollment ID"] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAdjustPointsSubmit = async () => {
    if (!adjustingClient) return;
    setSaving(true);

    const pointsEarned = adjustType === "add" ? pointsAmount : 0;
    const pointsRedeemed = adjustType === "deduct" ? pointsAmount : 0;

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      // Mock update
      setTimeout(() => {
        const clientPts = parseInt(adjustingClient["Loyalty Points"] || 0, 10);
        const change = adjustType === "add" ? pointsAmount : -pointsAmount;
        adjustingClient["Loyalty Points"] = Math.max(0, clientPts + change);
        adjustingClient["Loyalty Tier"] = getPointsTier(adjustingClient["Loyalty Points"]);
        
        toast.success("Points balance updated (Offline Simulation)!");
        setAdjustingClient(null);
        setSaving(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "adjustPoints",
          enrollmentId: adjustingClient["Enrollment ID"],
          activity: activityText,
          pointsEarned,
          pointsRedeemed
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success(`Loyalty points successfully updated!`);
        refreshData();
        setAdjustingClient(null);
      } else {
        toast.error(result.message || "Failed to update points ledger");
      }
    } catch (err) {
      console.error(err);
      toast.error("Database connection failed.");
    } finally {
      setSaving(false);
    }
  };

  const getPointsTier = (pts: number) => {
    if (pts >= 5000) return "Diamond";
    if (pts >= 2000) return "Platinum";
    if (pts >= 1000) return "Gold";
    if (pts >= 500) return "Silver";
    return "Bronze";
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case "Diamond": return "bg-sky-500/10 text-sky-600 border-sky-200";
      case "Platinum": return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "Gold": return "bg-amber-500/10 text-amber-600 border-amber-200";
      case "Silver": return "bg-slate-400/10 text-slate-500 border-slate-200";
      default: return "bg-amber-800/10 text-amber-900 border-amber-800/20";
    }
  };

  // Helper to draw clean visual representation of barcodes
  const BarcodeRenderer = ({ code }: { code: string }) => {
    // Generate simulated striped lines based on characters hash
    const lines = [];
    const hash = code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 0; i < 45; i++) {
      const isBlack = (hash + i * 3) % 2 === 0 || (i % 5 === 0);
      const width = (hash + i * 7) % 3 === 0 ? "w-1" : "w-[2.5px]";
      lines.push(
        <div key={i} className={`h-11 ${isBlack ? "bg-slate-800 dark:bg-slate-100" : "bg-transparent"} ${width} shrink-0`} />
      );
    }

    return (
      <div className="flex flex-col items-center gap-1.5 mt-4 p-2 bg-white/95 rounded-lg border border-slate-200/40 w-fit mx-auto">
        <div className="flex gap-[1.5px] items-center h-11 overflow-hidden">
          {lines}
        </div>
        <span className="font-mono text-[8px] font-bold text-slate-500 tracking-[3px] uppercase">{code}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Header */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Loyalty Ledger & Cards</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage membership rewards, tier statuses, and adjust loyalty points balances.</p>
      </div>

      {/* Main Database & Preview layout grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Loyalty members table column */}
        <div className="xl:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[20px] p-5 shadow-soft">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search loyalty members by ID, name or phone..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                    <th className="py-4.5 px-4">Enrollment ID</th>
                    <th className="py-4.5 px-4">Member Name</th>
                    <th className="py-4.5 px-4 text-center">Points Balance</th>
                    <th className="py-4.5 px-4">Loyalty Tier</th>
                    <th className="py-4.5 px-4">Referral Code</th>
                    <th className="py-4.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member: any, idx: number) => (
                      <tr key={member["Enrollment ID"] || idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-4.5 px-4 font-bold text-slate-400 dark:text-slate-500">{member["Enrollment ID"]}</td>
                        <td className="py-4.5 px-4 font-semibold">{member.fullName}</td>
                        <td className="py-4.5 px-4 text-center font-black text-slate-800 dark:text-slate-200 text-sm">
                          {member["Loyalty Points"] || "0"} pts
                        </td>
                        <td className="py-4.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider ${getTierBadgeStyle(member["Loyalty Tier"])}`}>
                            {member["Loyalty Tier"] || "Bronze"}
                          </span>
                        </td>
                        <td className="py-4.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{member["Referral Code"] || "N/A"}</td>
                        <td className="py-4.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setAdjustingClient(member)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              Adjust Pts
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedCardClient(member);
                                setCardFlip(false);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                            >
                              View Card
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No loyalty members found matching search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Loyalty Card Visualizer Side Preview Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
            <h3 className="font-semibold text-base mb-6 leading-none flex items-center gap-2">
              <BadgePercent className="h-5 w-5 text-emerald-500" /> Digital Card Visualizer
            </h3>

            {selectedCardClient ? (
              <div className="space-y-6 animate-scale-up">
                
                {/* 3D Glass Card Container */}
                <div 
                  id="loyalty-card-box-admin"
                  className={`w-full max-w-sm aspect-[1.6/1] mx-auto rounded-3xl p-6 relative overflow-hidden text-white shadow-soft transition-all duration-500 cursor-pointer loyalty-card-box ${
                    cardFlip 
                      ? "bg-slate-850 border border-slate-700" 
                      : "bg-gradient-to-br from-[#064e3b] via-[#0f766e] to-[#0f766e] border border-emerald-400/20"
                  }`}
                  onClick={() => setCardFlip(!cardFlip)}
                >
                  
                  {/* Decorative background details */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/20 blur-xl" />
                    <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-400/40 blur-xl" />
                  </div>

                  {!cardFlip ? (
                    
                    /* Front Side Content */
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
                          {selectedCardClient["Loyalty Tier"] || "Bronze"} Member
                        </span>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-emerald-250 font-semibold leading-none">Card Holder</p>
                        <p className="font-display font-bold text-lg mt-1 truncate">{selectedCardClient.fullName}</p>
                        <p className="text-[8px] text-emerald-100/80 mt-0.5 truncate">{selectedCardClient.programName}</p>
                      </div>

                      <div className="flex justify-between items-end border-t border-white/10 pt-3">
                        <div>
                          <p className="text-[7px] text-emerald-250/80 uppercase">Enrollment ID</p>
                          <p className="font-mono text-[9px] font-bold mt-0.5">{selectedCardClient["Enrollment ID"]}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[7px] text-emerald-250/80 uppercase">Points Balance</p>
                          <p className="font-display font-black text-sm text-emerald-350">{selectedCardClient["Loyalty Points"] || 0} pts</p>
                        </div>
                      </div>

                    </div>
                  ) : (
                    
                    /* Back Side Content */
                    <div className="h-full flex flex-col justify-between relative z-10 text-slate-350 text-[8px] leading-relaxed">
                      
                      <div>
                        <p className="font-bold text-slate-200 text-[9px] uppercase mb-1">Terms & Conditions</p>
                        <p>1. Present QR/Barcode on check-ins to claim attendance points.</p>
                        <p>2. Points cannot be redeemed for cash values.</p>
                        <p>3. Memberships are non-transferable.</p>
                      </div>

                      {/* Render Barcode dynamically */}
                      <BarcodeRenderer code={selectedCardClient["Enrollment ID"] || "OPT-2026-000000"} />

                      <div className="flex justify-between items-center border-t border-slate-800/80 pt-2.5 text-[7px] text-slate-400">
                        <span>Expiry: Dec 2026</span>
                        <span>optivita.com</span>
                      </div>

                    </div>
                  )}

                </div>

                {/* Flip Indicator */}
                <p className="text-center text-[10px] text-slate-400">Click the card to review {cardFlip ? "Front Face" : "Back barcode information"}</p>

                {/* Print and download links */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => handlePrintSection("loyalty-card-box-admin")}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Card
                  </button>
                  <button 
                    onClick={() => handlePrintSection("loyalty-card-box-admin", true)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft"
                  >
                    <Download className="h-3.5 w-3.5" /> Save PDF
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center text-slate-400 py-16 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-8 w-8 text-slate-300" />
                <p className="text-xs">Select a member profile from the list to preview their loyalty card.</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Adjust Points Modal popup dialog */}
      {adjustingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setAdjustingClient(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up">
            
            <button 
              onClick={() => setAdjustingClient(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1">Adjust Loyalty Points</h3>
            <p className="text-xs text-slate-400 mb-5">{adjustingClient.fullName} ({adjustingClient["Enrollment ID"]})</p>

            <div className="space-y-4">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border">
                <button 
                  onClick={() => setAdjustType("add")}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${
                    adjustType === "add" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-soft" : "text-slate-500"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Points
                </button>
                <button 
                  onClick={() => setAdjustType("deduct")}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${
                    adjustType === "deduct" ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-soft" : "text-slate-500"
                  }`}
                >
                  <Minus className="h-3.5 w-3.5" /> Deduct Points
                </button>
              </div>

              {/* Amount input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points Amount</label>
                <input 
                  type="number" 
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full p-3 text-sm border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Reason activity text */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Reason</label>
                <select 
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="Birthday Bonus">Birthday Bonus (+100 pts)</option>
                  <option value="Google Review Bonus">Google Review (+50 pts)</option>
                  <option value="Webinar Attendance">Webinar Attendance (+40 pts)</option>
                  <option value="Friend Referral Bonus">Friend Referral (+300 pts)</option>
                  <option value="Manual Adjustment">Manual Coordinator Override</option>
                </select>
              </div>

              {/* Submit Adjustments */}
              <button 
                onClick={handleAdjustPointsSubmit}
                disabled={saving}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2 ${
                  adjustType === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-650 hover:bg-red-700"
                }`}
              >
                {saving ? "Writing Ledger..." : "Apply Adjustment"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

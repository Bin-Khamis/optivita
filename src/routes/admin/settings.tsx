import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCRM } from "@/lib/crmContext";
import { 
  Settings, Award, Plus, Edit, Trash2, SwitchCamera, CheckSquare, 
  HelpCircle, RefreshCw, X, Gift, Percent
} from "lucide-react";
import { toast } from "sonner";
import { isWebhookOffline } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { data, refreshData } = useCRM();
  
  // Point values configurations (local state since we store points logic inside Google Apps Script webhook trigger)
  const [enrollPoints, setEnrollPoints] = useState(500);
  const [renewalPoints, setRenewalPoints] = useState(400);
  const [referralPoints, setReferralPoints] = useState(300);
  const [checkinPoints, setCheckinPoints] = useState(20);
  const [reviewPoints, setReviewPoints] = useState(50);
  const [assessPoints, setAssessPoints] = useState(30);

  // Rewards catalog states
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [rewardName, setRewardName] = useState("");
  const [pointsRequired, setPointsRequired] = useState(500);
  const [rewardDesc, setRewardDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const rewards = data?.["Rewards Catalog"] || [];

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear all data and restore mock database defaults? This will erase all your local changes (adjusted points, logged receipts, etc.).")) {
      localStorage.removeItem("optivita_crm_cache");
      toast.success("Database cache cleared! Restoring defaults and reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleUpdatePointsRules = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Earning points configuration updated successfully!");
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardName || !rewardDesc) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSaving(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      // Mock add
      setTimeout(() => {
        rewards.push({
          RewardId: "RW-" + Math.floor(100 + Math.random() * 900),
          RewardName: rewardName,
          PointsRequired: pointsRequired,
          Active: true,
          Description: rewardDesc
        });
        toast.success("New reward item added to catalog (Offline Simulation)!");
        setShowAddRewardModal(false);
        setSaving(false);
        resetRewardForm();
      }, 600);
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Rewards Catalog",
          idColumn: "RewardId",
          id: "RW-" + Math.floor(100 + Math.random() * 900),
          fields: {
            "RewardName": rewardName,
            "PointsRequired": pointsRequired,
            "Active": true,
            "Description": rewardDesc
          }
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Rewards catalog updated instantly!");
        refreshData();
        setShowAddRewardModal(false);
        resetRewardForm();
      } else {
        toast.error("Failed to write reward item.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Database sync timeout.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisableRewardToggle = async (reward: any) => {
    const nextActive = !reward.Active;
    
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      reward.Active = nextActive;
      toast.success(`Reward item status set to ${nextActive ? "Enabled" : "Disabled"}`);
      refreshData();
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Rewards Catalog",
          idColumn: "RewardId",
          id: reward.RewardId,
          fields: {
            "Active": nextActive
          }
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Reward status toggled.");
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetRewardForm = () => {
    setRewardName("");
    setPointsRequired(500);
    setRewardDesc("");
  };

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure loyalty points weights and rewards catalog items.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Points Weights editor Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
          <h3 className="font-semibold text-base mb-6 flex items-center gap-2">
            <Percent className="h-5 w-5 text-emerald-500" /> Point System Rules
          </h3>

          <form onSubmit={handleUpdatePointsRules} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program Enrollment</label>
              <input 
                type="number" 
                value={enrollPoints}
                onChange={(e) => setEnrollPoints(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program Renewal</label>
              <input 
                type="number" 
                value={renewalPoints}
                onChange={(e) => setRenewalPoints(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Friend Referral Bonus</label>
              <input 
                type="number" 
                value={referralPoints}
                onChange={(e) => setReferralPoints(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Check-in Completion</label>
              <input 
                type="number" 
                value={checkinPoints}
                onChange={(e) => setCheckinPoints(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Progress Review</label>
              <input 
                type="number" 
                value={reviewPoints}
                onChange={(e) => setReviewPoints(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2"
            >
              Update Earning Rules
            </button>

          </form>
        </div>

        {/* Rewards Catalog Manager */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-500" /> Rewards Catalogue
            </h3>
            <button 
              onClick={() => setShowAddRewardModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-soft flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Reward Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((rw: any) => (
              <div 
                key={rw.RewardId} 
                className={`p-4 border rounded-2xl flex flex-col justify-between hover:shadow-soft transition-all duration-200 ${
                  rw.Active 
                    ? "border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40" 
                    : "border-slate-200/40 bg-slate-100/20 opacity-55"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">{rw.RewardId}</span>
                    <button 
                      onClick={() => handleDisableRewardToggle(rw)}
                      className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider border transition-colors ${
                        rw.Active ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-red-500/10 text-red-600 border-red-200"
                      }`}
                    >
                      {rw.Active ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>
                  
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">{rw.RewardName}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">{rw.Description}</p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{rw.PointsRequired} points</span>
                  <span className="text-[10px] text-slate-400">Claims: 12</span>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Database Maintenance Section */}
      <div className="bg-white dark:bg-slate-900 border border-red-200/60 dark:border-red-900/40 rounded-[24px] p-6 shadow-soft space-y-4">
        <h3 className="font-semibold text-base text-red-600 dark:text-red-400 flex items-center gap-2">
          <Trash2 className="h-5 w-5" /> Database Maintenance
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Clearing the system database cache will restore all data models (Program Enrollments, Loyalty Ledger, Receipts, Invoices, Expenses, Staff) back to their initial default mock templates. Use this button to clear all local edits, adjustments, and test entries. **This action cannot be undone.**
        </p>
        <button 
          onClick={handleClearAllData}
          className="px-5 py-3 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-soft transition-all duration-200"
        >
          <RefreshCw className="h-4 w-4 animate-spin-reverse" /> Clear All Data & Reset Database
        </button>
      </div>

      {/* Add Reward Modal popup */}
      {showAddRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddRewardModal(false)} />
          <form onSubmit={handleAddReward} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up">
            
            <button 
              type="button"
              onClick={() => setShowAddRewardModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1">Create Catalog Reward</h3>
            <p className="text-xs text-slate-400 mb-5">Define points threshold and reward descriptors.</p>

            <div className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reward Item Name</label>
                <input 
                  type="text" 
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  placeholder="e.g. Free Nutrition Consultation"
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points Cost Threshold</label>
                <input 
                  type="number" 
                  value={pointsRequired}
                  onChange={(e) => setPointsRequired(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Public Description</label>
                <textarea 
                  rows={3}
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  placeholder="Explain benefits and claim requirements..."
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2"
              >
                {saving ? "Creating reward..." : "Add Reward Item"}
              </button>

            </div>
          </form>
        </div>
      )}

    </div>
  );
}

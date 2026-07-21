import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePortal } from "@/lib/portalContext";
import { 
  Activity, TrendingUp, Plus, Calendar, Scale, Footprints, Flame,
  CheckCircle2, AlertCircle, HeartPulse, RefreshCw
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/progress")({
  component: CustomerProgress,
});

function CustomerProgress() {
  const { data, customer } = usePortal();

  // Progress chart dataset (mock tracking history)
  const [progressData, setProgressData] = useState([
    { date: "Wk 1", weight: 80.5, steps: 7200, calories: 2350 },
    { date: "Wk 2", weight: 79.8, steps: 8900, calories: 2180 },
    { date: "Wk 3", weight: 79.1, steps: 10400, calories: 2200 },
    { date: "Wk 4", weight: 78.0, steps: 11200, calories: 2100 }
  ]);

  // Log progress input states
  const [logWeight, setLogWeight] = useState("");
  const [logSteps, setLogSteps] = useState("");
  const [logCalories, setLogCalories] = useState("");
  const [logging, setLogging] = useState(false);

  const assessments = data?.["Health Assessments"] || [];
  const clientAssessment = assessments.find((a: any) => a.fullName === customer?.fullName) || assessments[0] || {};

  const handleLogProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logWeight || !logSteps) {
      toast.error("Please fill in weight and steps logs.");
      return;
    }

    setLogging(true);
    setTimeout(() => {
      const newEntry = {
        date: `Wk ${progressData.length + 1}`,
        weight: parseFloat(logWeight),
        steps: parseInt(logSteps, 10),
        calories: parseInt(logCalories || "2200", 10)
      };
      
      setProgressData(prev => [...prev, newEntry]);
      toast.success("Progress logs saved! Earned +20 loyalty points.");
      
      // Clear inputs
      setLogWeight("");
      setLogSteps("");
      setLogCalories("");
      setLogging(false);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Progress Tracking</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review weight logs, physical activities, and clinical health check calculations.</p>
      </div>

      {/* Progress Charts & Logging Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-base leading-none">Weight Reduction Trend</h3>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">Tracking client weight loss progress logs</p>
          </div>

          <div className="h-64 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip />
                <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Log check-in form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
          <h3 className="font-semibold text-base mb-6 leading-none flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" /> Log Weekly Check-in
          </h3>

          <form onSubmit={handleLogProgressSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Scale className="h-3.5 w-3.5" /> Current Weight (kg)
              </label>
              <input 
                type="number" 
                step="0.1"
                value={logWeight}
                onChange={(e) => setLogWeight(e.target.value)}
                placeholder="e.g. 78.5"
                className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Footprints className="h-3.5 w-3.5" /> Daily Target Steps
              </label>
              <input 
                type="number" 
                value={logSteps}
                onChange={(e) => setLogSteps(e.target.value)}
                placeholder="e.g. 9500"
                className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> Average Daily Calories (kcal)
              </label>
              <input 
                type="number" 
                value={logCalories}
                onChange={(e) => setLogCalories(e.target.value)}
                placeholder="e.g. 2150"
                className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={logging}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2"
            >
              {logging ? "Logging progress..." : "Submit Progress Entry"}
            </button>

          </form>
        </div>

      </div>

      {/* Health Calculator assessment report history */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
        <h3 className="font-semibold text-base leading-none mb-6">Patient Health Assessment Report</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Calculated BMI Score</span>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">{clientAssessment.bmi || "24.6"}</p>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full mt-2 inline-block font-bold">
              {clientAssessment.bmiCategory || "Normal"} Category
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Height / Weight Logs</span>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4 leading-none">{clientAssessment.height || "178"} cm</p>
            <p className="text-xs text-slate-500 mt-2 leading-none">{clientAssessment.weight || "78"} kg base weight</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age & Gender Profile</span>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4 leading-none">{clientAssessment.age || "33"} years</p>
            <p className="text-xs text-slate-500 mt-2 leading-none">{clientAssessment.gender || "Male"}</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evaluation Health Score</span>
            <p className="text-3xl font-black text-amber-500 mt-3">{clientAssessment.healthScore || "78"} / 100</p>
            <span className="text-[9px] text-slate-500 block mt-2 font-medium">Recommended: {clientAssessment.recommendedProgram}</span>
          </div>

        </div>
      </div>

    </div>
  );
}

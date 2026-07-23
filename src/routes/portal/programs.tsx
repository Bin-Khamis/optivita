import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePortal } from "@/lib/portalContext";
import { 
  CheckSquare, ShieldCheck, HeartPulse, RefreshCw, Calendar, 
  HelpCircle, Sparkles, ChevronRight, Play, BookOpen, CheckCircle, Clock, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { getEnrollmentId, getPhone, getEmail } from "@/lib/utils";

export const Route = createFileRoute("/portal/programs")({
  component: CustomerPrograms,
});

function CustomerPrograms() {
  const { data, customer } = usePortal();
  const [renewing, setRenewing] = useState(false);

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

  const progressVal = clientEnrollment["Progress"] !== undefined 
    ? Number(clientEnrollment["Progress"]) 
    : (clientEnrollment["Completion Progress"] !== undefined ? Number(clientEnrollment["Completion Progress"]) : 0);

  const currentWeek = Number(clientEnrollment["Current Week"] || 2);

  // Deliverables Roadmap
  let deliverables = [
    { week: 1, title: "Initial Clinical Assessment & Detox Meal Plan", status: "Completed" },
    { week: 2, title: "Metabolic Adaptation & Calorie Adjustment", status: "In Progress" },
    { week: 3, title: "Mid-Program Progress Evaluation & Biomarkers", status: "Pending" },
    { week: 4, title: "Final Health Summary & Subscription Renewal Plan", status: "Pending" }
  ];

  try {
    const rawDelivs = typeof clientEnrollment["Deliverables"] === "string" 
      ? JSON.parse(clientEnrollment["Deliverables"]) 
      : clientEnrollment["Deliverables"];
    if (rawDelivs && Array.isArray(rawDelivs) && rawDelivs.length > 0) {
      deliverables = rawDelivs;
    }
  } catch (e) {}

  // Deliverables checklist
  const [tasks, setTasks] = useState(() => {
    try {
      const rawTasks = typeof clientEnrollment["Tasks"] === "string" 
        ? JSON.parse(clientEnrollment["Tasks"]) 
        : clientEnrollment["Tasks"];
      if (rawTasks && Array.isArray(rawTasks) && rawTasks.length > 0) {
        return rawTasks;
      }
    } catch (e) {}
    return [
      { id: 1, text: "Log weekly calorie count in profile tracker", done: true },
      { id: 2, text: "Complete weekly checklist health review", done: false },
      { id: 3, text: "Attend Live Webinar: Science of PCOS & Keto", done: false },
      { id: 4, text: "Log daily target steps limit (minimum 8,000 steps)", done: true }
    ];
  });

  const handleToggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    toast.success("Progress checklist updated! +5 Points recorded.");
  };

  const handleRenewMembership = () => {
    setRenewing(true);
    setTimeout(() => {
      setRenewing(false);
      toast.success("Renewal inquiry submitted! Your coach will contact you on WhatsApp with checkout options.");
    }, 900);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Coaching Hub</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review active program deliverables, weekly checklists, and renew subscriptions.</p>
      </div>

      {/* Program Completion Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-4">
        <div className="flex justify-between items-center text-xs font-bold">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-800 dark:text-slate-100 font-extrabold text-sm">{clientEnrollment.programName || customer?.programName || "Medical Wellness Program"}</span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">{progressVal}% Completed</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressVal}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Weekly Deliverables Roadmap & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Weekly Deliverables Roadmap */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-base leading-none flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" /> Weekly Deliverables Roadmap
              </h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full">
                Week {currentWeek} of 4 Active
              </span>
            </div>

            <div className="space-y-3">
              {deliverables.map((item: any, idx: number) => {
                const isCurrent = item.week === currentWeek;
                return (
                  <div 
                    key={idx}
                    className={`p-4 border rounded-2xl flex items-center justify-between transition-all duration-200 ${
                      item.status === "Completed"
                        ? "border-emerald-500/10 bg-emerald-500/5 text-slate-700 dark:text-slate-300"
                        : isCurrent
                          ? "border-emerald-500/30 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/20 shadow-soft"
                          : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        item.status === "Completed" ? "bg-emerald-600 text-white" : isCurrent ? "bg-emerald-500/20 text-emerald-600" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}>
                        W{item.week || idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Assigned Clinical Deliverable</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                      item.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" :
                      item.status === "In Progress" ? "bg-blue-500/10 text-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Weekly Tasks Checklist */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-base leading-none flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-500" /> Active Weekly Checklist
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Coach Assigned Tasks</span>
            </div>

            <div className="space-y-3">
              {tasks.map(t => (
                <div 
                  key={t.id}
                  onClick={() => handleToggleTask(t.id)}
                  className={`p-4 border rounded-2xl flex items-start gap-3.5 cursor-pointer hover:shadow-soft transition-all duration-200 ${
                    t.done 
                      ? "border-emerald-500/10 bg-emerald-500/5 text-slate-500" 
                      : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100"
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={t.done}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span className={`text-xs font-semibold leading-normal ${t.done ? "line-through opacity-70" : ""}`}>{t.text}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-[11px] text-slate-400 leading-normal flex items-start gap-2.5">
              <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                Complete your weekly tasks to earn up to <strong>+20 loyalty points</strong> automatically! Points can be redeemed for consultations and extending programs.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Renewal Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft flex flex-col gap-5 sticky top-24">
          <h3 className="font-semibold text-base leading-none flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-emerald-500" /> Renew Subscription
          </h3>

          <div className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Active Subscription Plan:</p>
            <p className="font-medium text-emerald-600 dark:text-emerald-400">{clientEnrollment.programName || customer?.programName}</p>
            <p className="pt-2 text-slate-500">Maintain uninterrupted access to your clinical coach, weekly meal routines, and progress evaluations.</p>
          </div>

          <button 
            onClick={handleRenewMembership}
            disabled={renewing}
            className="w-full text-center bg-brand-gradient text-white font-bold py-3.5 rounded-xl text-xs shadow-soft hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            {renewing ? "Submitting Inquiry..." : "Renew / Extend Program"}
          </button>
        </div>

      </div>

    </div>
  );
}

import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePortal } from "@/lib/portalContext";
import { toast } from "sonner";
import { isWebhookOffline } from "@/lib/utils";
import {
  HeartPulse,
  Calendar,
  Activity,
  FileText,
  CheckSquare,
  Sparkles,
  ArrowRight,
  User,
  Scale,
  Cpu,
  Download,
  Send,
  Lock,
  Eye,
  Smile,
  ShieldCheck,
  CheckCircle,
  Users,
  Egg,
  Pizza,
  Utensils,
  Cookie,
  Smartphone,
  Music,
  PlayCircle,
  PauseCircle,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  getEnrollmentId,
  getJoiningStatus,
  getPhone,
  getProgress,
  getAmount,
  getInvoiceId,
  getProgramName,
  getInvoiceStatus,
  getInvoiceDate,
  findClientEnrollment
} from "@/lib/utils";

export const Route = createFileRoute("/portal/dashboard")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { data, customer, refreshData } = usePortal();
  const [localData, setLocalData] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState(0); // 0: Today's Hub, 1: Daily Tracker, 2: Mindfulness, 3: Profile & Billing
  const [typedMsg, setTypedMsg] = React.useState("");
  const [sendingMsg, setSendingMsg] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Vitals form state
  const [weight, setWeight] = React.useState("");
  const [fat, setFat] = React.useState("");
  const [muscle, setMuscle] = React.useState("");
  const [water, setWater] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Mindfulness state
  const [playingSession, setPlayingSession] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Device sync state
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncTime, setSyncTime] = React.useState("Jul 28, 07:30 AM");
  const [stepCount, setStepCount] = React.useState(8420);

  React.useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const enrollments = localData?.["Program Enrollments"] || [];
  const clientEnrollment = findClientEnrollment(enrollments, customer) || {};

  const isConfirmed = true; // Assume active portal layout access is unlocked

  const assessments = localData?.["Health Assessments"] || [];
  const clientAssessment =
    assessments.find((a: any) => a.fullName === customer?.fullName) || assessments[0] || {};

  const appointments = localData?.["Appointments"] || [];
  const clientAppointments = appointments.filter(
    (a: any) => a.fullName === customer?.fullName || a.phone === customer?.phone,
  );

  const invoices = localData?.["Invoices"] || [];
  const clientInvoices = invoices.filter((i: any) => {
    const invEnrollId = getEnrollmentId(i);
    const invPhone = getPhone(i);
    return (
      (invEnrollId &&
        customer?.enrollmentId &&
        String(invEnrollId).trim() === String(customer.enrollmentId).trim()) ||
      (invPhone &&
        customer?.phone &&
        String(invPhone)
          .replace(/[^0-9]/g, "")
          .endsWith(
            String(customer.phone)
              .replace(/[^0-9]/g, "")
              .slice(-9),
          ))
    );
  });

  const points = getLoyaltyPoints(clientEnrollment) || 500;
  const tier = getLoyaltyTier(clientEnrollment) || "Silver";

  // Calculate dynamic program completion
  const totalDays = 30;
  const completedDays = 18;
  const daysLeft = totalDays - completedDays;
  const progressPercent = Math.round((completedDays / totalDays) * 100);

  // Financial summaries
  const totalBilled = clientInvoices.reduce(
    (sum: number, i: any) => sum + Number(getAmount(i) || 0),
    0,
  );
  const totalPaid = clientInvoices
    .filter((i: any) => getInvoiceStatus(i) === "Paid")
    .reduce((sum: number, i: any) => sum + Number(getAmount(i) || 0), 0);
  const outstandingBalance = totalBilled - totalPaid;

  // Daily Tasks
  const isToday = (dateVal: any) => {
    if (!dateVal) return false;
    const todayStr = new Date().toISOString().split("T")[0];
    const logDateStr = new Date(dateVal).toISOString().split("T")[0];
    return todayStr === logDateStr;
  };

  const clientMeals = (localData?.["Meal Logs"] || []).filter(
    (m: any) =>
      String(m["Enrollment ID"] || m.EnrollmentID || "").trim() === String(customer?.enrollmentId || "").trim() &&
      isToday(m.Date)
  );

  const clientWorkouts = (localData?.["Workout Logs"] || []).filter(
    (w: any) =>
      String(w["Enrollment ID"] || w.EnrollmentID || "").trim() === String(customer?.enrollmentId || "").trim() &&
      isToday(w.Date)
  );

  const totalDailyTasks = clientMeals.length + clientWorkouts.length;
  const completedDailyTasks = 
    clientMeals.filter((m: any) => String(m.Status || "").toLowerCase().includes("complete") || String(m.Status || "").toLowerCase().includes("done")).length +
    clientWorkouts.filter((w: any) => String(w.Status || "").toLowerCase().includes("complete") || String(w.Status || "").toLowerCase().includes("done")).length;

  const dailyProgressVal = totalDailyTasks > 0 ? Math.round((completedDailyTasks / totalDailyTasks) * 100) : 0;
  const dailyProgressPercentage = Math.min(100, Math.max(0, dailyProgressVal));

  // Chat message threads
  const rawMessages = localData?.["Messages"] || [];
  const clientEnrollmentId = customer?.enrollmentId || "";
  const chatMessages = rawMessages
    .filter((m: any) => {
      const sender = String(m["Sender ID"] || m.SenderID || "").trim();
      const recipient = String(m["Recipient ID"] || m.RecipientID || "").trim();
      return (
        (sender === clientEnrollmentId && recipient === "admin") ||
        (sender === "admin" && recipient === clientEnrollmentId)
      );
    })
    .sort((a: any, b: any) => {
      const tA = new Date(a.Timestamp || a.timestamp).getTime();
      const tB = new Date(b.Timestamp || b.timestamp).getTime();
      return tA - tB;
    });

  const todayStr = new Date().toISOString().split("T")[0];
  const sentTodayCount = rawMessages.filter((m: any) => {
    const sender = String(m["Sender ID"] || m.SenderID || "").trim();
    const timestamp = String(m.Timestamp || m.timestamp || "");
    return sender === clientEnrollmentId && timestamp.includes(todayStr);
  }).length;

  const isLimitReached = sentTodayCount >= 5; // Enforce secure chat limits

  const handleToggleDailyTask = async (sheetName: "Meal Logs" | "Workout Logs", logId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    const currentDataset = { ...localData };
    const list = currentDataset[sheetName] || [];
    const idx = list.findIndex((item: any) => (item["Log ID"] || item.LogID) === logId);
    if (idx !== -1) {
      list[idx]["Status"] = nextStatus;
      currentDataset[sheetName] = list;
      setLocalData(currentDataset);
      localStorage.setItem("optivita_crm_cache", JSON.stringify(currentDataset));
    }
    toast.success(`Task marked as ${nextStatus === "Completed" ? "completed" : "pending"}!`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMsg.trim()) return;
    if (isLimitReached) {
      toast.error("Daily messaging limit reached.");
      return;
    }
    setSendingMsg(true);
    const msgId = "MSG-2026-W" + (rawMessages.length + 101);
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} | ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newDataset = { ...localData };
    if (!newDataset["Messages"]) newDataset["Messages"] = [];
    newDataset["Messages"].push({
      "Message ID": msgId,
      "Sender ID": clientEnrollmentId,
      "Sender Type": "Client",
      "Recipient ID": "admin",
      Message: typedMsg.trim(),
      Timestamp: timestampStr
    });
    setLocalData(newDataset);
    localStorage.setItem("optivita_crm_cache", JSON.stringify(newDataset));

    toast.success("Secure chat delivered to coach!");
    setTypedMsg("");
    setSendingMsg(false);
  };

  const triggerWatchSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncTime("Just now");
      setStepCount(10542);
      toast.success("Smartwatch data synchronized!");
    }, 1500);
  };

  const handleLogVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight && !water) {
      toast.error("Please enter weight or water intake.");
      return;
    }
    toast.success("Vitals log successfully registered in system CRM!");
    setWeight("");
    setFat("");
    setMuscle("");
    setWater("");
    setNotes("");
  };

  return (
    <div className="space-y-6 min-h-screen bg-[#F3F8F6] p-6 rounded-[32px] text-[#0F172A]">
      {/* Dynamic Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center gap-3 p-1.5 bg-[#E2EFEA] rounded-[24px] max-w-xl">
        {["Today's Hub", "Daily Tracker", "Mindfulness", "Profile & Billing"].map((label, idx) => {
          const active = activeTab === idx;
          return (
            <button
              key={label}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 min-w-[100px] text-center py-2.5 rounded-[18px] text-xs font-bold transition-all duration-300 ${
                active ? "bg-white text-[#1B7A8A] shadow-soft" : "text-slate-500 hover:text-[#1B7A8A]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Main Content Areas */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Hub Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Banner */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-500" /> Precision Coaching Active
                </span>
                <h2 className="text-2xl font-black text-[#1B3A5C] mt-1">Welcome back, {customer?.fullName}!</h2>
                <p className="text-xs text-slate-400 mt-0.5">Let's check your checklist and progress metrics for today.</p>
              </div>
            </div>

            {/* Program Progress Circle SVG Card */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft flex flex-col sm:flex-row items-center gap-8 justify-around">
              <div className="relative h-44 w-44 flex items-center justify-center">
                <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#E8EFEA" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#3AA655"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10 space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Program Progress</span>
                  <p className="text-lg font-black text-[#1B3A5C]">{daysLeft} Days Left</p>
                  <p className="text-[10px] font-bold text-emerald-600">Day {completedDays} / {totalDays}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-[#1B3A5C]">Program Details</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  Your customized weight management & metabology program consists of 30 days clinical tracking. Keep up with your checklist to sustain progress!
                </p>
              </div>
            </div>

            {/* Daily Schedule Checklist */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft space-y-4">
              <h3 className="font-extrabold text-base text-[#1B3A5C] flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Today's Schedule & Checklist
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Meals */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">🍳 Meals today</h4>
                  {clientMeals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No meal schedules found.</p>
                  ) : (
                    clientMeals.map((meal: any) => {
                      const id = meal["Log ID"] || meal.LogID;
                      const isDone = String(meal.Status || "").toLowerCase().includes("complete") || String(meal.Status || "").toLowerCase().includes("done");
                      return (
                        <div
                          key={id}
                          onClick={() => handleToggleDailyTask("Meal Logs", id, meal.Status || "Pending")}
                          className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isDone ? "bg-emerald-500/5 border-emerald-500/20 text-slate-400" : "bg-[#F8FAFC] border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="text-xs">
                            <span className="font-black text-[9px] bg-emerald-600/10 text-emerald-600 px-1.5 py-0.5 rounded mr-1.5">
                              {meal["Meal Type"]}
                            </span>
                            <span className={isDone ? "line-through" : "font-bold"}>{meal["Food Items"]}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Workouts */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">🏃 Workouts today</h4>
                  {clientWorkouts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No workouts scheduled.</p>
                  ) : (
                    clientWorkouts.map((workout: any) => {
                      const id = workout["Log ID"] || workout.LogID;
                      const isDone = String(workout.Status || "").toLowerCase().includes("complete") || String(workout.Status || "").toLowerCase().includes("done");
                      return (
                        <div
                          key={id}
                          onClick={() => handleToggleDailyTask("Workout Logs", id, workout.Status || "Pending")}
                          className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isDone ? "bg-emerald-500/5 border-emerald-500/20 text-slate-400" : "bg-[#F8FAFC] border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="text-xs">
                            <span className="font-black text-[9px] bg-cyan-600/10 text-cyan-600 px-1.5 py-0.5 rounded mr-1.5">
                              {workout.Intensity || "Medium"}
                            </span>
                            <span className={isDone ? "line-through" : "font-bold"}>{workout.Activity}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Hub Right Column (Directions, Meet, Messages) */}
          <div className="space-y-6">
            {/* Coach Directions Card */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft space-y-4">
              <h3 className="font-extrabold text-base text-[#1B3A5C] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1B7A8A]" /> Coach Guidelines
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                "Keep focus on fiber rich carbohydrates during lunch. Maintain water intake target and avoid snacking past 8:00 PM."
              </p>
            </div>

            {/* Meet consultation options */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-400">NEXT REVIEW CALL</h4>
                <p className="text-sm font-black text-[#1B3A5C] mt-1">Tomorrow, 2:30 PM</p>
              </div>
              <button
                onClick={() => toast.success("Redirecting to video consultation call...")}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
              >
                Join Call
              </button>
            </div>

            {/* Private Message Chat Widget */}
            <div className="p-5 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft flex flex-col h-[300px]">
              <h3 className="font-extrabold text-sm text-[#1B3A5C] mb-3">Coach Secure Chat</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {chatMessages.map((m: any) => {
                  const isMe = (m["Sender Type"] || m.SenderType) === "Client";
                  return (
                    <div key={m["Message ID"]} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`p-2.5 rounded-xl max-w-[80%] ${isMe ? "bg-[#1B7A8A] text-white" : "bg-[#F3F8F6] text-slate-800"}`}>
                        <p>{m.Message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={typedMsg}
                  onChange={(e) => setTypedMsg(e.target.value)}
                  placeholder="Ask coach..."
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B7A8A]"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-[#1B7A8A] text-white"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Tracker Left Column (Food Plan & Watch activity) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Food Grid */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft space-y-4">
              <h3 className="font-extrabold text-base text-[#1B3A5C]">Weekly Food Plan</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-[#E2F0EC] rounded-2xl text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-[#F3F8F6] mx-auto flex items-center justify-center text-[#1B7A8A]"><Egg className="h-5 w-5" /></div>
                  <h4 className="font-bold text-xs text-[#1B3A5C]">Breakfast</h4>
                  <p className="text-[10px] text-slate-400">450 kcal • Avocado toast & boiled egg</p>
                </div>
                <div className="p-4 border border-[#E2F0EC] rounded-2xl text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-[#F3F8F6] mx-auto flex items-center justify-center text-[#1B7A8A]"><Pizza className="h-5 w-5" /></div>
                  <h4 className="font-bold text-xs text-[#1B3A5C]">Lunch</h4>
                  <p className="text-[10px] text-slate-400">650 kcal • Greek chicken salad</p>
                </div>
                <div className="p-4 border border-[#E2F0EC] rounded-2xl text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-[#F3F8F6] mx-auto flex items-center justify-center text-[#1B7A8A]"><Utensils className="h-5 w-5" /></div>
                  <h4 className="font-bold text-xs text-[#1B3A5C]">Dinner</h4>
                  <p className="text-[10px] text-slate-400">800 kcal • Grilled Salmon & asparagus</p>
                </div>
                <div className="p-4 border border-[#E2F0EC] rounded-2xl text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-[#F3F8F6] mx-auto flex items-center justify-center text-[#1B7A8A]"><Cookie className="h-5 w-5" /></div>
                  <h4 className="font-bold text-xs text-[#1B3A5C]">Snacks</h4>
                  <p className="text-[10px] text-slate-400">200 kcal • Mixed raw almonds & yogurt</p>
                </div>
              </div>
            </div>

            {/* Smartwatch Connected Activity card */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base text-[#1B3A5C] flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-emerald-500" /> Watch Synced Activity
                  </h3>
                  <p className="text-xs text-slate-400">Last synced: {syncTime}</p>
                </div>
                <button
                  onClick={triggerWatchSync}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-[#1B7A8A] hover:bg-[#145D69] text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">TODAY STEPS</span>
                  <p className="text-xl font-black text-[#1B3A5C] mt-2">{stepCount.toLocaleString()}</p>
                  <span className="text-[9px] text-slate-400 block mt-1">Goal: 10,000</span>
                </div>
                <div className="p-4 bg-slate-50 border rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">ACTIVE CALORIES</span>
                  <p className="text-xl font-black text-[#1B3A5C] mt-2">542 kcal</p>
                  <span className="text-[9px] text-slate-400 block mt-1">Goal: 600 kcal</span>
                </div>
                <div className="p-4 bg-slate-50 border rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">SLEEP HOURS</span>
                  <p className="text-xl font-black text-[#1B3A5C] mt-2">7.3 hrs</p>
                  <span className="text-[9px] text-slate-400 block mt-1">Goal: 8.0 hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Tracker Right Column (Vitals Form) */}
          <div className="space-y-6">
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft space-y-4">
              <h3 className="font-extrabold text-base text-[#1B3A5C] flex items-center gap-2">
                <Scale className="h-5 w-5 text-[#1B7A8A]" /> Log Program changes
              </h3>
              <form onSubmit={handleLogVitals} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Body Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="E.g. 74.5"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#1B7A8A]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Water Intake (ml)</label>
                  <input
                    type="number"
                    value={water}
                    onChange={(e) => setWater(e.target.value)}
                    placeholder="E.g. 250"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#1B7A8A]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-500 block mb-1">Body Fat %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="Fat %"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#1B7A8A]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 block mb-1">Muscle %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={muscle}
                      onChange={(e) => setMuscle(e.target.value)}
                      placeholder="Muscle %"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#1B7A8A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Notes / Symptoms</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Record notes or symptoms..."
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#1B7A8A]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#1B7A8A] text-white font-extrabold"
                >
                  Submit Log
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Mindfulness Curated player card */}
          <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft space-y-4">
            <h3 className="font-extrabold text-base text-[#1B3A5C]">Mindfulness & Meditation</h3>
            <p className="text-xs text-slate-400">Curated wave soundscapes and guided sleep meditations.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div
                onClick={() => {
                  setPlayingSession("Morning Calm");
                  setIsPlaying(true);
                }}
                className="h-32 rounded-2xl bg-gradient-to-br from-[#1B7A8A] to-[#3AA655] p-5 text-white flex flex-col justify-end cursor-pointer shadow-soft relative overflow-hidden"
              >
                <div className="absolute top-3 right-3 text-white/40"><Music className="h-5 w-5" /></div>
                <h4 className="font-extrabold text-sm">Morning Calm</h4>
                <p className="text-[10px] text-white/80 mt-1">Curated morning sessions</p>
              </div>

              <div
                onClick={() => {
                  setPlayingSession("Stress Relief");
                  setIsPlaying(true);
                }}
                className="h-32 rounded-2xl bg-gradient-to-br from-[#248FA2] to-[#8B5CF6] p-5 text-white flex flex-col justify-end cursor-pointer shadow-soft relative overflow-hidden"
              >
                <div className="absolute top-3 right-3 text-white/40"><Music className="h-5 w-5" /></div>
                <h4 className="font-extrabold text-sm">Stress Relief</h4>
                <p className="text-[10px] text-white/80 mt-1">Curated calmest sessions</p>
              </div>

              <div
                onClick={() => {
                  setPlayingSession("Better Sleep");
                  setIsPlaying(true);
                }}
                className="h-32 rounded-2xl bg-gradient-to-br from-[#102A45] to-[#1B3A5C] p-5 text-white flex flex-col justify-end cursor-pointer shadow-soft relative overflow-hidden"
              >
                <div className="absolute top-3 right-3 text-white/40"><Music className="h-5 w-5" /></div>
                <h4 className="font-extrabold text-sm">Better Sleep</h4>
                <p className="text-[10px] text-white/80 mt-1">Curated sleep meditations</p>
              </div>
            </div>

            {/* Audio player card */}
            {playingSession && (
              <div className="p-4 border border-[#E2F0EC] bg-[#F8FAFC] rounded-2xl flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-600">
                    <Music className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#1B3A5C]">{playingSession}</h5>
                    <p className="text-[9px] text-slate-400">{isPlaying ? "Now Playing..." : "Paused"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <PauseCircle className="h-8 w-8 text-emerald-600" /> : <PlayCircle className="h-8 w-8 text-emerald-600" />}
                  </button>
                  <button onClick={() => setPlayingSession(null)} className="text-xs text-slate-400 font-bold ml-2">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile & Billing Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* User profile parameters */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                {customer?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-[#1B3A5C]">{customer?.fullName}</h3>
                <p className="text-xs text-slate-400">Enrollment ID: <strong>{customer?.enrollmentId}</strong></p>
                <p className="text-[10px] text-emerald-600 font-bold">Email: {customer?.email} • Tel: {customer?.phone}</p>
              </div>
            </div>

            {/* Invoices and Billing statements table */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft space-y-4">
              <h3 className="font-extrabold text-base text-[#1B3A5C] flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" /> Invoices & Statements
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 border rounded-2xl text-center">
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Total Billed</span>
                  <p className="text-sm font-extrabold text-[#1B3A5C] mt-1">SAR {totalBilled.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-emerald-500/5 border rounded-2xl text-center">
                  <span className="text-[8px] text-emerald-600 font-bold uppercase">Total Paid</span>
                  <p className="text-sm font-extrabold text-emerald-700 mt-1">SAR {totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-amber-500/5 border rounded-2xl text-center">
                  <span className="text-[8px] text-amber-600 font-bold uppercase">Outstanding</span>
                  <p className="text-sm font-extrabold text-amber-700 mt-1">SAR {outstandingBalance.toLocaleString()}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Service</th>
                      <th className="py-2.5 px-4 text-center">Amount</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {clientInvoices.map((inv: any) => {
                      const invId = getInvoiceId(inv);
                      const pName = getProgramName(inv) || customer?.programName;
                      const invAmount = getAmount(inv);
                      const invStatus = getInvoiceStatus(inv);
                      return (
                        <tr key={invId} className="hover:bg-slate-50/40">
                          <td className="py-2.5 px-4 font-bold">{invId}</td>
                          <td className="py-2.5 px-4">{pName}</td>
                          <td className="py-2.5 px-4 text-center font-bold">SAR {invAmount}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                              invStatus === "Paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                            }`}>{invStatus}</span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button onClick={() => toast.success("Generating statement download link...")} className="text-[#1B7A8A] font-bold"><Download className="h-4 w-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Profile & Billing Right Column (Trends) */}
          <div className="space-y-6">
            {/* Weight trend line graph */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft space-y-4">
              <h3 className="font-extrabold text-base text-[#1B3A5C]">Weight Trend</h3>
              <div className="h-32 w-full relative">
                {/* SVG Line Graph representation */}
                <svg className="w-full h-full" viewBox="0 0 100 50">
                  <path d="M 0 35 Q 25 15 50 25 T 100 10" fill="none" stroke="#3AA655" strokeWidth="3" />
                  <path d="M 0 35 Q 25 15 50 25 T 100 10 L 100 50 L 0 50 Z" fill="rgba(58, 166, 85, 0.08)" />
                  <circle cx="0" cy="35" r="2" fill="#3AA655" />
                  <circle cx="25" cy="18" r="2" fill="#3AA655" />
                  <circle cx="50" cy="25" r="2" fill="#3AA655" />
                  <circle cx="75" cy="13" r="2" fill="#3AA655" />
                  <circle cx="100" cy="10" r="2" fill="#3AA655" />
                </svg>
              </div>
              <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
            </div>

            {/* Doughnut Weekly Activity Mix */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2F0EC] shadow-soft space-y-4">
              <h3 className="font-extrabold text-base text-[#1B3A5C]">Weekly Activity Mix</h3>
              <div className="h-32 w-full relative flex items-center justify-center">
                {/* Custom SVG Doughnut Chart representation */}
                <svg className="h-28 w-28 transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#E2EFEA" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#1B7A8A" strokeWidth="3" strokeDasharray="40 100" strokeDashoffset="100" />
                  <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#3AA655" strokeWidth="3" strokeDasharray="30 100" strokeDashoffset="60" />
                  <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#1B3A5C" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="30" />
                  <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#CBEAD7" strokeWidth="3" strokeDasharray="10 100" strokeDashoffset="10" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Helper Methods Synced with CRM Models
// -------------------------------------------------------------
function getLoyaltyPoints(enrollment: any) {
  return enrollment?.["Loyalty Points"] || enrollment?.LoyaltyPoints || 500;
}

function getLoyaltyTier(enrollment: any) {
  return enrollment?.["Loyalty Tier"] || enrollment?.LoyaltyTier || "Silver";
}

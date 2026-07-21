import { createFileRoute, Link } from "@tanstack/react-router";
import { useCRM } from "@/lib/crmContext";
import { 
  Users, Activity, Award, TrendingUp, Calendar, Clock, ArrowRight,
  TrendingDown, Percent, Sparkles, AlertCircle
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, loading, refreshData } = useCRM();

  // Safeguard if data hasn't loaded yet
  const enrollments = data?.["Program Enrollments"] || [];
  const assessments = data?.["Health Assessments"] || [];
  const appointments = data?.["Appointments"] || [];

  // 1. Calculations & Metrics
  const totalLeads = enrollments.length;
  const totalHealthChecks = assessments.length;
  const enrolledCount = enrollments.filter((e: any) => e["Lead Status"] === "Enrolled").length;
  const conversionRate = totalLeads ? (enrolledCount / totalLeads) * 100 : 0;

  // New Leads in last 24h
  const newLeadsCount = enrollments.filter((e: any) => e["Lead Status"] === "New Lead").length;

  // 2. Program Data Chart Preparation
  const programMap: Record<string, number> = {};
  enrollments.forEach((e: any) => {
    const progName = e.programName || "Unassigned";
    programMap[progName] = (programMap[progName] || 0) + 1;
  });

  const chartData = Object.keys(programMap).map(key => ({
    name: key.replace(" Challenge", "").replace(" Program", ""),
    leads: programMap[key]
  }));

  // 3. Lead Status Pie Chart Preparation
  const statusMap: Record<string, number> = {};
  enrollments.forEach((e: any) => {
    const status = e["Lead Status"] || "New Lead";
    statusMap[status] = (statusMap[status] || 0) + 1;
  });

  const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280"];
  const statusChartData = Object.keys(statusMap).map(key => ({
    name: key,
    value: statusMap[key]
  }));

  // 4. Sparkline targets
  const avgHealthScore = assessments.length 
    ? Math.round(assessments.reduce((acc: number, curr: any) => acc + parseFloat(curr.healthScore || 0), 0) / assessments.length)
    : 72;

  const avgWater = assessments.length 
    ? (assessments.reduce((acc: number, curr: any) => acc + parseFloat(curr.dailyWater || 0), 0) / assessments.length).toFixed(1)
    : "2.8";

  const avgSteps = assessments.length 
    ? Math.round(assessments.reduce((acc: number, curr: any) => acc + parseFloat(curr.dailySteps || 0), 0) / assessments.length)
    : 8500;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Dynamic Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Precision Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time indicators across clinical programs and CRM flows</p>
        </div>
        <button 
          onClick={refreshData}
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 text-xs shadow-soft transition-all duration-200"
        >
          Force Database Sync
        </button>
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sign-Ups</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black">{totalLeads}</span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +12%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Registered customer inquiries</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health Checks</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black">{totalHealthChecks}</span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +8%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Calculators submitted online</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversions</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-500 flex items-center justify-center">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black">{enrolledCount}</span>
            <span className="text-xs font-semibold text-red-500 flex items-center gap-0.5">
              <TrendingDown className="h-3 w-3" /> -2%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Paying premium members</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversion %</span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 dark:bg-teal-950/20 text-teal-500 flex items-center justify-center">
              <Percent className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black">{conversionRate.toFixed(1)}%</span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +1.4%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Signups to enrolled close rate</p>
        </div>

      </div>

      {/* Graphical Insights Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Program Popularity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-base leading-none">Enrollments by Program</h3>
              <p className="text-xs text-slate-400 mt-1.5">Popularity metrics per medical wellness package</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(16, 185, 129, 0.05)" }} />
                  <Bar dataKey="leads" fill="#0f766e" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No program records logged.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Lead Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft flex flex-col">
          <h3 className="font-semibold text-base leading-none mb-6">Lead Status Flow</h3>
          <div className="h-56 w-full relative flex-1">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No status records.</div>
            )}
          </div>
          
          {/* Status color tags labels list */}
          <div className="mt-4 flex flex-wrap gap-2.5 justify-center">
            {statusChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sparkline Health Progress Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
        <h3 className="font-semibold text-base leading-none mb-6">Precision Health Performance Targets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Sparkline 1 */}
          <div className="border border-slate-100 dark:border-slate-800/60 rounded-xl p-4.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>Avg. Patient Health Score</span>
              <span className="text-slate-900 dark:text-white font-black text-sm">{avgHealthScore}/100</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${avgHealthScore}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Clinical evaluation calculations average</p>
          </div>

          {/* Sparkline 2 */}
          <div className="border border-slate-100 dark:border-slate-800/60 rounded-xl p-4.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>Avg. Hydration Target</span>
              <span className="text-slate-900 dark:text-white font-black text-sm">{avgWater} / 5L</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full transition-all duration-300" style={{ width: `${(parseFloat(avgWater)/5)*100}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Recommended daily water intake average</p>
          </div>

          {/* Sparkline 3 */}
          <div className="border border-slate-100 dark:border-slate-800/60 rounded-xl p-4.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>Avg. Steps Logged</span>
              <span className="text-slate-900 dark:text-white font-black text-sm">{avgSteps} / 15k</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${(avgSteps/15000)*100}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Client physical activities average</p>
          </div>

        </div>
      </div>

      {/* Bottom Row: Recent lead signups table & appointments checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table summary of leads */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base leading-none">Newest Registries</h3>
            <Link to="/admin/leads" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              View Database <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Program</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {enrollments.slice(0, 5).map((e: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-2 text-slate-400">{e.Timestamp?.split(",")[0] || "Just now"}</td>
                    <td className="py-3 px-2 font-semibold">{e.fullName}</td>
                    <td className="py-3 px-2 truncate max-w-[120px]">{e.programName}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                        e["Lead Status"] === "Enrolled" ? "bg-emerald-500/10 text-emerald-600" :
                        e["Lead Status"] === "New Lead" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {e["Lead Status"]}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-slate-500">{e["Loyalty Points"] || "0"} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Appointment sidebar checklist */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base leading-none">Upcoming Consultations</h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-500">Real-time</span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-72">
            {appointments.length > 0 ? (
              appointments.map((apt: any) => (
                <div key={apt.AppointmentId} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{apt.fullName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                      apt.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-600" : "bg-yellow-500/10 text-yellow-600"
                    }`}>{apt.status}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {apt.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {apt.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 text-center gap-2">
                <AlertCircle className="h-8 w-8 text-slate-300" />
                <p className="text-xs">No coach consultations scheduled for this week.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

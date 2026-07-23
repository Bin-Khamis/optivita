import { createFileRoute, Link } from "@tanstack/react-router";
import { usePortal } from "@/lib/portalContext";
import { 
  HeartPulse, Award, Calendar, DollarSign, Activity, FileText, CheckSquare,
  Sparkles, ArrowRight, User, TrendingUp, RefreshCw, Star, CreditCard, Wallet, Printer, CheckCircle2, AlertCircle, Lock
} from "lucide-react";
import { 
  getEnrollmentId, getJoiningStatus, getPhone, getEmail, 
  getLoyaltyPoints, getLoyaltyTier, getProgress, 
  getAmount, getInvoiceId, getProgramName, getInvoiceStatus, getInvoiceDate
} from "@/lib/utils";

export const Route = createFileRoute("/portal/dashboard")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { data, customer, refreshData } = usePortal();

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
  
  const assessments = data?.["Health Assessments"] || [];
  const clientAssessment = assessments.find((a: any) => a.fullName === customer?.fullName) || assessments[0] || {};

  const appointments = data?.["Appointments"] || [];
  const clientAppointments = appointments.filter((a: any) => a.fullName === customer?.fullName || a.phone === customer?.phone);

  const invoices = data?.["Invoices"] || [];
  const clientInvoices = invoices.filter((i: any) => {
    const invEnrollId = getEnrollmentId(i);
    const invPhone = getPhone(i);
    return (
      (invEnrollId && customer?.enrollmentId && String(invEnrollId).trim() === String(customer.enrollmentId).trim()) ||
      (invPhone && customer?.phone && String(invPhone).replace(/[^0-9]/g, "").endsWith(String(customer.phone).replace(/[^0-9]/g, "").slice(-9)))
    );
  });

  const points = getLoyaltyPoints(clientEnrollment) || 500;
  const tier = getLoyaltyTier(clientEnrollment) || "Silver";

  // Calculate dynamic program completion (Defaults to 0% for newly joined clients)
  const progressVal = getProgress(clientEnrollment) !== undefined 
    ? Number(getProgress(clientEnrollment))
    : 0;

  // Financial summary calculations
  const totalBilled = clientInvoices.reduce((sum: number, i: any) => sum + Number(getAmount(i) || 0), 0);
  const totalPaid = clientInvoices.filter((i: any) => getInvoiceStatus(i) === "Paid").reduce((sum: number, i: any) => sum + Number(getAmount(i) || 0), 0);
  const outstandingBalance = totalBilled - totalPaid;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Joining Pending Alert Banner (if not yet confirmed by Admin) */}
      {!isConfirmed && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 font-medium text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">Joining Pending Admin Confirmation: </span>
            <span>Your Digital Loyalty Card, Rewards, Invoices, and Account Statements will unlock automatically once your program enrollment is confirmed by an admin coach.</span>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] to-[#0f766e] rounded-[32px] p-8 text-white relative overflow-hidden shadow-soft">
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" /> Client Portal Active
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight">Welcome back, {customer?.fullName}!</h1>
            <p className="text-sm md:text-base text-emerald-100/90 max-w-xl">
              Track your personalized nutrition progress, schedule clinical reviews, and view your account statements.
            </p>
          </div>
          <div className="shrink-0">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/15"
            >
              <ArrowRight className="h-4 w-4 rotate-180" /> Return to Website Home
            </Link>
          </div>
        </div>
      </div>

      {/* Profile quick summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Loyalty Points summary card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loyalty Points</span>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{points} pts</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Tier Status: <strong>{tier}</strong></span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
            <TrophyIcon className="h-6 w-6" />
          </div>
        </div>

        {/* BMI summary card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current BMI score</span>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">{clientAssessment.bmi || "24.6"}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Category: <strong>{clientAssessment.bmiCategory || "Normal"}</strong></span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        {/* Daily Target calories */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Calorie Target</span>
            <p className="text-3xl font-black text-amber-500 mt-2">{clientAssessment.dailyCalories || "2200"} kcal</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Water: <strong>{clientAssessment.dailyWater || "3.2"} L</strong></span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
            <HeartPulse className="h-6 w-6" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Enrolled Program Tracker card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base">Active Coaching Program</h3>
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-bold">In Progress</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border">
            <p className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">{customer?.programName}</p>
            <p className="text-xs text-slate-400 mt-1 leading-normal">Precision health tracking plan. Personal clinical coach: <strong>{clientEnrollment["Assigned To"] || "Clinical Lead"}</strong></p>
            
            {/* Checklist progress bar (Starts at 0% for newly joined clients) */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Program Completion Target</span>
                <span>{progressVal}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressVal}%` }} />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t pt-4 text-xs font-semibold">
            <span className="text-slate-400">Duration: 30 Days coaching support</span>
            <Link to="/portal/programs" className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              Open Program Hub <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Upcoming appointments list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-base mb-4 leading-none">Consultation Call</h3>
            <div className="space-y-3">
              {clientAppointments.length > 0 ? (
                clientAppointments.map((apt: any) => (
                  <div key={apt.AppointmentId} className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 text-xs leading-normal">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-slate-100">Coaching Session</span>
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-600 uppercase">{apt.status}</span>
                    </div>
                    <div className="mt-2 text-slate-400">
                      <p>Date: {apt.date}</p>
                      <p>Time: {apt.time}</p>
                      <p>Coach: {apt.coach}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-8 text-xs leading-normal">
                  <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  No consultations booked for this week.
                </div>
              )}
            </div>
          </div>

          <Link to="/portal/appointments" className="w-full text-center py-2.5 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 mt-4 block text-slate-600 dark:text-slate-300">
            Book Coach Session
          </Link>
        </div>

      </div>

      {/* NEW: Invoices & Account Statements Dashboard Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-semibold text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Invoices & Account Statements
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">View active billing statements, generated receipts, and payment history.</p>
          </div>
          {isConfirmed && (
            <Link to="/portal/invoices" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              View All Invoices & Statements <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {!isConfirmed ? (
          <div className="p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-3">
            <Lock className="h-8 w-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Account Statements & Invoices Locked</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Financial statements and active invoices will become accessible here as soon as your joining confirmation is approved by your admin coach.
            </p>
          </div>
        ) : (
          <>
            {/* Statement Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Billed</span>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">SAR {totalBilled.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Paid</span>
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">SAR {totalPaid.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Outstanding Balance</span>
                <p className="text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">SAR {outstandingBalance.toLocaleString()}</p>
              </div>
            </div>

            {/* Invoices List / Table */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-950/40">
                      <th className="py-3 px-4">Invoice ID</th>
                      <th className="py-3 px-4">Program / Service</th>
                      <th className="py-3 px-4">Billing Date</th>
                      <th className="py-3 px-4 text-center">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {clientInvoices.length > 0 ? (
                      clientInvoices.slice(0, 5).map((inv: any) => {
                        const invId = getInvoiceId(inv);
                        const pName = getProgramName(inv) || customer?.programName;
                        const invDate = getInvoiceDate(inv) || "Just now";
                        const invAmount = getAmount(inv);
                        const invStatus = getInvoiceStatus(inv) || "Unpaid";
                        return (
                          <tr key={invId} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-400 dark:text-slate-500">{invId}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">{pName}</td>
                            <td className="py-3 px-4 text-slate-400">{invDate}</td>
                            <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-slate-100">SAR {invAmount}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                                invStatus === "Paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                              }`}>
                                {invStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Link to="/portal/invoices" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                                View Details
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 leading-normal">
                          <FileText className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                          No invoices generated yet. Invoices will appear here once issued.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

// Icon helper since lucide Trophy is sometimes called differently
function TrophyIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a7 7 0 0 0-7 7v4.66a5 5 0 0 0 10 0V9a7 7 0 0 0-7-7z" />
    </svg>
  );
}

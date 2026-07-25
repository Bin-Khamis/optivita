import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePortal } from "@/lib/portalContext";
import { 
  FileText, DollarSign, Calendar, CheckCircle2, AlertCircle, RefreshCw,
  Printer, ArrowRight, Wallet, BadgeCheck, ShieldAlert, Lock, User, Mail, Phone, Globe, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { 
  getEnrollmentId, getJoiningStatus, getPhone, getEmail, 
  getAmount, getInvoiceId, getProgramName, getInvoiceStatus, getInvoiceDate,
  findClientEnrollment
} from "@/lib/utils";

export const Route = createFileRoute("/portal/invoices")({
  component: CustomerInvoices,
});

function CustomerInvoices() {
  const { data, customer } = usePortal();
  const [checkingOutInvoice, setCheckingOutInvoice] = useState<any | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [paying, setPaying] = useState(false);

  const enrollments = data?.["Program Enrollments"] || [];
  const clientEnrollment = findClientEnrollment(enrollments, customer);
  
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

  const invoices = data?.["Invoices"] || [];
  const clientInvoices = invoices.filter((i: any) => {
    const invEnrollId = getEnrollmentId(i);
    const invPhone = getPhone(i);
    return (
      (invEnrollId && customer?.enrollmentId && String(invEnrollId).trim() === String(customer.enrollmentId).trim()) ||
      (invPhone && customer?.phone && String(invPhone).replace(/[^0-9]/g, "").endsWith(String(customer.phone).replace(/[^0-9]/g, "").slice(-9)))
    );
  });

  const handlePayInvoice = () => {
    if (!checkingOutInvoice) return;
    setPaying(true);

    setTimeout(() => {
      checkingOutInvoice.Status = "Paid";
      toast.success(`Payment successful! Receipt for Invoice ID: ${checkingOutInvoice.InvoiceId} sent.`);
      setCheckingOutInvoice(null);
      setPaying(false);
    }, 1000);
  };

  if (!isConfirmed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Billing & Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review active invoices, payments schedules, and settle outstanding balances.</p>
        </div>

        <div className="p-12 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 text-center space-y-4 shadow-soft">
          <div className="h-16 w-16 rounded-3xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-slate-100">Invoices & Statements Locked</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Your billing history, active receipts, and financial statements will become accessible here as soon as your joining confirmation is approved by your admin coach.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Billing & Invoices</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review active invoices, payments schedules, and settle outstanding balances.</p>
      </div>

      {/* Main Billing Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                <th className="py-4 px-5">Invoice ID</th>
                <th className="py-4 px-5">Program Name</th>
                <th className="py-4 px-5">Billing Date</th>
                <th className="py-4 px-5 text-center">Amount Due</th>
                <th className="py-4 px-5">Payment Status</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {clientInvoices.length > 0 ? (
                clientInvoices.map((inv: any) => {
                  const invId = getInvoiceId(inv);
                  const pName = getProgramName(inv) || customer?.programName;
                  const invDate = getInvoiceDate(inv) || "Just now";
                  const invAmount = getAmount(inv);
                  const invStatus = getInvoiceStatus(inv) || "Unpaid";
                  return (
                    <tr key={invId} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-400 dark:text-slate-500">{invId}</td>
                      <td className="py-4 px-5 font-semibold text-slate-800 dark:text-slate-100">{pName}</td>
                      <td className="py-4 px-5 text-slate-400">{invDate}</td>
                      <td className="py-4 px-5 text-center font-black text-slate-900 dark:text-slate-100 text-sm">
                        SAR {invAmount}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                          invStatus === "Paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                        }`}>
                          {invStatus}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setViewingInvoice(inv)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 font-bold rounded-lg text-[10px] transition-colors"
                          >
                            View Invoice
                          </button>
                          <button 
                            onClick={() => {
                              setViewingInvoice(inv);
                              setTimeout(() => {
                                window.print();
                              }, 150);
                            }}
                            className="p-1.5 rounded-lg border text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Print Invoice"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {invStatus !== "Paid" && (
                            <button 
                              onClick={() => setCheckingOutInvoice(inv)}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px] hover:bg-emerald-700 transition-colors"
                            >
                              Pay Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 leading-normal">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    No invoice transactions recorded for this enrollment account yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Invoice checkout modal popup */}
      {checkingOutInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setCheckingOutInvoice(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up">
            
            <button 
              type="button"
              onClick={() => setCheckingOutInvoice(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-500" /> Settle Invoice
            </h3>
            <p className="text-xs text-slate-400 mb-5">Secure checkout portal integration</p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed mb-5">
              <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-100">
                <span>{checkingOutInvoice.ProgramName}</span>
                <span className="text-sm text-emerald-600 dark:text-emerald-400">SAR {checkingOutInvoice.Amount}</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Invoice Reference: {checkingOutInvoice.InvoiceId}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setCheckingOutInvoice(null)}
                className="flex-1 py-3 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handlePayInvoice}
                disabled={paying}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft disabled:opacity-50"
              >
                {paying ? "Processing payment..." : "Confirm Checkout"}
              </button>
            </div>

          </div>
        </div>
      )}
      {viewingInvoice && (() => {
        const invId = getInvoiceId(viewingInvoice);
        const invAmount = getAmount(viewingInvoice) || 299;
        const invDate = getInvoiceDate(viewingInvoice) || "25 July 2026";
        const invStatus = getInvoiceStatus(viewingInvoice) || "Unpaid";
        
        // Dynamic Currency & Country
        const phoneStr = String(customer?.phone || "");
        let currency = "SAR";
        let country = "Saudi Arabia";
        if (phoneStr.startsWith("971")) {
          currency = "AED";
          country = "United Arab Emirates";
        } else if (phoneStr.startsWith("44")) {
          currency = "GBP";
          country = "United Kingdom";
        } else if (phoneStr.startsWith("33") || phoneStr.startsWith("49")) {
          currency = "EUR";
          country = "Europe";
        } else if (phoneStr.startsWith("1")) {
          currency = "USD";
          country = "United States";
        } else if (customer?.city) {
          country = customer.city.includes("Riyadh") || customer.city.includes("Jeddah") ? "Saudi Arabia" : customer.city;
        }

        const nutritionist = clientEnrollment["Assigned To"] || "Clinical Lead";
        const enrollmentDate = clientEnrollment["Timestamp"] ? String(clientEnrollment["Timestamp"]).split(" | ")[0] : invDate;
        
        // Dynamic item prices summing exactly to total amount
        const totalVal = Number(invAmount);
        const val1 = Math.round(totalVal * 0.33);
        const val2 = Math.round(totalVal * 0.40);
        const val3 = totalVal - val1 - val2;

        const isPaid = invStatus === "Paid";
        const amountPaid = isPaid ? totalVal : 0;
        const outstandingBalance = isPaid ? 0 : totalVal;

        const programDuration = "30 Days";
        const programStart = enrollmentDate;
        
        // Calculate dynamic program end date (approx 30 days later)
        let programEnd = "24-08-2026";
        try {
          const parts = enrollmentDate.split("-");
          if (parts.length === 3) {
            const dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            dateObj.setDate(dateObj.getDate() + 30);
            programEnd = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
          }
        } catch (e) {}

        const programGoal = "PCOS Management, Weight Loss & Lifestyle Optimization";
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${invId}`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
            <div className="absolute inset-0" onClick={() => setViewingInvoice(null)} />
            
            {/* Print style block wrapper specifically for this print modal rendering */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #optivita-print-invoice-modal-content, #optivita-print-invoice-modal-content * {
                  visibility: visible !important;
                }
                #optivita-print-invoice-modal-content {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  background: white !important;
                  padding: 15mm !important;
                  margin: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  box-sizing: border-box !important;
                }
                @page {
                  size: A4 portrait;
                  margin: 0;
                }
              }
            ` }} />

            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-glow z-10 animate-scale-up overflow-hidden">
              
              {/* Actions Header bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-200">Invoice: {invId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="h-4 w-4" /> Print / Download PDF
                  </button>
                  <button 
                    onClick={() => setViewingInvoice(null)}
                    className="p-2 rounded-xl border text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable sheet body preview */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
                
                {/* A4 sheet page rendering */}
                <div 
                  id="optivita-print-invoice-modal-content"
                  className="w-full max-w-[210mm] bg-white text-slate-800 p-10 font-sans relative rounded-none border shadow-md overflow-hidden select-none"
                  style={{ color: "#1F2937", background: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}
                >
                  
                  {/* Subtle water-mark behind content */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
                    <svg className="w-[500px] h-[500px] text-[#0D4E8A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      <path d="M12 5v7m-3.5-3.5h7" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </div>

                  <div className="relative z-10 space-y-6">

                    {/* TOP HEADER SECTION */}
                    <div className="flex justify-between items-start">
                      
                      {/* Left: Brand logo & taglines */}
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          {/* Premium SVG Logo */}
                          <div className="h-10 w-10 text-[#0D4E8A] flex items-center justify-center bg-sky-50 rounded-xl">
                            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              <path d="M12 5v7m-3.5-3.5h7" stroke="#13B5B1" strokeWidth="2" />
                            </svg>
                          </div>
                          <div>
                            <h1 className="font-extrabold text-2xl tracking-wider text-[#0D4E8A] leading-none">OPTIVITA</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Your Precision Health Partner</p>
                          </div>
                        </div>
                        <div className="text-[9px] text-[#13B5B1] font-semibold tracking-wider">
                          Precision Nutrition • Sustainable Results • Lifelong Wellness
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          International Online Clinical Nutrition & Wellness Services
                        </div>
                      </div>

                      {/* Right: INVOICE title & core metrics */}
                      <div className="text-right space-y-2">
                        <h2 className="text-3xl font-black tracking-tight text-[#0D4E8A]">INVOICE</h2>
                        <div className="text-xs space-y-1 text-slate-600">
                          <p><span className="font-semibold text-slate-400">Invoice Number:</span> <span className="font-bold text-slate-900">{invId}</span></p>
                          <p><span className="font-semibold text-slate-400">Invoice Date:</span> <span className="font-medium text-slate-800">{invDate}</span></p>
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <span className="font-semibold text-slate-400">Status:</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isPaid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}>
                              {isPaid ? "🟢 Paid" : "🟠 Unpaid"}
                            </span>
                          </div>
                          <p><span className="font-semibold text-slate-400">Billing Currency:</span> <span className="font-bold text-[#0D4E8A]">{currency}</span></p>
                        </div>
                      </div>

                    </div>

                    {/* Divider */}
                    <div className="border-b border-slate-200/80" />

                    {/* TWO CARDS COLUMN: PROVIDER vs CLIENT */}
                    <div className="grid grid-cols-2 gap-6 text-left">
                      
                      {/* Provider card */}
                      <div className="p-4 rounded-2xl bg-[#F8FBFD] border border-slate-100 space-y-2">
                        <h3 className="text-xs font-bold text-[#0D4E8A] tracking-wider uppercase">Provider Information</h3>
                        <div className="text-xs space-y-1 text-slate-600 leading-normal">
                          <p className="font-bold text-slate-900">OPTIVITA</p>
                          <p className="text-[10px] italic text-slate-400">Your Precision Health Partner</p>
                          <p>International Online Nutrition Services</p>
                          <p className="pt-1.5"><span className="font-semibold text-slate-400">Email:</span> optivita.support@gmail.com</p>
                          <p><span className="font-semibold text-slate-400">Website:</span> www.optivita.netlify.app</p>
                          <p><span className="font-semibold text-slate-400">Customer Support:</span> 24/7 Online Support</p>
                        </div>
                      </div>

                      {/* Client card */}
                      <div className="p-4 rounded-2xl bg-[#F8FBFD] border border-slate-100 space-y-2">
                        <h3 className="text-xs font-bold text-[#0D4E8A] tracking-wider uppercase">Client Information</h3>
                        <div className="text-xs space-y-1 text-slate-600 leading-normal">
                          <p><span className="font-semibold text-slate-400">Client Name:</span> <span className="font-bold text-slate-900">{customer?.fullName}</span></p>
                          <p><span className="font-semibold text-slate-400">Client ID:</span> <span className="font-bold text-slate-800">{customer?.enrollmentId}</span></p>
                          <p><span className="font-semibold text-slate-400">Email:</span> {customer?.email}</p>
                          <p><span className="font-semibold text-slate-400">Phone Number:</span> {customer?.phone}</p>
                          <p><span className="font-semibold text-slate-400">Country:</span> {country}</p>
                          <p className="pt-1 border-t border-slate-200/40"><span className="font-semibold text-slate-400">Coaching Program:</span> {customer?.programName}</p>
                          <p><span className="font-semibold text-slate-400">Assigned Nutritionist:</span> {nutritionist}</p>
                          <p><span className="font-semibold text-slate-400">Enrollment Date:</span> {enrollmentDate}</p>
                        </div>
                      </div>

                    </div>

                    {/* INVOICE SUMMARY CARDS */}
                    <div className="grid grid-cols-3 gap-4">
                      
                      <div className="p-3 rounded-xl bg-white border border-slate-100 text-center shadow-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subscribed Program</span>
                        <p className="text-xs font-bold text-slate-800 mt-1 truncate">{customer?.programName}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-100 text-center shadow-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</span>
                        <p className="text-sm font-black text-[#0D4E8A] mt-0.5">{currency} {invAmount.toLocaleString()}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-100 text-center shadow-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</span>
                        <p className={`text-xs font-black mt-1 ${isPaid ? "text-emerald-600" : "text-rose-600"}`}>
                          {isPaid ? "🟢 Paid" : "🟠 Unpaid"}
                        </p>
                      </div>

                    </div>

                    {/* DETAILS TABLE */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#F8FBFD] border-b border-slate-100 text-[#0D4E8A] font-bold">
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4">Program</th>
                            <th className="py-3 px-4 text-center">Duration</th>
                            <th className="py-3 px-3 text-center">Qty</th>
                            <th className="py-3 px-3 text-right">Unit Price</th>
                            <th className="py-3 px-3 text-right">Discount</th>
                            <th className="py-3 px-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 text-left">
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Initial Nutrition Consultation</td>
                            <td className="py-3 px-4">{customer?.programName}</td>
                            <td className="py-3 px-4 text-center">1 Session</td>
                            <td className="py-3 px-3 text-center">1</td>
                            <td className="py-3 px-3 text-right">{currency} {val1}</td>
                            <td className="py-3 px-3 text-right">{currency} 0</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">{currency} {val1}</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Customized Meal Plan</td>
                            <td className="py-3 px-4">{customer?.programName}</td>
                            <td className="py-3 px-4 text-center">30 Days</td>
                            <td className="py-3 px-3 text-center">1</td>
                            <td className="py-3 px-3 text-right">{currency} {val2}</td>
                            <td className="py-3 px-3 text-right">{currency} 0</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">{currency} {val2}</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Weekly Progress Reviews</td>
                            <td className="py-3 px-4">{customer?.programName}</td>
                            <td className="py-3 px-4 text-center">4 Sessions</td>
                            <td className="py-3 px-3 text-center">1</td>
                            <td className="py-3 px-3 text-right">{currency} {val3}</td>
                            <td className="py-3 px-3 text-right">{currency} 0</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">{currency} {val3}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* TWO COLS: PAYMENT DETAILS vs FINANCIALS */}
                    <div className="grid grid-cols-2 gap-6 text-left">
                      
                      {/* Left: Payment details */}
                      <div className="p-4 rounded-2xl bg-[#F8FBFD] border border-slate-100 space-y-3 relative">
                        <h4 className="text-xs font-bold text-[#0D4E8A] uppercase tracking-wider">Payment Information</h4>
                        <div className="text-[10px] space-y-1.5 text-slate-500 leading-normal pr-16">
                          <p><span className="font-semibold text-slate-400">Accepted Methods:</span> Visa, Mastercard, American Express, Apple Pay, Google Pay, Mada, Bank Transfer</p>
                          <p><span className="font-semibold text-slate-400">Transaction Reference:</span> TXN-{invId.replace("INV-", "")}</p>
                          {!isPaid && (
                            <p className="text-amber-600 font-bold bg-amber-500/10 px-2 py-1 rounded-md inline-block">
                              🔗 Payment link active. Please settle online.
                            </p>
                          )}
                          <p className="text-[9px] text-slate-400 italic pt-1">QR verification reference code:</p>
                        </div>
                        {/* Real dynamic QR Code */}
                        <div className="absolute right-4 bottom-4 h-16 w-16 border rounded-lg overflow-hidden bg-white p-1">
                          <img src={qrCodeUrl} alt="Invoice QR" className="h-full w-full object-contain" />
                        </div>
                      </div>

                      {/* Right: Totals card */}
                      <div className="p-4 rounded-2xl bg-[#F8FBFD] border border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal</span>
                          <span>{currency} {totalVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Discount</span>
                          <span>{currency} 0</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Amount Paid</span>
                          <span>{currency} {amountPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Outstanding Balance</span>
                          <span>{currency} {outstandingBalance.toLocaleString()}</span>
                        </div>
                        <div className="border-b border-slate-200/60 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 text-sm">Grand Total</span>
                          <span className="font-black text-lg text-[#4CAF50]">{currency} {totalVal.toLocaleString()}</span>
                        </div>
                      </div>

                    </div>

                    {/* PROGRAM CONTEXT DETAILS CARD */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-2 text-left">
                      <h4 className="text-xs font-bold text-[#0D4E8A] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-[#13B5B1]" /> Program Delivery Plan
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 leading-normal">
                        <div>
                          <p><span className="font-semibold text-slate-400">Program Duration:</span> {programDuration}</p>
                          <p><span className="font-semibold text-slate-400">Start Date:</span> {programStart}</p>
                          <p><span className="font-semibold text-slate-400">Estimated End Date:</span> {programEnd}</p>
                        </div>
                        <div>
                          <p><span className="font-semibold text-slate-400">Delivery Method:</span> Online Portal / App</p>
                          <p><span className="font-semibold text-slate-400">Consultation Mode:</span> Video Call & WhatsApp Support</p>
                          <p><span className="font-semibold text-slate-400">Program Goal:</span> {programGoal}</p>
                        </div>
                      </div>
                    </div>

                    {/* NOTES */}
                    <div className="text-[10px] text-slate-400 leading-relaxed italic text-left">
                      <span className="font-bold text-slate-500">Notes:</span> Thank you for choosing Optivita. Your personalized nutrition program has been prepared according to your health assessment and consultation. Please retain this invoice for your records. Contact our support team if you have any questions regarding your program or payment.
                    </div>

                    {/* TERMS & CONDITIONS */}
                    <div className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/50 space-y-1.5 text-[9px] text-slate-400 leading-relaxed text-left">
                      <p className="font-bold text-slate-500 text-[10px] tracking-wider uppercase mb-1">Terms & Conditions</p>
                      <p>• This invoice is issued electronically by OPTIVITA. No physical signature is required.</p>
                      <p>• All consultations and nutrition programs are delivered online unless otherwise specified.</p>
                      <p>• Please include your Invoice Number when making payments or contacting support.</p>
                      <p>• This invoice serves as proof of purchase for your selected nutrition program.</p>
                      <p>• Program access begins after payment confirmation (if applicable).</p>
                      <p>• Refunds and cancellations are subject to the Optivita Refund Policy.</p>
                      <p>• Currency displayed reflects the billing currency selected during checkout.</p>
                    </div>

                    {/* Divider */}
                    <div className="border-b border-slate-200" />

                    {/* FOOTER */}
                    <div className="flex justify-between items-center text-[9px] text-slate-400 leading-normal text-left">
                      <div>
                        <p className="font-bold text-[#0D4E8A] text-[10px]">OPTIVITA</p>
                        <p className="italic text-[8px]">Your Precision Health Partner</p>
                        <p className="text-[8px] text-[#13B5B1] font-semibold">Precision Nutrition • Sustainable Results • Lifelong Wellness</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">Customer Support</p>
                        <p className="font-bold text-slate-700">optivita.support@gmail.com</p>
                        <p>Available Worldwide • Online Nutrition Services</p>
                      </div>
                    </div>

                    {/* BOTTOM CENTER */}
                    <div className="text-center text-[8px] text-slate-400 pt-2 tracking-wider">
                      © 2026 OPTIVITA | Your Precision Health Partner | Precision Nutrition • Sustainable Results • Lifelong Wellness
                    </div>

                  </div>

                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}

// Icon helper
function X(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

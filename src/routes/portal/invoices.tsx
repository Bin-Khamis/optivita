import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePortal } from "@/lib/portalContext";
import { 
  FileText, DollarSign, Calendar, CheckCircle2, AlertCircle, RefreshCw,
  Printer, ArrowRight, Wallet, BadgeCheck, ShieldAlert, Lock
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/invoices")({
  component: CustomerInvoices,
});

function CustomerInvoices() {
  const { data, customer } = usePortal();
  const [checkingOutInvoice, setCheckingOutInvoice] = useState<any | null>(null);
  const [paying, setPaying] = useState(false);

  const enrollments = data?.["Program Enrollments"] || [];
  const clientEnrollment = enrollments.find((e: any) => 
    (e["Enrollment ID"] && customer?.enrollmentId && String(e["Enrollment ID"]).trim() === String(customer.enrollmentId).trim()) ||
    (e["phone"] && customer?.phone && String(e["phone"]).replace(/[^0-9]/g, "").endsWith(String(customer.phone).replace(/[^0-9]/g, "").slice(-9))) ||
    (e["Email Address"] && customer?.email && String(e["Email Address"]).toLowerCase().trim() === String(customer.email).toLowerCase().trim())
  ) || enrollments[0] || {};
  
  // Check Admin Joining Confirmation Status
  const isConfirmed = 
    clientEnrollment["Joining Status"] === "Confirmed" || 
    clientEnrollment["Lead Status"] === "Enrolled" || 
    clientEnrollment["Status"] === "Confirmed" ||
    clientEnrollment["Status"] === "Active" ||
    customer?.joiningStatus === "Confirmed" ||
    customer?.status === "Confirmed";

  const invoices = data?.["Invoices"] || [];
  const clientInvoices = invoices.filter((i: any) => i["Enrollment ID"] === customer?.enrollmentId);

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
                clientInvoices.map((inv: any) => (
                  <tr key={inv.InvoiceId} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-400 dark:text-slate-500">{inv.InvoiceId}</td>
                    <td className="py-4 px-5 font-semibold text-slate-800 dark:text-slate-100">{inv.ProgramName}</td>
                    <td className="py-4 px-5 text-slate-400">{inv.Date || "Just now"}</td>
                    <td className="py-4 px-5 text-center font-black text-slate-900 dark:text-slate-100 text-sm">
                      SAR {inv.Amount}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                        inv.Status === "Paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      }`}>
                        {inv.Status || "Unpaid"}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => window.print()}
                          className="p-1.5 rounded-lg border text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {inv.Status !== "Paid" && (
                          <button 
                            onClick={() => setCheckingOutInvoice(inv)}
                            className="px-2.5 py-1 bg-emerald-650 text-white font-bold rounded-lg text-[10px] hover:bg-emerald-700 transition-colors"
                          >
                            Pay Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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

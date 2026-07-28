import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePortal } from "@/lib/portalContext";
import {
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Printer,
  ArrowRight,
  Wallet,
  BadgeCheck,
  ShieldAlert,
  Lock,
  User,
  Mail,
  Phone,
  Globe,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEnrollmentId,
  getJoiningStatus,
  getPhone,
  getEmail,
  getAmount,
  getInvoiceId,
  getProgramName,
  getInvoiceStatus,
  getInvoiceDate,
  findClientEnrollment,
  isWebhookOffline,
} from "@/lib/utils";
import { InvoicePrint } from "@/components/print/InvoicePrint";

export const Route = createFileRoute("/portal/invoices")({
  component: CustomerInvoices,
});

function CustomerInvoices() {
  const { data, customer, refreshData } = usePortal();
  const [checkingOutInvoice, setCheckingOutInvoice] = useState<any | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);

  const getSetting = (key: string, fallback: string) => {
    const match = data?.["Settings"]?.find(
      (s: any) =>
        String(s.Key || s.key || "")
          .trim()
          .toLowerCase() === key.toLowerCase(),
    );
    return match ? String(match.Value || match.value || "") : fallback;
  };
  const [paying, setPaying] = useState(false);

  // Payment Request Form States
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [referenceNo, setReferenceNo] = useState("");
  const [proofOfPayment, setProofOfPayment] = useState("");
  const [notes, setNotes] = useState("");

  const enrollments = data?.["Program Enrollments"] || [];
  const clientEnrollment = findClientEnrollment(enrollments, customer);

  // Check Admin Joining Confirmation Status
  const jStatus = String(getJoiningStatus(clientEnrollment) || "")
    .trim()
    .toLowerCase();
  const cStatus = String(getJoiningStatus(customer) || "")
    .trim()
    .toLowerCase();
  const isConfirmed =
    jStatus === "confirmed" ||
    jStatus === "enrolled" ||
    jStatus === "active" ||
    cStatus === "confirmed" ||
    cStatus === "enrolled" ||
    cStatus === "active";

  const invoices = data?.["Invoices"] || [];
  const paymentRequests = data?.["Payment Requests"] || [];

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

  const handlePayInvoice = async () => {
    if (!checkingOutInvoice) return;
    setPaying(true);

    const invId = getInvoiceId(checkingOutInvoice);
    const amt = getAmount(checkingOutInvoice) || 299;
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;

    // Generate unique sequential payment request number
    const nextPrNum = paymentRequests.length + 15;
    const prNo = `PR-${String(nextPrNum).padStart(5, "0")}`;

    const newPaymentRequest = {
      action: "webhookSubmit",
      sheetName: "Payment Requests",
      "PR No": prNo,
      "Client ID": customer?.enrollmentId || "",
      "Client Name": customer?.fullName || "",
      "Invoice ID": invId,
      Amount: amt,
      "Payment Method": paymentMethod,
      "Submitted Date": new Date().toISOString().split("T")[0],
      Status: "Pending Approval",
      "Proof Of Payment": proofOfPayment || referenceNo || "Wire transfer slip confirmation",
      Notes: notes,
    };

    // Check offline mode
    if (isWebhookOffline(webhookUrl)) {
      setTimeout(() => {
        // Add to local data cache
        if (!data["Payment Requests"]) data["Payment Requests"] = [];
        data["Payment Requests"].unshift({
          "PR No": prNo,
          "Client ID": customer?.enrollmentId || "",
          "Client Name": customer?.fullName || "",
          "Invoice ID": invId,
          Amount: amt,
          "Payment Method": paymentMethod,
          "Submitted Date": new Date().toISOString().split("T")[0],
          Status: "Pending Approval",
          "Proof Of Payment": proofOfPayment || referenceNo || "Wire transfer slip confirmation",
          Notes: notes,
        });

        // Set invoice status to "Payment Under Review"
        const invIdx = data["Invoices"]?.findIndex((i: any) => getInvoiceId(i) === invId);
        if (invIdx !== -1) {
          data["Invoices"][invIdx].Status = "Payment Under Review";
        }
        localStorage.setItem("optivita_crm_cache", JSON.stringify(data));

        toast.success(
          `Payment request ${prNo} submitted locally! Invoice status is now Payment Under Review.`,
        );
        setCheckingOutInvoice(null);
        setPaying(false);
        setReferenceNo("");
        setProofOfPayment("");
        setNotes("");
        refreshData();
      }, 1000);
      return;
    }

    try {
      // 1. Submit Payment Request
      const resPr = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(newPaymentRequest),
      });
      const resultPr = await resPr.json();

      if (resultPr.status === "success") {
        // 2. Update Invoice Status to "Payment Under Review"
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "updateRecord",
            sheetName: "Invoices",
            idColumn: "InvoiceId",
            id: invId,
            fields: {
              Status: "Payment Under Review",
            },
          }),
        });

        toast.success(`Payment request ${prNo} submitted! Awaiting admin verification.`);
        setCheckingOutInvoice(null);
        setReferenceNo("");
        setProofOfPayment("");
        setNotes("");
        refreshData();
      } else {
        toast.error(resultPr.message || "Failed to submit payment request");
      }
    } catch (e) {
      console.error(e);
      toast.error("Database connection failed. Unable to submit payment request.");
    } finally {
      setPaying(false);
    }
  };

  if (!isConfirmed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review active invoices, payments schedules, and settle outstanding balances.
          </p>
        </div>

        <div className="p-12 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 text-center space-y-4 shadow-soft">
          <div className="h-16 w-16 rounded-3xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-slate-100">
            Invoices & Statements Locked
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Your billing history, active receipts, and financial statements will become accessible
            here as soon as your joining confirmation is approved by your admin coach.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="portal-invoices-page-root" className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Billing & Invoices</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review active invoices, payments schedules, and settle outstanding balances.
        </p>
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
                  const matchingPR = paymentRequests.find(
                    (pr: any) => pr["Invoice ID"] === invId || pr["InvoiceID"] === invId,
                  );

                  return (
                    <tr
                      key={invId}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-4 px-5 font-bold text-slate-400 dark:text-slate-500">
                        {invId}
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-800 dark:text-slate-100">
                        {pName}
                      </td>
                      <td className="py-4 px-5 text-slate-400">{invDate}</td>
                      <td className="py-4 px-5 text-center font-black text-slate-900 dark:text-slate-100 text-sm">
                        SAR {invAmount}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                            invStatus === "Paid"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : invStatus === "Payment Under Review" ||
                                  invStatus === "Pending Confirmation" ||
                                  invStatus === "Payment Requested"
                                ? "bg-amber-500/10 text-amber-600 animate-pulse"
                                : invStatus === "Cancelled"
                                  ? "bg-slate-500/10 text-slate-650"
                                  : "bg-red-500/10 text-red-600"
                          }`}
                        >
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
                          {invStatus !== "Paid" &&
                          invStatus !== "Payment Under Review" &&
                          invStatus !== "Pending Confirmation" &&
                          invStatus !== "Payment Requested" &&
                          invStatus !== "Cancelled" ? (
                            <button
                              onClick={() => {
                                setCheckingOutInvoice(inv);
                                setPaymentMethod("Card");
                                setReferenceNo("");
                                setProofOfPayment("");
                                setNotes("");
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px] hover:bg-emerald-700 transition-colors"
                            >
                              Request Payment
                            </button>
                          ) : invStatus === "Payment Under Review" ||
                            invStatus === "Pending Confirmation" ||
                            invStatus === "Payment Requested" ? (
                            <div className="flex flex-col items-center">
                              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-300/30 font-bold rounded-lg text-[9px] select-none cursor-not-allowed uppercase tracking-wider">
                                Awaiting Admin Review
                              </span>
                              {matchingPR && (
                                <span className="text-[8px] text-slate-400 mt-0.5 font-mono">
                                  {matchingPR["PR No"] || matchingPR.PRNo || "PR-Pending"}
                                </span>
                              )}
                            </div>
                          ) : null}
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

      {/* Request Payment Confirmation Form Modal */}
      {checkingOutInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setCheckingOutInvoice(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up">
            <button
              type="button"
              onClick={() => setCheckingOutInvoice(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1 flex items-center gap-2 text-slate-900 dark:text-white">
              <Wallet className="h-5 w-5 text-emerald-500" /> Settle Payment
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Request administrative confirmation of your transfer
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed mb-4">
              <div className="flex justify-between items-center font-bold text-slate-850 dark:text-slate-100">
                <span>
                  {checkingOutInvoice.ProgramName ||
                    checkingOutInvoice["Program Name"] ||
                    "Optivita Coaching"}
                </span>
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
                  SAR {checkingOutInvoice.Amount}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Invoice: {checkingOutInvoice.InvoiceId}
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200"
                >
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Online">Online Payment Gateway</option>
                  <option value="Bank">Bank Wire Transfer</option>
                  <option value="Cash">Cash Deposit</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Transaction Reference No.
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. Bank Transfer ID, Receipt Code"
                  className="w-full mt-1 p-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Proof of Payment Reference
                </label>
                <input
                  type="text"
                  value={proofOfPayment}
                  onChange={(e) => setProofOfPayment(e.target.value)}
                  placeholder="e.g. Reference slip uploaded description"
                  className="w-full mt-1 p-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any extra details..."
                  className="w-full mt-1 p-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCheckingOutInvoice(null)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePayInvoice}
                disabled={paying}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft disabled:opacity-50"
              >
                {paying ? "Submitting Request..." : "Request Confirmation"}
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingInvoice &&
        (() => {
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
          } else if ((customer as any)?.city) {
            country =
              (customer as any).city.includes("Riyadh") || (customer as any).city.includes("Jeddah")
                ? "Saudi Arabia"
                : (customer as any).city;
          }

          const nutritionist = clientEnrollment["Assigned To"] || "Clinical Lead";
          const enrollmentDate = clientEnrollment["Timestamp"]
            ? String(clientEnrollment["Timestamp"]).split(" | ")[0]
            : invDate;

          const providerInfo = {
            name: getSetting("Provider_Company_Name", "OPTIVITA"),
            address: getSetting("Provider_Address", "123 Health Street"),
            cityCountry: `${getSetting("Provider_City", "Kuwait City")}, ${getSetting("Provider_Country", "Kuwait")} - ${getSetting("Provider_PostalCode", "13001")}`,
            email: getSetting("Provider_Email", "optivita.support@gmail.com"),
            website: getSetting("Provider_Website", "www.optivita.netlify.app"),
            phone: getSetting("Provider_Phone", "+965 12345678"),
            registration: getSetting("Provider_Registration", ""),
          };
          const logoUrl = getSetting("Provider_Logo", "/optivita-logo.png");

          // Dynamic item prices summing exactly to total amount
          const totalVal = Number(invAmount);
          const val1 = Math.round(totalVal * 0.33);
          const val2 = Math.round(totalVal * 0.4);
          const val3 = totalVal - val1 - val2;

          const isPaid = invStatus === "Paid";
          const isPending = invStatus === "Pending Confirmation";
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
              programEnd = `${String(dateObj.getDate()).padStart(2, "0")}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${dateObj.getFullYear()}`;
            }
          } catch (e) {}

          const programGoal = "PCOS Management, Weight Loss & Lifestyle Optimization";
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${invId}`;

          return (
            <div
              id="optivita-invoice-modal-parent"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
            >
              <div className="absolute inset-0" onClick={() => setViewingInvoice(null)} />

              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-glow z-10 animate-scale-up overflow-hidden">
                {/* Actions Header bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      Invoice: {invId}
                    </span>
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
                    id="optivita-invoice-print-modal-content-parent"
                    className="flex justify-center scale-95 origin-top overflow-x-auto select-none"
                  >
                    <InvoicePrint
                      invoice={viewingInvoice}
                      customer={customer}
                      currency={currency}
                      country={country}
                      nutritionist={nutritionist}
                      enrollmentDate={enrollmentDate}
                      providerInfo={providerInfo}
                      logoUrl={logoUrl}
                    />
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

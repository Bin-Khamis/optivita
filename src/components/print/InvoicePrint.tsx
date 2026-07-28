import React from "react";
import { PrintLayout } from "./PrintLayout";

interface InvoicePrintProps {
  invoice: any;
  customer: any;
  currency: string;
  country: string;
  nutritionist: string;
  enrollmentDate: string;
  providerInfo?: any;
  logoUrl?: string;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
  invoice,
  customer,
  currency,
  country,
  nutritionist,
  enrollmentDate,
  providerInfo,
  logoUrl,
}) => {
  const invId = invoice?.InvoiceId || invoice?.["Invoice ID"] || "INV-XXXXXX";
  const invAmount = Number(invoice?.Amount || invoice?.amount || 299);
  const invDate = invoice?.Date || invoice?.BillingDate || invoice?.["Billing Date"] || "N/A";
  const invStatus = invoice?.Status || "Unpaid";

  const isPaid = invStatus === "Paid";
  const isPending = invStatus === "Pending Confirmation" || invStatus === "Payment Under Review";
  const amountPaid = isPaid ? invAmount : 0;
  const outstandingBalance = isPaid ? 0 : invAmount;

  // Split prices mathematically to sum up to exactly total
  const val1 = Math.round(invAmount * 0.33);
  const val2 = Math.round(invAmount * 0.4);
  const val3 = invAmount - val1 - val2;

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

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${invId}`;

  // Formulating metadata for PrintLayout
  const metadata = [
    { label: "Invoice Number", value: invId },
    { label: "Invoice Date", value: invDate },
    {
      label: "Status",
      value: (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
            isPaid
              ? "bg-emerald-100 text-emerald-700"
              : isPending
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
          }`}
        >
          {isPaid ? "🟢 Paid" : isPending ? "🟠 Pending Confirmation" : "🔴 Unpaid"}
        </span>
      ),
    },
    { label: "Billing Currency", value: currency },
  ];

  const clientInfo = {
    title: "Client Information",
    fields: [
      { label: "Client Name", value: customer?.fullName || "Client" },
      { label: "Client ID", value: customer?.enrollmentId || "N/A" },
      { label: "Email", value: customer?.email || "N/A" },
      { label: "Phone Number", value: customer?.phone || "N/A" },
      { label: "Country", value: country },
      { label: "Coaching Program", value: customer?.programName || "Clinical Program" },
      { label: "Assigned Nutritionist", value: nutritionist },
      { label: "Enrollment Date", value: enrollmentDate },
    ],
  };

  const summaryCards = [
    { label: "Subscribed Program", value: customer?.programName || "Clinical Coaching" },
    { label: "Total Amount", value: `${currency} ${invAmount.toLocaleString()}` },
    { label: "Payment Status", value: isPaid ? "🟢 Paid" : isPending ? "🟠 Pending" : "🔴 Unpaid" },
  ];

  return (
    <PrintLayout
      id="optivita-invoice-print-modal-content"
      title="INVOICE"
      metadata={metadata}
      clientInfo={clientInfo}
      summaryCards={summaryCards}
      providerInfo={providerInfo}
      logoUrl={logoUrl}
    >
      <div className="space-y-4 text-left">
        {/* ITEMS TABLE */}
        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="bg-[#F8FBFD] border-b border-slate-100 text-[#0D4E8A] font-bold">
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Program</th>
                <th className="py-2.5 px-3 text-center">Duration</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-2 text-right">Discount</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-650">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  Initial Nutrition Consultation
                </td>
                <td className="py-2.5 px-3">{customer?.programName || "Coaching Program"}</td>
                <td className="py-2.5 px-3 text-center">1 Session</td>
                <td className="py-2.5 px-2 text-center">1</td>
                <td className="py-2.5 px-2 text-right">
                  {currency} {val1}
                </td>
                <td className="py-2.5 px-2 text-right">{currency} 0</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {currency} {val1}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">Customized Meal Plan</td>
                <td className="py-2.5 px-3">{customer?.programName || "Coaching Program"}</td>
                <td className="py-2.5 px-3 text-center">30 Days</td>
                <td className="py-2.5 px-2 text-center">1</td>
                <td className="py-2.5 px-2 text-right">
                  {currency} {val2}
                </td>
                <td className="py-2.5 px-2 text-right">{currency} 0</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {currency} {val2}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  Weekly Progress Reviews
                </td>
                <td className="py-2.5 px-3">{customer?.programName || "Coaching Program"}</td>
                <td className="py-2.5 px-3 text-center">4 Sessions</td>
                <td className="py-2.5 px-2 text-center">1</td>
                <td className="py-2.5 px-2 text-right">
                  {currency} {val3}
                </td>
                <td className="py-2.5 px-2 text-right">{currency} 0</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {currency} {val3}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TWO COLS: PAYMENT DETAILS vs FINANCIALS */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left: Payment details */}
          <div className="p-3 rounded-2xl bg-[#F8FBFD] border border-slate-100 space-y-2 relative min-h-[110px]">
            <h4 className="text-[10px] font-bold text-[#0D4E8A] uppercase tracking-wider">
              Payment Information
            </h4>
            <div className="text-[9px] space-y-1 text-slate-500 leading-normal pr-16">
              <p>
                <span className="font-semibold text-slate-400">Accepted Methods:</span> Visa,
                Mastercard, American Express, Apple Pay, Google Pay, Mada, Bank Transfer
              </p>
              <p>
                <span className="font-semibold text-slate-400">Transaction Reference:</span> TXN-
                {invId.replace("INV-", "")}
              </p>
              {!isPaid && (
                <p className="text-amber-600 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded inline-block">
                  🔗 Payment link active. Please settle online.
                </p>
              )}
              <p className="text-[8px] text-slate-400 italic pt-0.5">
                QR verification reference code:
              </p>
            </div>
            {/* Real dynamic QR Code */}
            <div className="absolute right-3 bottom-3 h-12 w-12 border rounded bg-white p-0.5">
              <img src={qrCodeUrl} alt="Invoice QR" className="h-full w-full object-contain" />
            </div>
          </div>

          {/* Right: Totals card */}
          <div className="p-3 rounded-2xl bg-[#F8FBFD] border border-slate-100 space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>
                {currency} {invAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Discount</span>
              <span>{currency} 0</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Amount Paid</span>
              <span>
                {currency} {amountPaid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Outstanding Balance</span>
              <span>
                {currency} {outstandingBalance.toLocaleString()}
              </span>
            </div>
            <div className="border-b border-slate-200/60 my-1.5" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 text-xs">Grand Total</span>
              <span className="font-black text-sm text-[#4CAF50]">
                {currency} {invAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* PROGRAM CONTEXT DETAILS CARD */}
        <div className="p-3 rounded-2xl bg-white border border-slate-100 space-y-1">
          <h4 className="text-[10px] font-bold text-[#0D4E8A] uppercase tracking-wider">
            Program Delivery Plan
          </h4>
          <div className="grid grid-cols-2 gap-4 text-[9px] text-slate-600 leading-relaxed">
            <div>
              <p>
                <span className="font-semibold text-slate-400">Program Duration:</span> 30 Days
              </p>
              <p>
                <span className="font-semibold text-slate-400">Start Date:</span> {enrollmentDate}
              </p>
              <p>
                <span className="font-semibold text-slate-400">Estimated End Date:</span>{" "}
                {programEnd}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold text-slate-400">Delivery Method:</span> Online Portal
                / App
              </p>
              <p>
                <span className="font-semibold text-slate-400">Consultation Mode:</span> Video Call
                & WhatsApp Support
              </p>
              <p>
                <span className="font-semibold text-slate-400">Program Goal:</span> PCOS Management,
                Weight Loss & Lifestyle Optimization
              </p>
            </div>
          </div>
        </div>

        {/* NOTES */}
        <div className="text-[9px] text-slate-400 leading-normal italic">
          <span className="font-bold text-slate-500">Notes:</span> Thank you for choosing Optivita.
          Your personalized nutrition program has been prepared according to your health assessment
          and consultation. Please retain this invoice for your records. Contact our support team if
          you have any questions regarding your program or payment.
        </div>

        {/* TERMS & CONDITIONS */}
        <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-0.5 text-[8px] text-slate-450 leading-relaxed">
          <p className="font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            Terms & Conditions
          </p>
          <p>
            • This invoice is issued electronically by OPTIVITA. No physical signature is required.
          </p>
          <p>
            • All consultations and nutrition programs are delivered online unless otherwise
            specified.
          </p>
          <p>• Please include your Invoice Number when making payments or contacting support.</p>
          <p>• This invoice serves as proof of purchase for your selected nutrition program.</p>
          <p>• Program access begins after payment confirmation (if applicable).</p>
          <p>• Refunds and cancellations are subject to the Optivita Refund Policy.</p>
          <p>• Currency displayed reflects the billing currency selected during checkout.</p>
        </div>
      </div>
    </PrintLayout>
  );
};

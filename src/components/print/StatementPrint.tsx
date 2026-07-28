import React from "react";
import { PrintLayout } from "./PrintLayout";

interface LedgerEntry {
  date: string;
  description: string;
  ref: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

interface StatementPrintProps {
  title: string;
  accountRef: string;
  accountType: string;
  entries: LedgerEntry[];
  period?: string;
  providerInfo?: any;
  logoUrl?: string;
  currency?: string;
}

export const StatementPrint: React.FC<StatementPrintProps> = ({
  title,
  accountRef,
  accountType,
  entries,
  period = "All Time",
  providerInfo,
  logoUrl,
  currency = "$",
}) => {
  // Calculate summary statistics
  const totalDebit = entries.reduce((acc, curr) => acc + (curr.debit || 0), 0);
  const totalCredit = entries.reduce((acc, curr) => acc + (curr.credit || 0), 0);
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].runningBalance : 0;

  const metadata = [
    { label: "Statement Period", value: period },
    {
      label: "Print Date",
      value: (() => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      })(),
    },
    { label: "Account Ref", value: accountRef },
    { label: "Account Type", value: accountType },
  ];

  const clientInfo = {
    title: "Account Statement Summary",
    fields: [
      { label: "Account Title", value: title },
      { label: "Account Reference", value: accountRef },
      { label: "Type", value: accountType },
      { label: "Closing Balance", value: `${currency} ${closingBalance.toFixed(2)}` },
    ],
  };

  const summaryCards = [
    { label: "Total Inflow (Debit)", value: `${currency} ${totalDebit.toFixed(2)}` },
    { label: "Total Outflow (Credit)", value: `${currency} ${totalCredit.toFixed(2)}` },
    { label: "Closing Account Balance", value: `${currency} ${closingBalance.toFixed(2)}` },
  ];

  return (
    <PrintLayout
      id="optivita-statement-print-content"
      title="CUSTOMER STATEMENT"
      metadata={metadata}
      clientInfo={clientInfo}
      summaryCards={summaryCards}
      providerInfo={providerInfo}
      logoUrl={logoUrl}
    >
      <div className="space-y-4 text-left">
        {/* ENTRIES TABLE */}
        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-[9.5px] border-collapse">
            <thead>
              <tr className="bg-[#F8FBFD] border-b border-slate-150 text-[#0D4E8A] font-bold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 font-mono">Reference</th>
                <th className="py-2.5 px-3 text-right">Debit (Inflow)</th>
                <th className="py-2.5 px-3 text-right">Credit (Outflow)</th>
                <th className="py-2.5 px-3 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-650">
              {entries.length > 0 ? (
                entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="py-2 px-3 text-slate-400">{entry.date}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{entry.description}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-400">{entry.ref}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">
                      {entry.debit > 0 ? `${currency} ${entry.debit.toFixed(2)}` : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">
                      {entry.credit > 0 ? `${currency} ${entry.credit.toFixed(2)}` : "-"}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-black ${
                        entry.runningBalance >= 0 ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {currency} {entry.runningBalance.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-450 italic">
                    No account statements or transaction entries recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* DOUBLE COLUMN: STATEMENT FINANCIAL TOTALS vs SIGNATURES */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left: Signatures & Certification */}
          <div className="p-3 rounded-2xl bg-[#F8FBFD] border border-slate-100 space-y-2 flex flex-col justify-between min-h-[100px]">
            <h4 className="text-[10px] font-bold text-[#0D4E8A] uppercase tracking-wider">
              Statement Certification
            </h4>
            <p className="text-[8px] text-slate-450 leading-relaxed">
              This statement represents a secure transcript of financial activities from the
              Optivita ledger database. All payments under review have been confirmed by our
              internal bookkeeping division.
            </p>
            <div className="pt-2 flex justify-between items-end border-t border-slate-200/40 text-[8px] text-slate-400">
              <span>Auditor Signature: __________________</span>
              <span>Ref ID: {accountRef.slice(-6)}</span>
            </div>
          </div>

          {/* Right: Totals summary card */}
          <div className="p-3 rounded-2xl bg-[#F8FBFD] border border-slate-100 space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-500">
              <span>Total Debit Postings</span>
              <span>
                {currency} {totalDebit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Credit Postings</span>
              <span>
                {currency} {totalCredit.toFixed(2)}
              </span>
            </div>
            <div className="border-b border-slate-200/60 my-1.5" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 text-xs">Closing Balance</span>
              <span
                className={`font-black text-sm ${
                  closingBalance >= 0 ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                {currency} {closingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* NOTES */}
        <div className="text-[9px] text-slate-400 leading-normal italic">
          <span className="font-bold text-slate-500">Notice:</span> Statements are generated in
          real-time. If you find any discrepancies, please notify your assigned coach or our support
          desk within 7 working days.
        </div>
      </div>
    </PrintLayout>
  );
};

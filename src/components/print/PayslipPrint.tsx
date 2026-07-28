import React from "react";
import { PrintLayout } from "./PrintLayout";

interface PayslipPrintProps {
  employee: any;
  month: string;
  allowances: number;
  bonus: number;
  commission: number;
  overtime: number;
  advance: number;
  loanRecovery: number;
  otherDeductions: number;
  paymentMethod: string;
  payrollRef: string;
  providerInfo?: any;
  logoUrl?: string;
  currency?: string;
}

export const PayslipPrint: React.FC<PayslipPrintProps> = ({
  employee,
  month,
  allowances,
  bonus,
  commission,
  overtime,
  advance,
  loanRecovery,
  otherDeductions,
  paymentMethod = "Bank Wire",
  payrollRef = "PAY-REF-XXXXX",
  providerInfo,
  logoUrl,
  currency = "$",
}) => {
  const basicSalary = parseFloat(String(employee?.Salary || employee?.salary || 0));

  // Safe math parsing
  const cleanAllowances = parseFloat(String(allowances || 0));
  const cleanBonus = parseFloat(String(bonus || 0));
  const cleanCommission = parseFloat(String(commission || 0));
  const cleanOvertime = parseFloat(String(overtime || 0));

  const cleanAdvance = parseFloat(String(advance || 0));
  const cleanLoan = parseFloat(String(loanRecovery || 0));
  const cleanOtherDeductions = parseFloat(String(otherDeductions || 0));

  const grossSalary = basicSalary + cleanAllowances + cleanBonus + cleanCommission + cleanOvertime;
  const totalDeductions = cleanAdvance + cleanLoan + cleanOtherDeductions;
  const netSalary = grossSalary - totalDeductions;

  const metadata = [
    { label: "Salary Month", value: month },
    {
      label: "Issue Date",
      value: (() => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      })(),
    },
    { label: "Payroll Reference", value: payrollRef },
    { label: "Payment Method", value: paymentMethod },
  ];

  const employeeInfo = {
    title: "Employee Details",
    fields: [
      { label: "Employee Name", value: employee?.Name || "Employee" },
      { label: "Employee ID", value: employee?.StaffId || "N/A" },
      { label: "Role / Position", value: employee?.Role || "N/A" },
      { label: "Department", value: employee?.Department || employee?.Role || "Clinical" },
      { label: "Branch Office", value: employee?.Branch || "N/A" },
      { label: "Status", value: employee?.Status || "Active" },
    ],
  };

  const summaryCards = [
    { label: "Gross Earnings", value: `${currency} ${grossSalary.toLocaleString()}` },
    { label: "Total Deductions", value: `${currency} ${totalDeductions.toLocaleString()}` },
    { label: "Net Salary Payout", value: `${currency} ${netSalary.toLocaleString()}` },
  ];

  return (
    <PrintLayout
      id="optivita-payslip-print-content"
      title="SALARY PAYSLIP"
      metadata={metadata}
      clientInfo={employeeInfo}
      summaryCards={summaryCards}
      providerInfo={providerInfo}
      logoUrl={logoUrl}
    >
      <div className="space-y-4 text-left">
        {/* BREAKDOWN TABLES Side-By-Side */}
        <div className="grid grid-cols-2 gap-4 text-[10px]">
          {/* Earnings card */}
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
            <div className="bg-[#F8FBFD] border-b border-slate-150 p-2 font-bold text-[#0D4E8A]">
              Earnings Breakdown
            </div>
            <div className="p-3 space-y-2 flex-1">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">Basic Monthly Salary</span>
                <span className="font-bold">
                  {currency} {basicSalary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">Coaching Allowances</span>
                <span className="font-bold">
                  {currency} {cleanAllowances.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">Performance Bonuses</span>
                <span className="font-bold">
                  {currency} {cleanBonus.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">Sales Commission</span>
                <span className="font-bold">
                  {currency} {cleanCommission.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Overtime Hours</span>
                <span className="font-bold">
                  {currency} {cleanOvertime.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 border-t p-2 flex justify-between font-bold text-slate-800">
              <span>Gross Earnings</span>
              <span>
                {currency} {grossSalary.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Deductions card */}
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
            <div className="bg-rose-50/50 border-b border-slate-150 p-2 font-bold text-rose-800">
              Deductions Breakdown
            </div>
            <div className="p-3 space-y-2 flex-1">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">Salary Advance Deduction</span>
                <span className="font-bold text-rose-600">
                  -{currency} {cleanAdvance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">Loan Recovery Recovery</span>
                <span className="font-bold text-rose-600">
                  -{currency} {cleanLoan.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Other Deductions</span>
                <span className="font-bold text-rose-600">
                  -{currency} {cleanOtherDeductions.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 border-t p-2 flex justify-between font-bold text-slate-850">
              <span>Total Deductions</span>
              <span>
                {currency} {totalDeductions.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* SUMMARY GRAND TOTAL CARD */}
        <div className="p-3.5 rounded-2xl bg-[#F8FBFD] border border-slate-100 flex justify-between items-center text-xs">
          <div>
            <h4 className="font-bold text-slate-800">Net Salary Payout</h4>
            <p className="text-[9px] text-slate-450 mt-0.5">
              Calculated Net = Gross Earnings - Total Deductions
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-[#4CAF50]">
              {currency} {netSalary.toLocaleString()}
            </span>
          </div>
        </div>

        {/* SIGNATURE SECTION */}
        <div className="grid grid-cols-2 gap-8 pt-6">
          <div className="text-center space-y-8">
            <div className="border-b border-slate-300 w-3/4 mx-auto" />
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
              Authorized Officer Signature
            </p>
          </div>
          <div className="text-center space-y-8">
            <div className="border-b border-slate-300 w-3/4 mx-auto" />
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
              Staff Member Signature
            </p>
          </div>
        </div>

        {/* NOTES */}
        <div className="text-[8px] text-slate-400 leading-normal italic text-center pt-2">
          This salary slip is generated and certified electronically by OPTIVITA payroll division.
        </div>
      </div>
    </PrintLayout>
  );
};

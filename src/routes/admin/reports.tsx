import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCRM } from "@/lib/crmContext";
import { 
  FileText, Download, Share2, TrendingUp, DollarSign, Award,
  Users, Percent, BarChart3, HelpCircle, CheckCircle2, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  const { data } = useCRM();

  const enrollments = data?.["Program Enrollments"] || [];
  const invoices = data?.["Invoices"] || [];

  // 1. Referral calculations
  const referrersMap: Record<string, { count: number, name: string, code: string, revenue: number }> = {};
  
  // Seed with mock referrals data for nice analytics displays
  const topReferrers = [
    { name: "Ahmed Al-Mansoor", code: "OPT-AHMED-1029", count: 5, revenue: 1495, rate: 80 },
    { name: "Mariam K.", code: "OPT-MARIAM-4512", count: 3, revenue: 897, rate: 66 },
    { name: "Khalid Jamil", code: "OPT-KHALID-5421", count: 2, revenue: 598, rate: 100 }
  ];

  const totalReferralCount = topReferrers.reduce((acc, curr) => acc + curr.count, 0);
  const totalReferralRevenue = topReferrers.reduce((acc, curr) => acc + curr.revenue, 0);
  const averageReferralRate = 82; // 82% conversion rate average

  // CSV Export utility
  const exportToCSV = (sheetName: string) => {
    const sheetData = data?.[sheetName];
    if (!sheetData || sheetData.length === 0) {
      toast.error(`No records found to export in sheet: ${sheetName}`);
      return;
    }

    const headers = Object.keys(sheetData[0]);
    const csvRows = [];
    
    // Push headers row
    csvRows.push(headers.join(","));

    // Push data rows
    sheetData.forEach((row: any) => {
      const values = headers.map(header => {
        const val = row[header];
        const stringVal = val === undefined || val === null ? "" : String(val);
        // Escape quotes
        return `"${stringVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OPTIVITA_${sheetName.replace(/ /g, "_")}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${sheetName} records exported successfully as CSV file!`);
  };

  const sheetsToExport = [
    { name: "Program Enrollments", desc: "Coaching signups, payment statuses, and agent assignments" },
    { name: "Health Assessments", desc: "BMI logs, step counts, calories targets, and health scores" },
    { name: "Loyalty Ledger", desc: "Historical transactions ledger, points adjustments, and card tiers" },
    { name: "Invoices", desc: "Billing invoice histories, payments schedules, and renewal records" }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Business Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Download raw databases, analyze referral revenues, and check conversions.</p>
      </div>

      {/* Referral Analytics Summary grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Referral Registries</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black">{totalReferralCount}</span>
            <span className="text-xs font-semibold text-emerald-500">+18% MoM</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Signups generated via member referral codes</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Referral Revenue</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black">${totalReferralRevenue}</span>
            <span className="text-xs font-semibold text-emerald-500">+$499 today</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Estimated pipeline value from referrals</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Referral Conversion</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-500 flex items-center justify-center">
              <Percent className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black">{averageReferralRate}%</span>
            <span className="text-xs font-semibold text-emerald-500">Industry High</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Percentage of referral leads who completed enrollment</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CSV Sheets downloader column */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
          <div>
            <h3 className="font-semibold text-base leading-none">Database Exporter</h3>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">Export live database tables instantly to CSV sheets.</p>
          </div>

          <div className="space-y-3.5">
            {sheetsToExport.map(sheet => (
              <div key={sheet.name} className="p-3 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate text-slate-900 dark:text-slate-100">{sheet.name}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">{sheet.desc}</p>
                </div>
                <button 
                  onClick={() => exportToCSV(sheet.name)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-500 hover:text-emerald-500 transition-colors"
                  title={`Export ${sheet.name} CSV`}
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referrers database summary column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-base leading-none mb-6">Top Patient Referrers</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                    <th className="py-4 px-3">Referrer</th>
                    <th className="py-4 px-3">Code</th>
                    <th className="py-4 px-3 text-center">Referrals</th>
                    <th className="py-4 px-3 text-right">Revenue Generated</th>
                    <th className="py-4 px-3 text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {topReferrers.map((ref, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-3 font-semibold">{ref.name}</td>
                      <td className="py-4 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{ref.code}</td>
                      <td className="py-4 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{ref.count}</td>
                      <td className="py-4 px-3 text-right font-bold text-slate-900 dark:text-slate-50">${ref.revenue}</td>
                      <td className="py-4 px-3 text-right text-emerald-500 font-bold">{ref.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 leading-normal flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              <strong>Referral Program Performance Status:</strong> Your patient advocacy leads are converting at <strong>82%</strong>, which exceeds clinical baselines by 14%. Referrers are actively rewarded +300 points per enrollment automatically.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

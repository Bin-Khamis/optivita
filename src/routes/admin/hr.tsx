import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCRM } from "@/lib/crmContext";
import { 
  Users, UserCheck, Calendar, DollarSign, Award, Plus, FileText, CheckCircle2,
  X, AlertCircle, RefreshCw, Printer, ShieldAlert, Sparkles, Building, Briefcase,
  Sliders, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { isWebhookOffline } from "@/lib/utils";

export const Route = createFileRoute("/admin/hr")({
  component: AdminHR,
});

function AdminHR() {
  const { data, refreshData } = useCRM();
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "payroll" | "leaves">("directory");

  const handlePrintSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    document.body.classList.add("printing-active");
    element.classList.add("print-section");

    setTimeout(() => {
      window.print();
      
      const cleanup = () => {
        document.body.classList.remove("printing-active");
        element.classList.remove("print-section");
      };
      
      if ("onafterprint" in window) {
        window.addEventListener("afterprint", cleanup, { once: true });
      } else {
        setTimeout(cleanup, 500);
      }
    }, 100);
  };

  // HR Datasets
  const staff = data?.["Staff"] || [];
  
  // Custom states
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("Senior Nutritionist");
  const [newStaffBranch, setNewStaffBranch] = useState("Kuwait City");
  const [newStaffSalary, setNewStaffSalary] = useState("3000");
  const [savingStaff, setSavingStaff] = useState(false);

  // Payslip generation states
  const [selectedPayslipStaff, setSelectedPayslipStaff] = useState<any | null>(null);
  const [payslipMonth, setPayslipMonth] = useState("July 2026");
  const [payslipBonus, setPayslipBonus] = useState("200");
  const [payslipLoanDeduction, setPayslipLoanDeduction] = useState("100");

  const [leaves, setLeaves] = useState([
    { leaveId: "LV-1002", name: "Sara Khan", type: "Sick Leave", dates: "July 18 - July 20", reason: "Dental surgery", status: "Pending" },
    { leaveId: "LV-1001", name: "John Smith", type: "Annual Leave", dates: "Aug 01 - Aug 10", reason: "Family travel vacation", status: "Approved" }
  ]);

  // 1. Add employee handler
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) {
      toast.error("Please enter employee name.");
      return;
    }

    setSavingStaff(true);
    const staffId = "EMP-" + Math.floor(100 + Math.random() * 900);

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      setTimeout(() => {
        staff.push({
          StaffId: staffId,
          Name: newStaffName,
          Role: newStaffRole,
          Branch: newStaffBranch,
          "Joining Date": (() => {
            const d = new Date();
            return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
          })(),
          Salary: parseFloat(newStaffSalary),
          Allowances: 200,
          Deductions: 100,
          Status: "Active"
        });

        toast.success("Employee successfully added to master records!");
        setShowAddStaffModal(false);
        setNewStaffName("");
        setSavingStaff(false);
        refreshData();
      }, 700);
      return;
    }
  };

  const handleApproveLeave = (leaveId: string) => {
    setLeaves(prev => prev.map(l => l.leaveId === leaveId ? { ...l, status: "Approved" } : l));
    toast.success("Leave request approved!");
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">HR & Payroll</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage employee master directory records, track attendance leaves, and calculate monthly payroll statements.</p>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setActiveSubTab("directory")}
          className={`px-4 py-2 text-xs font-bold rounded-lg border uppercase tracking-wider transition-all ${
            activeSubTab === "directory" ? "bg-emerald-600 text-white border-emerald-500 shadow-soft" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
          }`}
        >
          Employee Master
        </button>
        <button
          onClick={() => setActiveSubTab("payroll")}
          className={`px-4 py-2 text-xs font-bold rounded-lg border uppercase tracking-wider transition-all ${
            activeSubTab === "payroll" ? "bg-emerald-600 text-white border-emerald-500 shadow-soft" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
          }`}
        >
          Payroll Console
        </button>
        <button
          onClick={() => setActiveSubTab("leaves")}
          className={`px-4 py-2 text-xs font-bold rounded-lg border uppercase tracking-wider transition-all ${
            activeSubTab === "leaves" ? "bg-emerald-600 text-white border-emerald-500 shadow-soft" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
          }`}
        >
          Leaves & Attendance
        </button>
      </div>

      {/* View: Directory */}
      {activeSubTab === "directory" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[20px] p-5 shadow-soft">
            <h3 className="font-semibold text-base leading-none">Employee Directories</h3>
            <button 
              onClick={() => setShowAddStaffModal(true)}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-soft flex items-center gap-1.5"
            >
              <UserPlus className="h-4.5 w-4.5" /> Add Staff Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((emp: any) => (
              <div 
                key={emp.StaffId}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft flex flex-col justify-between hover:shadow-glow transition-all"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center font-bold">
                      {emp.Name.charAt(0)}
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">{emp.Status || "Active"}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-4">{emp.Name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {emp.Role}</p>
                  
                  <div className="mt-4 pt-4 border-t space-y-2 text-xs text-slate-500">
                    <p className="flex justify-between"><span>Branch Location:</span> <strong className="text-slate-700 dark:text-slate-350">{emp.Branch}</strong></p>
                    <p className="flex justify-between"><span>Basic Salary:</span> <strong className="text-slate-700 dark:text-slate-350">${emp.Salary || 3000}</strong></p>
                    <p className="flex justify-between"><span>Joining Date:</span> <strong className="text-slate-700 dark:text-slate-350">{emp["Joining Date"] || "2025-01-10"}</strong></p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedPayslipStaff(emp);
                    setActiveSubTab("payroll");
                  }}
                  className="w-full py-2 border rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 mt-5"
                >
                  Generate Monthly Payslip
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View: Payroll */}
      {activeSubTab === "payroll" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
          
          {/* Settle bonuses & payroll inputs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <h3 className="font-semibold text-base mb-6 leading-none">Salary Calculation Panel</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Employee</label>
                <select 
                  value={selectedPayslipStaff ? selectedPayslipStaff.StaffId : ""}
                  onChange={(e) => {
                    const emp = staff.find(s => s.StaffId === e.target.value);
                    setSelectedPayslipStaff(emp || null);
                  }}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="">Select staff member...</option>
                  {staff.map(s => (
                    <option key={s.StaffId} value={s.StaffId}>{s.Name} ({s.Role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salary Month</label>
                <select 
                  value={payslipMonth}
                  onChange={(e) => setPayslipMonth(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="June 2026">June 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="August 2026">August 2026</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Bonus / Commission ($)</label>
                <input 
                  type="number" 
                  value={payslipBonus}
                  onChange={(e) => setPayslipBonus(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loan / Advance Deduction ($)</label>
                <input 
                  type="number" 
                  value={payslipLoanDeduction}
                  onChange={(e) => setPayslipLoanDeduction(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payslip preview & Printable render view */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft">
            {selectedPayslipStaff ? (
              <div className="space-y-6">
                
                {/* Visual payslip layout */}
                <div id="payroll-payslip" className="p-6 border rounded-2xl bg-slate-50 dark:bg-slate-950 font-sans text-xs leading-relaxed space-y-4">
                  <div className="flex justify-between items-start border-b pb-4">
                    <div className="flex items-center gap-3">
                      <img src="/optivita-logo.png" alt="Optivita Logo" className="h-8.5 w-8.5 object-contain" />
                      <div>
                        <p className="font-display font-black text-sm tracking-wider">OPTIVITA precision health</p>
                        <p className="text-[7px] text-slate-400 tracking-wider">SALARY PAYSLIP STATEMENT</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-700 dark:text-slate-350">Month: {payslipMonth}</p>
                      <p className="text-[8px] text-slate-400">Date Issued: {(() => {
                        const d = new Date();
                        return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
                      })()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] pb-2 border-b">
                    <div>
                      <p className="text-slate-400">Employee Name</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{selectedPayslipStaff.Name}</p>
                      <p className="text-slate-400 mt-2">Department / Role</p>
                      <p className="font-bold text-slate-850 dark:text-slate-300">{selectedPayslipStaff.Role}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Branch Office</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{selectedPayslipStaff.Branch}</p>
                      <p className="text-slate-400 mt-2">Employee ID</p>
                      <p className="font-mono font-bold text-slate-850 dark:text-slate-300">{selectedPayslipStaff.StaffId}</p>
                    </div>
                  </div>

                  {/* Calculations breakdown table */}
                  <div className="space-y-2 pt-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Basic salary package</span>
                      <span className="font-bold">${selectedPayslipStaff.Salary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coaching allowances & transportations</span>
                      <span className="font-bold">${selectedPayslipStaff.Allowances || 200}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Performance Bonus / Commission</span>
                      <span>+${payslipBonus || 0}</span>
                    </div>
                    <div className="flex justify-between text-red-500 font-semibold border-b pb-2">
                      <span>Salary Advance Deductions</span>
                      <span>-${payslipLoanDeduction || 0}</span>
                    </div>

                    <div className="flex justify-between font-black text-slate-900 dark:text-white pt-2 text-xs">
                      <span>Net Salary Payout</span>
                      <span>
                        ${selectedPayslipStaff.Salary + (selectedPayslipStaff.Allowances || 200) + parseFloat(payslipBonus || "0") - parseFloat(payslipLoanDeduction || "0")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handlePrintSection("payroll-payslip")}
                    className="flex-1 py-3 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center gap-1 text-slate-600 dark:text-slate-300"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Payslip
                  </button>
                  <button 
                    onClick={() => {
                      toast.success("Payslip successfully processed & registered in general ledger!");
                      refreshData();
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft"
                  >
                    Post Payslip to Accounts
                  </button>
                </div>

              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
                Select an employee from the panel to generate and calculate their monthly payslip statements.
              </div>
            )}
          </div>

        </div>
      )}

      {/* View: Leaves & Attendance */}
      {activeSubTab === "leaves" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft space-y-6">
            <h3 className="font-semibold text-base leading-none">Employee Leave Requests</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50">
                    <th className="py-3 px-3">Request ID</th>
                    <th className="py-3 px-3">Employee Name</th>
                    <th className="py-3 px-3">Leave Type</th>
                    <th className="py-3 px-3">Leave Dates</th>
                    <th className="py-3 px-3">Reason</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {leaves.map((l: any) => (
                    <tr key={l.leaveId} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-400">{l.leaveId}</td>
                      <td className="py-3.5 px-3 font-semibold">{l.name}</td>
                      <td className="py-3.5 px-3">{l.type}</td>
                      <td className="py-3.5 px-3 text-slate-400">{l.dates}</td>
                      <td className="py-3.5 px-3 text-slate-500 italic">{l.reason}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                          l.status === "Approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-yellow-500/10 text-yellow-600"
                        }`}>{l.status}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex justify-between items-center gap-2">
                          {l.status === "Pending" && (
                            <button 
                              onClick={() => handleApproveLeave(l.leaveId)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal Form popup dialog */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddStaffModal(false)} />
          <form onSubmit={handleAddStaffSubmit} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up">
            
            <button 
              type="button"
              onClick={() => setShowAddStaffModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-500" /> Add Employee Master
            </h3>
            <p className="text-xs text-slate-400 mb-5">Create new employee register</p>

            <div className="space-y-4">
              
              {/* Employee name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Name</label>
                <input 
                  type="text" 
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Sara Khan"
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role / Specialization</label>
                <select 
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="Senior Nutritionist">Senior Nutritionist</option>
                  <option value="Coaching Director">Coaching Director</option>
                  <option value="Intake Counselor">Intake Counselor</option>
                  <option value="Finance Lead">Finance Lead Manager</option>
                </select>
              </div>

              {/* Branch */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch Office</label>
                <select 
                  value={newStaffBranch}
                  onChange={(e) => setNewStaffBranch(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="Kuwait City">Kuwait City Branch</option>
                  <option value="Riyadh HQ">Riyadh HQ Branch</option>
                  <option value="Dubai Wellness">Dubai Wellness Branch</option>
                </select>
              </div>

              {/* Basic Salary */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Monthly Salary ($)</label>
                <input 
                  type="number" 
                  value={newStaffSalary}
                  onChange={(e) => setNewStaffSalary(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <button 
                type="submit"
                disabled={savingStaff}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2"
              >
                {savingStaff ? "Saving Staff..." : "Save Employee Profile"}
              </button>

            </div>
          </form>
        </div>
      )}

    </div>
  );
}



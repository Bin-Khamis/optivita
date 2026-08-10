import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Users, DollarSign, Calendar, Activity, UserPlus, Trash2, Mail, CheckCircle2, Ticket } from "lucide-react";

export const Route = createFileRoute("/corporate/")({
  component: CorporateDashboard,
});

function CorporateDashboard() {
  // Mock company details
  const [company] = useState(() => {
    const raw = localStorage.getItem("optivita_corporate_session");
    return raw ? JSON.parse(raw) : { companyName: "Saudi Tech Partners", budget: 25000, billingPlan: "monthly" };
  });

  // Mock employee list
  const [employees, setEmployees] = useState([
    { id: "EMP-101", name: "Fahad Al-Otaibi", email: "fahad@company.com", department: "Sales", status: "Active" },
    { id: "EMP-102", name: "Sarah Al-Ghamdi", email: "sarah.g@company.com", department: "HR", status: "Active" },
    { id: "EMP-103", name: "Khalid Mansoor", email: "khalid.m@company.com", department: "Operations", status: "Active" },
  ]);

  // Invite state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("Sales");

  const handleInviteEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    
    const newEmp = {
      id: `EMP-${Math.floor(104 + Math.random() * 900)}`,
      name: newName,
      email: newEmail,
      department: newDept,
      status: "Active",
    };
    
    setEmployees([...employees, newEmp]);
    setNewEmail("");
    setNewName("");
    toast.success(`Invitation successfully sent to ${newEmail}!`);
  };

  const handleDeactivate = (id: string) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        return { ...emp, status: "Deactivated" };
      }
      return emp;
    }));
    toast.info("Employee credit benefits deactivated.");
  };

  const [supportOpen, setSupportOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMsg, setTicketMsg] = useState("");

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg) return;
    toast.success("B2B support ticket created successfully!");
    setTicketSubject("");
    setTicketMsg("");
    setSupportOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10 text-xs text-left">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">{company.companyName}</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Corporate Wellness Dashboard — Manage employee credits & wellness seats</p>
        </div>
        
        <div className="flex gap-3">
          <Link
            to="/corporate/employees/groups"
            className="px-4.5 py-2.5 rounded-full border border-border/60 font-bold hover:bg-secondary/15"
          >
            Sponsorship Groups
          </Link>
          <Link
            to="/corporate/analytics"
            className="px-4.5 py-2.5 rounded-full bg-accent text-white font-bold shadow-soft hover:opacity-95"
          >
            Engagement Analytics
          </Link>
          <button
            onClick={() => setSupportOpen(true)}
            className="px-4.5 py-2.5 rounded-full border border-accent/20 bg-accent/5 font-bold hover:bg-accent/10 flex items-center gap-1.5"
          >
            <Ticket className="h-4 w-4 text-accent" />
            <span>Support Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-2">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="font-bold uppercase text-[9px] tracking-wider">Active Employees</span>
            <Users className="h-4.5 w-4.5 text-accent" />
          </div>
          <p className="text-2xl font-black text-foreground">{employees.filter(e => e.status === "Active").length}</p>
          <span className="text-[9px] text-emerald-600 block font-bold">+1 added this week</span>
        </div>

        <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-2">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="font-bold uppercase text-[9px] tracking-wider">Remaining Budget</span>
            <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground">SAR {company.budget}</p>
          <span className="text-[9px] text-muted-foreground block font-bold">Billing Plan: {company.billingPlan}</span>
        </div>

        <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-2">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="font-bold uppercase text-[9px] tracking-wider">Program Seats</span>
            <Calendar className="h-4.5 w-4.5 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-foreground">7 / 10 Seats</p>
          <span className="text-[9px] text-slate-400 block font-bold">3 seats remaining</span>
        </div>

        <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-2">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="font-bold uppercase text-[9px] tracking-wider">Benefit Utilization</span>
            <Activity className="h-4.5 w-4.5 text-rose-550" />
          </div>
          <p className="text-2xl font-black text-foreground">78%</p>
          <span className="text-[9px] text-emerald-600 block font-bold">Above Saudi benchmark</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left: Employee invitation & table */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Employee Directory list */}
          <div className="bg-card border rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-foreground">Company Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/15 text-muted-foreground border-b border-border/40 font-bold">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-border/30 last:border-b-0 hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{emp.name}</td>
                      <td className="p-3 text-muted-foreground font-mono">{emp.email}</td>
                      <td className="p-3 text-muted-foreground">{emp.department}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          emp.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {emp.status === "Active" && (
                          <button
                            onClick={() => handleDeactivate(emp.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500 border border-transparent hover:border-red-150"
                            title="Deactivate benefits"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side: Invite Form */}
        <aside className="bg-card border rounded-3xl p-6 shadow-soft space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1">
            <UserPlus className="h-4.5 w-4.5 text-accent" />
            Invite Employees
          </h3>
          <form onSubmit={handleInviteEmployee} className="space-y-4">
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase text-muted-foreground">Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Khalid Al-Faisal"
                className="w-full p-2.5 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase text-muted-foreground">Work Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. khalid@company.com"
                className="w-full p-2.5 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase text-muted-foreground">Department Cohort</label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none font-semibold"
              >
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-accent text-white font-bold rounded-xl shadow-soft hover:opacity-95"
            >
              Send Employee Invitation
            </button>
          </form>
        </aside>
      </div>

      {/* Support ticket creation modal */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSupportOpen(false)} />
          <div className="relative bg-card border rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up text-left">
            <h3 className="font-display font-black text-base text-foreground mb-4">Create Corporate Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-[9px] text-slate-400 uppercase">Subject</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Add 20 more dietitian seats to catalog"
                  className="w-full p-3 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[9px] text-slate-400 uppercase">Ticket details</label>
                <textarea
                  rows={4}
                  required
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  placeholder="Describe your issue..."
                  className="w-full p-3 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSupportOpen(false)}
                  className="flex-1 py-3 border rounded-xl font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-accent text-white font-bold rounded-xl"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

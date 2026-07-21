import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCRM } from "@/lib/crmContext";
import { updateFirestoreRecord } from "@/lib/firebase";
import { 
  Search, Filter, Edit, Trash2, Calendar, Phone, Mail, Award, CheckCircle, 
  XCircle, Clock, AlertCircle, FileText, UserPlus, HeartPulse, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads")({
  component: AdminLeads,
});

function AdminLeads() {
  const { data, refreshData } = useCRM();
  const [activeTab, setActiveTab] = useState<"leads" | "assessments">("leads");
  
  // Filtering & Searching states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");
  
  // Lead edit modal state
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editJoiningStatus, setEditJoiningStatus] = useState("Pending Confirmation");
  const [editAgent, setEditAgent] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Coaching Hub Management Modal state
  const [coachingLead, setCoachingLead] = useState<any | null>(null);
  const [coachingProgress, setCoachingProgress] = useState(0);
  const [coachingWeek, setCoachingWeek] = useState(2);
  const [week1Title, setWeek1Title] = useState("Initial Clinical Assessment & Detox Meal Plan");
  const [week1Status, setWeek1Status] = useState("Completed");
  const [week2Title, setWeek2Title] = useState("Metabolic Adaptation & Calorie Adjustment");
  const [week2Status, setWeek2Status] = useState("In Progress");
  const [week3Title, setWeek3Title] = useState("Mid-Program Progress Evaluation & Biomarkers");
  const [week3Status, setWeek3Status] = useState("Pending");
  const [week4Title, setWeek4Title] = useState("Final Health Summary & Subscription Renewal Plan");
  const [week4Status, setWeek4Status] = useState("Pending");
  const [coachingTasks, setCoachingTasks] = useState<any[]>([
    { id: 1, text: "Log weekly calorie count in profile tracker", done: true },
    { id: 2, text: "Complete weekly checklist health review", done: false },
    { id: 3, text: "Attend Live Webinar: Science of PCOS & Keto", done: false },
    { id: 4, text: "Log daily target steps limit (minimum 8,000 steps)", done: true }
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [savingCoaching, setSavingCoaching] = useState(false);

  const handleOpenCoachingHub = (lead: any) => {
    setCoachingLead(lead);
    setCoachingProgress(Number(lead["Progress"] || lead["Completion Progress"] || 0));
    setCoachingWeek(Number(lead["Current Week"] || 2));
    
    // Parse deliverables
    try {
      const delivs = typeof lead["Deliverables"] === "string" ? JSON.parse(lead["Deliverables"]) : lead["Deliverables"];
      if (delivs && Array.isArray(delivs)) {
        if (delivs[0]) { setWeek1Title(delivs[0].title || ""); setWeek1Status(delivs[0].status || "Completed"); }
        if (delivs[1]) { setWeek2Title(delivs[1].title || ""); setWeek2Status(delivs[1].status || "In Progress"); }
        if (delivs[2]) { setWeek3Title(delivs[2].title || ""); setWeek3Status(delivs[2].status || "Pending"); }
        if (delivs[3]) { setWeek4Title(delivs[3].title || ""); setWeek4Status(delivs[3].status || "Pending"); }
      }
    } catch (e) {}

    // Parse tasks
    try {
      const tsks = typeof lead["Tasks"] === "string" ? JSON.parse(lead["Tasks"]) : lead["Tasks"];
      if (tsks && Array.isArray(tsks) && tsks.length > 0) {
        setCoachingTasks(tsks);
      }
    } catch (e) {}
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = { id: Date.now(), text: newTaskText.trim(), done: false };
    setCoachingTasks(prev => [...prev, newTask]);
    setNewTaskText("");
  };

  const handleToggleCoachingTask = (id: number) => {
    setCoachingTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDeleteCoachingTask = (id: number) => {
    setCoachingTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveCoachingHub = async () => {
    if (!coachingLead) return;
    setSavingCoaching(true);

    const deliverables = [
      { week: 1, title: week1Title, status: week1Status },
      { week: 2, title: week2Title, status: week2Status },
      { week: 3, title: week3Title, status: week3Status },
      { week: 4, title: week4Title, status: week4Status }
    ];

    const fields = {
      "Progress": coachingProgress,
      "Completion Progress": coachingProgress,
      "Current Week": coachingWeek,
      "Deliverables": JSON.stringify(deliverables),
      "Tasks": JSON.stringify(coachingTasks)
    };

    // 1. Update Memory State
    coachingLead["Progress"] = coachingProgress;
    coachingLead["Completion Progress"] = coachingProgress;
    coachingLead["Current Week"] = coachingWeek;
    coachingLead["Deliverables"] = deliverables;
    coachingLead["Tasks"] = coachingTasks;

    // 2. Local Cache Update
    const cached = localStorage.getItem("optivita_crm_cache");
    if (cached) {
      try {
        const db = JSON.parse(cached);
        const idx = db["Program Enrollments"]?.findIndex((x: any) => x["Enrollment ID"] === coachingLead["Enrollment ID"]);
        if (idx !== -1) {
          db["Program Enrollments"][idx] = { 
            ...db["Program Enrollments"][idx], 
            ...fields, 
            Deliverables: deliverables, 
            Tasks: coachingTasks 
          };
          localStorage.setItem("optivita_crm_cache", JSON.stringify(db));
        }
      } catch (e) {}
    }

    // 3. Firestore Realtime Speed Update
    await updateFirestoreRecord("Program Enrollments", "Enrollment ID", coachingLead["Enrollment ID"], {
      ...fields,
      Deliverables: deliverables,
      Tasks: coachingTasks
    });

    toast.success("Coaching Hub deliverables & weekly checklists saved!");
    setCoachingLead(null);
    setSavingCoaching(false);
    refreshData();

    // 4. Background Master Google Sheets Sync
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl && !webhookUrl.includes("placeholder")) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Program Enrollments",
          id: coachingLead["Enrollment ID"],
          fields: {
            "Progress": coachingProgress,
            "Current Week": coachingWeek,
            "Deliverables": JSON.stringify(deliverables),
            "Tasks": JSON.stringify(coachingTasks)
          }
        })
      }).catch(() => {});
    }
  };

  const enrollments = data?.["Program Enrollments"] || [];
  const assessments = data?.["Health Assessments"] || [];

  // 1. Filter Leads
  const filteredLeads = enrollments.filter((lead: any) => {
    if (!lead || !lead["Enrollment ID"]) return false; // Skip empty rows
    const matchesSearch = 
      (lead["Enrollment ID"] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || lead["Lead Status"] === statusFilter;
    const matchesProgram = programFilter === "All" || lead.programName === programFilter;

    return matchesSearch && matchesStatus && matchesProgram;
  });

  // 2. Filter Assessments
  const filteredAssessments = assessments.filter((assess: any) => {
    if (!assess || !assess.fullName) return false; // Skip empty rows
    const matchesSearch = 
      (assess.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assess.recommendedProgram || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleToggleConfirmJoining = async (lead: any) => {
    const isCurrentlyConfirmed = lead["Joining Status"] === "Confirmed" || lead["Lead Status"] === "Enrolled";
    const nextJoiningStatus = isCurrentlyConfirmed ? "Pending Confirmation" : "Confirmed";
    const nextLeadStatus = isCurrentlyConfirmed ? "New Lead" : "Enrolled";

    lead["Joining Status"] = nextJoiningStatus;
    lead["Lead Status"] = nextLeadStatus;

    // 1. Instant Local Cache Update
    const cached = localStorage.getItem("optivita_crm_cache");
    if (cached) {
      try {
        const db = JSON.parse(cached);
        const idx = db["Program Enrollments"]?.findIndex((x: any) => 
          x["Enrollment ID"] === lead["Enrollment ID"] || x["phone"] === lead["phone"]
        );
        if (idx !== -1) {
          db["Program Enrollments"][idx]["Joining Status"] = nextJoiningStatus;
          db["Program Enrollments"][idx]["Lead Status"] = nextLeadStatus;
          localStorage.setItem("optivita_crm_cache", JSON.stringify(db));
        }
      } catch (e) {
        console.error("Cache update error:", e);
      }
    }

    // 2. Instant Real-Time Firestore Speed Update
    await updateFirestoreRecord("Program Enrollments", "Enrollment ID", lead["Enrollment ID"], {
      "Joining Status": nextJoiningStatus,
      "Lead Status": nextLeadStatus
    });

    toast.success(`Joining status updated to: ${nextJoiningStatus}`);

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.includes("placeholder")) {
      return;
    }

    // 3. Permanent Master Sync to Google Sheets
    try {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Program Enrollments",
          id: lead["Enrollment ID"] || lead["phone"],
          fields: {
            "Joining Status": nextJoiningStatus,
            "Lead Status": nextLeadStatus
          }
        })
      }).catch(() => {});
    } catch (err) {
      console.error("Google Sheets sync note:", err);
    }
  };

  const handleEditClick = (lead: any) => {
    setEditingLead(lead);
    setEditStatus(lead["Lead Status"] || "New Lead");
    setEditJoiningStatus(lead["Joining Status"] || (lead["Lead Status"] === "Enrolled" ? "Confirmed" : "Pending Confirmation"));
    setEditAgent(lead["Assigned To"] || "Select Agent");
    setEditPriority(lead["Priority"] || "Medium");
    setEditPayment(lead["Payment Status"] || "Unpaid");
    setEditNotes(lead["Action Notes"] || "");
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    setSaving(true);
    
    const updateFields = {
      "Lead Status": editStatus,
      "Joining Status": editJoiningStatus,
      "Assigned To": editAgent,
      "Priority": editPriority,
      "Payment Status": editPayment,
      "Action Notes": editNotes
    };

    // Instant Real-time Firestore update
    await updateFirestoreRecord("Program Enrollments", "Enrollment ID", editingLead["Enrollment ID"], updateFields);

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.includes("placeholder")) {
      editingLead["Lead Status"] = editStatus;
      editingLead["Joining Status"] = editJoiningStatus;
      editingLead["Assigned To"] = editAgent;
      editingLead["Priority"] = editPriority;
      editingLead["Payment Status"] = editPayment;
      editingLead["Action Notes"] = editNotes;
      
      const cached = localStorage.getItem("optivita_crm_cache");
      if (cached) {
        try {
          const db = JSON.parse(cached);
          const idx = db["Program Enrollments"].findIndex((x: any) => x["Enrollment ID"] === editingLead["Enrollment ID"]);
          if (idx !== -1) {
            db["Program Enrollments"][idx] = { ...editingLead };
            localStorage.setItem("optivita_crm_cache", JSON.stringify(db));
          }
        } catch (e) {
          console.error("Local cache save error during edit:", e);
        }
      }

      toast.success("Profile updated successfully!");
      setEditingLead(null);
      setSaving(false);
      refreshData();
      return;
    }

    try {
      toast.success("Client record updated successfully!");
      setEditingLead(null);
      refreshData();

      // Permanent Master Sync to Google Sheets
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Program Enrollments",
          id: editingLead["Enrollment ID"],
          fields: updateFields
        })
      }).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead record? This action will remove it permanently.")) return;
    
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.includes("placeholder")) {
      const cached = localStorage.getItem("optivita_crm_cache");
      if (cached) {
        try {
          const db = JSON.parse(cached);
          db["Program Enrollments"] = db["Program Enrollments"].filter((x: any) => x["Enrollment ID"] !== leadId);
          localStorage.setItem("optivita_crm_cache", JSON.stringify(db));
          toast.success("Record deleted locally (Simulation)!");
          refreshData();
        } catch (e) {
          console.error("Local delete error:", e);
        }
      }
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "deleteRecord",
          sheetName: "Program Enrollments",
          id: leadId
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Lead removed successfully");
        refreshData();
      } else {
        toast.error(result.message || "Deletion failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to sheet server.");
    }
  };

  // Dropdown options
  const statusOptions = ["New Lead", "Contacted - WA", "Contacted - Email", "Awaiting Response", "Assessment Scheduled", "Enrolled", "Not Interested"];
  const agentOptions = ["Agent A", "Agent B", "Clinical Lead", "None"];
  const priorityOptions = ["Low", "Medium", "High", "Urgent"];
  const paymentOptions = ["Unpaid", "Partial", "Paid", "Refunded"];

  return (
    <div className="space-y-6">
      
      {/* Layout Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Database Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review registrations, health results, and update follow-up progress.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60">
          <button 
            onClick={() => setActiveTab("leads")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "leads" ? "bg-white dark:bg-slate-800 shadow-soft text-emerald-600 dark:text-emerald-400" : "text-slate-500"
            }`}
          >
            <UserPlus className="h-4 w-4" /> Enrollments ({enrollments.length})
          </button>
          <button 
            onClick={() => setActiveTab("assessments")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "assessments" ? "bg-white dark:bg-slate-800 shadow-soft text-emerald-600 dark:text-emerald-400" : "text-slate-500"
            }`}
          >
            <HeartPulse className="h-4 w-4" /> Assessments ({assessments.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[20px] p-5 shadow-soft">
        <div className="flex flex-wrap gap-4 items-center">
          
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === "leads" ? "Search ID, phone, name, email..." : "Search name or program..."}
              className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Filters (only for leads) */}
          {activeTab === "leads" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2 border rounded-full text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="All">All Statuses</option>
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Program</span>
                <select 
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="px-3.5 py-2 border rounded-full text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="All">All Programs</option>
                  <option value="30-Day Weight Loss Challenge">Weight Loss</option>
                  <option value="Diabetes Nutrition Program">Diabetes Nutrition</option>
                  <option value="Healthy Lifestyle Reset">Lifestyle Reset</option>
                </select>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Main Tables */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden">
        
        {activeTab === "leads" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                  <th className="py-4.5 px-4">Enrollment ID</th>
                  <th className="py-4.5 px-4">Name</th>
                  <th className="py-4.5 px-4">Program</th>
                  <th className="py-4.5 px-4">Lead Status</th>
                  <th className="py-4.5 px-4">Joining Confirmation</th>
                  <th className="py-4.5 px-4">Payment</th>
                  <th className="py-4.5 px-4">Assigned To</th>
                  <th className="py-4.5 px-4">Priority</th>
                  <th className="py-4.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead: any, idx: number) => {
                    const isConfirmed = lead["Joining Status"] === "Confirmed" || lead["Lead Status"] === "Enrolled";
                    return (
                      <tr key={lead["Enrollment ID"] || idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-4.5 px-4 font-bold text-slate-400 dark:text-slate-500">{lead["Enrollment ID"]}</td>
                        <td className="py-4.5 px-4 font-semibold">
                          <div>{lead.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">{lead.phone}</div>
                        </td>
                        <td className="py-4.5 px-4 truncate max-w-[150px]" title={lead.programName}>{lead.programName}</td>
                        <td className="py-4.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                            lead["Lead Status"] === "Enrolled" ? "bg-emerald-500/10 text-emerald-600" :
                            lead["Lead Status"] === "New Lead" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
                          }`}>
                            {lead["Lead Status"]}
                          </span>
                        </td>
                        <td className="py-4.5 px-4">
                          <button
                            onClick={() => handleToggleConfirmJoining(lead)}
                            className={`px-3 py-1 rounded-full text-[9px] font-black tracking-wider border transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                              isConfirmed 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/20" 
                                : "bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-800 hover:bg-amber-500/20"
                            }`}
                            title={isConfirmed ? "Click to set back to Pending" : "Click to Confirm Client Joining"}
                          >
                            <CheckCircle className="h-3 w-3" />
                            {isConfirmed ? "CONFIRMED" : "CONFIRM JOINING"}
                          </button>
                        </td>
                        <td className="py-4.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                            lead["Payment Status"] === "Paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                          }`}>
                            {lead["Payment Status"] || "Unpaid"}
                          </span>
                        </td>
                        <td className="py-4.5 px-4 text-slate-500">{lead["Assigned To"] || "None"}</td>
                        <td className="py-4.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                            lead["Priority"] === "Urgent" || lead["Priority"] === "High" ? "bg-red-500/10 text-red-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}>
                            {lead["Priority"] || "Medium"}
                          </span>
                        </td>
                        <td className="py-4.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleOpenCoachingHub(lead)}
                              className="px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] hover:bg-emerald-500/20 flex items-center gap-1"
                              title="Manage Weekly Deliverables & Checklists"
                            >
                              <HeartPulse className="h-3 w-3" /> COACHING HUB
                            </button>
                            <button 
                              onClick={() => handleEditClick(lead)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-500"
                              title="Edit Lead Status"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteLead(lead["Enrollment ID"])}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500"
                              title="Delete Lead"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No matching records found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          
          /* Assessments Sub-table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                  <th className="py-4.5 px-4">Timestamp</th>
                  <th className="py-4.5 px-4">Patient Name</th>
                  <th className="py-4.5 px-4">Age / Gender</th>
                  <th className="py-4.5 px-4 text-center">BMI Score</th>
                  <th className="py-4.5 px-4">Category</th>
                  <th className="py-4.5 px-4">Calorie Target</th>
                  <th className="py-4.5 px-4">Recommended Program</th>
                  <th className="py-4.5 px-4">Daily Water</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {filteredAssessments.length > 0 ? (
                  filteredAssessments.map((assess: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4.5 px-4 text-slate-400">{assess.Timestamp?.split(",")[0]}</td>
                      <td className="py-4.5 px-4 font-semibold">{assess.fullName}</td>
                      <td className="py-4.5 px-4 text-slate-500">{assess.age} years / {assess.gender}</td>
                      <td className="py-4.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">{assess.bmi}</td>
                      <td className="py-4.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                          assess.bmiCategory === "Normal" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {assess.bmiCategory}
                        </span>
                      </td>
                      <td className="py-4.5 px-4 font-semibold">{assess.dailyCalories} kcal</td>
                      <td className="py-4.5 px-4 truncate max-w-[150px] font-medium" title={assess.recommendedProgram}>{assess.recommendedProgram}</td>
                      <td className="py-4.5 px-4 text-cyan-500 font-bold">{assess.dailyWater} Liters</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No health calculator assessments logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Slide-out Edit Side Panel */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditingLead(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full p-8 shadow-glow overflow-y-auto animate-slide-in">
            <h2 className="font-display font-extrabold text-2xl mb-1 text-slate-900 dark:text-slate-50">Intake Record Editor</h2>
            <p className="text-xs text-slate-400 mb-6">Updating Enrollment ID: {editingLead["Enrollment ID"]}</p>

            <div className="space-y-4">
              
              {/* Customer summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-xs text-slate-400 uppercase tracking-wider">Customer Details</p>
                <p className="mt-2 text-sm font-semibold">{editingLead.fullName}</p>
                <p className="text-xs text-slate-500 mt-1">{editingLead.email} | {editingLead.phone}</p>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2">{editingLead.programName}</p>
              </div>

              {/* Status input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Status</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                >
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Joining Confirmation input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joining Confirmation</label>
                <select 
                  value={editJoiningStatus}
                  onChange={(e) => setEditJoiningStatus(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                >
                  <option value="Confirmed">Confirmed (Unlocks Loyalty Card & Invoices in Portal)</option>
                  <option value="Pending Confirmation">Pending Confirmation (Locked in Client Portal)</option>
                </select>
              </div>

              {/* Agent input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Counselor</label>
                <select 
                  value={editAgent}
                  onChange={(e) => setEditAgent(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                >
                  {agentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Priority input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Follow-up Priority</label>
                <select 
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                >
                  {priorityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Payment input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
                <select 
                  value={editPayment}
                  onChange={(e) => setEditPayment(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                >
                  {paymentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Notes input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Notes</label>
                <textarea 
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record follow-up logs or clinical instructions..."
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3.5 pt-4">
                <button 
                  onClick={() => setEditingLead(null)}
                  className="flex-1 border rounded-xl text-xs py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs disabled:opacity-50"
                >
                  {saving ? "Saving changes..." : "Save to Google Sheets"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Coaching Hub Management Modal */}
      {coachingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setCoachingLead(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-glow z-10 animate-scale-up space-y-6">
            
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-display font-extrabold text-xl flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <HeartPulse className="h-5 w-5 text-emerald-500" /> Coaching Hub & Weekly Deliverables
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Client: <strong className="text-slate-700 dark:text-slate-200">{coachingLead.fullName}</strong> ({coachingLead["Enrollment ID"]})
                </p>
              </div>
              <button onClick={() => setCoachingLead(null)} className="p-1.5 rounded-full border text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            {/* Overall Program Progress */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Overall Coaching Program Progress</span>
                <span className="text-emerald-700 dark:text-emerald-400">{coachingProgress}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={coachingProgress}
                onChange={(e) => setCoachingProgress(Number(e.target.value))}
                className="w-full accent-emerald-600 h-2 bg-emerald-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Weekly Deliverables Roadmap (Weeks 1 to 4) */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Weekly Deliverables Roadmap</h4>
              
              {/* Week 1 */}
              <div className="p-3.5 border rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Week 1 Deliverable</span>
                <input 
                  type="text" 
                  value={week1Title}
                  onChange={(e) => setWeek1Title(e.target.value)}
                  className="sm:col-span-1 p-2 text-xs border rounded-xl bg-white dark:bg-slate-900"
                />
                <select 
                  value={week1Status} 
                  onChange={(e) => setWeek1Status(e.target.value)}
                  className="p-2 text-xs border rounded-xl bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Week 2 */}
              <div className="p-3.5 border rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Week 2 Deliverable</span>
                <input 
                  type="text" 
                  value={week2Title}
                  onChange={(e) => setWeek2Title(e.target.value)}
                  className="sm:col-span-1 p-2 text-xs border rounded-xl bg-white dark:bg-slate-900"
                />
                <select 
                  value={week2Status} 
                  onChange={(e) => setWeek2Status(e.target.value)}
                  className="p-2 text-xs border rounded-xl bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Week 3 */}
              <div className="p-3.5 border rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Week 3 Deliverable</span>
                <input 
                  type="text" 
                  value={week3Title}
                  onChange={(e) => setWeek3Title(e.target.value)}
                  className="sm:col-span-1 p-2 text-xs border rounded-xl bg-white dark:bg-slate-900"
                />
                <select 
                  value={week3Status} 
                  onChange={(e) => setWeek3Status(e.target.value)}
                  className="p-2 text-xs border rounded-xl bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Week 4 */}
              <div className="p-3.5 border rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Week 4 Deliverable</span>
                <input 
                  type="text" 
                  value={week4Title}
                  onChange={(e) => setWeek4Title(e.target.value)}
                  className="sm:col-span-1 p-2 text-xs border rounded-xl bg-white dark:bg-slate-900"
                />
                <select 
                  value={week4Status} 
                  onChange={(e) => setWeek4Status(e.target.value)}
                  className="p-2 text-xs border rounded-xl bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Weekly Tasks Checklist Builder */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Weekly Client Tasks Checklist</h4>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Add new weekly task for client portal..."
                  className="flex-1 p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
                <button 
                  type="button"
                  onClick={handleAddTask}
                  className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                >
                  Add Task
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {coachingTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-xl flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="checkbox"
                        checked={task.done}
                        onChange={() => handleToggleCoachingTask(task.id)}
                        className="rounded text-emerald-600 accent-emerald-600"
                      />
                      <span className={task.done ? "line-through text-slate-400" : "font-medium text-slate-800 dark:text-slate-100"}>{task.text}</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteCoachingTask(task.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setCoachingLead(null)}
                className="flex-1 py-3 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveCoachingHub}
                disabled={savingCoaching}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft disabled:opacity-50"
              >
                {savingCoaching ? "Saving..." : "Save Coaching Hub"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCRM } from "@/lib/crmContext";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Award,
  CheckCircle,
  XCircle,
  RefreshCw,
  Video,
  AlertCircle,
  Search,
  Edit2,
  Sliders,
  MapPin,
  MessageSquare,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { isWebhookOffline } from "@/lib/utils";

export const Route = createFileRoute("/admin/appointments")({
  component: AdminAppointments,
});

function AdminAppointments() {
  const { data, refreshData } = useCRM();

  // Appointments dataset
  const appointments = data?.["Appointments"] || [];
  const staffList = data?.["Staff"] || [];

  // Local state controls
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Selected appointment for actions
  const [selectedApt, setSelectedApt] = useState<any | null>(null);

  // Action Modals
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Form states for modals
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00");
  const [newTimeZone, setNewTimeZone] = useState("UTC+3");
  const [assignedCoach, setAssignedCoach] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [saving, setSaving] = useState(false);

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt: any) => {
    const name = String(apt.fullName || apt["Customer Name"] || "").toLowerCase();
    const id = String(
      apt["Enrollment ID"] || apt.enrollmentId || apt["Client ID"] || "",
    ).toLowerCase();
    const status = String(apt.status || apt.Status || "").trim();

    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Key metrics
  const totalSessions = appointments.length;
  const pendingRequests = appointments.filter(
    (a: any) => String(a.status || a.Status).toLowerCase() === "pending",
  ).length;
  const confirmedSessions = appointments.filter(
    (a: any) => String(a.status || a.Status).toLowerCase() === "confirmed",
  ).length;
  const cancelledSessions = appointments.filter(
    (a: any) => String(a.status || a.Status).toLowerCase() === "cancelled",
  ).length;

  const handleUpdateAppointmentStatus = async (
    apt: any,
    nextStatus: string,
    extraFields: Record<string, any> = {},
  ) => {
    const aptId = apt["Appointment ID"] || apt.AppointmentId;
    if (!aptId) {
      toast.error("Invalid appointment record ID.");
      return;
    }

    setSaving(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = isWebhookOffline(webhookUrl);

    const fieldsToUpdate = {
      Status: nextStatus,
      ...extraFields,
    };

    if (isOffline) {
      setTimeout(() => {
        const match = appointments.find(
          (a: any) => (a["Appointment ID"] || a.AppointmentId) === aptId,
        );
        if (match) {
          Object.assign(match, fieldsToUpdate);
          // Map properties properly
          match.status = nextStatus;
          if (extraFields["Google Meet Link"]) match.meetLink = extraFields["Google Meet Link"];
          if (extraFields["Coach"]) match.coach = extraFields["Coach"];
          if (extraFields["Internal Notes"]) match.internalNotes = extraFields["Internal Notes"];
        }
        localStorage.setItem("optivita_crm_cache", JSON.stringify(data));
        toast.success(`Appointment status updated to ${nextStatus} (offline simulation)!`);
        setSaving(false);
        refreshData();
      }, 600);
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Appointments",
          idColumn: "Appointment ID",
          id: aptId,
          fields: fieldsToUpdate,
        }),
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success(`Appointment status updated to ${nextStatus}!`);
        refreshData();
      } else {
        toast.error(result.message || "Failed to update appointment record.");
      }
    } catch (err) {
      toast.error("Database connection failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveSession = (apt: any) => {
    const randomMeetCode =
      Math.random().toString(36).substring(2, 5) +
      "-" +
      Math.random().toString(36).substring(2, 6) +
      "-" +
      Math.random().toString(36).substring(2, 5);
    const mockMeetUrl = `https://meet.google.com/${randomMeetCode}`;
    handleUpdateAppointmentStatus(apt, "Confirmed", {
      "Google Meet Link": mockMeetUrl,
    });
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      toast.error("Please select a valid date.");
      return;
    }

    await handleUpdateAppointmentStatus(selectedApt, "Rescheduled", {
      "Appointment Date": newDate,
      "Appointment Time": newTime,
      "Time Zone": newTimeZone,
    });

    setShowRescheduleModal(false);
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedCoach) {
      toast.error("Please pick an employee to assign.");
      return;
    }

    await handleUpdateAppointmentStatus(selectedApt, selectedApt.status || "Pending", {
      Coach: assignedCoach,
      "Google Meet Link": meetLink || selectedApt["Google Meet Link"] || "",
    });

    setShowAssignModal(false);
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUpdateAppointmentStatus(selectedApt, selectedApt.status || "Pending", {
      "Internal Notes": internalNotes,
    });
    setShowNotesModal(false);
  };

  const handleSimulateNotification = (apt: any) => {
    toast.success(
      `Notification sent to ${apt.fullName || apt["Customer Name"]}! (SMS, Email & WhatsApp Bridge updated)`,
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Appointments Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage consultation requests, schedule google meets, and assign coaches.
          </p>
        </div>
        <button
          onClick={() => refreshData()}
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4.5 py-2 text-xs shadow-soft flex items-center gap-1.5"
        >
          <RefreshCw className="h-4 w-4" /> Force Sync
        </button>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Consultations
          </p>
          <p className="text-2xl font-black mt-2 text-slate-850 dark:text-white">{totalSessions}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft border-l-4 border-l-yellow-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pending Approvals
          </p>
          <p className="text-2xl font-black mt-2 text-yellow-600 dark:text-yellow-400">
            {pendingRequests}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Confirmed Slots
          </p>
          <p className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
            {confirmedSessions}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-soft border-l-4 border-l-red-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Cancelled / Rejected
          </p>
          <p className="text-2xl font-black mt-2 text-red-600 dark:text-red-400">
            {cancelledSessions}
          </p>
        </div>
      </div>

      {/* Main List Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] shadow-soft overflow-hidden">
        {/* Filters and search banner */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name or ID..."
              className="w-full pl-9.5 pr-4 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {(["All", "Pending", "Confirmed", "Rescheduled", "Cancelled"] as const).map(
              (status) => {
                const active = statusFilter.toLowerCase() === status.toLowerCase();
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                      active
                        ? "bg-emerald-600 text-white shadow-soft"
                        : "bg-slate-100 dark:bg-slate-950 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-850"
                    }`}
                  >
                    {status}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Appointment Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                <th className="p-4">Appointment ID</th>
                <th className="p-4">Client</th>
                <th className="p-4">Requested Slot</th>
                <th className="p-4">Assignee Coach</th>
                <th className="p-4">Status</th>
                <th className="p-4">Meet Room</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt: any) => {
                  const id = apt["Appointment ID"] || apt.AppointmentId;
                  const name = apt.fullName || apt["Customer Name"] || "Unknown Client";
                  const clientEnrollId =
                    apt["Client ID"] || apt.enrollmentId || apt["Enrollment ID"] || "N/A";
                  const email = apt.Email || apt.email || "N/A";
                  const phone = apt.Phone || apt.phone || "N/A";
                  const date = apt["Appointment Date"] || apt.date || "N/A";
                  const time = apt["Appointment Time"] || apt.time || "N/A";
                  const timezone = apt["Time Zone"] || apt.timezone || "UTC+3";
                  const coach = apt.Coach || apt.coach || "Unassigned";
                  const status = apt.Status || apt.status || "Pending";
                  const meet = apt["Google Meet Link"] || apt.meetLink || "";
                  const notes = apt["Internal Notes"] || apt.internalNotes || "";

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-400">{id}</td>
                      <td className="p-4 leading-normal">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{name}</p>
                        <p className="text-[10px] text-slate-450 mt-0.5">
                          ID: {clientEnrollId} • {phone}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate max-w-[180px]">{email}</p>
                      </td>
                      <td className="p-4 leading-normal">
                        <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" /> {date}
                        </p>
                        <p className="text-[10px] text-slate-450 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" /> {time} ({timezone})
                        </p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            coach === "Unassigned"
                              ? "bg-slate-100 dark:bg-slate-850 text-slate-500"
                              : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {coach}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            status.toLowerCase() === "confirmed" ||
                            status.toLowerCase() === "approved"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : status.toLowerCase() === "pending"
                                ? "bg-yellow-500/10 text-yellow-600 animate-pulse"
                                : status.toLowerCase() === "rescheduled"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-rose-500/10 text-red-650"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="p-4">
                        {meet ? (
                          <a
                            href={meet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors"
                          >
                            <Video className="h-3 w-3" /> Meet Room
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No link</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {status.toLowerCase() === "pending" && (
                            <button
                              onClick={() => handleApproveSession(apt)}
                              title="Approve Session"
                              className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/35 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedApt(apt);
                              setNewDate(date !== "N/A" ? date : "");
                              setNewTime(time !== "N/A" ? time : "10:00");
                              setShowRescheduleModal(true);
                            }}
                            title="Reschedule Session"
                            className="h-7 w-7 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-850"
                          >
                            <Clock className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedApt(apt);
                              setAssignedCoach(coach !== "Unassigned" ? coach : "");
                              setMeetLink(meet);
                              setShowAssignModal(true);
                            }}
                            title="Assign Practitioner"
                            className="h-7 w-7 rounded-lg bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-850"
                          >
                            <User className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedApt(apt);
                              setInternalNotes(notes);
                              setShowNotesModal(true);
                            }}
                            title="Internal Coach Notes"
                            className="h-7 w-7 rounded-lg bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-850"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleSimulateNotification(apt)}
                            title="Dispatch WhatsApp Alert"
                            className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>

                          {status.toLowerCase() !== "cancelled" && (
                            <button
                              onClick={() => handleUpdateAppointmentStatus(apt, "Cancelled")}
                              title="Cancel Session"
                              className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-650 flex items-center justify-center border border-red-100 dark:border-red-900/50"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400">
                    <AlertCircle className="h-10 w-10 text-slate-350 mx-auto mb-2 animate-bounce" />
                    <p className="font-semibold text-slate-880">No scheduled appointments found</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Filter criteria returned zero items. Verify details and try again.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal popup */}
      {showRescheduleModal && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowRescheduleModal(false)}
          />
          <form
            onSubmit={handleSaveReschedule}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up"
          >
            <h3 className="font-display font-extrabold text-lg mb-4">Reschedule Consultation</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-250/60 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  New Time Slot
                </label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="e.g. 11:30"
                  className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-250/60 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Time Zone</label>
                <input
                  type="text"
                  value={newTimeZone}
                  onChange={(e) => setNewTimeZone(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-250/60 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {saving ? "Rescheduling..." : "Save Reschedule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Coach Modal popup */}
      {showAssignModal && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowAssignModal(false)}
          />
          <form
            onSubmit={handleSaveAssign}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up"
          >
            <h3 className="font-display font-extrabold text-lg mb-4">Assign Nutritionist & Meet</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Select Staff Member
                </label>
                <select
                  value={assignedCoach}
                  onChange={(e) => setAssignedCoach(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-250/60 dark:border-slate-850 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Coach --</option>
                  <option value="Clinical Lead">Clinical Lead Specialist</option>
                  {staffList.map((st: any) => (
                    <option key={st.StaffId} value={st.Name}>
                      {st.Name} ({st.Role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Google Meet Room Link
                </label>
                <input
                  type="text"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="e.g. https://meet.google.com/xyz-abcd-efg"
                  className="w-full p-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-250/60 dark:border-slate-850 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {saving ? "Assigning..." : "Save Assignment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Internal Notes Modal popup */}
      {showNotesModal && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowNotesModal(false)}
          />
          <form
            onSubmit={handleSaveNotes}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up"
          >
            <h3 className="font-display font-extrabold text-lg mb-4">Internal Consult Notes</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Coach Notes (Private to Team)
                </label>
                <textarea
                  rows={4}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Review findings, client requests, and intake details..."
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-250/60 dark:border-slate-850 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {saving ? "Saving notes..." : "Save Internal Notes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

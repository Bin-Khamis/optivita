import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCRM } from "@/lib/crmContext";
import {
  Smartphone,
  Send,
  RefreshCw,
  Clock,
  UserCheck,
  AlertCircle,
  Activity,
  CheckCircle,
  FileCheck,
  Trash2,
  Bell,
  HardDriveUpload,
  CloudLightning,
} from "lucide-react";
import { toast } from "sonner";
import { isWebhookOffline } from "@/lib/utils";

export const Route = createFileRoute("/admin/mobile")({
  component: MobileConsole,
});

function MobileConsole() {
  const { data, refreshData } = useCRM();

  // Retrieve sheets data dynamically
  const devices = data?.["Devices"] || [];
  const sessions = data?.["Sessions"] || [];
  const pushHistory = data?.["Push Notifications"] || [];
  const clients = data?.["Clients"] || [];
  const syncQueue = data?.["Synchronization Queue"] || [];
  const settings = data?.["Settings"] || [];

  // Parse app version settings
  const minVersionRow = settings.find(
    (s: any) => String(s.Key || s.key || "").trim().toLowerCase() === "min android app version"
  );
  const forceUpdateRow = settings.find(
    (s: any) => String(s.Key || s.key || "").trim().toLowerCase() === "force android update"
  );

  const initialMinVersion = minVersionRow ? minVersionRow.Value || minVersionRow.value || "1.0.0" : "1.0.0";
  const initialForceUpdate = forceUpdateRow ? String(forceUpdateRow.Value || forceUpdateRow.value || "").toLowerCase() === "true" : false;

  // Local state
  const [minVersion, setMinVersion] = useState(initialMinVersion);
  const [forceUpdate, setForceUpdate] = useState(initialForceUpdate);
  const [savingSettings, setSavingSettings] = useState(false);

  // Push notifications form state
  const [selectedClientId, setSelectedClientId] = useState("All");
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushType, setPushType] = useState("General");
  const [sendingPush, setSendingPush] = useState(false);

  // Sync state settings once spreadsheet data arrives
  useEffect(() => {
    if (minVersionRow) {
      setMinVersion(minVersionRow.Value || minVersionRow.value || "1.0.0");
    }
    if (forceUpdateRow) {
      setForceUpdate(String(forceUpdateRow.Value || forceUpdateRow.value || "").toLowerCase() === "true");
    }
  }, [settings]);

  // Update mobile configurations in Settings sheet
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      toast.success("Settings updated successfully (Offline Simulation)!");
      setSavingSettings(false);
      return;
    }

    try {
      // 1. Update Min App Version
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Settings",
          id: "Min Android App Version",
          fields: {
            "Value": minVersion
          }
        })
      });

      // 2. Update Force Update Toggle
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Settings",
          id: "Force Android Update",
          fields: {
            "Value": String(forceUpdate)
          }
        })
      });

      const result = await res.json();
      if (result.status === "success") {
        toast.success("Mobile settings synced permanently with Google Sheets!");
        refreshData();
      } else {
        toast.error("Failed to update mobile settings.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network communication error.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Dispatch custom push alert
  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushMessage) {
      toast.error("Please fill out push notification title and message.");
      return;
    }

    setSendingPush(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      toast.success("Push notification simulated successfully (Offline Mode)!");
      setSendingPush(false);
      setPushTitle("");
      setPushMessage("");
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "sendPush",
          enrollmentId: selectedClientId === "All" ? "" : selectedClientId,
          title: pushTitle,
          message: pushMessage,
          type: pushType
        })
      });

      const result = await res.json();
      if (result.status === "success") {
        toast.success("Notification pushed to Firebase Cloud Messaging (FCM)!");
        refreshData();
        setPushTitle("");
        setPushMessage("");
      } else {
        toast.error(result.message || "No registered active devices found for target client.");
      }
    } catch (err) {
      console.error(err);
      toast.error("FCM integration communication error.");
    } finally {
      setSendingPush(false);
    }
  };

  // Revoke active login session
  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session? The device will be logged out instantly.")) return;

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      toast.success("Session revoked (Simulation)");
      refreshData();
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Sessions",
          id: sessionId,
          fields: {
            "Expiry": new Date(0).toISOString() // set expiry to 1970
          }
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Session revoked successfully.");
        refreshData();
      } else {
        toast.error("Failed to revoke session.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync session revoke.");
    }
  };

  // Deactivate active device
  const handleDeactivateDevice = async (deviceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Blocked" : "Active";
    if (!confirm(`Are you sure you want to ${nextStatus === "Blocked" ? "Block" : "Unblock"} this device?`)) return;

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      toast.success(`Device status set to ${nextStatus} (Simulation)`);
      refreshData();
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Devices",
          id: deviceId,
          fields: {
            "Status": nextStatus
          }
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success(`Device status updated to ${nextStatus}.`);
        refreshData();
      } else {
        toast.error("Failed to update device status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync device status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Mobile Console</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage native Android clients, active device tokens, push notification logs, and version updates.
          </p>
        </div>
        <button
          onClick={() => {
            refreshData();
            toast.info("Refreshed mobile stats.");
          }}
          className="rounded-full border hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 flex items-center justify-center text-slate-500 transition-all duration-200"
          title="Refresh Data"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border p-5 rounded-[20px] flex items-center gap-4 shadow-soft">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Devices</p>
            <h3 className="text-2xl font-black mt-0.5">{devices.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border p-5 rounded-[20px] flex items-center gap-4 shadow-soft">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active JWT Sessions</p>
            <h3 className="text-2xl font-black mt-0.5">{sessions.filter((s: any) => new Date(s.Expiry) > new Date()).length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border p-5 rounded-[20px] flex items-center gap-4 shadow-soft">
          <div className="h-12 w-12 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
            <CloudLightning className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Sync Queue</p>
            <h3 className="text-2xl font-black mt-0.5">{syncQueue.filter((s: any) => String(s.Status).toLowerCase() === "pending").length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border p-5 rounded-[20px] flex items-center gap-4 shadow-soft">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min App Version Required</p>
            <h3 className="text-2xl font-black mt-0.5">{minVersion}</h3>
          </div>
        </div>
      </div>

      {/* Main Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Firebase Push Dispatcher Form */}
        <div className="bg-white dark:bg-slate-900 border p-6 rounded-[24px] shadow-soft lg:col-span-2 space-y-4">
          <h2 className="font-display font-extrabold text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-500" /> FCM Push Notification Center
          </h2>
          <p className="text-xs text-slate-400">
            Dispatch notification alerts directly to the registered Android app users through Firebase v1 credentials.
          </p>

          <form onSubmit={handleSendPush} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Client Profile</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">All Registered Devices (Spam Warning)</option>
                  {clients.map((c: any) => (
                    <option key={c["Enrollment ID"] || c.EnrollmentID} value={c["Enrollment ID"] || c.EnrollmentID}>
                      {c["Client Name"] || c.ClientName || c.fullName || ""} ({c["Enrollment ID"] || c.EnrollmentID})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notification Type</label>
                <select
                  value={pushType}
                  onChange={(e) => setPushType(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="General">General Announcement</option>
                  <option value="Appointment">Appointment Reminder</option>
                  <option value="Workout">Workout Reminder</option>
                  <option value="Meal">Meal Routine Notification</option>
                  <option value="Payment">Invoice / Billing Request</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notification Title</label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="e.g. Schedule Update: Meal Plan Uploaded"
                className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message Description Body</label>
              <textarea
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder="Type the message description to be pushed to the status bar alert of the client's smartphone..."
                className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none leading-normal"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sendingPush}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 text-xs shadow-soft flex items-center justify-center gap-1.5 w-full disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-4 w-4" /> {sendingPush ? "Pushing Notification..." : "Dispatch Push Alert"}
            </button>
          </form>
        </div>

        {/* Mobile App Version Management Form */}
        <div className="bg-white dark:bg-slate-900 border p-6 rounded-[24px] shadow-soft space-y-4">
          <h2 className="font-display font-extrabold text-lg flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-500" /> Mobile Version Control
          </h2>
          <p className="text-xs text-slate-400">
            Set version criteria parameters. Clients using builds below the limit will receive forced/optional update prompts.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Minimum Build Version Required</label>
              <input
                type="text"
                value={minVersion}
                onChange={(e) => setMinVersion(e.target.value)}
                placeholder="e.g. 1.0.2"
                className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5 flex items-center justify-between border-y border-slate-100 dark:border-slate-800 py-4">
              <div>
                <p className="text-xs font-bold">Forced Update Lockout</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Locks client view until they download updates.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceUpdate}
                  onChange={(e) => setForceUpdate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 text-xs shadow-soft flex items-center justify-center gap-1.5 w-full disabled:opacity-50 cursor-pointer"
            >
              <HardDriveUpload className="h-4 w-4" /> {savingSettings ? "Syncing configs..." : "Save Settings"}
            </button>
          </form>
        </div>
      </div>

      {/* Connected Devices Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-display font-extrabold text-sm flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-500" /> Connected Devices Directory
          </h3>
          <span className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 font-bold px-2.5 py-1 rounded-full">{devices.length} Devices</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                <th className="py-4.5 px-6">Device ID</th>
                <th className="py-4.5 px-6">Client Profile</th>
                <th className="py-4.5 px-6">Platform / Model</th>
                <th className="py-4.5 px-6">Android / App Version</th>
                <th className="py-4.5 px-6">Last Active Sync</th>
                <th className="py-4.5 px-6">Push Token</th>
                <th className="py-4.5 px-6">Security status</th>
                <th className="py-4.5 px-6 text-center">Control Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No active mobile devices have linked to the API yet.
                  </td>
                </tr>
              ) : (
                devices.map((dev: any) => {
                  const clientObj = clients.find((c: any) => (c["Enrollment ID"] || c.EnrollmentID) === dev["Enrollment ID"]);
                  const clientName = clientObj ? clientObj["Client Name"] || clientObj.ClientName || clientObj.fullName || "" : "Unassigned";
                  return (
                    <tr key={dev["Device ID"]} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4.5 px-6 font-mono font-bold text-slate-400 dark:text-slate-500">{String(dev["Device ID"]).substring(0, 12)}...</td>
                      <td className="py-4.5 px-6 font-semibold">
                        {clientName}
                        <p className="text-[10px] text-slate-400 mt-0.5">{dev["Enrollment ID"]}</p>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{dev.Model || "Unknown Model"}</span>
                        <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">{dev.Platform || "Android"}</p>
                      </td>
                      <td className="py-4.5 px-6 font-medium">
                        OS: {dev["Android Version"] || "N/A"}
                        <p className="text-[9px] font-mono text-slate-400 mt-0.5">Build: v{dev["App Version"] || "1.0.0"}</p>
                      </td>
                      <td className="py-4.5 px-6 text-slate-500">
                        {dev["Last Sync"] ? new Date(dev["Last Sync"]).toLocaleString() : "Never synced"}
                      </td>
                      <td className="py-4.5 px-6 font-mono text-[9px] text-slate-450 truncate max-w-xs" title={dev["FCM Token"]}>
                        {dev["FCM Token"] ? `${dev["FCM Token"].substring(0, 20)}...` : "Empty Token"}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider border ${
                          String(dev.Status).toLowerCase() === "active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                            : "bg-red-500/10 text-red-600 border-red-200"
                        }`}>
                          {String(dev.Status).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleDeactivateDevice(dev["Device ID"], dev.Status)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                              String(dev.Status).toLowerCase() === "active"
                                ? "bg-red-50 hover:bg-red-100 text-red-650 border-red-100 dark:bg-red-950/20 dark:border-red-900/40"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-650 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40"
                            }`}
                          >
                            {String(dev.Status).toLowerCase() === "active" ? "Block Device" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Active Sessions & Push History logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Session List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/20">
            <h3 className="font-display font-extrabold text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-500" /> Current Login Sessions
            </h3>
            <span className="bg-blue-50 dark:bg-blue-950 text-[10px] text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1 rounded-full">
              {sessions.filter((s: any) => new Date(s.Expiry) > new Date()).length} Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">No active authorization sessions found.</div>
            ) : (
              sessions.map((sess: any) => {
                const isExpired = new Date(sess.Expiry) < new Date();
                const clientObj = clients.find((c: any) => (c["Enrollment ID"] || c.EnrollmentID) === sess["Enrollment ID"]);
                const clientName = clientObj ? clientObj["Client Name"] || clientObj.ClientName || clientObj.fullName || "" : "Unknown";
                return (
                  <div key={sess["Session ID"]} className={`p-4.5 flex justify-between items-center ${isExpired ? "opacity-40" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{clientName}</span>
                        <span className="font-mono text-[9px] bg-slate-50 dark:bg-slate-950 text-slate-400 border px-1.5 py-0.5 rounded-md">
                          {sess["Enrollment ID"]}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">Device ID: {sess["Device ID"]}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Expires: {new Date(sess.Expiry).toLocaleString()}
                      </p>
                    </div>
                    {!isExpired && (
                      <button
                        onClick={() => handleRevokeSession(sess["Session ID"])}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors"
                        title="Revoke and Logout"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Push Notifications Logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20">
            <h3 className="font-display font-extrabold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-500" /> FCM Pushed Alerts History
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {pushHistory.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">No notifications sent through FCM yet.</div>
            ) : (
              [...pushHistory].reverse().map((push: any, idx: number) => {
                const clientObj = clients.find((c: any) => (c["Enrollment ID"] || c.EnrollmentID) === push["Enrollment ID"]);
                const clientName = clientObj ? clientObj["Client Name"] || clientObj.ClientName || clientObj.fullName || "" : "General Announcement";
                return (
                  <div key={idx} className="p-4.5 flex gap-3.5 leading-normal">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Send className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-xs text-slate-400 truncate">{clientName}</span>
                        <span className="text-[9px] text-slate-400 shrink-0">{push.Created ? new Date(push.Created).toLocaleString() : ""}</span>
                      </div>
                      <h4 className="font-bold text-xs mt-1 text-slate-850 dark:text-slate-100">{push.Title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{push.Message}</p>
                      <span className="inline-block bg-slate-50 dark:bg-slate-950 text-[8px] text-slate-400 font-bold border px-2 py-0.5 rounded-full uppercase mt-2">
                        Type: {push.Type || "General"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCRM } from "@/lib/crmContext";
import { 
  Shield, UserCheck, ShieldAlert, Plus, Edit, Trash2, ShieldCheck, 
  MapPin, Clock, X, Lock, KeyRound
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { data, user, refreshData } = useCRM();
  const navigate = useNavigate();

  // Guard: Double verify Super Admin role
  useEffect(() => {
    if (user && user.role !== "Super Admin") {
      toast.error("Access denied. Admin management is restricted to Super Administrators.");
      navigate({ to: "/admin/dashboard" });
    }
  }, [user, navigate]);

  const users = data?.["Users"] || [];

  // Add User Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Viewer");
  const [branches, setBranches] = useState("Main Office");
  const [permissions, setPermissions] = useState("Read Only");
  const [saving, setSaving] = useState(false);

  // View Log history modal
  const [selectedLogsUser, setSelectedLogsUser] = useState<any | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please fill in username and password.");
      return;
    }

    setSaving(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.includes("placeholder")) {
      // Mock create
      setTimeout(() => {
        users.push({
          UserId: "USR-" + Math.floor(1000 + Math.random() * 9000),
          Username: username,
          Role: role,
          Active: true,
          Branches: branches,
          Permissions: permissions,
          LastLogin: ""
        });
        toast.success("Staff profile created (Offline Simulation)!");
        setShowAddModal(false);
        setSaving(false);
        resetForm();
      }, 700);
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "manageUser",
          subAction: "create",
          username,
          password,
          role,
          branches,
          permissions
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("New staff user added instantly to Google Sheets!");
        refreshData();
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error(result.message || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to sheet backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateToggle = async (targetUser: any) => {
    const nextActive = !targetUser.Active;
    
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.includes("placeholder")) {
      targetUser.Active = nextActive;
      toast.success(`Account status updated to ${nextActive ? "Active" : "Inactive"}`);
      refreshData();
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "updateRecord",
          sheetName: "Users",
          idColumn: "UserId",
          id: targetUser.UserId,
          fields: {
            "Active": nextActive
          }
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success(`User status updated successfully!`);
        refreshData();
      } else {
        toast.error("Failed to adjust user status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network synchronization failed.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === "USR-1001" || userId === user?.userId) {
      toast.error("Cannot delete your own account or the master Super Admin account.");
      return;
    }
    if (!confirm("Are you sure you want to delete this staff user? This cannot be undone.")) return;

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.includes("placeholder")) {
      toast.success("User deleted (Offline Mode)");
      refreshData();
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "manageUser",
          subAction: "delete",
          userId
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("User removed successfully");
        refreshData();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed.");
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setRole("Viewer");
    setBranches("Main Office");
    setPermissions("Read Only");
  };

  return (
    <div className="space-y-6">
      
      {/* Module Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Staff Credentials</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add, edit, deactivate, or assign clinical access roles to administrative staff.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 text-xs shadow-soft flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Staff Account
        </button>
      </div>

      {/* Staff directory table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                <th className="py-4.5 px-5">Staff ID</th>
                <th className="py-4.5 px-5">Username</th>
                <th className="py-4.5 px-5">Assign Role</th>
                <th className="py-4.5 px-5">Assigned Branch</th>
                <th className="py-4.5 px-5">Permission Level</th>
                <th className="py-4.5 px-5">Active Status</th>
                <th className="py-4.5 px-5">Last Login Time</th>
                <th className="py-4.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {users.map((usr: any) => (
                <tr key={usr.UserId} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4.5 px-5 font-mono font-bold text-slate-400 dark:text-slate-500">{usr.UserId}</td>
                  <td className="py-4.5 px-5 font-semibold text-sm">{usr.Username}</td>
                  <td className="py-4.5 px-5">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <Shield className="h-3.5 w-3.5 text-emerald-500" /> {usr.Role}
                    </span>
                  </td>
                  <td className="py-4.5 px-5">
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="h-3.5 w-3.5" /> {usr.Branches || "Main"}
                    </span>
                  </td>
                  <td className="py-4.5 px-5 font-medium text-slate-600 dark:text-slate-400">{usr.Permissions || "Full"}</td>
                  <td className="py-4.5 px-5">
                    <button 
                      onClick={() => handleDeactivateToggle(usr)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black tracking-wider border cursor-pointer transition-all duration-200 ${
                        usr.Active 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" 
                          : "bg-red-500/10 text-red-600 border-red-200"
                      }`}
                    >
                      {usr.Active ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </td>
                  <td className="py-4.5 px-5 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {usr.LastLogin || "Never logged in"}
                    </span>
                  </td>
                  <td className="py-4.5 px-5">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedLogsUser(usr)}
                        className="px-2.5 py-1.5 rounded-lg border text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                        title="View Login Logs"
                      >
                        Logs
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(usr.UserId)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500"
                        title="Delete Staff"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal popup dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddModal(false)} />
          <form onSubmit={handleCreateUser} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up">
            
            <button 
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1">Add Staff Account</h3>
            <p className="text-xs text-slate-400 mb-5">Assign unique security permissions to this account.</p>

            <div className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. counselor_ahmed"
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter temp password"
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              {/* Role Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CRM Staff Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Sales">Sales Coordinator</option>
                  <option value="Nutritionist">Clinical Nutritionist</option>
                  <option value="Coach">Health Coach</option>
                  <option value="Viewer">Guest Viewer</option>
                </select>
              </div>

              {/* Branches dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Branch Location</label>
                <select 
                  value={branches}
                  onChange={(e) => setBranches(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="All">All Branches</option>
                  <option value="Kuwait City">Kuwait City Branch</option>
                  <option value="Riyadh HQ">Riyadh HQ</option>
                  <option value="Dubai Wellness">Dubai Wellness Office</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <button 
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2"
              >
                {saving ? "Writing User..." : "Create Admin Account"}
              </button>

            </div>
          </form>
        </div>
      )}

      {/* Security Logs Modal popup dialog */}
      {selectedLogsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedLogsUser(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up">
            
            <button 
              onClick={() => setSelectedLogsUser(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-500" /> Security Login History
            </h3>
            <p className="text-xs text-slate-400 mb-5">Showing details for user: {selectedLogsUser.Username}</p>

            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
              {selectedLogsUser.LoginHistory && JSON.parse(selectedLogsUser.LoginHistory).length > 0 ? (
                JSON.parse(selectedLogsUser.LoginHistory).map((log: any, idx: number) => (
                  <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl leading-normal text-xs flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{log.timestamp}</span>
                    <span className="font-mono text-[10px] text-slate-400">IP: {log.ip}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-10 text-xs">
                  No login history records logged for this account yet.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

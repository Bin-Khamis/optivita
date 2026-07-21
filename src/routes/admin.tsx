import { createFileRoute, Outlet, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect, createContext, useContext } from "react";
import { 
  Users, BarChart3, Settings, LogOut, Menu, Bell, Sun, Moon, Search, 
  Award, Calendar, DollarSign, Activity, FileText, CheckSquare, Shield
} from "lucide-react";
import { toast, Toaster } from "sonner";

import { CRMContext, type UserSession } from "../lib/crmContext";
import { getCRMDataFromFirestore, saveCRMDataToFirestore } from "@/lib/firebase";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([
    "New lead sufaid Hussain registered",
    "Clinical check scheduling request received",
    "Referral bonus assigned to Ahmed"
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // 1. Auth Guard and Dark Mode initializer
  useEffect(() => {
    const session = localStorage.getItem("optivita_admin_session");
    if (!session) {
      navigate({ to: "/admin/login" });
      return;
    }
    setUser(JSON.parse(session));

    // Dark Mode check
    const isDark = localStorage.getItem("admin_dark_mode") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    
    // Fetch dashboard dataset
    fetchCRMData();
  }, [navigate]);

  // 2. Fetch dataset from Google Sheets (Permanent Master) & Firestore (Realtime Cache)
  const fetchCRMData = async (forceSpinner = false) => {
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    
    // Check local cache, but purge if it contains outdated mock data (OPT-2026-001002)
    const cached = localStorage.getItem("optivita_crm_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const hasMockData = JSON.stringify(parsed).includes("OPT-2026-001002");
        if (!hasMockData) {
          setData(parsed);
          if (!forceSpinner) setLoading(false);
        } else {
          console.log("Purging old mock data from cache...");
          localStorage.removeItem("optivita_crm_cache");
          setLoading(true);
        }
      } catch (e) {
        localStorage.removeItem("optivita_crm_cache");
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    if (!webhookUrl || webhookUrl.includes("placeholder")) {
      setLoading(false);
      return;
    }

    try {
      // Attempt 1: POST request to Apps Script
      let result: any = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "getData" }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          result = await res.json();
        }
      } catch (e) {
        console.warn("POST getData attempt note:", e);
      }

      // Attempt 2: GET request fallback if POST did not return success
      if (!result || result.status !== "success") {
        try {
          const getRes = await fetch(`${webhookUrl}?action=getData`);
          const getContentType = getRes.headers.get("content-type");
          if (getContentType && getContentType.includes("application/json")) {
            result = await getRes.json();
          }
        } catch (e) {
          console.warn("GET getData attempt note:", e);
        }
      }

      if (result && result.status === "success" && result.data) {
        setData(result.data);
        localStorage.setItem("optivita_crm_cache", JSON.stringify(result.data));
        // Mirror live Google Sheets Master into Firestore
        saveCRMDataToFirestore(result.data);
      } else {
        // Fallback to Firestore only if valid non-mock dataset exists
        const firestoreData = await getCRMDataFromFirestore();
        if (firestoreData && !JSON.stringify(firestoreData).includes("OPT-2026-001002")) {
          setData(firestoreData);
        }
      }
    } catch (err: any) {
      console.warn("Master Google Sheets fetch note:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("optivita_admin_session");
    toast.success("Successfully logged out");
    navigate({ to: "/admin/login" });
  };

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem("admin_dark_mode", String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const isLoginPage = router.state.location.pathname === "/admin/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Outlet />
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  // Synchronous Guard: Block child rendering if there is no active session
  const session = typeof window !== "undefined" ? localStorage.getItem("optivita_admin_session") : null;
  if (!session) {
    return null;
  }

  const navItems = [
    { label: "Dashboard", icon: BarChart3, path: "/admin/dashboard" },
    { label: "Lead Management", icon: Users, path: "/admin/leads" },
    { label: "Loyalty Program", icon: Award, path: "/admin/loyalty" },
    { label: "Financial Console", icon: DollarSign, path: "/admin/finance" },
    { label: "HR & Payroll", icon: Users, path: "/admin/hr" },
    { label: "User Management", icon: Shield, path: "/admin/users", restricted: true },
    { label: "Reports & Analytics", icon: FileText, path: "/admin/reports" },
    { label: "System Settings", icon: Settings, path: "/admin/settings" }
  ];

  return (
    <CRMContext.Provider value={{ data, loading, refreshData: fetchCRMData, user, logout }}>
      <div className={`min-h-screen flex transition-colors duration-200 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
        
        {/* Left Sidebar Layout */}
        <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r shadow-soft transition-all duration-300 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} ${sidebarOpen ? "w-64" : "w-20"}`}>
          
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-inherit">
            {sidebarOpen ? (
              <span className="font-display font-extrabold text-lg text-emerald-600 dark:text-emerald-400 tracking-wider">OPTIVITA CRM</span>
            ) : (
              <span className="font-display font-black text-xl text-emerald-600 dark:text-emerald-400">O</span>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              if (item.restricted && user?.role !== "Super Admin") return null;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  activeProps={{ className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" }}
                  inactiveProps={{ className: "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60" }}
                  className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Summary */}
          <div className="p-4 border-t border-inherit">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-none">{user?.username}</p>
                  <p className="text-xs text-slate-400 mt-1 truncate">{user?.role}</p>
                </div>
              )}
              {sidebarOpen && (
                <button onClick={logout} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors" title="Log Out">
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-20"}`}>
          
          {/* Top Navigation */}
          <header className={`h-16 border-b flex items-center justify-between px-8 sticky top-0 z-20 backdrop-blur-md ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
            
            {/* Search Bar */}
            <div className="relative w-72 max-w-md hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search leads, invoices, cards..." 
                className="w-full pl-10 pr-4 py-2 border rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="md:hidden"></div>

            {/* Quick Actions (Theme, notifications, profile) */}
            <div className="flex items-center gap-4">
              
              {/* Dark mode switcher */}
              <button 
                onClick={toggleDarkMode}
                className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-200"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notification badge */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </button>

                {/* Notifications dropdown menu */}
                {showNotifications && (
                  <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-glow border p-4 z-50 animate-scale-up ${darkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}>
                    <h4 className="font-bold text-sm mb-3">Notifications ({notifications.length})</h4>
                    <div className="space-y-2">
                      {notifications.map((notif, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800 leading-normal">
                          {notif}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Branch indicator badge */}
              <div className="hidden lg:flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/40">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Branch: {user?.branches === "All" ? "Main Office" : user?.branches}
              </div>

            </div>

          </header>

          {/* Main Module Content */}
          <main className="flex-1 p-8 overflow-y-auto">
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-slate-400 animate-pulse">Syncing with Google Sheets...</p>
              </div>
            ) : (
              <Outlet />
            )}
          </main>

        </div>

        <Toaster position="top-right" richColors />
      </div>
    </CRMContext.Provider>
  );
}

function getMockCRMDataset() {
  return {
    "Program Enrollments": [],
    "Health Assessments": [],
    "Users": [
      {
        "UserId": "USR-1001",
        "Username": "admin",
        "Role": "Super Admin",
        "Active": true,
        "Branches": "All",
        "Permissions": "Full System Access",
        "LastLogin": ""
      }
    ],
    "Loyalty Ledger": [],
    "Rewards Catalog": [
      { "RewardId": "RW-101", "RewardName": "Free BMI Assessment", "PointsRequired": 250, "Active": true, "Description": "Standard consultation BMI analysis" },
      { "RewardId": "RW-102", "RewardName": "Nutrition Consultation", "PointsRequired": 400, "Active": true, "Description": "1-on-1 private dietary planner review" },
      { "RewardId": "RW-103", "RewardName": "Diet Plan Upgrade", "PointsRequired": 500, "Active": true, "Description": "Upgrade to personalized premium meals schedule" },
      { "RewardId": "RW-104", "RewardName": "1 Week Program Extension", "PointsRequired": 750, "Active": true, "Description": "Extension of core nutrition tracking support" }
    ],
    "Appointments": [],
    "Invoices": [],
    "Receipts": [],
    "Refunds": [],
    "Cash Treasury": [],
    "Expenses": [],
    "Staff": [],
    "Journal Ledger": [],
    "Audit Logs": []
  };
}



import { createFileRoute, Outlet, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect, createContext, useContext } from "react";
import { 
  User, Award, Calendar, DollarSign, Activity, FileText, CheckSquare,
  LogOut, Menu, Bell, Sun, Moon, Sparkles, HeartPulse, Trophy, Key
} from "lucide-react";
import { toast, Toaster } from "sonner";

import { PortalContext, type CustomerSession } from "../lib/portalContext";
import { getCRMDataFromFirestore } from "@/lib/firebase";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

function PortalLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("optivita_customer_session");
    if (!session) {
      navigate({ to: "/portal/login" });
      return;
    }
    try {
      setCustomer(JSON.parse(session));
    } catch (e) {
      console.warn("Invalid session cache:", e);
      localStorage.removeItem("optivita_customer_session");
      navigate({ to: "/portal/login" });
      return;
    }

    // Set initial activity timestamp
    localStorage.setItem("optivita_portal_last_activity", String(Date.now()));

    // Listeners for user activity to extend session
    const updateActivity = () => {
      localStorage.setItem("optivita_portal_last_activity", String(Date.now()));
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);

    // Periodically check for 30 minutes of inactivity
    const checkInactivity = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem("optivita_portal_last_activity") || "0", 10);
      const diff = Date.now() - lastActivity;
      if (diff > 30 * 60 * 1000) {
        clearInterval(checkInactivity);
        localStorage.removeItem("optivita_customer_session");
        localStorage.removeItem("optivita_portal_last_activity");
        toast.warning("Session expired due to inactivity. Please log in again.");
        navigate({ to: "/portal/login" });
      }
    }, 10000); // Check every 10 seconds

    // Dark Mode check
    const isDark = localStorage.getItem("portal_dark_mode") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");

    fetchCustomerData();

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      clearInterval(checkInactivity);
    };
  }, [navigate]);

  const fetchCustomerData = async () => {
    setLoading(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    
    // 1. Read from localStorage cache immediately
    const cached = localStorage.getItem("optivita_crm_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setLoading(false);
      } catch (e) {
        localStorage.removeItem("optivita_crm_cache");
      }
    }

    // 2. High-speed Firestore read
    try {
      const firestoreData = await getCRMDataFromFirestore();
      if (firestoreData) {
        setData(firestoreData);
        localStorage.setItem("optivita_crm_cache", JSON.stringify(firestoreData));
        setLoading(false);
      }
    } catch (e) {
      console.warn("Firestore portal read warning:", e);
    }

    if (!webhookUrl || 
        webhookUrl.includes("placeholder") || 
        webhookUrl === "undefined" || 
        webhookUrl === "null" || 
        webhookUrl.trim() === "") {
      if (!cached) {
        const mock = getMockCustomerDataset();
        setData(mock);
      }
      setLoading(false);
      return;
    }

    // 3. Background fetch from Google Sheets
    try {
      let result: any = null;
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "getData" })
        });
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          result = await res.json();
        }
      } catch (e) {}

      if (!result || result.status !== "success") {
        try {
          const getRes = await fetch(`${webhookUrl}?action=getData`);
          const getContentType = getRes.headers.get("content-type");
          if (getContentType && getContentType.includes("application/json")) {
            result = await getRes.json();
          }
        } catch (e) {}
      }

      if (result && result.status === "success" && result.data) {
        setData(result.data);
        localStorage.setItem("optivita_crm_cache", JSON.stringify(result.data));
      }
    } catch (err) {
      console.warn("Portal Google Sheets fetch note:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("optivita_customer_session");
    toast.success("Logged out successfully");
    navigate({ to: "/portal/login" });
  };

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem("portal_dark_mode", String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const isLoginPage = router.state.location.pathname === "/portal/login";

  if (isLoginPage) {
    return (
      <PortalContext.Provider value={{ data: null, loading: false, refreshData: async () => {}, customer: null, logout: () => {} }}>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Outlet />
        </div>
      </PortalContext.Provider>
    );
  }

  // Synchronous Guard: Block child rendering if there is no active session
  const session = typeof window !== "undefined" ? localStorage.getItem("optivita_customer_session") : null;
  if (!session) {
    return null;
  }

  const navItems = [
    { label: "Dashboard", icon: HeartPulse, path: "/portal/dashboard" },
    { label: "Coaching Programs", icon: CheckSquare, path: "/portal/programs" },
    { label: "Loyalty Card Hub", icon: Trophy, path: "/portal/loyalty" },
    { label: "Progress Logs", icon: Activity, path: "/portal/progress" },
    { label: "Appointments", icon: Calendar, path: "/portal/appointments" },
    { label: "Billing & Invoices", icon: FileText, path: "/portal/invoices" },
    { label: "Security Settings", icon: Key, path: "/portal/security" }
  ];

  return (
    <PortalContext.Provider value={{ data, loading, refreshData: fetchCustomerData, customer, logout }}>
      <div className={`min-h-screen flex transition-colors duration-200 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-slate-900"}`}>
        
        {/* Sidebar Nav */}
        <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r shadow-soft transition-all duration-300 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} ${sidebarOpen ? "w-64" : "w-20"}`}>
          
          <div className="h-16 flex items-center justify-between px-6 border-b border-inherit">
            {sidebarOpen ? (
              <span className="font-display font-extrabold text-base text-emerald-600 dark:text-emerald-400 tracking-wider">OPTIVITA PORTAL</span>
            ) : (
              <span className="font-display font-black text-lg text-emerald-600 dark:text-emerald-400">O</span>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
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
            ))}
          </nav>

          <div className="p-4 border-t border-inherit">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                {customer?.fullName.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-none">{customer?.fullName}</p>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">{customer?.enrollmentId}</p>
                </div>
              )}
              {sidebarOpen && (
                <button onClick={logout} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500" title="Log Out">
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-20"}`}>
          
          <header className={`h-16 border-b flex items-center justify-between px-8 sticky top-0 z-20 backdrop-blur-md ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
            
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-500">Precision Coaching Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              
              <button onClick={toggleDarkMode} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 relative"
                >
                  <Bell className="h-5 w-5" />
                </button>

                {showNotifications && (
                  <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-glow border p-4 z-50 animate-scale-up ${darkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}>
                    <h4 className="font-bold text-sm mb-3">Portal Announcements</h4>
                    <div className="p-2.5 rounded-lg text-xs border bg-slate-50/50 dark:bg-slate-850 border-slate-100 dark:border-slate-800 leading-normal">
                      Welcome to your new Optivita Patient Hub! Adjust points and renew memberships dynamically.
                    </div>
                  </div>
                )}
              </div>

            </div>

          </header>

          <main className="flex-1 p-8 overflow-y-auto">
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-slate-400">Connecting database...</p>
              </div>
            ) : (
              <Outlet />
            )}
          </main>

        </div>

        
      </div>
    </PortalContext.Provider>
  );
}

// Mock dataset generator to ensure Customer Portal loads beautifully immediately
function getMockCustomerDataset() {
  return {
    "Program Enrollments": [],
    "Health Assessments": [],
    "Loyalty Ledger": [],
    "Rewards Catalog": [
      { "RewardId": "RW-101", "RewardName": "Free BMI Assessment", "PointsRequired": 250, "Active": true, "Description": "Standard consultation BMI analysis" },
      { "RewardId": "RW-102", "RewardName": "Nutrition Consultation", "PointsRequired": 400, "Active": true, "Description": "1-on-1 private dietary planner review" },
      { "RewardId": "RW-103", "RewardName": "Diet Plan Upgrade", "PointsRequired": 500, "Active": true, "Description": "Upgrade to personalized premium meals schedule" },
      { "RewardId": "RW-104", "RewardName": "1 Week Program Extension", "PointsRequired": 750, "Active": true, "Description": "Extension of core nutrition tracking support" }
    ],
    "Appointments": [],
    "Invoices": []
  };
}

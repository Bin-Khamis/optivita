import { createFileRoute, Outlet, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  User,
  CheckSquare,
  Calendar,
  Users,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Star,
  Tag,
  Settings,
  LogOut,
  Menu,
  Bell,
  Sun,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Languages,
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/provider")({
  component: ProviderLayout,
});

function ProviderLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = router.state.location.pathname;
  
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const isLoginPage = pathname === "/provider/login";
    const isRegisterPage = pathname === "/provider/register";
    
    if (isLoginPage || isRegisterPage) {
      setLoading(false);
      return;
    }

    const session = localStorage.getItem("optivita_provider_session");
    if (!session) {
      navigate({ to: "/provider/login" });
      return;
    }

    try {
      setProvider(JSON.parse(session));
    } catch {
      localStorage.removeItem("optivita_provider_session");
      navigate({ to: "/provider/login" });
    }
    
    // Dark mode check
    const isDark = localStorage.getItem("provider_dark_mode") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    
    setLoading(false);
  }, [pathname, navigate]);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem("provider_dark_mode", String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("optivita_provider_session");
    toast.success("Successfully logged out from Provider Portal");
    navigate({ to: "/provider/login" });
  };

  const isAuthPage = pathname === "/provider/login" || pathname === "/provider/register";

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-muted-foreground">Authenticating Provider Session...</p>
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-200">
        <Outlet />
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/provider" },
    { label: "Public Profile", icon: User, path: "/provider/profile" },
    { label: "My Services", icon: CheckSquare, path: "/provider/services" },
    { label: "Availability", icon: Calendar, path: "/provider/availability" },
    { label: "Appointments", icon: Calendar, path: "/provider/appointments" },
    { label: "Customers", icon: Users, path: "/provider/customers" },
    { label: "Messages", icon: MessageSquare, path: "/provider/messages" },
    { label: "Earnings", icon: TrendingUp, path: "/provider/earnings" },
    { label: "Payouts", icon: DollarSign, path: "/provider/payouts" },
    { label: "Reviews", icon: Star, path: "/provider/reviews" },
    { label: "Promotions", icon: Tag, path: "/provider/promotions" },
    { label: "Settings", icon: Settings, path: "/provider/settings" },
    { label: "Performance Analytics", icon: TrendingUp, path: "/provider/analytics" },
  ];

  const verificationStatus = provider?.verified;

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-slate-900"}`}>
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r shadow-soft transition-all duration-300 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-inherit">
          {sidebarOpen ? (
            <span className="font-display font-extrabold text-sm text-accent tracking-wider uppercase">
              PROVIDER PORTAL
            </span>
          ) : (
            <span className="font-display font-black text-lg text-accent">P</span>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              activeProps={{
                className: "bg-accent/15 text-accent dark:bg-accent/20 dark:text-accent-foreground",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:bg-secondary/35",
              }}
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs transition-all duration-200"
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Profile Card Footer */}
        <div className="p-4 border-t border-inherit">
          <div className="flex items-center gap-3">
            <img
              src={provider?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"}
              alt="Avatar"
              className="h-10 w-10 rounded-xl object-cover border border-border/40"
            />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate leading-none">{provider?.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1 capitalize truncate">{provider?.type}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500" title="Log Out">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-grow flex flex-col transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-20"}`}>
        {/* Header Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-8 sticky top-0 z-20 backdrop-blur-md ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
          {/* Left indicator status */}
          <div className="flex items-center gap-3">
            {verificationStatus ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-wide uppercase">
                <ShieldCheck className="h-4 w-4 animate-pulse" />
                <span>Verified Provider</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black tracking-wide uppercase">
                <ShieldAlert className="h-4 w-4 animate-bounce" />
                <span>Verification Pending</span>
              </div>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-secondary/40 text-muted-foreground">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-secondary/40 text-muted-foreground relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
              {showNotifications && (
                <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-glow border p-4 z-50 animate-scale-up ${darkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}>
                  <h4 className="font-bold text-sm mb-3">System Alerts</h4>
                  <div className="space-y-2 text-xs">
                    {!verificationStatus && (
                      <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 leading-normal">
                        Your professional profile is pending verification by the Admin board.
                      </div>
                    )}
                    <div className="p-2.5 rounded-lg border border-border bg-secondary/10 leading-normal">
                      Welcome to the Optivita Provider Portal. Configure your services and available slots to start receiving bookings.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}

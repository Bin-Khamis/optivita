import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, User, Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      toast.error("Please fill in all fields.");
      setLoading(false);
      return;
    }

    // Default Fallback Credentials for instant testing
    if ((username === "admin" && password === "admin123") || (username === "SFD" && password === "42168511")) {
      const mockSession = {
        userId: "USR-1001",
        username: username,
        role: "Super Admin",
        branches: "All",
        permissions: "Full System Access"
      };
      localStorage.setItem("optivita_admin_session", JSON.stringify(mockSession));
      toast.success("Welcome back to OPTIVITA!");
      setTimeout(() => navigate({ to: "/admin/dashboard" }), 800);
      return;
    }

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.includes("placeholder")) {
      toast.error("Invalid login. Try default credentials: admin / admin123");
      setLoading(false);
      return;
    }

    try {
      // Connect to Google Sheets API
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "login",
          username,
          password
        })
      });

      const data = await res.json();
      if (data.status === "success") {
        localStorage.setItem("optivita_admin_session", JSON.stringify(data.user));
        toast.success("Successfully logged in!");
        navigate({ to: "/admin/dashboard" });
      } else {
        toast.error(data.message || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login request error:", err);
      toast.error("Server connection failed. Attempting offline fallback...");
      
      // Fallback
      if ((username === "admin" && password === "admin123") || (username === "SFD" && password === "42168511")) {
        const mockSession = {
          userId: "USR-1001",
          username: username,
          role: "Super Admin",
          branches: "All",
          permissions: "Full System Access"
        };
        localStorage.setItem("optivita_admin_session", JSON.stringify(mockSession));
        toast.success("Welcome (Offline Mode)");
        navigate({ to: "/admin/dashboard" });
      } else {
        toast.error("Verification failed. Please check network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Please contact the Super Admin to reset your password.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-200">
      
      {/* Visual background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-teal-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] p-8 md:p-10 shadow-glow relative z-10 animate-scale-up">
        
        {/* Brand Logo and Title */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50 tracking-tight">
            Optivita CRM Access
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Secure admin portal for healthcare coordinators
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter user ID"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter security password"
                className="w-full pl-10 pr-12 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 accent-emerald-600 dark:border-slate-800 dark:bg-slate-900"
            />
            <label htmlFor="remember" className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
              Remember my session
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-gradient text-white font-bold py-3.5 shadow-md hover:opacity-95 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {loading ? "Authenticating..." : "Login to Console"}
          </button>
        </form>

        {/* Return to Home link */}
        <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Website Home
          </Link>
        </div>

      </div>
    </div>
  );
}

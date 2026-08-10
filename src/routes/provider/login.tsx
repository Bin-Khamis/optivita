import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import logoAsset from "@/assets/optivita-logo.png.asset.json";
import { getStoredProviders } from "@/lib/marketplaceData";

export const Route = createFileRoute("/provider/login")({
  component: ProviderLoginScreen,
});

function ProviderLoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const providers = getStoredProviders();
      
      // Look up provider (simulating database check)
      // Allow custom provider signups, or fallback to default doctor
      const match = providers.find(
        (p) => 
          (p.email && p.email.toLowerCase() === email.toLowerCase()) || 
          (p.id === "prov-101" && email === "doctor@optivita.com")
      );

      if (match) {
        // Set session
        localStorage.setItem("optivita_provider_session", JSON.stringify(match));
        toast.success(`Welcome back, ${match.name}!`);
        navigate({ to: "/provider" });
      } else {
        toast.error("Invalid provider credentials. Try doctor@optivita.com (Password: any).");
      }
      setLoading(false);
    }, 8000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-card rounded-3xl border border-border/60 p-8 space-y-8 shadow-soft">
        {/* Brand Logo & Heading */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-2 bg-white rounded-2xl shadow-sm border border-border/30">
            <img src={logoAsset.url} alt="Optivita" className="h-16 w-16 object-contain" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Provider Portal</span>
            </div>
            <h1 className="text-xl font-display font-black text-foreground">Sign In to Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage your consulting presence and booking slots</p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Email / Phone Number</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@optivita.com"
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Password</label>
              <button
                type="button"
                onClick={() => toast.info("Simulating password recovery email...")}
                className="text-[10px] font-semibold text-accent hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent text-white font-bold text-xs shadow-soft disabled:opacity-50 flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity"
          >
            {loading ? "Authenticating Session..." : "Log In"}
          </button>
        </form>

        {/* Register CTA */}
        <div className="text-center pt-4 border-t border-border/30 space-y-2">
          <p className="text-[11px] text-muted-foreground">Don't have a provider account?</p>
          <Link
            to="/provider/register"
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
          >
            <span>Become an Optivita Provider</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

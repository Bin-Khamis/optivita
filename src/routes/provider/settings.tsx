import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Settings, Lock, Bell, HelpCircle, LogOut } from "lucide-react";

export const Route = createFileRoute("/provider/settings")({
  component: ProviderSettingsPanel,
});

function ProviderSettingsPanel() {
  const navigate = useNavigate();
  const [provider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const [notifBookings, setNotifBookings] = useState(() => {
    if (!provider) return true;
    const raw = localStorage.getItem(`optivita_marketplace_notification_preferences_${provider.id}`);
    if (raw) {
      try { return JSON.parse(raw).inApp; } catch {}
    }
    return true;
  });
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (provider) {
      const prefObj = {
        inApp: notifBookings,
        email: notifMessages,
        push: true,
        whatsapp: notifWeekly,
      };
      localStorage.setItem(`optivita_marketplace_notification_preferences_${provider.id}`, JSON.stringify(prefObj));
    }
    toast.success("Notification preferences saved successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("optivita_provider_session");
    toast.success("Successfully logged out from Provider Portal");
    navigate({ to: "/provider/login" });
  };

  return (
    <div className="max-w-2xl mx-auto rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-soft">
      <div className="space-y-1 pb-4 border-b border-border/30">
        <h2 className="text-lg font-display font-black text-foreground">System Settings</h2>
        <p className="text-[10px] text-muted-foreground">Manage your notification targets and account logout preferences</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Notifications Section */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Bell className="h-4.5 w-4.5 text-accent" />
            Alert Notifications
          </h3>
          <div className="space-y-3.5 pl-6 text-xs text-foreground">
            <div className="flex items-center justify-between">
              <label htmlFor="notifBookings" className="font-semibold cursor-pointer">
                Notify me on new client bookings
              </label>
              <input
                type="checkbox"
                id="notifBookings"
                checked={notifBookings}
                onChange={(e) => setNotifBookings(e.target.checked)}
                className="h-4.5 w-4.5 accent-accent"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="notifMessages" className="font-semibold cursor-pointer">
                Notify me on incoming chat messages
              </label>
              <input
                type="checkbox"
                id="notifMessages"
                checked={notifMessages}
                onChange={(e) => setNotifMessages(e.target.checked)}
                className="h-4.5 w-4.5 accent-accent"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="notifWeekly" className="font-semibold cursor-pointer">
                Receive weekly summary reports of practice earnings
              </label>
              <input
                type="checkbox"
                id="notifWeekly"
                checked={notifWeekly}
                onChange={(e) => setNotifWeekly(e.target.checked)}
                className="h-4.5 w-4.5 accent-accent"
              />
            </div>
          </div>
        </div>

        {/* Security / Help */}
        <div className="space-y-3 pt-4 border-t border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <HelpCircle className="h-4.5 w-4.5 text-accent" />
            Optivita Support
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
            If you need assistance updating your registered SCHS license numbers or bank IBAN details, please contact our administrator support desk at **optivita.support@gmail.com**.
          </p>
        </div>

        {/* Action Button and Logout */}
        <div className="pt-6 border-t border-border/30 flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-soft"
          >
            Save Account Changes
          </button>
        </div>
      </form>
    </div>
  );
}

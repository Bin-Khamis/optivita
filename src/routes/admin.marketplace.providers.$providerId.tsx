import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  DollarSign,
  GraduationCap,
  Award,
  Video,
  MapPin,
  Clock,
  FileText,
  User,
  HeartPulse,
  Activity,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { getStoredProviders, saveProviderToStorage, getStoredServices, getProviderAppointments, getProviderPayouts } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/providers/$providerId")({
  component: AdminProviderDetailView,
});

function AdminProviderDetailView() {
  const { providerId } = Route.useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(() => {
    return getStoredProviders().find((p) => p.id === providerId);
  });

  const services = useMemo(() => {
    return getStoredServices().filter((s) => s.providerId === providerId);
  }, [providerId]);

  const appointments = useMemo(() => {
    return providerId ? getProviderAppointments(providerId) : [];
  }, [providerId]);

  const payouts = useMemo(() => {
    return providerId ? getProviderPayouts(providerId) : [];
  }, [providerId]);

  // Dialog Reason modals
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const handleSetVerification = (status: boolean) => {
    if (!provider) return;
    const updated = { ...provider, verified: status };
    saveProviderToStorage(updated);
    setProvider(updated);
    
    // Log administrative action to Audit Logs
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action: status ? "Approved Provider" : "Revoked Verification",
      entityType: "Provider",
      entityId: provider.id,
      previousState: status ? "Pending" : "Approved",
      newState: status ? "Approved" : "Pending",
      reason: status ? "Credential checklist verified." : "Admin validation checks failed.",
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    toast.success(`Verification status updated successfully!`);
  };

  const handleSuspendProvider = () => {
    if (!provider || !suspendReason.trim()) {
      toast.warning("Please provide a suspension reason.");
      return;
    }

    const updated = { ...provider, name: `${provider.name.replace(" (Suspended)", "")} (Suspended)` };
    saveProviderToStorage(updated);
    setProvider(updated);

    // Audit log
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action: "Suspended Provider",
      entityType: "Provider",
      entityId: provider.id,
      previousState: "Approved",
      newState: "Suspended",
      reason: suspendReason,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    setShowSuspendDialog(false);
    setSuspendReason("");
    toast.error("Provider account suspended.");
  };

  const handleReactivate = () => {
    if (!provider) return;
    const updated = { ...provider, name: provider.name.replace(" (Suspended)", "") };
    saveProviderToStorage(updated);
    setProvider(updated);
    toast.success("Provider account reactivated.");
  };

  if (!provider) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Provider record not found.</p>
        <Link to="/admin/marketplace/providers" className="text-xs text-accent font-bold hover:underline">
          Return to Providers List
        </Link>
      </div>
    );
  }

  const isSuspended = provider.name.includes("(Suspended)");

  return (
    <div className="space-y-8">
      {/* Back button header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link to="/admin/marketplace/providers" className="p-2 border rounded-xl hover:bg-secondary/20">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-xl font-display font-black text-foreground">Provider Credentials Audit</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Validate SCHS licenses, qualification certificates, and payouts ledger</p>
          </div>
        </div>

        {/* Verification Actions */}
        <div className="flex gap-2">
          {isSuspended ? (
            <button
              onClick={handleReactivate}
              className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-soft hover:opacity-95"
            >
              Reactivate Account
            </button>
          ) : (
            <>
              {provider.verified ? (
                <button
                  onClick={() => handleSetVerification(false)}
                  className="px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-600 font-bold text-xs hover:bg-amber-500/10"
                >
                  Revoke Verification
                </button>
              ) : (
                <button
                  onClick={() => handleSetVerification(true)}
                  className="px-5 py-2 rounded-full bg-accent text-white font-bold text-xs shadow-soft hover:opacity-95"
                >
                  Approve Application
                </button>
              )}
              
              <button
                onClick={() => setShowSuspendDialog(true)}
                className="px-4 py-2 rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/15 font-bold text-xs"
              >
                Suspend Provider
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Sections Grid */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Personal, Professional, Certificates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Personal & Contact */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-xs">
            <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b pb-2">
              <User className="h-4.5 w-4.5 text-accent" />
              Personal & Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Display Name</span>
                <span className="font-semibold text-foreground">{provider.name}</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Email Address</span>
                <span className="font-semibold text-foreground">{provider.email || "doctor@optivita.com"}</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Gender / Age</span>
                <span className="font-semibold text-foreground">Female / 32</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Location</span>
                <span className="font-semibold text-foreground">{provider.location}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Professional specs */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-xs">
            <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b pb-2">
              <HeartPulse className="h-4.5 w-4.5 text-accent" />
              Professional details
            </h3>
            <div className="space-y-3.5">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Professional Title</span>
                <span className="font-semibold text-foreground capitalize">{provider.type} Practitioner</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Professional biography</span>
                <p className="text-muted-foreground leading-relaxed italic">“{provider.bio}”</p>
              </div>
            </div>
          </div>

          {/* Card 3: Credentials files list */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-xs">
            <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b pb-2">
              <Award className="h-4.5 w-4.5 text-accent" />
              Credentials Certifications & Licenses
            </h3>

            <div className="space-y-3">
              {[
                { label: "SCHS Medical Registry Certificate", num: "SCHS-902148", expiry: "2028-12-31" },
                { label: "Civil Identity Card Iqama", num: "IQ-2489021", expiry: "2027-06-30" },
                { label: "Clinical Nutrition Bachelor Degree Certificate", num: "KSU-UG-8812", expiry: "Lifetime" },
              ].map((doc, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-secondary/10 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="font-bold text-foreground block">{doc.label}</span>
                    <div className="flex gap-4 text-[9px] text-muted-foreground">
                      <span>Doc Ref: {doc.num}</span>
                      <span>Expiry: {doc.expiry}</span>
                    </div>
                  </div>
                  <span className="text-accent font-bold hover:underline cursor-pointer">
                    View Attachment
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Bank payouts, Bookings, Suspensions details */}
        <aside className="space-y-6">
          {/* Bank Info */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-xs">
            <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b pb-2">
              <CreditCard className="h-4.5 w-4.5 text-accent" />
              Masked Bank details
            </h3>
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold block">Accrued Available Balance</span>
              <p className="text-sm font-black text-foreground">SAR {provider.verified ? "1200" : "0"}</p>
            </div>
            <div className="space-y-1 pt-2 border-t">
              <span className="text-[9px] text-muted-foreground uppercase font-bold block">Registered IBAN</span>
              <p className="font-mono text-foreground font-semibold">SA****************9281</p>
            </div>
          </div>

          {/* Bookings summary */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm text-xs">
            <h3 className="font-bold text-xs text-foreground border-b pb-2">Recent Client Bookings ({appointments.length})</h3>
            <div className="space-y-3.5 max-h-48 overflow-y-auto">
              {appointments.map((a) => (
                <div key={a.id} className="pb-3 border-b border-border/30 last:border-0 last:pb-0 space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>{a.customerName}</span>
                    <span className="text-accent">{a.time}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{a.date}</span>
                    <span>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Suspend modal reason dialog */}
      {showSuspendDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-glow text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Provide Account Suspension Reason
            </h3>
            
            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="State clear reasons for professional account suspension..."
              className="w-full px-3 py-2 border rounded-xl"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSuspendDialog(false)}
                className="px-4 py-2 border rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendProvider}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold"
              >
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, FileText, Check, X, AlertTriangle } from "lucide-react";
import { getStoredProviders, saveProviderToStorage } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/verification")({
  component: AdminVerificationDesk,
});

function AdminVerificationDesk() {
  const [providers, setProviders] = useState(() => getStoredProviders());
  const [auditLog, setAuditLog] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_verification_audit");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return [
      {
        admin: "Sarah Admin",
        action: "Approved Provider",
        date: "09 Aug 2026",
        time: "10:30 AM",
        provider: "Dr. Ahmed Khalid",
        previous: "Under Review",
        new: "Approved",
        reason: "Valid SCHS registration verified.",
      },
    ];
  });

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    providers.find((p) => !p.verified)?.id || null
  );
  
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const pendingProviders = providers.filter((p) => !p.verified);

  const logAudit = (action: string, prevStatus: string, nextStatus: string, providerName: string, reason: string) => {
    const newLog = {
      admin: "John Admin",
      action,
      date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      provider: providerName,
      previous: prevStatus,
      new: nextStatus,
      reason,
    };
    const updatedLogs = [newLog, ...auditLog];
    setAuditLog(updatedLogs);
    localStorage.setItem("optivita_verification_audit", JSON.stringify(updatedLogs));

    // Also write to general admin marketplace audit log
    const rawGeneral = localStorage.getItem("optivita_marketplace_audit_logs");
    let generalLogs = [];
    if (rawGeneral) {
      try { generalLogs = JSON.parse(rawGeneral); } catch {}
    }
    generalLogs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action,
      entityType: "Provider",
      entityId: selectedProviderId || "unknown",
      previousState: prevStatus,
      newState: nextStatus,
      reason,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(generalLogs));
  };

  const handleApprove = () => {
    if (!selectedProvider) return;
    
    const updated = { ...selectedProvider, verified: true };
    saveProviderToStorage(updated);
    
    const updatedList = getStoredProviders();
    setProviders(updatedList);
    
    logAudit("Approved Provider", "Pending Audit", "Approved", selectedProvider.name, "All credentials verified successfully.");
    
    const nextPending = updatedList.find((p) => !p.verified);
    setSelectedProviderId(nextPending ? nextPending.id : null);
    
    toast.success(`${selectedProvider.name} is now a Verified Optivita Provider!`);
  };

  const handleReject = () => {
    if (!selectedProvider || !rejectReason.trim()) {
      toast.warning("Please provide a rejection reason.");
      return;
    }
    
    logAudit("Rejected Provider Credentials", "Pending Audit", "Rejected", selectedProvider.name, rejectReason);
    
    setShowRejectDialog(false);
    setRejectReason("");
    
    const nextPending = providers.filter((p) => p.id !== selectedProviderId).find((p) => !p.verified);
    setSelectedProviderId(nextPending ? nextPending.id : null);
    
    toast.error(`Application rejected: ${rejectReason}`);
  };

  const handleRequestMoreInfo = () => {
    if (!selectedProvider) return;
    logAudit("Requested Information Update", "Pending Audit", "Pending Info", selectedProvider.name, "Awaiting document clarifications.");
    toast.info(`Information request message dispatched to ${selectedProvider.name}.`);
  };

  // Determine if SCHS registration is required based on type
  const isSchsRequired = selectedProvider?.type === "dietitian" || selectedProvider?.type === "nutritionist";

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Verification desk</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Moderate professional licensing files, SCHS records, and academic credentials</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Pending review queue */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-foreground">Awaiting Review ({pendingProviders.length})</h3>
          
          <div className="space-y-3">
            {pendingProviders.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProviderId(p.id)}
                className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                  selectedProviderId === p.id
                    ? "bg-accent/15 border-accent shadow-sm"
                    : "bg-card border-border/60 hover:bg-secondary/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary/45 flex items-center justify-center font-bold">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-foreground block">{p.name}</span>
                    <span className="text-[9px] text-muted-foreground capitalize">{p.type}</span>
                  </div>
                </div>
                <span className="text-[8px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded">
                  Pending Audit
                </span>
              </button>
            ))}
            {pendingProviders.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">All provider applications are fully verified! 🎉</p>
            )}
          </div>
        </div>

        {/* Center/Right Column: Selected provider review documents */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProvider ? (
            <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-6 shadow-soft">
              <div className="flex justify-between items-start border-b pb-4">
                <div className="flex gap-3">
                  <img
                    src={selectedProvider.avatar}
                    alt={selectedProvider.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{selectedProvider.name}</h3>
                    <span className="text-[10px] text-muted-foreground capitalize">{selectedProvider.type}</span>
                  </div>
                </div>
                
                {/* Actions row */}
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRequestMoreInfo()}
                    className="px-3.5 py-1.5 rounded-xl border border-border/60 hover:bg-secondary text-xs font-bold"
                  >
                    Request Info
                  </button>
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/15 text-xs font-bold flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Documents Audit Checklist */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-muted-foreground block font-display">Uploaded Credentials Checklist</span>
                
                <div className="space-y-3.5">
                  {/* SCHS check if required */}
                  {isSchsRequired && (
                    <div className="p-4 border border-border/60 rounded-2xl bg-amber-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground leading-none">Clinical License (SCHS Accreditation)</h4>
                          <span className="text-[8px] text-amber-600 font-bold mt-1 block">CRITICAL REQUIREMENT: Mandatory SCHS Registration</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-accent cursor-pointer hover:underline">
                        Audit File
                      </span>
                    </div>
                  )}

                  <div className="p-4 border rounded-2xl bg-secondary/15 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-none">Academic Qualifications Degrees</h4>
                        <span className="text-[8px] text-muted-foreground mt-1 block">University credentials check</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-accent cursor-pointer hover:underline">
                      Audit File
                    </span>
                  </div>

                  <div className="p-4 border rounded-2xl bg-secondary/15 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-none">Civil Identity Document (Iqama/National ID)</h4>
                        <span className="text-[8px] text-muted-foreground mt-1 block">Identity verification file</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-accent cursor-pointer hover:underline">
                      Audit File
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl border border-border/60 bg-card text-center text-muted-foreground py-16">
              Select a provider from the pending queue to inspect documentation files.
            </div>
          )}

          {/* Audit History Logs */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-4 shadow-sm">
            <h3 className="font-bold text-xs text-foreground border-b pb-2">Verification Audit Log</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {auditLog.map((log, idx) => (
                <div key={idx} className="p-3 border rounded-xl bg-secondary/10 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-[10px] text-muted-foreground">
                    <span>Admin: {log.admin}</span>
                    <span>{log.date} at {log.time}</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>Action: <strong className="text-accent">{log.action}</strong> ({log.provider})</span>
                    <span className="font-bold">{log.previous} ➔ {log.new}</span>
                  </div>
                  {log.reason && (
                    <p className="text-[10px] text-muted-foreground italic pt-1 leading-relaxed">
                      Reason: {log.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reject dialog reason input */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-glow">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Provide Rejection Reason
            </h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Detail reasons for credential rejection (e.g. invalid SCHS registration format)..."
              className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

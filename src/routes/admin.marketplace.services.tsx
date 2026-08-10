import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldAlert, Check, X, Ban, Video, MapPin, AlertTriangle } from "lucide-react";
import { getStoredServices, saveServiceToStorage, getStoredProviders } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/services")({
  component: AdminServicesModeration,
});

function AdminServicesModeration() {
  const [services, setServices] = useState(() => getStoredServices());
  const [providers] = useState(() => getStoredProviders());
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Rejection Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectServiceId, setRejectServiceId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const enrichedServices = useMemo(() => {
    return services.map((srv) => {
      const providerObj = providers.find((p) => p.id === srv.providerId);
      return {
        ...srv,
        providerName: providerObj?.name || "Unknown Provider",
        providerAvatar: providerObj?.avatar,
      };
    });
  }, [services, providers]);

  const filteredServices = useMemo(() => {
    return enrichedServices.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.providerName.toLowerCase().includes(search.toLowerCase());

      const status = s.id.startsWith("srv-custom") ? "Pending Review" : "Approved";
      const matchStatus = statusFilter === "all" || status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [enrichedServices, search, statusFilter]);

  const createAuditRecord = (action: string, entityId: string, prev: string, next: string, reason: string) => {
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action,
      entityType: "Service",
      entityId,
      previousState: prev,
      newState: next,
      reason,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));
  };

  const handleApproveService = (id: string) => {
    // Audit Log entry
    createAuditRecord("Approved Service", id, "Pending Review", "Approved", "Meets marketplace listing standards.");
    toast.success("Service listing approved and published!");
  };

  const handleRejectService = () => {
    if (!rejectServiceId || !rejectReason.trim()) {
      toast.warning("Rejection reason is required.");
      return;
    }
    
    // Audit Log entry
    createAuditRecord("Rejected Service", rejectServiceId, "Pending Review", "Rejected", rejectReason);
    
    setShowRejectDialog(false);
    setRejectReason("");
    setRejectServiceId(null);
    toast.error("Service listing rejected and returned to provider draft.");
  };

  const handleSuspendService = (id: string) => {
    createAuditRecord("Suspended Service", id, "Approved", "Suspended", "Temporary suspension due to compliance review.");
    toast.warning("Service listing temporarily suspended from marketplace.");
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Service Moderation Directory</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Moderate consulting service listings, pricing models, and session coverages</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service title, provider name..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border rounded-xl text-xs bg-card border-border/60 focus:outline-none"
        >
          <option value="all">All Moderation Status</option>
          <option value="approved">Approved & Published</option>
          <option value="pending review">Pending Moderation</option>
        </select>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
              <th className="p-4">Service Details</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Price</th>
              <th className="p-4">Consultation Mode</th>
              <th className="p-4">Moderation Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.map((s) => {
              const mockStatus = s.id.startsWith("srv-custom") ? "Pending Review" : "Approved";
              return (
                <tr key={s.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-foreground block">{s.title}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{s.id}</span>
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    <img src={s.providerAvatar} alt={s.providerName} className="h-6.5 w-6.5 rounded-full object-cover" />
                    <span className="font-semibold text-foreground">{s.providerName}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{s.duration} mins</td>
                  <td className="p-4 font-black text-foreground">SAR {s.price}</td>
                  <td className="p-4">
                    {s.type === "online" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <Video className="h-3.5 w-3.5" />
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sky-600 font-medium">
                        <MapPin className="h-3.5 w-3.5" />
                        In-Person
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {mockStatus === "Approved" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-bold">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-bold animate-pulse">
                        Pending Review
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {mockStatus === "Pending Review" && (
                        <>
                          <button
                            onClick={() => handleApproveService(s.id)}
                            className="p-1.5 rounded border hover:bg-secondary text-emerald-600"
                            title="Approve Listing"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setRejectServiceId(s.id);
                              setShowRejectDialog(true);
                            }}
                            className="p-1.5 rounded border hover:bg-red-50 text-red-500"
                            title="Reject Listing"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {mockStatus === "Approved" && (
                        <button
                          onClick={() => handleSuspendService(s.id)}
                          className="p-1.5 rounded border hover:bg-red-50 text-red-500"
                          title="Suspend Listing"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredServices.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No service listings found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject dialog reason input */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-glow text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Provide Service Rejection Reason
            </h3>
            
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="State clear reasons for rejecting service listing (e.g. unclear details)..."
              className="w-full px-3 py-2 border rounded-xl"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectServiceId(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 border rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectService}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold"
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

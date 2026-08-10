import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Scale, Check, X, ShieldAlert, AlertTriangle, Eye, CornerDownRight } from "lucide-react";

export const Route = createFileRoute("/admin/marketplace/disputes")({
  component: AdminDisputesDesk,
});

function AdminDisputesDesk() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  
  // Modal reason states
  const [decisionReason, setDecisionReason] = useState("");
  const [customRefundAmount, setCustomRefundAmount] = useState("");
  const [actionType, setActionType] = useState<"favor_customer" | "favor_provider" | "reject" | "partial">("favor_customer");

  const [disputes, setDisputes] = useState<any[]>(() => {
    const raw = localStorage.getItem("optivita_marketplace_disputes");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const initial = [
      {
        id: "DIS-701",
        bookingId: "APT-801",
        customerName: "Fahad Khalid",
        providerName: "Dr. Ahmed Khalid",
        providerId: "prov-101",
        amount: 150,
        reason: "Provider did not join the online session call link.",
        evidenceCustomer: "Waited 20 minutes in video room. Screenshot uploaded.",
        evidenceProvider: "Had emergency hospital check-up call.",
        status: "Open",
        date: "2026-08-08",
      },
      {
        id: "DIS-702",
        bookingId: "APT-802",
        customerName: "Amal Al-Otaibi",
        providerName: "Sarah Al-Ghamdi",
        providerId: "prov-102",
        amount: 250,
        reason: "Discontent with diet recommendation details.",
        evidenceCustomer: "Sent generic layout sheet, did not address my custom goals.",
        evidenceProvider: "The plan addresses all metabolic targets requested in form.",
        status: "Under Review",
        date: "2026-08-07",
      },
    ];
    localStorage.setItem("optivita_marketplace_disputes", JSON.stringify(initial));
    return initial;
  });

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const matchSearch =
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        d.providerName.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || d.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [disputes, search, statusFilter]);

  const createAuditRecord = (action: string, entityId: string, prev: string, next: string, reason: string) => {
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    const newLog = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "John Admin",
      action,
      entityType: "Dispute",
      entityId,
      previousState: prev,
      newState: next,
      reason,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));
  };

  const createTransactionRecord = (bookingId: string, providerId: string, type: string, amount: number) => {
    const raw = localStorage.getItem("optivita_marketplace_transactions");
    let txns = [];
    if (raw) {
      try { txns = JSON.parse(raw); } catch {}
    }
    const commission = amount * 0.15;
    const net = amount - commission;
    const newTx = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      bookingId,
      customerName: selectedDispute?.customerName || "Customer",
      providerName: selectedDispute?.providerName || "Provider",
      providerId,
      type,
      gross: -amount,
      commission: -commission,
      net: -net,
      status: "Cleared",
      date: new Date().toISOString().split("T")[0],
    };
    txns.unshift(newTx);
    localStorage.setItem("optivita_marketplace_transactions", JSON.stringify(txns));
  };

  const handleResolveDecision = () => {
    if (!selectedDispute || !decisionReason.trim()) {
      toast.warning("Decision reason is required.");
      return;
    }

    let finalStatus = "Resolved";
    let refundVal = 0;

    if (actionType === "favor_customer") {
      refundVal = selectedDispute.amount;
      toast.success("Full refund issued to customer wallet.");
    } else if (actionType === "partial") {
      refundVal = Number(customRefundAmount);
      if (isNaN(refundVal) || refundVal <= 0 || refundVal > selectedDispute.amount) {
        toast.error("Invalid partial refund amount.");
        return;
      }
      toast.success(`Partial refund of SAR ${refundVal} processed.`);
    } else if (actionType === "favor_provider") {
      toast.success("Resolved in provider favor. Payout remains valid.");
    } else {
      finalStatus = "Rejected";
      toast.error("Dispute ticket rejected.");
    }

    // Update disputes list
    const updated = disputes.map((d) => {
      if (d.id === selectedDispute.id) {
        return { ...d, status: finalStatus };
      }
      return d;
    });
    setDisputes(updated);
    localStorage.setItem("optivita_marketplace_disputes", JSON.stringify(updated));

    // Write audit log
    createAuditRecord(
      `Resolved Dispute ${selectedDispute.id}`,
      selectedDispute.id,
      selectedDispute.status,
      finalStatus,
      decisionReason
    );

    // Create transaction reversing records if refunded
    if (refundVal > 0) {
      createTransactionRecord(selectedDispute.bookingId, selectedDispute.providerId, "Refund", refundVal);
      
      // Save refund record to localStorage refunds namespace too!
      const rawRefunds = localStorage.getItem("optivita_marketplace_refunds");
      let refunds = [];
      if (rawRefunds) {
        try { refunds = JSON.parse(rawRefunds); } catch {}
      }
      refunds.unshift({
        id: `REF-${Math.floor(800 + Math.random() * 200)}`,
        bookingId: selectedDispute.bookingId,
        customerName: selectedDispute.customerName,
        providerName: selectedDispute.providerName,
        originalAmount: selectedDispute.amount,
        refundAmount: refundVal,
        reason: decisionReason,
        status: "Completed",
        date: new Date().toISOString().split("T")[0],
      });
      localStorage.setItem("optivita_marketplace_refunds", JSON.stringify(refunds));
    }

    setSelectedDispute(null);
    setDecisionReason("");
    setCustomRefundAmount("");
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Disputes & Resolution Desk</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Moderate complaints raised by customers and perform transaction reversals</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Tickets list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3 justify-between">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Dispute ID, Client, Provider..."
              className="flex-grow max-w-sm px-3.5 py-2 border rounded-xl text-xs bg-card focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 border rounded-xl text-xs bg-card focus:outline-none"
            >
              <option value="all">All Dispute Status</option>
              <option value="open">Open</option>
              <option value="under review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredDisputes.map((d) => (
              <div key={d.id} className="p-5 rounded-2xl border border-border/60 bg-card space-y-3.5 shadow-sm">
                <div className="flex justify-between items-center text-xs pb-2 border-b">
                  <span className="font-mono font-bold text-foreground">{d.id}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    d.status === "Resolved"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : d.status === "Rejected"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-amber-500/10 text-amber-600 animate-pulse"
                  }`}>
                    {d.status}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold block">Client</span>
                    <span className="font-bold text-foreground">{d.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold block">Provider</span>
                    <span className="font-bold text-foreground">{d.providerName}</span>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Complaint Issue</span>
                  <p className="text-foreground font-semibold leading-relaxed">“{d.reason}”</p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                  <span className="text-xs font-black text-accent">SAR {d.amount}</span>
                  <button
                    onClick={() => setSelectedDispute(d)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inspect Evidence</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Decisions Drawer */}
        <aside className="space-y-6">
          {selectedDispute ? (
            <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-5 shadow-soft animate-scale-up text-xs">
              <h3 className="font-bold text-sm text-foreground border-b pb-2">Dispute Evidence Audit</h3>
              
              <div className="space-y-3 leading-normal">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Customer Claim Evidence</span>
                  <p className="italic text-foreground">“{selectedDispute.evidenceCustomer}”</p>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Provider Defense Response</span>
                  <p className="italic text-foreground">“{selectedDispute.evidenceProvider}”</p>
                </div>
              </div>

              {selectedDispute.status !== "Resolved" && selectedDispute.status !== "Rejected" && (
                <div className="pt-4 border-t space-y-4">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Decision Action</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button
                      onClick={() => setActionType("favor_customer")}
                      className={`p-2 rounded-xl border text-center font-bold ${
                        actionType === "favor_customer" ? "bg-accent border-accent text-white" : "bg-secondary/20"
                      }`}
                    >
                      Favor Customer
                    </button>
                    <button
                      onClick={() => setActionType("favor_provider")}
                      className={`p-2 rounded-xl border text-center font-bold ${
                        actionType === "favor_provider" ? "bg-accent border-accent text-white" : "bg-secondary/20"
                      }`}
                    >
                      Favor Provider
                    </button>
                    <button
                      onClick={() => setActionType("partial")}
                      className={`p-2 rounded-xl border text-center font-bold ${
                        actionType === "partial" ? "bg-accent border-accent text-white" : "bg-secondary/20"
                      }`}
                    >
                      Partial Refund
                    </button>
                    <button
                      onClick={() => setActionType("reject")}
                      className={`p-2 rounded-xl border text-center font-bold ${
                        actionType === "reject" ? "bg-accent border-accent text-white" : "bg-secondary/20"
                      }`}
                    >
                      Reject Claim
                    </button>
                  </div>

                  {actionType === "partial" && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase">Partial Refund (SAR)</label>
                      <input
                        type="number"
                        value={customRefundAmount}
                        onChange={(e) => setCustomRefundAmount(e.target.value)}
                        placeholder="e.g. 75"
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Decision Reason Notes</label>
                    <textarea
                      rows={2}
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      placeholder="Audit justification for historical logs..."
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>

                  <button
                    onClick={handleResolveDecision}
                    className="w-full py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-soft"
                  >
                    Submit Decision
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-3xl border border-dashed text-center text-muted-foreground py-16 text-xs">
              Select a dispute ticket from the left panel to inspect customer claims and submit decisions.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

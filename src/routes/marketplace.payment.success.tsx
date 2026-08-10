import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CheckCircle, FileText, Share2, MessageSquare, ArrowRight } from "lucide-react";
import { getActivePaymentGateway } from "@/lib/paymentGateway";
import { getStoredProviders, getProviderAppointments, saveProviderAppointments } from "@/lib/marketplaceData";

interface SuccessSearchSchema {
  session_id?: string;
}

export const Route = createFileRoute("/marketplace/payment/success")({
  component: PaymentSuccessCallback,
  validateSearch: (search: Record<string, unknown>): SuccessSearchSchema => {
    return {
      session_id: search.session_id as string | undefined,
    };
  },
});

function PaymentSuccessCallback() {
  const { session_id } = useSearch({ from: "/marketplace/payment/success" });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionDetails, setSessionDetails] = useState<any | null>(null);

  useEffect(() => {
    if (!session_id) {
      setErrorMsg("Missing payment session token.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const gateway = getActivePaymentGateway();
        const { success: isPaid, session } = await gateway.verifyPayment(session_id);
        
        if (!isPaid) {
          setErrorMsg("Payment session has expired or failed verification checks.");
          setLoading(false);
          return;
        }

        // Idempotency Check: Verify if booking already recorded
        const providerId = session.providerId;
        const bookingRef = session.bookingReference;
        const providerApts = getProviderAppointments(providerId);
        
        const exists = providerApts.some((a) => a.id === bookingRef);
        if (exists) {
          // Already created, safe to skip duplicate creation
          setSessionDetails(session);
          setSuccess(true);
          setLoading(false);
          return;
        }

        // Fetch provider to get details
        const providers = getStoredProviders();
        const provider = providers.find((p) => p.id === providerId);
        if (!provider) {
          setErrorMsg("Provider details not found.");
          setLoading(false);
          return;
        }

        // Resolve commission rate dynamically
        const rawCommissions = localStorage.getItem("optivita_marketplace_commissions");
        let ratesObj: Record<string, number> = { nutritionist: 15, dietitian: 15, trainer: 12, coach: 12, gym: 10, wellness: 15 };
        if (rawCommissions) {
          try { ratesObj = JSON.parse(rawCommissions); } catch {}
        }
        const rate = ratesObj[provider.type.toLowerCase()] || 15;
        const commissionVal = session.amount * (rate / 100);
        const providerShare = session.amount - commissionVal;

        // Post-Payment 1: Create transaction record in marketplace ledger
        const rawLedger = localStorage.getItem("optivita_marketplace_transactions");
        let ledger = [];
        if (rawLedger) {
          try { ledger = JSON.parse(rawLedger); } catch {}
        }
        ledger.unshift({
          id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          bookingId: bookingRef,
          customerName: "Marketplace Customer",
          providerName: provider.name,
          providerId: provider.id,
          type: "Booking Payment",
          gross: session.amount,
          commission: commissionVal,
          net: providerShare,
          status: "Cleared",
          date: new Date().toISOString().split("T")[0],
        });
        localStorage.setItem("optivita_marketplace_transactions", JSON.stringify(ledger));

        // Post-Payment 2: Add appointment to provider's schedules list
        providerApts.unshift({
          id: bookingRef,
          customerName: "Marketplace Customer",
          serviceTitle: `Marketplace Session (Ref: ${session.serviceId})`,
          date: new Date().toISOString().split("T")[0], // Today
          time: "11:00 AM",
          duration: 45,
          type: "online",
          status: "Upcoming",
        });
        saveProviderAppointments(providerId, providerApts);

        // Post-Payment 3: Log administrative action in Audit log
        const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
        let logs = [];
        if (rawLogs) {
          try { logs = JSON.parse(rawLogs); } catch {}
        }
        logs.unshift({
          id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
          adminId: "Marketplace Gateway",
          action: "Confirmed Payment Session",
          entityType: "Booking",
          entityId: bookingRef,
          previousState: "Pending",
          newState: "Upcoming",
          reason: "Payment verified successfully via gateway redirect.",
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

        setSessionDetails(session);
        setSuccess(true);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed during payment verification.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [session_id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-muted-foreground">Verifying payment gateway transaction reference...</p>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-4">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-3xl inline-block">
          <span className="font-bold text-sm block">Verification Error</span>
          <p className="text-xs mt-1">{errorMsg}</p>
        </div>
        <div className="pt-4">
          <Link to="/marketplace" className="text-xs text-accent font-bold hover:underline">
            Return to Marketplace Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 animate-scale-up">
      <div className="rounded-3xl border border-border/60 bg-card p-8 text-center space-y-8 shadow-soft">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
              Paid
            </span>
            <h1 className="text-2xl font-display font-black text-foreground">Booking Confirmed! 🎉</h1>
          </div>
        </div>

        {/* Receipt Box */}
        <div className="rounded-2xl bg-secondary/25 border border-border/50 p-5 text-left space-y-3.5 text-xs">
          <div className="flex justify-between pb-2 border-b border-border/30">
            <span className="text-muted-foreground">Booking Reference</span>
            <span className="font-bold text-foreground font-mono">{sessionDetails.bookingReference}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-border/30">
            <span className="text-muted-foreground">Payment ID</span>
            <span className="font-bold text-foreground font-mono">{sessionDetails.paymentSessionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expert ID</span>
            <span className="font-bold text-foreground font-mono">{sessionDetails.providerId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-bold text-foreground uppercase">{sessionDetails.paymentMethod}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border/30">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-black text-accent text-sm">SAR {sessionDetails.amount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 text-xs">
          <Link
            to="/portal/appointments"
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-soft hover:opacity-90 flex items-center justify-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            <span>View Appointment in Portal</span>
          </Link>
          
          <Link
            to="/marketplace"
            className="text-xs font-bold text-muted-foreground hover:text-accent transition-colors"
          >
            Back to Marketplace Home
          </Link>
        </div>
      </div>
    </div>
  );
}

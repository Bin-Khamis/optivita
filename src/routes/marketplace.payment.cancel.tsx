import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/marketplace/payment/cancel")({
  component: PaymentCancelCallback,
});

function PaymentCancelCallback() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center animate-scale-up">
      <div className="rounded-3xl border border-border/60 bg-card p-8 space-y-6 shadow-soft text-xs">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <AlertCircle className="h-10 w-10" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-xl font-display font-black text-foreground">Checkout Cancelled</h2>
          <p className="text-muted-foreground leading-relaxed">
            You canceled the payment session. The temporary appointment slot reservation has been released.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/marketplace"
            className="w-full py-3 rounded-full bg-accent text-white font-bold block text-center"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

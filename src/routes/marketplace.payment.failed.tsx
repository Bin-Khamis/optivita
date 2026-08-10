import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/marketplace/payment/failed")({
  component: PaymentFailedCallback,
});

function PaymentFailedCallback() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center animate-scale-up">
      <div className="rounded-3xl border border-border/60 bg-card p-8 space-y-6 shadow-soft text-xs">
        <div className="h-16 w-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <XCircle className="h-10 w-10" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-xl font-display font-black text-foreground">Payment Failed</h2>
          <p className="text-muted-foreground leading-relaxed">
            The payment gateway declined this transaction. Please verify card details or choose a different payment method.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/marketplace"
            className="flex-1 py-3 rounded-full bg-accent text-white font-bold text-center"
          >
            Retry Checkout
          </Link>
          <Link
            to="/marketplace"
            className="flex-1 py-3 rounded-full border border-border/60 hover:bg-secondary/20 font-bold text-center"
          >
            Cancel Order
          </Link>
        </div>
      </div>
    </div>
  );
}

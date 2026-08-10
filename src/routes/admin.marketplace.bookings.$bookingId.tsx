import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ArrowLeft, User, DollarSign, Calendar, Clock, Video, MapPin, AlertCircle, RotateCcw } from "lucide-react";
import { getStoredProviders, getProviderAppointments, saveProviderAppointments } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/bookings/$bookingId")({
  component: AdminBookingDetailView,
});

function AdminBookingDetailView() {
  const { bookingId } = Route.useParams();
  const [providers] = useState(() => getStoredProviders());

  // Search booking across all providers
  const [booking, setBooking] = useState<any>(() => {
    let match = null;
    providers.forEach((prov) => {
      const apts = getProviderAppointments(prov.id);
      const found = apts.find((a) => a.id === bookingId);
      if (found) {
        match = {
          ...found,
          providerId: prov.id,
          providerName: prov.name,
          amount: 150, // Mock base cost
          commission: 22.5,
          earnings: 127.5,
          paymentStatus: found.status === "Completed" ? "Paid" : "Pending",
        };
      }
    });
    return match;
  });

  const handleRefund = () => {
    if (!booking) return;

    if (confirm("Are you sure you want to process a refund for this booking?")) {
      const updatedBooking = { ...booking, status: "Refunded", paymentStatus: "Refunded" };
      setBooking(updatedBooking);

      // Save to localStorage provider appointments
      const providerApts = getProviderAppointments(booking.providerId);
      const updatedProviderApts = providerApts.map((a) => {
        if (a.id === bookingId) {
          return { ...a, status: "Refunded" };
        }
        return a;
      });
      saveProviderAppointments(booking.providerId, updatedProviderApts);

      toast.success("Transaction refund processed successfully!");
    }
  };

  if (!booking) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Booking details record not found.</p>
        <Link to="/admin/marketplace/bookings" className="text-xs text-accent font-bold hover:underline">
          Return to Bookings Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button title */}
      <div className="flex items-center gap-3 pb-5 border-b border-border/40">
        <Link to="/admin/marketplace/bookings" className="p-2 border rounded-xl hover:bg-secondary/20">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Booking Details Audit</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction invoices, commissions splits, and cancel sessions</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Transaction / Session specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Customer & Provider */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-5 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Customer */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-accent" />
                  Client details
                </span>
                <p className="text-xs font-bold text-foreground">{booking.customerName}</p>
                <p className="text-[10px] text-muted-foreground">Registered Marketplace Customer</p>
              </div>

              {/* Provider */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-accent" />
                  Provider Details
                </span>
                <p className="text-xs font-bold text-foreground">{booking.providerName}</p>
                <p className="text-[10px] text-muted-foreground">Verified Optivita Provider</p>
              </div>
            </div>
          </div>

          {/* Card 2: Service & Date */}
          <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-5 shadow-sm">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Consultation Service</span>
              <h3 className="font-bold text-sm text-foreground">{booking.serviceTitle}</h3>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-3 border-t border-border/30 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Date</span>
                <p className="font-semibold text-foreground">{booking.date}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Time</span>
                <p className="font-semibold text-foreground">{booking.time}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Mode</span>
                <div className="flex items-center gap-1">
                  {booking.type === "online" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <Video className="h-4 w-4" />
                      Online call
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sky-600 font-semibold">
                      <MapPin className="h-4 w-4" />
                      In-Person visit
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial ledger summary */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-6 shadow-sm">
          <h3 className="font-bold text-xs text-foreground pb-3 border-b border-border/30">Financial Invoice</h3>
          
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session Base Price</span>
              <span className="font-semibold text-foreground">SAR {booking.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Optivita Commission (15%)</span>
              <span className="font-semibold text-red-500">-SAR {booking.commission}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-border/30">
              <span className="text-muted-foreground">Provider share (85%)</span>
              <span className="font-black text-foreground">SAR {booking.earnings}</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-border/30 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking Status</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                booking.status === "Completed"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : booking.status === "Cancelled" || booking.status === "Refunded"
                  ? "bg-red-500/10 text-red-600"
                  : "bg-sky-500/10 text-sky-600"
              }`}>
                {booking.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status</span>
              <span className="font-bold text-foreground capitalize">{booking.paymentStatus}</span>
            </div>
          </div>

          {/* Refund Trigger button */}
          {booking.status !== "Refunded" && booking.status !== "Cancelled" && (
            <div className="pt-4 border-t border-border/30">
              <button
                onClick={handleRefund}
                className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Process Refund</span>
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Eye, RefreshCw, XCircle, CheckCircle, RotateCcw, X, Clock, User, Calendar, Video, MapPin } from "lucide-react";
import { getStoredProviders, getProviderAppointments, saveProviderAppointments } from "@/lib/marketplaceData";
import { LoyaltyService } from "@/services/loyaltyService";

export const Route = createFileRoute("/admin/marketplace/bookings")({
  component: AdminBookingsManagement,
});

function AdminBookingsManagement() {
  const [providers] = useState(() => getStoredProviders());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Selected booking state for detail drawer audit
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Aggregate bookings across all providers
  const [bookings, setBookings] = useState<any[]>(() => {
    let list: any[] = [];
    providers.forEach((prov) => {
      const appointments = getProviderAppointments(prov.id).map((apt) => ({
        ...apt,
        providerId: prov.id,
        providerName: prov.name,
        amount: 150,
        commission: 22.5,
        earnings: 127.5,
        paymentStatus: apt.status === "Completed" ? "Paid" : "Pending",
      }));
      list = [...list, ...appointments];
    });
    return list;
  });

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.providerName.toLowerCase().includes(search.toLowerCase()) ||
        b.serviceTitle.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || b.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [bookings, search, statusFilter]);

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
      entityType: "Booking",
      entityId,
      previousState: prev,
      newState: next,
      reason,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));
  };

  const handleCompleteBooking = async (id: string, providerId: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    if (booking.status === "Completed") {
      toast.warning("This booking is already completed.");
      return;
    }

    const updated = bookings.map((b) => {
      if (b.id === id) {
        return { ...b, status: "Completed", paymentStatus: "Paid" };
      }
      return b;
    });
    setBookings(updated);

    // Save status
    const providerApts = getProviderAppointments(providerId);
    const updatedProviderApts = providerApts.map((a) => {
      if (a.id === id) {
        return { ...a, status: "Completed" };
      }
      return a;
    });
    saveProviderAppointments(providerId, updatedProviderApts);

    createAuditRecord("Completed Booking", id, booking.status, "Completed", "Session successfully marked completed by admin.");

    // Evaluate Loyalty Event trigger
    const customerId = booking.customerId || "OPT-2026-001001";
    const result = await LoyaltyService.processEvent({
      eventId: `${booking.isCorporate ? "CORPORATE_BOOKING_COMPLETED" : "BOOKING_COMPLETED"}:${id}`,
      eventType: booking.isCorporate ? "CORPORATE_BOOKING_COMPLETED" : "BOOKING_COMPLETED",
      customerId,
      referenceId: id,
      referenceType: "Booking",
      source: booking.isCorporate ? "CORPORATE" : "MARKETPLACE",
      metadata: {
        coPaymentAmount: booking.coPaymentAmount,
        corporateBenefitAmount: booking.corporateBenefitAmount,
        isCorporate: booking.isCorporate,
      },
      occurredAt: new Date().toISOString(),
    });

    if (result === "already_processed") {
      toast.info("Points already processed for this booking completion.");
    } else if (result === "success") {
      toast.success("Booking completed and loyalty rewards processed!");
    } else {
      toast.error("Booking marked completed, but loyalty evaluations failed.");
    }
    
    setSelectedBooking(null);
  };

  const handleRefund = (id: string, providerId: string) => {
    if (confirm("Are you sure you want to process a full refund for this booking?")) {
      const updated = bookings.map((b) => {
        if (b.id === id) {
          return { ...b, status: "Refunded", paymentStatus: "Refunded" };
        }
        return b;
      });
      setBookings(updated);

      // Save to localStorage provider appointments
      const providerApts = getProviderAppointments(providerId);
      const updatedProviderApts = providerApts.map((a) => {
        if (a.id === id) {
          return { ...a, status: "Refunded" };
        }
        return a;
      });
      saveProviderAppointments(providerId, updatedProviderApts);

      // Create Audit Log
      createAuditRecord("Approved Refund", id, "Completed", "Refunded", "Client dispute resolution request refund.");

      // Create Transaction Reversal
      const rawTxns = localStorage.getItem("optivita_marketplace_transactions");
      let txns = [];
      if (rawTxns) {
        try { txns = JSON.parse(rawTxns); } catch {}
      }
      txns.unshift({
        id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        bookingId: id,
        customerName: selectedBooking?.customerName || "Customer",
        providerName: selectedBooking?.providerName || "Provider",
        providerId,
        type: "Refund",
        gross: -150,
        commission: -22.5,
        net: -127.5,
        status: "Cleared",
        date: new Date().toISOString().split("T")[0],
      });
      localStorage.setItem("optivita_marketplace_transactions", JSON.stringify(txns));

      // Evaluate Loyalty Event points reversal
      const customerId = selectedBooking?.customerId || "OPT-2026-001001";
      LoyaltyService.processEvent({
        eventId: `BOOKING_REFUNDED:${id}`,
        eventType: "BOOKING_REFUNDED",
        customerId,
        referenceId: id,
        referenceType: "Booking",
        source: "MARKETPLACE",
        occurredAt: new Date().toISOString(),
      }).then((result) => {
        if (result === "already_processed") {
          console.log("Loyalty refund reversal points already deducted.");
        } else {
          toast.info("Loyalty points refund reversal transaction processed.");
        }
      });

      toast.success("Full refund has been processed back to customer's wallet.");
      setSelectedBooking(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Appointments & Bookings Logs</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction invoices, commission splits, and complete refunds</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Bookings list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3 justify-between">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Booking ID, Client, Provider..."
              className="flex-grow max-w-sm px-3.5 py-2 border rounded-xl text-xs bg-card focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 border rounded-xl text-xs bg-card focus:outline-none"
            >
              <option value="all">All Booking Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                    <td className="p-4 font-mono font-bold text-foreground">{b.id}</td>
                    <td className="p-4 font-semibold text-foreground">{b.customerName}</td>
                    <td className="p-4 text-muted-foreground">{b.providerName}</td>
                    <td className="p-4 font-bold text-foreground">SAR {b.amount}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        b.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : b.status === "Cancelled" || b.status === "Refunded"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-sky-500/10 text-sky-600"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 rounded border hover:bg-secondary text-accent"
                          title="Audit Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {b.status !== "Refunded" && b.status !== "Cancelled" && (
                          <button
                            onClick={() => handleRefund(b.id, b.providerId)}
                            className="p-1.5 rounded border hover:bg-red-50 text-red-500"
                            title="Process Refund"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Detailed Audit Drawer */}
        <aside className="space-y-6">
          {selectedBooking ? (
            <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-5 shadow-soft animate-scale-up text-xs leading-normal">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm text-foreground">Booking Details</h3>
                <button onClick={() => setSelectedBooking(null)}>
                  <X className="h-5 w-5 hover:text-red-500" />
                </button>
              </div>

              <div className="space-y-3.5">
                {/* Customer / Provider details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold block flex items-center gap-1">
                      <User className="h-3 w-3 text-accent" />
                      Client
                    </span>
                    <span className="font-semibold text-foreground">{selectedBooking.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold block flex items-center gap-1">
                      <User className="h-3 w-3 text-accent" />
                      Provider
                    </span>
                    <span className="font-semibold text-foreground">{selectedBooking.providerName}</span>
                  </div>
                </div>

                {/* Consultation Details */}
                <div className="pt-2.5 border-t">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Consultation Service</span>
                  <span className="font-semibold text-foreground">{selectedBooking.serviceTitle}</span>
                  <div className="flex gap-4 text-[9px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedBooking.duration} mins</span>
                    {selectedBooking.type === "online" ? (
                      <span className="flex items-center gap-0.5 text-emerald-600 font-bold"><Video className="h-3 w-3" />Online</span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-sky-600 font-bold"><MapPin className="h-3 w-3" />In-Person</span>
                    )}
                  </div>
                </div>

                {/* Financial details */}
                <div className="pt-2.5 border-t space-y-2">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Financial Breakdown</span>
                  <div className="flex justify-between">
                    <span>Gross Invoice price</span>
                    <span className="font-bold">SAR {selectedBooking.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Commission (15%)</span>
                    <span className="font-bold text-red-500">-SAR {selectedBooking.commission}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/30">
                    <span>Provider earnings share (85%)</span>
                    <span className="font-black text-emerald-600">SAR {selectedBooking.earnings}</span>
                  </div>
                </div>

                {/* Status timelines */}
                <div className="pt-2.5 border-t space-y-2">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Invoice Statuses</span>
                  <div className="flex justify-between">
                    <span>Session Booking status</span>
                    <span className="font-semibold capitalize">{selectedBooking.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment clearance</span>
                    <span className="font-semibold capitalize">{selectedBooking.paymentStatus}</span>
                  </div>
                </div>

                {selectedBooking.status !== "Completed" && selectedBooking.status !== "Refunded" && selectedBooking.status !== "Cancelled" && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleCompleteBooking(selectedBooking.id, selectedBooking.providerId)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Mark Session Completed</span>
                    </button>
                  </div>
                )}

                {selectedBooking.status !== "Refunded" && selectedBooking.status !== "Cancelled" && (
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => handleRefund(selectedBooking.id, selectedBooking.providerId)}
                      className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Process Full Refund</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl border border-dashed text-center text-muted-foreground py-16 text-xs">
              Select a booking ref from the left panel to inspect detailed invoice specifications and splits.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

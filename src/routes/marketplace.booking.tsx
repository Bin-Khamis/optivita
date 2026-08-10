import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  CreditCard,
  CheckCircle,
  HelpCircle,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { SERVICES, PROVIDERS, generateAvailableSlots } from "@/lib/marketplaceData";
import { LoyaltyService } from "@/services/loyaltyService";

interface BookingSearchSchema {
  serviceId?: string;
}

export const Route = createFileRoute("/marketplace/booking")({
  component: BookingWizard,
  validateSearch: (search: Record<string, unknown>): BookingSearchSchema => {
    return {
      serviceId: search.serviceId as string | undefined,
    };
  },
});

function BookingWizard() {
  const { serviceId } = useSearch({ from: "/marketplace/booking" });
  
  // Find selected service
  const service = useMemo(() => {
    return SERVICES.find((s) => s.id === serviceId);
  }, [serviceId]);

  // Find provider
  const provider = useMemo(() => {
    return service ? PROVIDERS.find((p) => p.id === service.providerId) : null;
  }, [service]);

  // Calendar dates and slots
  const calendarDays = useMemo(() => generateAvailableSlots(), []);

  // Wizard Steps: 1 = Service/Slot selection, 2 = Payment details, 3 = Confirmation
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionMode, setSessionMode] = useState<"online" | "in-person">("online");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Load active session customer details
  const customerSession = useMemo(() => {
    const raw = localStorage.getItem("optivita_customer_session");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return { enrollmentId: "OPT-2026-001001", fullName: "Marketplace Customer" };
  }, []);

  const customerId = customerSession.enrollmentId || "OPT-2026-001001";
  const customerName = customerSession.fullName || "Marketplace Customer";

  // Corporate Wellness benefits states
  const [isCorporate, setIsCorporate] = useState(false);
  const corporateBenefitAmount = 400; // Company-sponsored wellness balance: e.g. SAR 400

  // Loyalty rewards redemption states
  const [rewardsCatalog] = useState(() => {
    const raw = localStorage.getItem("optivita_crm_cache");
    if (raw) {
      try {
        const db = JSON.parse(raw);
        return (db["Rewards Catalog"] || []).filter((r: any) => r.Active);
      } catch {}
    }
    return [
      { RewardId: "RW-01", RewardName: "SAR 50 Discount Voucher", PointsRequired: 500 },
      { RewardId: "RW-02", RewardName: "SAR 25 Discount Voucher", PointsRequired: 250 }
    ];
  });
  const [selectedRewardId, setSelectedRewardId] = useState("");
  const [rewardDiscount, setRewardDiscount] = useState(0);

  // Recalculate Checkout calculations separation
  const servicePrice = service.price || 150;
  
  // 1. Corporate wellness program split
  const companySponsored = isCorporate ? Math.min(servicePrice, corporateBenefitAmount) : 0;
  const remainingCoPayment = servicePrice - companySponsored;

  // 2. Loyalty discount application on remaining employee payment co-payment
  const discountVal = rewardDiscount;
  const finalPayable = Math.max(0, remainingCoPayment - discountVal);

  const handleSelectReward = (rewardId: string) => {
    if (!rewardId) {
      setSelectedRewardId("");
      setRewardDiscount(0);
      return;
    }
    const validation = LoyaltyService.validateReward(customerId, rewardId);
    if (!validation.valid) {
      alert(validation.reason || "Invalid reward selection.");
      setSelectedRewardId("");
      setRewardDiscount(0);
      return;
    }
    setSelectedRewardId(rewardId);
    setRewardDiscount(validation.discount || 0);
  };

  // Initialize session mode when service loads
  useMemo(() => {
    if (service) {
      setSessionMode(service.type);
    }
  }, [service]);

  // Helper to format date string to human-readable
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return "";
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleNextToPayment = () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select both a date and time slot.");
      return;
    }
    setStep(2);
  };

  // Payment Method: "card", "mada", "apple_pay", "wallet"
  const [paymentMethod, setPaymentMethod] = useState("card");

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    const price = finalPayable; // Employee co-payment after corporate benefits & loyalty discounts

    // Resolve customer balance if using wallet payment
    if (paymentMethod === "wallet") {
      const rawWallet = localStorage.getItem("optivita_marketplace_wallet_transactions");
      let walletTxns = [];
      if (rawWallet) {
        try { walletTxns = JSON.parse(rawWallet); } catch {}
      }
      const balance = walletTxns.length > 0 ? walletTxns[0].balanceAfter : 0;
      if (balance < price) {
        setPaymentError("Insufficient wallet balance. Please top up your wallet first.");
        return;
      }

      // Deduct balance and record transaction
      const newWalletTx = {
        id: `WTX-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split("T")[0],
        type: "Booking Payment",
        description: `Paid for ${service.title} session`,
        amount: -price,
        balanceAfter: balance - price,
      };
      walletTxns.unshift(newWalletTx);
      localStorage.setItem("optivita_marketplace_wallet_transactions", JSON.stringify(walletTxns));
    } else {
      // Validate card fields only if finalPayable > 0
      if (price > 0 && (!cardName || !cardNumber || !cardExpiry || !cardCvv)) {
        setPaymentError("Please fill in all credit card details.");
        return;
      }
    }

    // Deduct points after payment transaction is validated and verified
    if (selectedRewardId) {
      const successRedeem = LoyaltyService.redeemReward(customerId, selectedRewardId);
      if (!successRedeem) {
        setPaymentError("Reward validation and points deduction failed.");
        return;
      }
    }

    // Resolve Commission split dynamically based on full service price
    const rawCommissions = localStorage.getItem("optivita_marketplace_commissions");
    let ratesObj: Record<string, number> = { nutritionist: 15, dietitian: 15, trainer: 12, coach: 12, gym: 10, wellness: 15 };
    if (rawCommissions) {
      try { ratesObj = JSON.parse(rawCommissions); } catch {}
    }
    const rate = ratesObj[provider.type.toLowerCase()] || 15;
    const commissionVal = servicePrice * (rate / 100);
    const providerShare = servicePrice - commissionVal;

    // Create payment transaction
    const rawTransactions = localStorage.getItem("optivita_marketplace_transactions");
    let txns = [];
    if (rawTransactions) {
      try { txns = JSON.parse(rawTransactions); } catch {}
    }

    const generatedId = `BKG-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      bookingId: generatedId,
      customerName: cardName || customerName,
      providerName: provider.name,
      providerId: provider.id,
      type: "Booking Payment",
      gross: servicePrice,
      commission: commissionVal,
      net: providerShare,
      status: "Cleared",
      date: new Date().toISOString().split("T")[0],
      isCorporate,
      corporateBenefitAmount: companySponsored,
      coPaymentAmount: finalPayable,
      selectedRewardId,
      rewardDiscount,
    };

    txns.unshift(newTx);
    localStorage.setItem("optivita_marketplace_transactions", JSON.stringify(txns));

    // Save appointment details in provider's calendar database
    const appointmentKey = `optivita_appointments_${provider.id}`;
    const rawApts = localStorage.getItem(appointmentKey);
    let apts = [];
    if (rawApts) {
      try { apts = JSON.parse(rawApts); } catch {}
    }
    apts.unshift({
      id: generatedId,
      customerId,
      customerName: cardName || customerName,
      serviceTitle: service.title,
      date: selectedDate,
      time: selectedTime,
      duration: service.duration,
      type: service.type,
      status: "Upcoming",
      isCorporate,
      corporateBenefitAmount: companySponsored,
      coPaymentAmount: finalPayable,
      selectedRewardId,
      rewardDiscount,
    });
    localStorage.setItem(appointmentKey, JSON.stringify(apts));

    // Audit logs
    const rawLogs = localStorage.getItem("optivita_marketplace_audit_logs");
    let logs = [];
    if (rawLogs) {
      try { logs = JSON.parse(rawLogs); } catch {}
    }
    logs.unshift({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminId: "Marketplace System",
      action: "Created Booking Payment",
      entityType: "Booking",
      entityId: generatedId,
      previousState: "None",
      newState: "Upcoming",
      reason: "Secure checkout payment processed successfully.",
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));

    // If using simulated Card/Mada/Apple Pay: create gateway session and redirect to success callback
    if (paymentMethod !== "wallet") {
      const generatedSessionId = `SES-${Math.floor(100000 + Math.random() * 900000)}`;
      const newSessionObj = {
        paymentSessionId: generatedSessionId,
        bookingReference: generatedId,
        customerId: "cust-1",
        providerId: provider.id,
        serviceId: service.id,
        amount: price,
        currency: "SAR",
        paymentMethod: paymentMethod,
        status: "Pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      const rawSessions = localStorage.getItem("optivita_marketplace_payments") || "[]";
      let sessions = [];
      try { sessions = JSON.parse(rawSessions); } catch {}
      sessions.unshift(newSessionObj);
      localStorage.setItem("optivita_marketplace_payments", JSON.stringify(sessions));

      window.location.href = `/marketplace/payment/success?session_id=${generatedSessionId}`;
      return;
    }

    setBookingId(generatedId);
    setStep(3);
  };

  // Safe checks
  if (!service || !provider) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">No Service Selected</h2>
        <p className="text-muted-foreground text-sm">Please choose a service from the marketplace to start booking.</p>
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
          Return to Directory
        </Link>
      </div>
    );
  }

  // STEP 3: BOOKING CONFIRMED SCREEN
  if (step === 3) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 animate-scale-up">
        <div className="rounded-3xl border border-border/60 bg-card p-8 text-center space-y-8 shadow-soft">
          {/* Confirmed Animation & Badge */}
          <div className="flex flex-col items-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                Success
              </span>
              <h1 className="text-2xl font-display font-black text-foreground">Booking Confirmed! 🎉</h1>
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="rounded-2xl bg-secondary/25 border border-border/50 p-5 text-left space-y-3.5 text-xs">
            <div className="flex justify-between pb-2 border-b border-border/30">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-bold text-foreground font-mono">{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expert</span>
              <span className="font-bold text-foreground">{provider.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service</span>
              <span className="font-bold text-foreground">{service.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-bold text-foreground">{formatFriendlyDate(selectedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Slot</span>
              <span className="font-bold text-foreground">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session Mode</span>
              <span className="font-bold text-foreground capitalize">{sessionMode} Consultation</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/30">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-black text-accent text-sm">SAR {service.price}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3.5">
            <Link
              to="/portal/appointments"
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-soft hover:opacity-90 flex items-center justify-center gap-1.5"
            >
              <FileText className="h-4 w-4" />
              <span>View Appointment in Portal</span>
            </Link>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => alert("Simulating message to provider...")}
                className="py-3 rounded-full border border-border/60 bg-card hover:bg-secondary/25 text-foreground text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4 text-accent" />
                <span>Message Provider</span>
              </button>
              <button
                onClick={() => alert("Simulating download calendar file (ICS)...")}
                className="py-3 rounded-full border border-border/60 bg-card hover:bg-secondary/25 text-foreground text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Share2 className="h-4 w-4 text-accent" />
                <span>Add to Calendar</span>
              </button>
            </div>

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

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => (step === 2 ? setStep(1) : window.history.back())}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{step === 2 ? "Back to Slot Selection" : "Back to Service details"}</span>
      </button>

      {/* Grid container: Wizard Column + Summary Column */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Wizard Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: SERVICE DATE & TIME SELECTOR */}
          {step === 1 && (
            <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-8 shadow-soft">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Step 1 of 2</span>
                <h2 className="text-xl font-display font-black text-foreground">Select Appointment Slot</h2>
              </div>

              {/* Calendar Grid Date Selection */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-accent" />
                  Select Date
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {calendarDays.map((day) => {
                    const isSelected = selectedDate === day.dateStr;
                    const dateObj = new Date(day.dateStr);
                    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    const dayNum = dateObj.getDate();
                    const month = dateObj.toLocaleDateString("en-US", { month: "short" });

                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => {
                          setSelectedDate(day.dateStr);
                          setSelectedTime(""); // Reset time selection on date switch
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center space-y-1 ${
                          isSelected
                            ? "bg-accent border-accent text-white shadow-soft"
                            : "bg-secondary/15 border-border/60 hover:bg-secondary/30 text-foreground"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">{weekday}</span>
                        <span className="text-base font-black">{dayNum}</span>
                        <span className="text-[9px] font-semibold uppercase">{month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid */}
              {selectedDate && (
                <div className="space-y-3 animate-fade-in">
                  <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-accent" />
                    Available Hours
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {calendarDays
                      .find((d) => d.dateStr === selectedDate)
                      ?.slots.map((timeSlot) => {
                        const isSelected = selectedTime === timeSlot;
                        return (
                          <button
                            key={timeSlot}
                            onClick={() => setSelectedTime(timeSlot)}
                            className={`py-2.5 rounded-xl border text-center text-xs font-semibold transition-colors ${
                              isSelected
                                ? "bg-accent border-accent text-white"
                                : "bg-secondary/15 border-border/60 hover:bg-secondary/30 text-foreground"
                            }`}
                          >
                            {timeSlot}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Session Mode Selector */}
              <div className="space-y-3 border-t border-border/30 pt-6">
                <h3 className="text-xs font-bold text-muted-foreground">Session Type</h3>
                <div className="flex gap-4">
                  <button
                    disabled={service.type === "in-person"}
                    onClick={() => setSessionMode("online")}
                    className={`flex-grow py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      sessionMode === "online"
                        ? "bg-accent border-accent text-white"
                        : "bg-card border-border/60 hover:bg-secondary/20 text-foreground disabled:opacity-40"
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    <span>Online Consultation</span>
                  </button>

                  <button
                    disabled={service.type === "online"}
                    onClick={() => setSessionMode("in-person")}
                    className={`flex-grow py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      sessionMode === "in-person"
                        ? "bg-accent border-accent text-white"
                        : "bg-card border-border/60 hover:bg-secondary/20 text-foreground disabled:opacity-40"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    <span>In-Person Visit</span>
                  </button>
                </div>
              </div>

              {/* Next Step Action */}
              <div className="pt-6 border-t border-border/30 flex justify-end">
                <button
                  onClick={handleNextToPayment}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full md:w-auto px-8 py-3 rounded-full bg-brand-gradient text-white font-bold text-xs shadow-soft disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CREDIT CARD PAYMENT SIMULATION */}
          {step === 2 && (
            <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-8 shadow-soft">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Step 2 of 2</span>
                <h2 className="text-xl font-display font-black text-foreground">Secure Payment Checkout</h2>
              </div>

              <form onSubmit={handleProcessPayment} className="space-y-6">
                {/* Corporate Benefit Selection */}
                <div className="p-4 border rounded-2xl bg-secondary/10 border-border/40 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block text-xs">Corporate B2B Wellness benefit</span>
                      <span className="text-[9px] text-muted-foreground">Apply company sponsored wellness allowance (SAR 400 cap)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isCorporate}
                      onChange={(e) => setIsCorporate(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                  </div>
                  {isCorporate && (
                    <div className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 p-2.5 rounded-xl">
                      Company Benefit applied: -SAR {companySponsored} (Remaining co-payment: SAR {remainingCoPayment})
                    </div>
                  )}
                </div>

                {/* Loyalty Reward Redemptions */}
                <div className="space-y-2 text-left">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Redeem Existing Loyalty Reward</label>
                  <select
                    value={selectedRewardId}
                    onChange={(e) => handleSelectReward(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent font-semibold"
                  >
                    <option value="">No reward voucher selected</option>
                    {rewardsCatalog.map((reward: any) => (
                      <option key={reward.RewardId} value={reward.RewardId}>
                        {reward.RewardName} ({reward.PointsRequired} pts)
                      </option>
                    ))}
                  </select>
                  {rewardDiscount > 0 && (
                    <p className="text-[10px] text-emerald-600 font-bold">
                      Reward voucher applied: -SAR {rewardDiscount} discount
                    </p>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Choose Payment Option</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="card">Credit / Debit Card</option>
                    <option value="mada">Mada Bank Card</option>
                    <option value="apple_pay">Apple Pay</option>
                    <option value="wallet">Marketplace Wallet</option>
                  </select>
                </div>

                {paymentMethod === "wallet" ? (
                  <div className="p-6 rounded-2xl border bg-emerald-500/5 border-emerald-500/20 space-y-2.5 text-xs animate-scale-up">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Optivita Wallet Balance</span>
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase font-black">Active</span>
                    </div>
                    <p className="text-2xl font-black text-foreground">
                      SAR {((): number => {
                        const raw = localStorage.getItem("optivita_marketplace_wallet_transactions");
                        if (raw) {
                          try {
                            const txs = JSON.parse(raw);
                            if (txs.length > 0) return txs[0].balanceAfter;
                          } catch {}
                        }
                        return 0;
                      })().toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">The session fee of SAR {finalPayable} will be debited from your wallet.</p>
                  </div>
                ) : (
                  <>
                    {/* Mock Card Preview Panel */}
                    <div className="rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-6 space-y-8 shadow-md relative overflow-hidden">
                      <div className="absolute right-0 top-0 h-40 w-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
                      <div className="flex items-center justify-between">
                        <CreditCard className="h-10 w-10 text-white/90" />
                        <span className="text-[10px] font-mono tracking-widest opacity-80 uppercase">OptiPay</span>
                      </div>

                      <div className="space-y-4">
                        <span className="font-mono text-lg md:text-xl tracking-wider block">
                          {cardNumber || "•••• •••• •••• ••••"}
                        </span>
                        <div className="flex justify-between text-[10px] opacity-80 font-mono">
                          <div>
                            <span className="block opacity-60 uppercase text-[8px]">Cardholder</span>
                            <span>{cardName || "YOUR NAME"}</span>
                          </div>
                          <div>
                            <span className="block opacity-60 uppercase text-[8px]">Expires</span>
                            <span>{cardExpiry || "MM/YY"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Inputs */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="e.g. Eleanor Vance"
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Card Number</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4000 1234 5678 9010"
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Expiry Date</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">CVV Code</label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentError && <p className="text-xs text-red-500 font-semibold">{paymentError}</p>}

                {/* Confirm Pay Buttons */}
                <div className="pt-6 border-t border-border/30 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-full border border-border/65 text-foreground hover:bg-secondary/20 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="px-8 py-3 rounded-full bg-brand-gradient text-white font-bold text-xs shadow-soft hover:opacity-95 flex items-center gap-1.5"
                  >
                    <span>Pay & Book Session (SAR {finalPayable})</span>
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Checkout Summary Sidebar */}
        <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-6 shadow-sm">
          <h3 className="font-bold text-sm text-foreground pb-3 border-b border-border/30">Booking Summary</h3>

          {/* Provider Card summary */}
          <div className="flex gap-3">
            <img
              src={provider.avatar}
              alt={provider.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div>
              <h4 className="font-bold text-xs text-foreground">{provider.name}</h4>
              <p className="text-[10px] text-muted-foreground capitalize">{provider.type}</p>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-3.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <FileText className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground block">{service.title}</span>
                <span className="text-[10px] block mt-0.5">{service.duration} mins session</span>
              </div>
            </div>

            {selectedDate && (
              <div className="flex items-start gap-2.5">
                <CalendarIcon className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">{formatFriendlyDate(selectedDate)}</span>
                  {selectedTime && <span className="text-[10px] block mt-0.5">{selectedTime}</span>}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <Video className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground block capitalize">{sessionMode} mode</span>
                <span className="text-[10px] block mt-0.5">
                  {sessionMode === "online" ? "Google Meet connection" : `In-person at ${provider.location}`}
                </span>
              </div>
            </div>
          </div>

          {/* Price Calculations */}
          <div className="border-t border-border/30 pt-4 space-y-2 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original Subtotal</span>
              <span className="text-foreground font-semibold">SAR {servicePrice}</span>
            </div>
            {isCorporate && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Corporate Wellness Benefit</span>
                <span>-SAR {companySponsored}</span>
              </div>
            )}
            {rewardDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Loyalty Reward Discount</span>
                <span>-SAR {rewardDiscount}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border/30 text-sm">
              <span className="font-bold text-foreground">Total Employee Co-payment</span>
              <span className="font-black text-accent font-display">SAR {finalPayable}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

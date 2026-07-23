import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePortal } from "@/lib/portalContext";
import { 
  Calendar, Clock, User, Award, Plus, ArrowRight, CheckCircle2,
  X, CheckSquare, AlertCircle, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { getCustomerName, getPhone, isWebhookOffline } from "@/lib/utils";

export const Route = createFileRoute("/portal/appointments")({
  component: CustomerAppointments,
});

function CustomerAppointments() {
  const { data, customer, refreshData } = usePortal();

  // Booking states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00");
  const [bookingCoach, setBookingCoach] = useState("Clinical Lead");
  const [saving, setSaving] = useState(false);

  const appointments = data?.["Appointments"] || [];
  const clientAppointments = appointments.filter((a: any) => {
    const aptName = getCustomerName(a);
    const aptPhone = getPhone(a);
    return (
      (aptName && customer?.fullName && String(aptName).trim().toLowerCase() === String(customer.fullName).trim().toLowerCase()) ||
      (aptPhone && customer?.phone && String(aptPhone).replace(/[^0-9]/g, "").endsWith(String(customer.phone).replace(/[^0-9]/g, "").slice(-9)))
    );
  });

  const handleBookSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) {
      toast.error("Please select a date for your appointment.");
      return;
    }

    setSaving(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (isWebhookOffline(webhookUrl)) {
      // Mock book
      setTimeout(() => {
        appointments.push({
          AppointmentId: "APT-" + Math.floor(100000 + Math.random() * 900000),
          fullName: customer?.fullName || "Guest Customer",
          phone: customer?.phone || "",
          date: bookingDate,
          time: bookingTime,
          coach: bookingCoach,
          status: "Pending"
        });
        toast.success("Appointment request submitted (Offline Simulation)!");
        setShowBookingModal(false);
        setSaving(false);
        resetForm();
      }, 700);
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "bookAppointment",
          customerName: customer?.fullName,
          phone: customer?.phone,
          date: bookingDate,
          time: bookingTime,
          coach: bookingCoach,
          status: "Pending"
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Appointment request saved! Confirmed via WhatsApp shortly.");
        refreshData();
        setShowBookingModal(false);
        resetForm();
      } else {
        toast.error("Booking request failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Database sync failed.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBookingDate("");
    setBookingTime("10:00");
    setBookingCoach("Clinical Lead");
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Appointments Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Book or reschedule live 1-on-1 consultations with your clinical coach.</p>
        </div>
        <button 
          onClick={() => setShowBookingModal(true)}
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 text-xs shadow-soft flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Book New Session
        </button>
      </div>

      {/* Appointments List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {clientAppointments.length > 0 ? (
          clientAppointments.map((apt: any) => (
            <div 
              key={apt.AppointmentId} 
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 shadow-soft hover:shadow-glow transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">{apt.AppointmentId}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                    apt.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-600" : "bg-yellow-500/10 text-yellow-600"
                  }`}>
                    {apt.status}
                  </span>
                </div>
                
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Coaching Consultation</h4>
                <p className="text-xs text-slate-500 mt-1">Assign practitioner: <strong>{apt.coach}</strong></p>
              </div>

              <div className="flex justify-between items-center border-t pt-4 mt-6 text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1"><Calendar className="h-4.5 w-4.5" /> {apt.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-4.5 w-4.5" /> {apt.time}</span>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="h-10 w-10 text-slate-300" />
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No scheduled sessions</h4>
            <p className="text-xs max-w-sm mx-auto">You do not have any pending or confirmed appointments. Schedule a call with your wellness coach today!</p>
          </div>
        )}

      </div>

      {/* Book Session Modal Dialog popup */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowBookingModal(false)} />
          <form onSubmit={handleBookSessionSubmit} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-glow z-10 animate-scale-up">
            
            <button 
              type="button"
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl mb-1">Schedule Consultation</h3>
            <p className="text-xs text-slate-400 mb-5">Coaches will review your intakes prior to the call.</p>

            <div className="space-y-4">
              
              {/* Date Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment Date</label>
                <input 
                  type="date" 
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                  required
                />
              </div>

              {/* Time Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Time Slot</label>
                <select 
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:30">03:30 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>

              {/* Coach Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coaching Specialist</label>
                <select 
                  value={bookingCoach}
                  onChange={(e) => setBookingCoach(e.target.value)}
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="Clinical Lead">Clinical Lead Specialist</option>
                  <option value="Agent A">Patient Coordinator A</option>
                  <option value="Agent B">Counselor B</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <button 
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all duration-200 mt-2"
              >
                {saving ? "Booking session..." : "Submit Booking Request"}
              </button>

            </div>
          </form>
        </div>
      )}

    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, Coffee, Save, Globe } from "lucide-react";

export const Route = createFileRoute("/provider/availability")({
  component: ProviderAvailabilityManagement,
});

function ProviderAvailabilityManagement() {
  const [workingDays, setWorkingDays] = useState<string[]>([
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"
  ]);
  const [workStart, setWorkStart] = useState("09:00 AM");
  const [workEnd, setWorkEnd] = useState("06:00 PM");
  const [breakStart, setBreakStart] = useState("01:00 PM");
  const [breakEnd, setBreakEnd] = useState("02:00 PM");
  const [timeZone, setTimeZone] = useState("Asia/Riyadh (GMT+3)");

  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Shift availability saved successfully!");
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-soft">
      <div className="space-y-1 pb-4 border-b border-border/30">
        <h2 className="text-lg font-display font-black text-foreground">Weekly Shift Schedule</h2>
        <p className="text-[10px] text-muted-foreground">Define your consulting hours, weekly breaks, and holidays</p>
      </div>

      <form onSubmit={handleSaveAvailability} className="space-y-6">
        {/* Working Days */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-accent" />
            Working Days
          </label>
          <div className="flex flex-wrap gap-2.5">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
              const isActive = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-accent border-accent text-white shadow-soft"
                      : "bg-secondary/15 border-border/60 hover:bg-secondary/35 text-foreground"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Consulting Hours */}
        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border/30">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-accent" />
              Shift Starts At
            </label>
            <input
              type="text"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 text-center"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-accent" />
              Shift Ends At
            </label>
            <input
              type="text"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 text-center"
            />
          </div>
        </div>

        {/* Daily Breaks */}
        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border/30">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Coffee className="h-4 w-4 text-accent" />
              Break Starts At
            </label>
            <input
              type="text"
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 text-center"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Coffee className="h-4 w-4 text-accent" />
              Break Ends At
            </label>
            <input
              type="text"
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 text-center"
            />
          </div>
        </div>

        {/* Time Zone */}
        <div className="space-y-2 pt-4 border-t border-border/30">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-accent" />
            Default Time Zone
          </label>
          <select
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60"
          >
            <option value="Asia/Riyadh (GMT+3)">Asia/Riyadh (GMT+3)</option>
            <option value="Asia/Dubai (GMT+4)">Asia/Dubai (GMT+4)</option>
            <option value="Europe/London (GMT+0)">Europe/London (GMT+0)</option>
          </select>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-border/30 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-soft flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>Save Working Hours</span>
          </button>
        </div>
      </form>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, User, MessageSquare, Calendar, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/provider/customers")({
  component: ProviderCustomersDirectory,
});

function ProviderCustomersDirectory() {
  const [searchQuery, setSearchQuery] = useState("");

  const mockCustomers = [
    {
      id: "cli-201",
      name: "Fahad Khalid",
      phone: "+966 50 123 4567",
      email: "fahad@gmail.com",
      lastSession: "2026-08-01",
      nextSession: "Tomorrow, 10:30 AM",
      serviceType: "Weight Loss Assessment",
      status: "Active",
    },
    {
      id: "cli-202",
      name: "Amal Al-Otaibi",
      phone: "+966 55 908 2145",
      email: "amal.otaibi@outlook.com",
      lastSession: "None",
      nextSession: "In 2 days, 02:30 PM",
      serviceType: "PCOS Diet Plan",
      status: "Active",
    },
    {
      id: "cli-203",
      name: "Tariq Mansoor",
      phone: "+966 54 819 0281",
      email: "tariq.mansoor@gmail.com",
      lastSession: "2026-08-07",
      nextSession: "None Scheduled",
      serviceType: "Strength Workout",
      status: "Completed",
    },
  ];

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return mockCustomers;
    const q = searchQuery.toLowerCase().trim();
    return mockCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Client Directory</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Audit contact files and view session history logs</p>
        </div>
      </div>

      {/* Control Search bar */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name, email..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none"
        />
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
              <th className="p-4">Customer Name</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Last Session Date</th>
              <th className="p-4">Upcoming Booking</th>
              <th className="p-4">Consultation Plan</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary/45 flex items-center justify-center text-muted-foreground shrink-0 font-bold">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-foreground block">{c.name}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{c.id}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="block">{c.phone}</span>
                  <span className="text-[10px] text-muted-foreground">{c.email}</span>
                </td>
                <td className="p-4 text-muted-foreground">{c.lastSession}</td>
                <td className="p-4 font-semibold text-accent">{c.nextSession}</td>
                <td className="p-4 capitalize text-muted-foreground">{c.serviceType}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      to="/provider/messages"
                      className="p-1.5 rounded-lg border border-border hover:bg-secondary/20 text-accent"
                      title="Send Message"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to="/provider/appointments"
                      className="p-1.5 rounded-lg border border-border hover:bg-secondary/20 text-muted-foreground"
                      title="Appointments"
                    >
                      <Calendar className="h-3.5 w-3.5 animate-pulse" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No customers found matching search filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Building, ShieldCheck, ShieldAlert, Award, Search } from "lucide-react";

export const Route = createFileRoute("/admin/corporate")({
  component: AdminCorporatePortal,
});

function AdminCorporatePortal() {
  const [companies, setCompanies] = useState([
    { id: "CO-901", name: "Saudi Aramco Tech Corp", email: "hr@aramcotech.com", size: "1000+", budget: "SAR 150,000 / mo", status: "Pending Verification" },
    { id: "CO-902", name: "Riyadh Digital Solutions", email: "wellness@riyadhdigital.com", size: "200-1000", budget: "SAR 50,000 / mo", status: "Approved" },
    { id: "CO-903", name: "Jeddah Consulting Group", email: "hr@jeddahconsult.com", size: "50-200", budget: "SAR 25,000 / mo", status: "Approved" },
  ]);

  const [search, setSearch] = useState("");

  const handleApprove = (id: string) => {
    setCompanies(companies.map(c => {
      if (c.id === id) {
        return { ...c, status: "Approved" };
      }
      return c;
    }));
    toast.success("Organization B2B account successfully verified and approved!");
  };

  const handleSuspend = (id: string) => {
    setCompanies(companies.map(c => {
      if (c.id === id) {
        return { ...c, status: "Suspended" };
      }
      return c;
    }));
    toast.warning("Organization B2B account suspended.");
  };

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 text-xs text-left">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">B2B Corporate Wellness Registrations</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Approve corporate applications, modify budget limits, and audit employee usage</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Company ID, Name..."
          className="max-w-sm px-3.5 py-2 border rounded-xl text-xs bg-card focus:outline-none"
        />

        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
                <th className="p-4">Company ID</th>
                <th className="p-4">Organization Name</th>
                <th className="p-4">Contact Email</th>
                <th className="p-4">Monthly Budget</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/30 last:border-b-0 hover:bg-secondary/10 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">{c.id}</td>
                  <td className="p-4 font-semibold text-foreground">{c.name}</td>
                  <td className="p-4 text-muted-foreground font-mono">{c.email}</td>
                  <td className="p-4 font-bold text-foreground">{c.budget}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      c.status === "Approved"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : c.status === "Suspended"
                        ? "bg-red-500/10 text-red-600"
                        : "bg-sky-500/10 text-sky-600"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {c.status !== "Approved" && (
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      )}
                      {c.status === "Approved" && (
                        <button
                          onClick={() => handleSuspend(c.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-500 font-bold hover:bg-red-500/5"
                        >
                          Suspend
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
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, ShieldCheck, ShieldAlert, Ban, Eye, Check, XCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { getStoredProviders, saveProviderToStorage } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/providers")({
  component: AdminProvidersManagement,
});

function AdminProvidersManagement() {
  const [providers, setProviders] = useState(() => getStoredProviders());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [verifyFilter, setVerifyFilter] = useState("all");

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
        p.location.toLowerCase().includes(search.toLowerCase()) ||
        p.type.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === "all" || p.type.toLowerCase() === typeFilter.toLowerCase();
      const matchVerify =
        verifyFilter === "all" ||
        (verifyFilter === "approved" && p.verified && !p.name.includes("(Suspended)")) ||
        (verifyFilter === "pending" && !p.verified) ||
        (verifyFilter === "suspended" && p.name.includes("(Suspended)"));

      return matchSearch && matchType && matchVerify;
    });
  }, [providers, search, typeFilter, verifyFilter]);

  const handleUpdateStatus = (id: string, status: "approve" | "suspend" | "reactivate") => {
    const prov = providers.find((p) => p.id === id);
    if (!prov) return;

    let updated = { ...prov };
    if (status === "approve") {
      updated.verified = true;
      toast.success(`${prov.name} applications approved!`);
    } else if (status === "suspend") {
      if (!updated.name.includes(" (Suspended)")) {
        updated.name = `${updated.name} (Suspended)`;
      }
      toast.error(`${prov.name} has been suspended.`);
    } else {
      updated.name = updated.name.replace(" (Suspended)", "");
      toast.success(`${prov.name} reactivated.`);
    }

    saveProviderToStorage(updated);
    setProviders(getStoredProviders());
  };

  const handleExportCSV = () => {
    let csv = "ID,Name,Type,Location,Verified,Rating,Review Count,Starting Price\n";
    filteredProviders.forEach((p) => {
      csv += `${p.id},"${p.name}",${p.type},"${p.location}",${p.verified},${p.rating},${p.reviewCount},${p.startingPrice}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `marketplace_providers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV providers export downloaded.");
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Providers Directory</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Manage, verify, suspend, and reactivate marketplace providers.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-border/60 bg-card hover:bg-secondary text-xs font-bold text-foreground shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Export Providers CSV</span>
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search provider name, location, business..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 border rounded-xl text-xs bg-card border-border/60 focus:outline-none"
          >
            <option value="all">All Provider Types</option>
            <option value="nutritionist">Nutritionist</option>
            <option value="dietitian">Dietitian</option>
            <option value="trainer">Personal Trainer</option>
            <option value="coach">Fitness Coach</option>
            <option value="gym">Gym Facility</option>
            <option value="wellness">Wellness Coach</option>
          </select>

          <select
            value={verifyFilter}
            onChange={(e) => setVerifyFilter(e.target.value)}
            className="px-3.5 py-2 border rounded-xl text-xs bg-card border-border/60 focus:outline-none"
          >
            <option value="all">All Verification Status</option>
            <option value="approved">Approved Active</option>
            <option value="pending">Pending Audit</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Providers Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
              <th className="p-4">Provider Details</th>
              <th className="p-4">Category</th>
              <th className="p-4">Location</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Starting Price</th>
              <th className="p-4">Verification</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProviders.map((p) => {
              const isSuspended = p.name.includes("(Suspended)");
              return (
                <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="h-10 w-10 rounded-xl object-cover border border-border/30"
                    />
                    <div>
                      <span className="font-bold text-foreground block">{p.name}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">{p.id}</span>
                    </div>
                  </td>
                  <td className="p-4 capitalize text-muted-foreground">{p.type}</td>
                  <td className="p-4 text-muted-foreground">{p.location}</td>
                  <td className="p-4 font-bold text-foreground">★ {p.rating} ({p.reviewCount})</td>
                  <td className="p-4 text-foreground">SAR {p.startingPrice}</td>
                  <td className="p-4">
                    {isSuspended ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold text-[9px]">
                        Suspended
                      </span>
                    ) : p.verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[9px]">
                        <ShieldAlert className="h-3.5 w-3.5 animate-bounce" />
                        Pending Audit
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/marketplace/providers/${p.id}`}
                        className="p-1.5 rounded border hover:bg-secondary text-muted-foreground"
                        title="View Profile Details"
                      >
                        <Eye className="h-3.5 w-3.5 text-accent" />
                      </Link>
                      
                      {!p.verified && (
                        <button
                          onClick={() => handleUpdateStatus(p.id, "approve")}
                          className="p-1.5 rounded border hover:bg-secondary text-emerald-600"
                          title="Approve verification"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {isSuspended ? (
                        <button
                          onClick={() => handleUpdateStatus(p.id, "reactivate")}
                          className="p-1.5 rounded border hover:bg-secondary text-emerald-600 font-bold text-[9px]"
                          title="Reactivate Account"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(p.id, "suspend")}
                          className="p-1.5 rounded border hover:bg-red-50 text-red-500"
                          title="Suspend Provider"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredProviders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No providers found matching search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Star, Check, EyeOff, Flag, HelpCircle, X } from "lucide-react";
import { getStoredProviders, getProviderReviews } from "@/lib/marketplaceData";

export const Route = createFileRoute("/admin/marketplace/reviews")({
  component: AdminReviewsModeration,
});

function AdminReviewsModeration() {
  const [providers] = useState(() => getStoredProviders());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Flag reason dialog states
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReviewId, setFlagReviewId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("Spam");

  // Compile reviews lists across all providers
  const [reviews, setReviews] = useState<any[]>(() => {
    let list: any[] = [];
    providers.forEach((prov) => {
      const providerReviews = getProviderReviews(prov.id).map((rev) => ({
        ...rev,
        providerName: prov.name,
        status: "Published",
      }));
      list = [...list, ...providerReviews];
    });
    return list;
  });

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        r.author.toLowerCase().includes(search.toLowerCase()) ||
        r.providerName.toLowerCase().includes(search.toLowerCase()) ||
        r.comment.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [reviews, search, statusFilter]);

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
      entityType: "Review",
      entityId,
      previousState: prev,
      newState: next,
      reason,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("optivita_marketplace_audit_logs", JSON.stringify(logs));
  };

  const handleApproveReview = (id: string) => {
    setReviews(
      reviews.map((r) => {
        if (r.id === id) {
          return { ...r, status: "Published" };
        }
        return r;
      })
    );
    createAuditRecord("Approved Review", id, "Flagged", "Published", "Validated review content.");
    toast.success("Review published on marketplace profile.");
  };

  const handleFlagReview = () => {
    if (!flagReviewId) return;

    setReviews(
      reviews.map((r) => {
        if (r.id === flagReviewId) {
          return { ...r, status: "Flagged" };
        }
        return r;
      })
    );

    createAuditRecord("Flagged Review", flagReviewId, "Published", "Flagged", `Flagged for: ${flagReason}`);
    toast.warning(`Review flagged for: ${flagReason}`);
    
    setShowFlagDialog(false);
    setFlagReviewId(null);
  };

  const handleHideReview = (id: string) => {
    setReviews(
      reviews.map((r) => {
        if (r.id === id) {
          return { ...r, status: "Hidden" };
        }
        return r;
      })
    );
    createAuditRecord("Hidden Review", id, "Published", "Hidden", "Content violates professional safety guidelines.");
    toast.error("Review hidden from public view.");
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center pb-5 border-b border-border/40">
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Review Moderation Console</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Moderate customer reviews, ratings distributions, and spam comments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by author, provider, comment content..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none"
          />
        </div>

        {/* Status filters */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border rounded-xl text-xs bg-card border-border/60 focus:outline-none"
        >
          <option value="all">All Moderation Status</option>
          <option value="published">Published</option>
          <option value="flagged">Flagged</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/20 text-muted-foreground border-b border-border/40 font-bold">
              <th className="p-4">Author</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Comment Feedback</th>
              <th className="p-4">Submitted Date</th>
              <th className="p-4">Moderation Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((r) => (
              <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/10 last:border-b-0 transition-colors">
                <td className="p-4 font-bold text-foreground">{r.author}</td>
                <td className="p-4 text-muted-foreground">{r.providerName}</td>
                <td className="p-4">
                  <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    <span>{r.rating}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground max-w-xs truncate" title={r.comment}>
                  “{r.comment}”
                </td>
                <td className="p-4 text-muted-foreground">{r.date}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    r.status === "Published"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : r.status === "Flagged"
                      ? "bg-amber-500/10 text-amber-600 animate-pulse"
                      : "bg-red-500/10 text-red-600"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleApproveReview(r.id)}
                      className="p-1.5 rounded border hover:bg-secondary text-emerald-600"
                      title="Approve Review"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setFlagReviewId(r.id);
                        setShowFlagDialog(true);
                      }}
                      className="p-1.5 rounded border hover:bg-secondary text-amber-600"
                      title="Flag Review"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleHideReview(r.id)}
                      className="p-1.5 rounded border hover:bg-red-50 text-red-500"
                      title="Hide Review"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Flag review reasons dialog */}
      {showFlagDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-3xl border p-6 space-y-4 shadow-glow text-xs">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-sm text-foreground">Select Flagging Reason</h3>
              <button onClick={() => setShowFlagDialog(false)}>
                <X className="h-5 w-5 hover:text-red-500" />
              </button>
            </div>

            <select
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            >
              <option value="Spam">Spam</option>
              <option value="Abuse">Abuse / Harassment</option>
              <option value="Offensive Content">Offensive Language</option>
              <option value="Fake Review">Fake / Paid review</option>
              <option value="Personal Information">Exposing personal data</option>
              <option value="Irrelevant Content">Irrelevant feedback</option>
            </select>

            <button
              onClick={handleFlagReview}
              className="w-full py-2.5 rounded-xl bg-accent text-white font-bold"
            >
              Confirm Flag
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

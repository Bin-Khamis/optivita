import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Star, MessageSquare, CornerDownRight, Check } from "lucide-react";
import { getProviderReviews } from "@/lib/marketplaceData";

export const Route = createFileRoute("/provider/reviews")({
  component: ProviderReviewsDashboard,
});

function ProviderReviewsDashboard() {
  const [provider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const reviewsList = useMemo(() => {
    return provider ? getProviderReviews(provider.id) : [];
  }, [provider]);

  // Reply states
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [submittedReplies, setSubmittedReplies] = useState<Record<string, string>>({
    "rev-301": "Thank you Fahad! Glad to be part of your fitness journey.",
  });

  const handleSubmitReply = (reviewId: string) => {
    const text = replyTextMap[reviewId];
    if (!text?.trim()) return;

    setSubmittedReplies({
      ...submittedReplies,
      [reviewId]: text.trim(),
    });
    setReplyTextMap({
      ...replyTextMap,
      [reviewId]: "",
    });
  };

  // Distribution calculations
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r) => {
      const ratingInt = Math.floor(r.rating) as 5 | 4 | 3 | 2 | 1;
      if (counts[ratingInt] !== undefined) {
        counts[ratingInt]++;
      }
    });

    const total = reviewsList.length || 1;
    return {
      5: Math.round((counts[5] / total) * 100) || 85, // Fallback default distribution
      4: Math.round((counts[4] / total) * 100) || 10,
      3: Math.round((counts[3] / total) * 100) || 3,
      2: Math.round((counts[2] / total) * 100) || 1,
      1: Math.round((counts[1] / total) * 100) || 1,
    };
  }, [reviewsList]);

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
      {/* Left Column: Recent Reviews & Replies Form */}
      <div className="lg:col-span-2 space-y-6">
        <h3 className="font-bold text-sm text-foreground">Recent Client Reviews</h3>

        <div className="space-y-4">
          {reviewsList.map((rev) => (
            <div key={rev.id} className="p-5 rounded-2xl border border-border/60 bg-card space-y-3.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-foreground">{rev.author}</span>
                <span className="text-muted-foreground">{rev.date}</span>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.floor(rev.rating) ? "fill-amber-500 text-amber-500" : "text-secondary"}`}
                  />
                ))}
              </div>

              <p className="text-xs text-muted-foreground italic leading-relaxed">
                “{rev.comment}”
              </p>

              {/* Submitted reply */}
              {submittedReplies[rev.id] && (
                <div className="pl-4 border-l-2 border-accent/40 bg-secondary/10 p-3 rounded-r-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-accent font-bold text-[10px]">
                    <CornerDownRight className="h-3.5 w-3.5" />
                    <span>Your Response</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    “{submittedReplies[rev.id]}”
                  </p>
                </div>
              )}

              {/* Reply form input */}
              {!submittedReplies[rev.id] && (
                <div className="pt-3 border-t border-border/30 flex gap-2">
                  <input
                    type="text"
                    value={replyTextMap[rev.id] || ""}
                    onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                    placeholder="Type a professional response..."
                    className="flex-grow px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSubmitReply(rev.id)}
                    className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-bold shadow-sm"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
          {reviewsList.length === 0 && (
            <p className="text-xs text-muted-foreground py-16 text-center bg-card rounded-2xl border border-dashed">
              No ratings reviews received yet.
            </p>
          )}
        </div>
      </div>

      {/* Right Column: Rating distributions breakdown */}
      <aside className="p-6 rounded-3xl border border-border/60 bg-card space-y-6 shadow-sm">
        <h3 className="font-bold text-xs text-foreground pb-3 border-b border-border/30">Ratings Breakdown</h3>

        {/* Big Number */}
        <div className="text-center space-y-1">
          <p className="text-4xl font-display font-black text-foreground">{provider?.rating || "4.9"}</p>
          <div className="flex justify-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4.5 w-4.5 fill-amber-500" />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground block pt-1">
            Based on {provider?.reviewCount || "128"} verified reviews
          </span>
        </div>

        {/* Progress bars distribution */}
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((stars) => {
            const percent = distribution[stars as 5 | 4 | 3 | 2 | 1];
            return (
              <div key={stars} className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold">
                <span className="w-4 text-right font-bold text-foreground">{stars}★</span>
                <div className="flex-grow h-2 bg-secondary/35 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 text-right">{percent}%</span>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

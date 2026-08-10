import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Award, FileText, CheckCircle2, Languages, Star, MapPin } from "lucide-react";
import { saveProviderToStorage } from "@/lib/marketplaceData";
import { AIService } from "@/lib/recommendationEngine";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/provider/profile")({
  component: ProviderProfileManagement,
});

function ProviderProfileManagement() {
  const [provider, setProvider] = useState<any>(() => {
    const session = localStorage.getItem("optivita_provider_session");
    return session ? JSON.parse(session) : null;
  });

  const [name, setName] = useState(provider?.name || "");
  const [title, setTitle] = useState(provider?.professionalTitle || provider?.type || "");
  const [bio, setBio] = useState(provider?.bio || "");
  const [startingPrice, setStartingPrice] = useState(provider?.startingPrice || 150);
  const [languages, setLanguages] = useState<string[]>(provider?.languages || ["Arabic", "English"]);

  const [loadingBio, setLoadingBio] = useState(false);

  const handleImproveBio = async () => {
    if (!bio.trim()) {
      toast.warning("Please enter some draft text in your biography first.");
      return;
    }
    setLoadingBio(true);
    try {
      const response = await AIService.generateText(`Improve biography description professionals: ${bio}`);
      setBio(response);
      toast.success("Biography draft improved with AI recommendations!");
    } catch {
      toast.error("Failed to connect to the AI model services.");
    } finally {
      setLoadingBio(false);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;

    const updated = {
      ...provider,
      name,
      professionalTitle: title,
      bio,
      startingPrice: Number(startingPrice),
      languages,
    };

    saveProviderToStorage(updated);
    setProvider(updated);
    toast.success("Profile updated successfully!");
  };

  const verificationStatus = provider?.verified;

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
      {/* Left: Edit Profile Form */}
      <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-6 shadow-soft">
        <div className="space-y-1 pb-4 border-b border-border/30">
          <h2 className="text-lg font-display font-black text-foreground">Edit Public Profile</h2>
          <p className="text-[10px] text-muted-foreground">Keep your wellness expertise detail accurate for clients</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Professional Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Starting Session Price (SAR)</label>
              <input
                type="number"
                required
                value={startingPrice}
                onChange={(e) => setStartingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Consultation Languages</label>
              <input
                type="text"
                value={languages.join(", ")}
                onChange={(e) => setLanguages(e.target.value.split(",").map((s) => s.trim()))}
                placeholder="e.g. Arabic, English"
                className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>

            <div className="space-y-2 col-span-2 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Public Bio Description</label>
                <button
                  type="button"
                  onClick={handleImproveBio}
                  disabled={loadingBio}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-[9px] font-bold text-accent hover:bg-accent/25 transition-all disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{loadingBio ? "Improving..." : "Improve with AI"}</span>
                </button>
              </div>
              <textarea
                rows={5}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>
          </div>

          <button type="submit" className="px-6 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-soft hover:opacity-95">
            Save Profile Updates
          </button>
        </form>
      </div>

      {/* Right: Live Public Card Preview */}
      <aside className="space-y-6">
        <h3 className="text-sm font-bold text-foreground">Live Card Preview</h3>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft relative overflow-hidden space-y-4">
          <div className="flex gap-4">
            <img
              src={provider?.avatar}
              alt={name}
              className="h-16 w-16 rounded-xl object-cover border border-border/40"
            />
            <div className="space-y-1 flex-grow">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-xs text-foreground truncate max-w-[120px]">{name}</h4>
                {verificationStatus ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                    <ShieldAlert className="h-3 w-3" />
                    Pending
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground capitalize leading-none">{title}</p>
              <div className="flex items-center gap-1 text-[10px] text-amber-500">
                <Star className="h-3 w-3 fill-amber-500" />
                <span className="font-bold text-foreground">{provider?.rating || "0.0"}</span>
                <span className="text-muted-foreground">({provider?.reviewCount || "0"} reviews)</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {bio || "Enter your bio description to see it appear here..."}
          </p>

          <div className="border-t border-border/30 pt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{provider?.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Languages className="h-3.5 w-3.5" />
              <span>Speaks {languages.join(", ")}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[9px] text-muted-foreground block">Session starting from</span>
              <span className="text-xs font-black text-foreground">SAR {startingPrice}</span>
            </div>
            <span className="px-3.5 py-1.5 rounded-lg bg-secondary/35 text-[10px] font-bold text-muted-foreground">
              Book Appointment
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

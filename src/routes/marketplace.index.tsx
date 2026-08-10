import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  Star,
  MapPin,
  CheckCircle2,
  Apple,
  Dumbbell,
  Building,
  HeartPulse,
  Sparkles,
  ChevronRight,
  Video,
} from "lucide-react";
import { PROVIDERS, CATEGORIES } from "@/lib/marketplaceData";
import { RecommendationEngine, AIService } from "@/lib/recommendationEngine";
import { MessageSquare, Bot, Send, X } from "lucide-react";

export const Route = createFileRoute("/marketplace/")({
  component: MarketplaceHome,
});

function MarketplaceHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Load AI Recommendations
  const aiRecommended = useMemo(() => {
    // Check if customer session exists to load personalization
    const customerSession = localStorage.getItem("optivita_crm_cache");
    let userId = "default-user";
    if (customerSession) {
      try {
        const db = JSON.parse(customerSession);
        const active = db["Program Enrollments"]?.[0];
        if (active) userId = active["Enrollment ID"];
      } catch {}
    }
    return RecommendationEngine.getRecommendations(userId).slice(0, 3);
  }, []);

  // AI Assistant Chat States
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { text: "Hello! I am your Optivita AI Assistant. How can I help you find wellness experts or services today?", sender: "ai" }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = inputVal;
    setMessages(prev => [...prev, { text: userMsg, sender: "user" }]);
    setInputVal("");
    setLoadingMsg(true);

    try {
      const response = await AIService.generateText(userMsg);
      setMessages(prev => [...prev, { text: response, sender: "ai" }]);
    } catch {
      setMessages(prev => [...prev, { text: "Failed to connect to the AI model services.", sender: "ai" }]);
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({
        to: "/marketplace/$category",
        params: { category: "all" },
        search: { q: searchQuery },
      });
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Apple":
        return <Apple className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case "Dumbbell":
        return <Dumbbell className="h-6 w-6 text-teal-600 dark:text-teal-400" />;
      case "Building":
        return <Building className="h-6 w-6 text-sky-600 dark:text-sky-400" />;
      default:
        return <HeartPulse className="h-6 w-6 text-rose-600 dark:text-rose-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-16">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-brand-gradient">Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Find trusted health and wellness professionals for your journey.
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nutritionists, trainers, gyms..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-accent bg-secondary/25 border-border/60"
          />
        </form>
      </div>

      {/* 2. Premium Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-brand-gradient text-white p-8 md:p-14 shadow-soft">
        <div className="absolute inset-0 bg-gradient-hero-overlay opacity-80" />
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            <span>Verified Professionals Only</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black leading-tight tracking-tight">
            Find the Right Expert for Your Health Journey
          </h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Connect with verified nutritionists, trainers, gyms and wellness professionals — all integrated through Optivita for seamless progress tracking.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <a
              href="#categories"
              className="px-6 py-3 rounded-full bg-white text-primary font-bold text-sm shadow-md hover:scale-105 transition-transform"
            >
              Explore Experts
            </a>
            <Link
              to="/calculator"
              className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition-colors"
            >
              Take Health Check
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Explore Categories Grid */}
      <section id="categories" className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display font-extrabold text-foreground">Explore Categories</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to="/marketplace/$category"
              params={{ category: cat.id }}
              className="group p-6 rounded-2xl border border-border/60 bg-card hover:bg-secondary/10 hover:border-accent hover:shadow-soft transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                {getCategoryIcon(cat.icon)}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-foreground group-hover:text-accent transition-colors">
                  {cat.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-accent pt-2">
                <span>Browse {cat.title}</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Recommended For You (Personalization simulator) */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-display font-extrabold text-foreground">Recommended For You</h3>
          <span className="px-2 py-0.5 rounded bg-accent/15 text-accent text-[8px] font-black uppercase">
            AI Personalized
          </span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiRecommended.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </section>

      {/* 5. Top Rated Professionals */}
      <section className="space-y-6">
        <h3 className="text-2xl font-display font-extrabold text-foreground">Top Rated Professionals</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROVIDERS.filter((p) => p.rating >= 4.8).slice(0, 3).map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </section>

      {/* 6. Online Consultations Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display font-extrabold text-foreground">Online Consultations</h3>
          <Link
            to="/marketplace/$category"
            params={{ category: "all" }}
            search={{ online: "true" }}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
          >
            <span>See All Online</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROVIDERS.filter((p) => p.onlineAvailability).slice(0, 3).map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </section>

      {/* 7. Professionals Near You */}
      <section className="space-y-6">
        <h3 className="text-2xl font-display font-extrabold text-foreground">Professionals Near You</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROVIDERS.map((provider, idx) => (
            <ProviderCard key={provider.id} provider={provider} distance={`${(idx + 1) * 1.5} km away`} />
          ))}
        </div>
      </section>

      {/* Floating AI Assistant Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 text-xs">
        {chatOpen && (
          <div className="w-80 h-96 rounded-3xl border border-border/60 bg-card shadow-glow flex flex-col justify-between overflow-hidden animate-scale-up text-left">
            {/* Header */}
            <div className="bg-accent p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold">
                <Bot className="h-4.5 w-4.5" />
                <span>Optivita AI Assistant</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-1 rounded-full hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-secondary/5">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl max-w-[85%] leading-normal ${
                    m.sender === "user"
                      ? "ml-auto bg-accent text-white rounded-tr-none"
                      : "mr-auto bg-card border text-foreground rounded-tl-none"
                  }`}
                >
                  <p>{m.text}</p>
                </div>
              ))}
              {loadingMsg && (
                <div className="mr-auto p-3 rounded-2xl bg-card border text-muted-foreground rounded-tl-none flex items-center gap-1.5 font-bold">
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="p-3 border-t flex gap-2 bg-card">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-grow px-3.5 py-2 border rounded-full bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={loadingMsg}
                className="p-2 bg-accent hover:opacity-90 text-white rounded-full transition-opacity disabled:opacity-50"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        )}

        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="h-12 w-12 rounded-full bg-accent hover:opacity-95 text-white flex items-center justify-center shadow-glow transition-transform hover:scale-105"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// Reusable ProviderCard Component declared here
interface ProviderCardProps {
  provider: typeof PROVIDERS[0];
  distance?: string;
}

export function ProviderCard({ provider, distance }: ProviderCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 hover:shadow-soft transition-all duration-300 flex flex-col justify-between space-y-4">
      <div className="flex gap-4">
        <img
          src={provider.avatar}
          alt={provider.name}
          className="h-16 w-16 rounded-xl object-cover border border-border/40"
        />
        <div className="space-y-1 flex-grow">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-sm text-foreground truncate max-w-[150px]">
              {provider.name}
            </h4>
            {provider.verified && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-wide uppercase">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground capitalize">{provider.type}</p>
          <div className="flex items-center gap-1.5 text-xs text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span className="font-bold">{provider.rating}</span>
            <span className="text-muted-foreground">({provider.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {provider.specializations.slice(0, 2).map((spec, i) => (
          <span key={i} className="text-[10px] font-semibold bg-secondary/35 text-foreground px-2.5 py-1 rounded-full">
            {spec}
          </span>
        ))}
      </div>

      <div className="border-t border-border/30 pt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{provider.location}</span>
          {distance && <span className="text-[10px] text-accent font-bold">({distance})</span>}
        </div>
        {provider.onlineAvailability && (
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <Video className="h-3.5 w-3.5" />
            <span>Online</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-[10px] text-muted-foreground block">Starting from</span>
          <span className="text-sm font-black text-foreground">SAR {provider.startingPrice}</span>
        </div>
        <Link
          to="/marketplace/provider/$providerId"
          params={{ providerId: provider.id }}
          className="px-4.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

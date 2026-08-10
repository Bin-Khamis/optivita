import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { programs } from "@/lib/programs";
import { PROVIDERS } from "@/lib/marketplaceData";
import {
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Calendar,
  Activity,
  Heart,
  TrendingUp,
  Apple,
  Dumbbell,
  Shield,
  Smartphone,
  HeartPulse,
  ChevronRight,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";
import logoAsset from "@/assets/optivita-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Home,
});

const trustBenefits = [
  {
    title: "Personalized Programs",
    desc: "Every wellness plan is tailored to your unique metabolic profile and intake inputs.",
    icon: Sparkles,
  },
  {
    title: "Expert Guidance",
    desc: "Connect directly with certified nutritionists, trainers, and local wellness clinics.",
    icon: Award,
  },
  {
    title: "Progress Tracking",
    desc: "Log daily habits, sleep targets, and activity metrics for direct coach assessment.",
    icon: TrendingUp,
  },
  {
    title: "Secure Platform",
    desc: "Your medical intake data, test results, and personal profile are fully encrypted and secure.",
    icon: Shield,
  },
];

function Home() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Check if there is an active logged-in session
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Check client portal session
    const session = localStorage.getItem("optivita_crm_cache");
    if (session) {
      try {
        const db = JSON.parse(session);
        const activeUser = db["Program Enrollments"]?.[0];
        if (activeUser) {
          setIsLoggedIn(true);
          setUserName(activeUser.fullName || "Valued Client");
        }
      } catch {}
    }

    // Delay welcome popup
    const timer = setTimeout(() => {
      setShowWelcomeModal(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Cycle active step in flowchart for subtle animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <SiteHeader />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-28 pb-16 overflow-hidden">
        {/* Subtle background glow accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-400/10 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-teal-400/10 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-6 space-y-7 text-left">
            {/* Premium Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest w-fit select-none">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>YOUR PRECISION HEALTH PARTNER</span>
            </div>

            {/* Headline with Safe Inline Clip style */}
            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl leading-[1.12] tracking-tight text-slate-900 dark:text-white select-none">
              YOUR HEALTH.
              <br />
              YOUR DATA.
              <br />
              <span
                className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                YOUR PLAN.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-[540px] leading-relaxed">
              Personalized wellness programs, expert guidance and integrated
              progress tracking — all unified under one secure health-tech
              ecosystem.
            </p>

            {/* Button Layout & CTAs */}
            <div className="space-y-5 pt-2">
              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  to="/calculator"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 dark:bg-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-8 py-4 font-black uppercase tracking-wider text-xs shadow-soft hover:scale-105 transition-all duration-350 border border-slate-950 dark:border-slate-800"
                >
                  <Activity className="h-4.5 w-4.5 text-white" />
                  CHECK YOUR HEALTH
                </Link>
                <a
                  href="#programs"
                  className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-8 py-4 font-bold text-xs uppercase tracking-wider hover:border-emerald-500 hover:text-emerald-500 hover:scale-102 transition-all duration-350"
                >
                  EXPLORE PROGRAMS
                </a>
              </div>
              <div className="pl-1">
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent hover:underline"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0 text-accent" />
                  <span>Explore Marketplace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Wellness Visual + Floating Overlays */}
          <div className="lg:col-span-6 flex justify-center items-center relative py-8">
            {/* Subtle health-tech vector background graphic */}
            <div className="absolute inset-0 pointer-events-none opacity-30 select-none hidden sm:block">
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                <circle cx="150" cy="150" r="130" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 4" className="text-slate-300 dark:text-slate-700" />
                <line x1="50" y1="50" x2="350" y2="350" stroke="currentColor" strokeWidth="0.75" className="text-slate-300 dark:text-slate-700" />
                <circle cx="50" cy="50" r="3.5" fill="currentColor" className="text-emerald-500" />
                <circle cx="350" cy="350" r="3.5" fill="currentColor" className="text-teal-500" />
              </svg>
            </div>

            {/* Photo Card container */}
            <div className="relative w-full max-w-md aspect-[1.1] rounded-[48px] overflow-hidden shadow-glow border border-slate-200/50 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop&q=80"
                alt="Healthy modern wellness active posture"
                className="h-full w-full object-cover select-none"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Overlap Card 1: Sample Health Score */}
            <div className="absolute -top-4 -left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4.5 py-3 rounded-2xl border border-border/80 shadow-glow flex items-center gap-3 animate-bounce-slow max-w-[195px] text-left">
              <div className="relative h-10 w-10 rounded-full border-[3px] border-emerald-500/25 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin-slow" />
                <span className="text-xs font-black">82</span>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider truncate">Sample Health Score</p>
                <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate">Example Profile</p>
              </div>
            </div>

            {/* Overlap Card 2: Hydration Status */}
            <div className="absolute bottom-6 -right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4.5 py-3.5 rounded-2xl border border-border/80 shadow-glow space-y-1.5 text-left w-44 animate-pulse-slow">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-800 dark:text-slate-200">DAILY HYDRATION</span>
                <span className="font-black text-cyan-500">84%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-[84%] rounded-full" />
              </div>
              <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Sample Progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE PROGRAMS SECTION */}
      <section id="programs" className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Signature Programs
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white pt-2">
              PROGRAMS DESIGNED AROUND YOU
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Personalized health programs built around your metabolic targets, nutrition preferences, and lifestyle goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((p, i) => (
              <Link
                key={p.id}
                to="/programs/$programId"
                params={{ programId: p.id }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-slate-200/80 dark:border-slate-800 bg-card p-6.5 shadow-soft hover:shadow-glow hover:-translate-y-1.5 transition-all duration-300 text-left"
              >
                <div className="space-y-4">
                  {p.image && (
                    <div className="relative aspect-[1.5] w-full overflow-hidden rounded-2xl border border-border/50">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                      {p.duration} Duration
                    </span>
                    <h3 className="mt-1 font-display font-black text-2xl text-slate-900 dark:text-white">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      {p.tagline}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.focus.map((f) => (
                      <span
                        key={f}
                        className="text-[9px] font-bold bg-secondary text-secondary-foreground rounded-md px-2.5 py-1"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-bold text-accent">
                  <span>View Details & Intake Form</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-black uppercase tracking-wider text-xs px-6 py-3.5 hover:bg-accent hover:text-white transition-colors"
            >
              <span>Explore All Programs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. OPTIVITA HEALTH JOURNEY MARKETPLACE */}
      <section className="py-24 bg-secondary/20 border-t border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Wellness Network
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white pt-2">
              HEALTH JOURNEY MARKETPLACE
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Discover verified local professionals, sports clinics, and medical consultants synced for continuous health tracking.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { label: "Nutrition", icon: Apple, color: "text-emerald-500 bg-emerald-500/10", path: "/marketplace/nutrition" },
              { label: "Fitness", icon: Dumbbell, color: "text-teal-500 bg-teal-500/10", path: "/marketplace/fitness" },
              { label: "Gyms", icon: Award, color: "text-sky-500 bg-sky-500/10", path: "/marketplace/gyms" },
              { label: "Wearables", icon: Smartphone, color: "text-amber-500 bg-amber-500/10", path: "/marketplace" },
              { label: "Health Devices", icon: Activity, color: "text-blue-500 bg-blue-500/10", path: "/marketplace" },
              { label: "Wellness", icon: HeartPulse, color: "text-rose-500 bg-rose-500/10", path: "/marketplace/wellness" },
            ].map((cat, idx) => (
              <Link
                key={idx}
                to={cat.path}
                className="group p-5 rounded-3xl bg-card border border-border/50 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-accent hover:shadow-soft transition-all duration-300 flex flex-col items-center justify-center text-center space-y-3.5"
              >
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}
                >
                  <cat.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Actual Database Providers Showcase */}
          <div className="mt-16 space-y-6 text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">
                Featured Verified Experts
              </h3>
              <Link
                to="/marketplace"
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
              >
                <span>Browse Marketplace Directory</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PROVIDERS.slice(0, 3).map((provider) => (
                <Link
                  key={provider.id}
                  to={`/marketplace/provider/${provider.id}`}
                  className="p-5 bg-card border border-border/60 rounded-3xl flex items-center gap-4 hover:shadow-soft transition-shadow text-left"
                >
                  <img
                    src={provider.avatar}
                    alt={provider.name}
                    className="h-14 w-14 rounded-full object-cover border"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm truncate text-slate-850 dark:text-slate-200">
                        {provider.name}
                      </h4>
                      {provider.verified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground capitalize">{provider.type}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                      Starting from: <span className="text-accent">SAR {provider.startingPrice}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SOPHISTICATED HEALTH JOURNEY FLOWCHART */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Flowchart
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white pt-2">
              THE OPTIVITA HEALTH JOURNEY
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your data unlocks recommendations, connects you with programs and products, and charts your progress.
            </p>
          </div>

          {/* SVG-based Connected Flowchart */}
          <div className="relative max-w-4xl mx-auto py-10">
            {/* Flowchart items */}
            <div className="grid grid-cols-2 md:grid-cols-7 gap-6 relative z-10">
              {[
                { title: "Health Check", desc: "1-Minute Assessment" },
                { title: "Health Profile", desc: "Metabolic Classification" },
                { title: "Recommendations", desc: "AI Powered Matchmaking" },
                { title: "Programs & Shop", desc: "Select and Purchase" },
                { title: "Client Portal", desc: "Personalized Dashboards" },
                { title: "Track Progress", desc: "Water, Sleep & Fitness logs" },
                { title: "Better Health", desc: "Sustainable Outcomes" },
              ].map((step, idx) => {
                const isActive = idx === activeStep;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all duration-500 text-left space-y-2 flex flex-col justify-between ${
                      isActive
                        ? "bg-emerald-500/10 border-emerald-500 shadow-soft scale-105"
                        : "bg-card border-border/60 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isActive ? "bg-emerald-500 text-white" : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {step.title}
                      </h4>
                      <p className="text-[9px] text-muted-foreground leading-snug">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Connecting line graphic background */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/40 to-emerald-500/10 pointer-events-none hidden md:block" />
          </div>

          <div className="text-center mt-12">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient text-white font-black uppercase tracking-wider text-xs px-8 py-4 shadow-soft hover:opacity-95 transition"
            >
              <span>🩺 Start Health Check</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE HEALTH SCORE WIDGET */}
      <section className="py-24 bg-secondary/15 border-t border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center text-left">
          {/* Left Column: Visual Dashboard Indicator */}
          <div className="lg:col-span-6 bg-card border border-border/80 rounded-[36px] p-8 shadow-glow space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border/40">
              <div>
                <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                  Sample Health Profile
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                  Logged out / anonymous preview
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase">
                Healthy Class
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
              {/* Radial Progress Score */}
              <div className="relative h-32 w-32 rounded-full border-[10px] border-emerald-500/15 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white">82</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Score
                </span>
                <div className="absolute inset-0 rounded-full border-[10px] border-emerald-500 border-t-transparent border-r-transparent -m-[10px] rotate-45" />
              </div>

              {/* Individual Metrics */}
              <div className="flex-1 space-y-3.5 w-full">
                {[
                  { label: "Nutrition Score", value: "84%", color: "bg-emerald-500" },
                  { label: "Daily Physical Activity", value: "76%", color: "bg-teal-500" },
                  { label: "Sleep Target Meet", value: "72%", color: "bg-blue-500" },
                  { label: "Lifestyle Assessment", value: "81%", color: "bg-purple-500" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-650 dark:text-slate-450">{item.label}</span>
                      <span className="text-slate-800 dark:text-slate-200">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: item.value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Personalization Description */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Personalized Plan
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white pt-2 leading-tight">
              YOUR HEALTH.
              <br />
              PERSONALIZED.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Once you complete the 1-Minute health assessment, our engine builds a tailored profile mapping target ranges. This data directly dynamically shapes:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                <span>Custom calorie target estimates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                <span>Hydration goal adjustments</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                <span>Personalized activity guidance</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                <span>Tailored program recommendations</span>
              </li>
            </ul>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                to="/calculator"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient text-white font-black uppercase tracking-wider text-xs px-8 py-4 shadow-soft hover:opacity-95 transition"
              >
                <span>Start Free Assessment</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RECOMMENDED FOR YOU (PERSONALIZATION SECTION) */}
      <section className="py-24 bg-card border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 max-w-3xl text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              Discover Your Personalized Recommendations
            </h3>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-slate-850 dark:text-slate-200">
              Recommendations unlock after your Health Check
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Complete your profile assessment. Optivita will automatically display matching nutrition programs, verified specialists, and products based on your data.
            </p>
            <div className="pt-2">
              <Link
                to="/calculator"
                className="inline-flex items-center gap-1.5 rounded-full bg-accent text-white font-black uppercase tracking-wider text-[10px] px-6 py-3 hover:bg-accent/90 transition-colors shadow-soft"
              >
                <span>Start Assessment</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CLIENT JOURNEY TRACKER MOCKUP */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center text-left">
          {/* Left Column: Descriptions */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Product Preview
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              YOUR JOURNEY
              <br />
              CONTINUES
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Enrolled clients log directly into a dedicated progress hub. Connect with your coach, update fitness checkins, download menu PDFs, and view active clinical indices in real-time.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/portal/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient text-white font-black uppercase tracking-wider text-xs px-8 py-4 shadow-soft hover:opacity-95 transition"
              >
                <span>Enter Client Portal</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Portal Product Mockup UI */}
          <div className="lg:col-span-7 bg-card border border-border/80 rounded-[36px] p-6 shadow-glow space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-border/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Portal Dashboard</span>
              </div>
              <span className="text-[10px] text-slate-400">Sample Client Account preview</span>
            </div>

            {/* Layout simulation */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-secondary/30 rounded-xl space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400">MEAL PLAN</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Day 14 Menu</p>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">Balanced</span>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400">WORKOUT</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Core Training</p>
                <span className="text-[9px] bg-teal-500/10 text-teal-600 px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400">APPOINTMENTS</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Thu 16:00</p>
                <span className="text-[9px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">Confirmed</span>
              </div>
            </div>

            {/* Coach Chat mockup snippet */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl space-y-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Latest Coach Message</p>
              <p className="text-xs italic text-slate-650 dark:text-slate-350 leading-relaxed">
                "Keep up the great work on hydration targets. We will review your body weight index measurements on the Thursday sync!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TRUST / PLATFORM BENEFITS SECTION */}
      <section className="py-24 bg-card border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Why Optivita
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white pt-2">
              PRECISION DELIVERED WITH CARE
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              We focus on evidence-based health technology, direct accountability, and clinical precision.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustBenefits.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-secondary/15 border border-border/40 space-y-3.5 text-left hover:shadow-soft transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="py-24 bg-brand-gradient text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero-overlay opacity-80" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase">
            START YOUR OPTIVITA JOURNEY
          </h2>
          <p className="text-sm text-white/90 max-w-xl mx-auto leading-relaxed">
            Discover your current metabolic indexes in less than one minute. Access personalized coaching programs and verified local specialists today.
          </p>
          <div className="pt-4">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-1.5 rounded-full bg-white text-primary px-8 py-4 font-black uppercase tracking-wider text-xs shadow-md hover:scale-105 transition"
            >
              <span>🩺 Get Started Free</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Welcome Modal Popup */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center px-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWelcomeModal(false)}
          />

          <div className="relative bg-card border border-border/80 rounded-[36px] w-full max-w-lg p-6 md:p-8 shadow-glow z-10 overflow-hidden text-foreground text-left">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-gradient" />

            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mt-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-1 bg-white rounded-xl shadow-sm border border-border/40 inline-flex items-center justify-center shrink-0">
                  <img src={logoAsset.url} alt="Optivita" className="h-9 w-9 object-contain" />
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase text-vital bg-vital/10 px-3.5 py-1.5 rounded-full border border-vital/20">
                  Welcome to OPTIVITA
                </span>
              </div>
              <h3 className="font-display font-extrabold text-2xl md:text-3xl text-foreground leading-tight">
                Your Precision Health Partner
              </h3>

              <div className="mt-4 bg-secondary/40 rounded-2xl p-4 border border-border/50">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-accent animate-pulse" />
                  How Healthy Are You? Find out in just one minute.
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">
                  Complete your FREE Optivita Health Assessment and discover your current health
                  status instantly. We'll generate a personalized health report designed using
                  internationally accepted health calculations.
                </p>
              </div>

              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-6 mb-3">
                You'll receive your personalized:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-foreground mb-6 font-semibold">
                {[
                  "Health Score (0–100)",
                  "BMI Analysis & Classification",
                  "Healthy Weight Target Range",
                  "Daily Calorie Needs Target",
                  "Daily Hydration Target",
                  "Wellness Recommendation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-vital shrink-0 font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground bg-secondary/30 p-2.5 rounded-lg border border-border/20 text-center font-semibold">
                No registration required. Results are available immediately.
              </p>
            </div>

            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              <Link
                to="/calculator"
                onClick={() => setShowWelcomeModal(false)}
                className="w-full text-center bg-brand-gradient text-white font-black uppercase tracking-wider text-xs py-4 rounded-full shadow-glow hover:opacity-95 hover:scale-[1.01] transition-all duration-350 flex items-center justify-center gap-2"
              >
                🩺 Check My Health
              </Link>
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="w-full text-center bg-card border border-border text-foreground hover:bg-secondary/40 font-bold py-4 rounded-full transition-all duration-350 text-xs"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

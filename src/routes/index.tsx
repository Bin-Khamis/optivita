import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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

type IntroState = "loading" | "video" | "logo" | "reveal" | "done";

function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // Hero Stagger Entrance States
  const [heroActive, setHeroActive] = useState(false);
  const [heroScoreVal, setHeroScoreVal] = useState(0);
  const [heroHydrationVal, setHeroHydrationVal] = useState(0);

  // Scroll Parallax state
  const [scrollY, setScrollY] = useState(0);

  // Health Score Widget Animation States (Section 5)
  const [scoreWidgetActive, setScoreWidgetActive] = useState(false);
  const [scoreWidgetVal, setScoreWidgetVal] = useState(0);
  const [nutritionVal, setNutritionVal] = useState(0);
  const [activityVal, setActivityVal] = useState(0);
  const [sleepVal, setSleepVal] = useState(0);
  const [lifestyleVal, setLifestyleVal] = useState(0);

  // Flowchart SVG path state
  const [flowchartActive, setFlowchartActive] = useState(false);

  // Personalization Convergence States (Section 6)
  const [personalizationActive, setPersonalizationActive] = useState(false);

  // Current active viewport section for sidebar tracker
  const [currentSection, setCurrentSection] = useState("hero");

  // Check if there is an active logged-in session
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // Check session state, trigger count up, and set welcome modal on mount
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

    // Instantly activate Hero entrance
    setHeroActive(true);

    // Welcome modal triggers after a slight delay
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeModal(true);
    }, 1200);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setHeroScoreVal(82);
      setHeroHydrationVal(84);
      return () => clearTimeout(welcomeTimer);
    }

    // Score count (0 to 82)
    let curSc = 0;
    const scoreTimer = setInterval(() => {
      curSc += 2;
      if (curSc >= 82) {
        setHeroScoreVal(82);
        clearInterval(scoreTimer);
      } else {
        setHeroScoreVal(curSc);
      }
    }, 20);

    // Hydration progress (0 to 84)
    let curHyd = 0;
    const hydTimer = setInterval(() => {
      curHyd += 2;
      if (curHyd >= 84) {
        setHeroHydrationVal(84);
        clearInterval(hydTimer);
      } else {
        setHeroHydrationVal(curHyd);
      }
    }, 20);

    return () => {
      clearTimeout(welcomeTimer);
      clearInterval(scoreTimer);
      clearInterval(hydTimer);
    };
  }, []);

  // Scroll listeners for Parallax and Side Tracker with requestAnimationFrame Throttling
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setScrollY(currentY);

          // Sidebar indicators offsets
          const scrollPos = currentY + 280;
          const flowchartEl = document.getElementById("flowchart");
          const programsEl = document.getElementById("programs");
          const marketplaceEl = document.getElementById("marketplace");
          const clientPortalEl = document.getElementById("client-portal");

          if (clientPortalEl && scrollPos >= clientPortalEl.offsetTop) {
            setCurrentSection("portal");
          } else if (marketplaceEl && scrollPos >= marketplaceEl.offsetTop) {
            setCurrentSection("marketplace");
          } else if (programsEl && scrollPos >= programsEl.offsetTop) {
            setCurrentSection("programs");
          } else if (flowchartEl && scrollPos >= flowchartEl.offsetTop) {
            setCurrentSection("flowchart");
          } else {
            setCurrentSection("hero");
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global IntersectionObserver reveals
  useEffect(() => {
    if (typeof window === "undefined") return;

    const options = {
      root: null,
      rootMargin: "0px -10% -10% 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-active");

          if (entry.target.id === "flowchart-section") {
            setFlowchartActive(true);
          }
          if (entry.target.id === "health-score-section") {
            setScoreWidgetActive(true);
          }
          if (entry.target.id === "personalization-section") {
            setPersonalizationActive(true);
          }
        }
      });
    }, options);

    const revealElements = document.querySelectorAll(".scroll-reveal");
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Section 5 widget count up once visible
  useEffect(() => {
    if (scoreWidgetActive) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setScoreWidgetVal(82);
        setNutritionVal(84);
        setActivityVal(76);
        setSleepVal(72);
        setLifestyleVal(81);
        return;
      }

      let scoreTarget = 82;
      let curScore = 0;
      const scoreTimer = setInterval(() => {
        curScore += 2;
        if (curScore >= scoreTarget) {
          setScoreWidgetVal(scoreTarget);
          clearInterval(scoreTimer);
        } else {
          setScoreWidgetVal(curScore);
        }
      }, 15);

      let curNut = 0;
      const nutTimer = setInterval(() => {
        curNut += 2;
        if (curNut >= 84) {
          setNutritionVal(84);
          clearInterval(nutTimer);
        } else {
          setNutritionVal(curNut);
        }
      }, 15);

      let curAct = 0;
      const actTimer = setInterval(() => {
        curAct += 2;
        if (curAct >= 76) {
          setActivityVal(76);
          clearInterval(actTimer);
        } else {
          setActivityVal(curAct);
        }
      }, 15);

      let curSleep = 0;
      const sleepTimer = setInterval(() => {
        curSleep += 2;
        if (curSleep >= 72) {
          setSleepVal(72);
          clearInterval(sleepTimer);
        } else {
          setSleepVal(curSleep);
        }
      }, 15);

      let curLife = 0;
      const lifeTimer = setInterval(() => {
        curLife += 2;
        if (curLife >= 81) {
          setLifestyleVal(81);
          clearInterval(lifeTimer);
        } else {
          setLifestyleVal(curLife);
        }
      }, 15);

      return () => {
        clearInterval(scoreTimer);
        clearInterval(nutTimer);
        clearInterval(actTimer);
        clearInterval(sleepTimer);
        clearInterval(lifeTimer);
      };
    }
  }, [scoreWidgetActive]);

  // Cycle active flowchart steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 7);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden">
      {/* Self-contained styling module for Premium GPU Accelerated animations */}
      <style>{`
        @keyframes logoScale {
          0% { transform: scale(0.92); opacity: 0; filter: blur(5px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes fadeInUp {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-logo-scale {
          animation: logoScale 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }

        /* Scroll Reveal CSS triggers with GPU Layer rendering */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(24px);
          will-change: transform, opacity;
          transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-active {
          opacity: 1;
          transform: translateY(0);
        }
        .scroll-reveal img {
          transform: scale(1.05);
          will-change: transform;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-active img {
          transform: scale(1);
        }

        /* Sequential delays */
        .delay-stagger-1 { transition-delay: 100ms; }
        .delay-stagger-2 { transition-delay: 200ms; }
        .delay-stagger-3 { transition-delay: 300ms; }
        .delay-stagger-4 { transition-delay: 450ms; }
        .delay-stagger-5 { transition-delay: 600ms; }
      `}</style>

      {/* Side Scroll Progress Tracker (Timeline Sidebar, Desktop only) */}
      <div className="fixed right-8 top-[35%] z-45 hidden xl:flex flex-col items-center gap-6 select-none pointer-events-none animate-fade-in">
        <div className="relative w-[2px] bg-slate-200 dark:bg-slate-800 h-60 flex flex-col justify-between">
          <div
            className="absolute top-0 w-full bg-accent transition-all duration-700 ease-out"
            style={{
              height:
                currentSection === "hero"
                  ? "0%"
                  : currentSection === "flowchart"
                  ? "25%"
                  : currentSection === "programs"
                  ? "50%"
                  : currentSection === "marketplace"
                  ? "75%"
                  : "100%",
            }}
          />
          {[
            { id: "hero", label: "Intro" },
            { id: "flowchart", label: "Flow" },
            { id: "programs", label: "Programs" },
            { id: "marketplace", label: "Market" },
            { id: "portal", label: "Portal" },
          ].map((sectionItem) => {
            const isActive = currentSection === sectionItem.id;
            return (
              <div key={sectionItem.id} className="relative flex items-center justify-center -mx-[5px]">
                <div
                  className={`h-3 w-3 rounded-full border-2 transition-all duration-500 ${
                    isActive
                      ? "bg-accent border-accent scale-125 shadow-glow"
                      : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  }`}
                />
                <span
                  className={`absolute right-6 text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                    isActive ? "text-accent translate-x-0 opacity-100" : "text-slate-400 translate-x-2 opacity-0"
                  }`}
                >
                  {sectionItem.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <SiteHeader />

      {/* 1. HERO SECTION */}
      <section id="hero" className="relative min-h-[90vh] flex items-center pt-28 pb-16 overflow-hidden">
        {/* Atmospheric background glow */}
        <div
          className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ${
            heroActive ? "opacity-40" : "opacity-0"
          }`}
        >
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-400/15 blur-[130px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-teal-400/15 blur-[130px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
          {/* Left Column: Copy staggered entries */}
          <div className="lg:col-span-6 space-y-7 text-left">
            {/* Pill Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest w-fit select-none transition-all duration-700 ease-out transform ${
                heroActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>YOUR PRECISION HEALTH PARTNER</span>
            </div>

            {/* Headline revealing line-by-line */}
            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl leading-[1.12] tracking-tight text-slate-900 dark:text-white select-none">
              <span
                className={`block transition-all duration-700 delay-150 ease-out transform ${
                  heroActive ? "opacity-100 translate-y-0 filter-none" : "opacity-0 translate-y-4 filter blur-[2px]"
                }`}
              >
                YOUR HEALTH.
              </span>
              <span
                className={`block transition-all duration-700 delay-300 ease-out transform ${
                  heroActive ? "opacity-100 translate-y-0 filter-none" : "opacity-0 translate-y-4 filter blur-[2px]"
                }`}
              >
                YOUR DATA.
              </span>
              <span
                className={`block transition-all duration-700 delay-450 ease-out transform ${
                  heroActive ? "opacity-100 translate-y-0 filter-none" : "opacity-0 translate-y-4 filter blur-[2px]"
                }`}
              >
                <span
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  YOUR PLAN.
                </span>
              </span>
            </h1>

            {/* Supporting Copy */}
            <p
              className={`text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-[540px] leading-relaxed transition-all duration-700 delay-600 ease-out transform ${
                heroActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Personalized nutrition, wellness programs and progress tracking — built around your goals.
            </p>

            {/* Tagline Concept */}
            <div
              className={`text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2 select-none transition-all duration-700 delay-700 ease-out transform ${
                heroActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span>Precision nutrition.</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Sustainable results.</span>
            </div>

            {/* Buttons & Links */}
            <div
              className={`space-y-5 pt-2 transition-all duration-700 delay-[800ms] ease-out transform ${
                heroActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  to="/calculator"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 dark:bg-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-8 py-4 font-black uppercase tracking-wider text-xs shadow-soft hover:scale-105 active:scale-95 transition-all duration-300 border border-slate-950 dark:border-slate-800"
                >
                  <Activity className="h-4.5 w-4.5 text-white" />
                  CHECK YOUR HEALTH
                </Link>
                <a
                  href="#programs"
                  className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-8 py-4 font-bold text-xs uppercase tracking-wider hover:border-emerald-500 hover:text-emerald-500 hover:scale-102 active:scale-98 transition-all duration-300"
                >
                  EXPLORE PROGRAMS
                </a>
              </div>
              <div className="pl-1">
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent hover:underline group/market"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0 text-accent transition-transform group-hover/market:scale-110 group-hover/market:-translate-y-0.5" />
                  <span>Explore Marketplace &rarr;</span>
                </Link>
              </div>
            </div>
          </div>          {/* Right Column: Visual and overlapping widgets */}
          <div className="lg:col-span-6 flex justify-center items-center relative py-8">
            <div className="absolute inset-0 pointer-events-none opacity-30 select-none hidden sm:block">
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                <circle cx="150" cy="150" r="130" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 4" className="text-slate-300 dark:text-slate-700" />
                <line x1="50" y1="50" x2="350" y2="350" stroke="currentColor" strokeWidth="0.75" className="text-slate-300 dark:text-slate-700" />
                <circle cx="50" cy="50" r="3.5" fill="currentColor" className="text-emerald-500" />
                <circle cx="350" cy="350" r="3.5" fill="currentColor" className="text-teal-500" />
              </svg>
            </div>

            {/* Premium video container with round mask and parallax */}
            <div
              className={`relative w-full max-w-md aspect-[1.1] rounded-[28px] overflow-hidden shadow-glow border border-slate-200/50 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-900 transition-all duration-1000 delay-300 ease-out transform ${
                heroActive ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              style={{
                transform: `translateY(${scrollY * 0.05}px)`,
              }}
            >
              <video
                ref={heroVideoRef}
                src="/optivita-hero.mp4"
                autoPlay
                muted
                playsInline
                loop
                className="h-full w-full object-cover select-none"
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            </div>

            {/* Overlap Card 1: Sample Health Score with Count up */}
            <div
              className={`absolute -top-4 -left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4.5 py-3 rounded-2xl border border-border/80 shadow-glow flex items-center gap-3 max-w-[195px] text-left transition-all duration-800 delay-[1s] cubic-bezier(0.16, 1, 0.3, 1) transform ${
                heroActive ? "opacity-100 translate-x-0 translate-y-0 scale-100" : "opacity-0 -translate-x-8 -translate-y-4 scale-90"
              }`}
              style={{
                transform: `translateY(${scrollY * 0.08}px)`,
              }}
            >
              <div className="relative h-10 w-10 rounded-full border-[3px] border-emerald-500/25 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin-slow" />
                <span className="text-xs font-black">{heroScoreVal}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider truncate">SAMPLE HEALTH SCORE</p>
                <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate">Excellent Range</p>
              </div>
            </div>

            {/* Overlap Card 2: Daily Hydration with Width Animate */}
            <div
              className={`absolute bottom-6 -right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4.5 py-3.5 rounded-2xl border border-border/80 shadow-glow space-y-1.5 text-left w-44 transition-all duration-800 delay-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) transform ${
                heroActive ? "opacity-100 translate-x-0 translate-y-0 scale-100" : "opacity-0 translate-x-8 translate-y-4 scale-90"
              }`}
              style={{
                transform: `translateY(${scrollY * 0.03}px)`,
              }}
            >
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-800 dark:text-slate-200">DAILY HYDRATION</span>
                <span className="font-black text-cyan-500">{heroHydrationVal}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${heroHydrationVal}%` }}
                />
              </div>
              <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Sample Progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST VALUES SHOWCASE SECTION */}
      <section className="py-20 bg-emerald-500/5 dark:bg-emerald-500/5 border-t border-b border-border/40 scroll-reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Precision",
                desc: "Personalized nutrition plans and caloric matching built around your metabolic metrics.",
                icon: Sparkles,
                color: "text-emerald-500 bg-emerald-500/10",
              },
              {
                title: "Science",
                desc: "Every recommendation and program is backed by clinical data and evidence-based science.",
                icon: Activity,
                color: "text-teal-500 bg-teal-500/10",
              },
              {
                title: "Compassion",
                desc: "Supporting your personal health transformation journey with genuine care and empathy.",
                icon: Heart,
                color: "text-rose-500 bg-rose-500/10",
              },
              {
                title: "Accountability",
                desc: "Consistent progress feedback, direct chat support, and dedicated weekly assessments.",
                icon: ShieldCheck,
                color: "text-sky-500 bg-sky-500/10",
              },
            ].map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className={`group p-6.5 rounded-3xl bg-card border border-border/50 hover:border-accent hover:shadow-soft transition-all duration-300 flex flex-col text-left space-y-4 scroll-reveal delay-stagger-${
                    idx + 1
                  }`}
                >
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-[360deg] ${val.color}`}>
                    <Icon className="h-6 w-6 shrink-0" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display font-black text-lg text-slate-900 dark:text-white uppercase tracking-wider">
                      {val.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      {val.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. CORE PROGRAMS SECTION (Staggered scroll reveal cards + Parallax images) */}
      <section id="programs" className="py-24 border-t border-border/40 scroll-reveal">
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
            {programs.map((p, i) => {
              // Calculate subtle parallax offset based on window scroll
              const parallaxOffset = (scrollY * 0.04) % 16 - 8;
              return (
                <Link
                  key={p.id}
                  to="/programs/$programId"
                  params={{ programId: p.id }}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-[36px] border border-slate-200/80 dark:border-slate-800 bg-card p-8 shadow-soft hover:shadow-glow hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-350 text-left scroll-reveal delay-stagger-${
                    (i % 3) + 1
                  }`}
                >
                  <div className="space-y-5">
                    {p.image && (
                      <div className="relative aspect-[1.5] w-full overflow-hidden rounded-2xl border border-border/50 bg-slate-100 dark:bg-slate-800">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500"
                          style={{
                            transform: `scale(1.08) translateY(${parallaxOffset}px)`,
                          }}
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <span className="inline-block px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-[9px] font-black uppercase tracking-widest text-accent">
                        {p.duration} Duration
                      </span>
                      <h3 className="font-display font-black text-2xl text-slate-900 dark:text-white leading-tight">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                        {p.tagline}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.focus.map((f) => (
                        <span
                          key={f}
                          className="text-[9px] font-black uppercase tracking-wider bg-secondary/80 text-secondary-foreground rounded border border-border/40 px-2.5 py-1"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-black uppercase tracking-wider text-accent group-hover:text-emerald-500 transition-colors duration-300">
                    <span>View Details & Intake</span>
                    <div className="h-7 w-7 rounded-full bg-accent/10 text-accent group-hover:bg-emerald-500 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12 scroll-reveal delay-stagger-2">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-black uppercase tracking-wider text-xs px-6 py-3.5 hover:bg-accent hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-soft"
            >
              <span>Explore All Programs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. OPTIVITA HEALTH JOURNEY MARKETPLACE */}
      <section id="marketplace" className="py-24 bg-sky-500/5 dark:bg-sky-950/20 border-t border-b border-border/40 scroll-reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Health Marketplace
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white pt-2">
              HEALTH JOURNEY MARKETPLACE
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Discover nutrition consults, verified supplements, fitness coaching, active wearables, and medical tracking devices.
            </p>
          </div>

          {/* Categories grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { label: "Nutrition", icon: Apple, color: "text-emerald-500 bg-emerald-500/10", path: "/marketplace/nutrition" },
              { label: "Supplements", icon: Sparkles, color: "text-teal-500 bg-teal-500/10", path: "/marketplace" },
              { label: "Fitness", icon: Dumbbell, color: "text-sky-500 bg-sky-500/10", path: "/marketplace/fitness" },
              { label: "Wearables", icon: Smartphone, color: "text-amber-500 bg-amber-500/10", path: "/marketplace" },
              { label: "Health Devices", icon: Activity, color: "text-blue-500 bg-blue-500/10", path: "/marketplace" },
              { label: "Wellness", icon: HeartPulse, color: "text-rose-500 bg-rose-500/10", path: "/marketplace/wellness" },
            ].map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={idx}
                  to={cat.path}
                  className={`group p-5 rounded-3xl bg-card border border-border/50 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-accent hover:shadow-soft active:scale-95 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-3.5 scroll-reveal delay-stagger-${
                    (idx % 4) + 1
                  }`}
                >
                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${cat.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                    {cat.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Actual Database Providers Showcase */}
          <div className="mt-16 space-y-6 text-left scroll-reveal delay-stagger-2">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">
                  Featured Verified Experts
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Marketplace catalog is ready for supplements and gear. Browse verified experts currently active in your region:
                </p>
              </div>
              <Link
                to="/marketplace"
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1 group/btn shrink-0 w-fit"
              >
                <span>Browse Marketplace Directory</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6 pt-2">
              {PROVIDERS.slice(0, 3).map((provider, i) => (
                <Link
                  key={provider.id}
                  to={`/marketplace/provider/${provider.id}`}
                  className={`p-5 bg-card border border-border/60 rounded-3xl flex items-center gap-4 hover:shadow-soft active:scale-[0.99] transition-all duration-300 text-left scroll-reveal delay-stagger-${
                    i + 1
                  }`}
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

      {/* 4. SOPHISTICATED HEALTH JOURNEY FLOWCHART (Scroll drawing SVG line) */}
      <section id="flowchart-section" className="py-24 bg-card scroll-reveal">
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

          {/* SVG-based Flowchart with draw-in connector line */}
          <div className="relative max-w-5xl mx-auto py-10">
            {/* Flowchart items */}
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 relative z-10">
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
                        : "bg-card border-border/60 opacity-60"
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

            {/* Connecting line graphic background with scroll stroke drawing */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 pointer-events-none hidden md:block px-6">
              <svg className="w-full h-1" fill="none" preserveAspectRatio="none">
                <line
                  x1="0"
                  y1="2"
                  x2="100%"
                  y2="2"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-slate-200 dark:text-slate-800"
                />
                <line
                  x1="0"
                  y1="2"
                  x2="100%"
                  y2="2"
                  stroke="url(#flowchart-grad)"
                  strokeWidth="3"
                  style={{
                    strokeDasharray: "1000",
                    strokeDashoffset: flowchartActive ? "0" : "1000",
                    transition: "stroke-dashoffset 2.5s ease-in-out",
                  }}
                />
                <defs>
                  <linearGradient id="flowchart-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="text-center mt-12 scroll-reveal delay-stagger-2">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient text-white font-black uppercase tracking-wider text-xs px-8 py-4 shadow-soft hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span>🩺 Start Health Check</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE HEALTH SCORE WIDGET (Scroll trigger Radial meter and Bars count up) */}
      <section id="health-score-section" className="py-24 bg-secondary/15 border-t border-b border-border/40 scroll-reveal">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center text-left">
          {/* Left Column: Visual Dashboard Indicator */}
          <div className="lg:col-span-6 bg-card border border-border/80 rounded-[36px] p-8 shadow-glow space-y-6 scroll-reveal delay-stagger-1">
            <div className="flex justify-between items-center pb-4 border-b border-border/40">
              <div>
                <h3 className="font-display font-black text-lg text-slate-900 dark:text-white uppercase tracking-wider">
                  SAMPLE HEALTH PROFILE
                </h3>
                <p className="text-[9px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">
                  Sample data only — Check health to get real stats
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase shrink-0">
                Healthy Class
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
              {/* Radial Progress Score */}
              <div className="relative h-32 w-32 rounded-full border-[10px] border-emerald-500/15 flex flex-col items-center justify-center shrink-0">
                <span className="text-4xl font-black text-slate-900 dark:text-white transition-all duration-700">
                  {scoreWidgetVal}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Score
                </span>
                <div
                  className="absolute inset-0 rounded-full border-[10px] border-emerald-500 border-t-transparent border-r-transparent -m-[10px] transition-transform duration-[1.5s]"
                  style={{
                    transform: `rotate(${45 + (scoreWidgetVal / 100) * 180}deg)`,
                  }}
                />
              </div>

              {/* Individual Metrics */}
              <div className="flex-1 space-y-3.5 w-full">
                {[
                  { label: "Nutrition Score", value: nutritionVal, color: "bg-emerald-500" },
                  { label: "Daily Physical Activity", value: activityVal, color: "bg-teal-500" },
                  { label: "Sleep Target Meet", value: sleepVal, color: "bg-blue-500" },
                  { label: "Lifestyle Assessment", value: lifestyleVal, color: "bg-purple-500" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-655 dark:text-slate-400">{item.label}</span>
                      <span className="text-slate-800 dark:text-slate-200">{item.value}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-[1s] ease-out ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Personalization Description */}
          <div className="lg:col-span-6 space-y-6 scroll-reveal delay-stagger-2">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Personalized Plan
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white pt-2 leading-tight">
              YOUR HEALTH.
              <br />
              PERSONALIZED.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Once you complete the 1-Minute health assessment, our engine builds a tailored profile mapping target ranges. This data directly dynamically shapes:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
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
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient text-white font-black uppercase tracking-wider text-xs px-8 py-4 shadow-soft hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <span>Start Free Assessment</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RECOMMENDED FOR YOU (PERSONALIZATION DATA CONVERGENCE ANIMATION) */}
      <section id="personalization-section" className="py-24 bg-card border-b border-border/40 scroll-reveal">
        <div className="max-w-7xl mx-auto px-6 max-w-4xl text-center space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20">
              Optivita Intelligence
            </span>
            <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white uppercase">
              TURNING HEALTH DATA INTO ACTION
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              How your assessment data maps to personalized nutrition guidance and verified marketplace specialists.
            </p>
          </div>

          {/* Interactive Convergence Graphic */}
          <div className="relative min-h-[300px] flex items-center justify-center py-6 bg-slate-50 dark:bg-slate-900/40 rounded-[32px] border border-border/40 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none" />

            {/* Left nodes (Inputs) */}
            <div className="absolute left-6 sm:left-14 flex flex-col gap-8 text-left z-10">
              {[
                { label: "Nutrition Targets", sub: "Calculated Calorie Caps", delay: "delay-[100ms]", transform: personalizationActive ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0" },
                { label: "Activity Levels", sub: "Heart-Rate Zones", delay: "delay-[250ms]", transform: personalizationActive ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0" },
              ].map((inputNode, idx) => (
                <div
                  key={idx}
                  className={`p-3 bg-white dark:bg-slate-900 border rounded-2xl shadow-soft flex items-center gap-3 transition-all duration-[1s] ease-out ${inputNode.delay}`}
                  style={{ transform: inputNode.transform, opacity: personalizationActive ? 1 : 0 }}
                >
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{inputNode.label}</p>
                    <p className="text-[9px] text-slate-400 truncate">{inputNode.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Center Core (Optivita Engine) */}
            <div
              className={`relative z-20 h-24 w-24 rounded-full bg-slate-950 text-white flex flex-col items-center justify-center border-4 border-emerald-500 shadow-glow transition-all duration-1000 ease-out transform ${
                personalizationActive ? "scale-100 opacity-100" : "scale-75 opacity-0"
              }`}
            >
              <div className="absolute inset-0 rounded-full border border-emerald-500 animate-ping opacity-25" />
              <img src={logoAsset.url} alt="Optivita" className="h-9 w-9 object-contain" />
              <span className="text-[8px] font-black tracking-widest mt-1">CORE ENGINE</span>
            </div>

            {/* Right nodes (Outputs) */}
            <div className="absolute right-6 sm:right-14 flex flex-col gap-8 text-left z-10">
              {[
                { label: "Personalized Program", sub: "Weight / Reset resets", delay: "delay-[400ms]", transform: personalizationActive ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0" },
                { label: "Recommended Marketplace", sub: "Verified Coach & Gear matches", delay: "delay-[550ms]", transform: personalizationActive ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0" },
              ].map((outputNode, idx) => (
                <div
                  key={idx}
                  className={`p-3 bg-white dark:bg-slate-900 border rounded-2xl shadow-soft flex items-center gap-3 transition-all duration-[1s] ease-out ${outputNode.delay}`}
                  style={{ transform: outputNode.transform, opacity: personalizationActive ? 1 : 0 }}
                >
                  <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{outputNode.label}</p>
                    <p className="text-[9px] text-slate-400 truncate">{outputNode.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Connecting SVG Flow lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20 hidden sm:block">
              <svg className="w-full h-full">
                <line x1="20%" y1="35%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="20%" y1="65%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="50%" y1="50%" x2="80%" y2="35%" stroke="#14b8a6" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="50%" y1="50%" x2="80%" y2="65%" stroke="#14b8a6" strokeWidth="2" strokeDasharray="5 5" />
              </svg>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent text-white font-black uppercase tracking-wider text-[10px] px-8 py-4 hover:bg-accent/90 transition-colors shadow-soft hover:scale-105 active:scale-95"
            >
              <span>Discover Your Custom Plan</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. CLIENT JOURNEY TRACKER MOCKUP (Dashboard Rising Animation) */}
      <section id="client-portal" className="py-24 bg-slate-50 dark:bg-slate-950 scroll-reveal">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center text-left">
          {/* Left Column: Descriptions */}
          <div className="lg:col-span-5 space-y-6 scroll-reveal delay-stagger-1">
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

            <div className="pt-2">
              <Link
                to="/portal/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient text-white font-black uppercase tracking-wider text-xs px-8 py-4 shadow-soft hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <span>Enter Client Portal</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Portal Product Mockup UI rising */}
          <div className="lg:col-span-7 bg-card border border-border/80 rounded-[36px] p-6 shadow-glow space-y-5 scroll-reveal delay-stagger-2">
            <div className="flex justify-between items-center pb-3 border-b border-border/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Portal Dashboard</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Sample Client Account preview</span>
            </div>

            {/* Layout simulation */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-secondary/30 rounded-xl space-y-1.5 hover:scale-102 transition-transform duration-300">
                <span className="text-[9px] font-bold text-slate-400">MEAL PLAN</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Day 14 Menu</p>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">Balanced</span>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl space-y-1.5 hover:scale-102 transition-transform duration-300">
                <span className="text-[9px] font-bold text-slate-400">WORKOUT</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Core Training</p>
                <span className="text-[9px] bg-teal-500/10 text-teal-600 px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl space-y-1.5 hover:scale-102 transition-transform duration-300">
                <span className="text-[9px] font-bold text-slate-400">APPOINTMENTS</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Thu 16:00</p>
                <span className="text-[9px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">Confirmed</span>
              </div>
            </div>

            {/* Coach Chat mockup snippet */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl space-y-2 hover:scale-[1.01] transition-transform duration-300">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Latest Coach Message</p>
              <p className="text-xs italic text-slate-655 dark:text-slate-350 leading-relaxed">
                "Keep up the great work on hydration targets. We will review your body weight index measurements on the Thursday sync!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. OUTCOMES SHOWCASE SECTION */}
      <section className="py-24 bg-slate-900 dark:bg-slate-950 text-white scroll-reveal">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <span className="inline-block text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3.5 py-1.5 rounded-full border border-emerald-400/20">
              Optivita Standards
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              OUTCOMES,
              <br />
              NOT JUST PLANS.
            </h2>
            <p className="text-slate-350 text-sm leading-relaxed max-w-md">
              We focus on evidence-based health technology, direct accountability, and clinical precision. No generic templates or guesswork.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              "Personalized assessment",
              "Expert guidance",
              "Weekly check-ins",
              "Progress tracking",
              "Direct support",
              "Evidence-based nutrition",
            ].map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4.5 hover:bg-white/10 transition-colors duration-300 scroll-reveal delay-stagger-${
                  (idx % 3) + 1
                }`}
              >
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="py-24 bg-brand-gradient text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero-overlay opacity-80" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase animate-pulse-slow">
            START YOUR OPTIVITA JOURNEY
          </h2>
          <p className="text-sm text-white/90 max-w-xl mx-auto leading-relaxed">
            Discover your current metabolic indexes in less than one minute. Access personalized coaching programs and verified local specialists today.
          </p>
          <div className="pt-4">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-1.5 rounded-full bg-white text-primary px-8 py-4 font-black uppercase tracking-wider text-xs shadow-md hover:scale-105 active:scale-95 transition-all duration-300 group/end-btn"
            >
              <span>🩺 Get Started Free</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/end-btn:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Welcome Modal Popup */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWelcomeModal(false)}
          />

          <div className="relative bg-card border border-border/80 rounded-[36px] w-full max-w-lg p-6 md:p-8 shadow-glow z-10 overflow-hidden text-foreground text-left">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-gradient" />

            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors duration-205 cursor-pointer"
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
                className="w-full text-center bg-brand-gradient text-white font-black uppercase tracking-wider text-xs py-4 rounded-full shadow-glow hover:opacity-95 hover:scale-[1.01] transition-all duration-350 flex items-center justify-center gap-2 cursor-pointer"
              >
                🩺 Check My Health
              </Link>
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="w-full text-center bg-card border border-border text-foreground hover:bg-secondary/40 font-bold py-4 rounded-full transition-all duration-350 text-xs cursor-pointer"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}

      {introState === "done" && <SiteFooter />}
    </div>
  );
}

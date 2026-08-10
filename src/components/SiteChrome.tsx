import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Menu,
  X,
  ChevronDown,
  Apple,
  Activity,
  Sparkles,
  Heart,
  Dumbbell,
  Award,
  Smartphone,
  HeartPulse,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import logoAsset from "@/assets/optivita-logo.png.asset.json";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-white/90 dark:bg-slate-950/90 shadow-md h-20"
          : "bg-transparent h-24"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          <div className="p-1 bg-white rounded-xl shadow-soft border border-border/40 hover:scale-105 transition-transform duration-300">
            <img src={logoAsset.url} alt="Optivita" className="h-12 w-12 object-contain" />
          </div>
          <span className="ml-2.5 font-display font-black text-lg tracking-wider text-primary dark:text-white uppercase">
            Optivita
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600 dark:text-slate-350">
          {/* Programs Mega Menu Link */}
          <div className="relative group py-4">
            <button className="flex items-center gap-1.5 hover:text-accent transition-colors font-bold uppercase tracking-wider text-xs cursor-pointer">
              Programs
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
            </button>

            {/* Mega Menu Dropdown */}
            <div className="absolute top-[100%] left-0 w-[580px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-glow opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 p-6 grid grid-cols-2 gap-4 translate-y-2 group-hover:translate-y-0 text-left z-50">
              <div className="col-span-2 pb-2.5 border-b border-border/40 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-accent tracking-widest">
                  Signature Health Programs
                </span>
                <span className="text-[9px] text-muted-foreground">Tailored & Time-Bound</span>
              </div>

              {[
                {
                  title: "Weight Management",
                  desc: "Sustainable weight loss with weekly check-ins.",
                  icon: Apple,
                  path: "/programs/30-day-weight-loss",
                  color: "text-emerald-500 bg-emerald-500/10",
                },
                {
                  title: "Diabetes Nutrition",
                  desc: "Clinical plans to regulate blood glucose levels.",
                  icon: Activity,
                  path: "/programs/diabetes-nutrition",
                  color: "text-teal-500 bg-teal-500/10",
                },
                {
                  title: "Healthy Lifestyle Reset",
                  desc: "Rebuild habits for sleep, walk and water intake.",
                  icon: Sparkles,
                  path: "/programs/healthy-lifestyle-reset",
                  color: "text-amber-500 bg-amber-500/10",
                },
                {
                  title: "Women's Wellness",
                  desc: "PCOS & hormonal support with expert coaching.",
                  icon: Heart,
                  path: "/programs/pcos-nutrition",
                  color: "text-rose-500 bg-rose-500/10",
                },
                {
                  title: "Fitness Coaching",
                  desc: "Strength training guides & home workouts.",
                  icon: Dumbbell,
                  path: "/programs/fat-loss-premium",
                  color: "text-blue-500 bg-blue-500/10",
                },
                {
                  title: "Premium 1:1 Coaching",
                  desc: "High-touch transformation coaching plans.",
                  icon: Award,
                  path: "/programs/fat-loss-premium",
                  color: "text-violet-500 bg-violet-500/10",
                },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-805/50 transition-colors"
                >
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              ))}

              <Link
                to="/"
                hash="programs"
                className="col-span-2 mt-2 pt-3 border-t border-border/40 text-center text-xs font-bold text-accent hover:underline flex items-center justify-center gap-1"
              >
                <span>View All Programs</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Marketplace Mega Menu Link */}
          <div className="relative group py-4">
            <button className="flex items-center gap-1.5 hover:text-accent transition-colors font-bold uppercase tracking-wider text-xs cursor-pointer">
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
              Marketplace
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
            </button>

            {/* Mega Menu Dropdown */}
            <div className="absolute top-[100%] left-0 w-[520px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-glow opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 p-6 grid grid-cols-2 gap-4 translate-y-2 group-hover:translate-y-0 text-left z-50">
              <div className="col-span-2 pb-2.5 border-b border-border/40 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-accent tracking-widest">
                  Wellness & Expert Marketplace
                </span>
                <span className="text-[9px] text-muted-foreground">Verified Professionals</span>
              </div>

              {[
                {
                  title: "Nutrition",
                  desc: "Certified nutritionists and clinical dietitians.",
                  icon: Apple,
                  path: "/marketplace/nutrition",
                  color: "text-emerald-500 bg-emerald-500/10",
                },
                {
                  title: "Fitness & Training",
                  desc: "Certified gym instructors and personal coaches.",
                  icon: Dumbbell,
                  path: "/marketplace/fitness",
                  color: "text-teal-500 bg-teal-500/10",
                },
                {
                  title: "Local Gyms & Centers",
                  desc: "Browse local training centers and health clubs.",
                  icon: Award,
                  path: "/marketplace/gyms",
                  color: "text-sky-500 bg-sky-500/10",
                },
                {
                  title: "Wearable Trackers",
                  desc: "Verified smartwatch and health rings integration.",
                  icon: Smartphone,
                  path: "/marketplace",
                  color: "text-amber-500 bg-amber-500/10",
                },
                {
                  title: "Health Monitors",
                  desc: "Blood pressure and smart scales verified catalog.",
                  icon: Activity,
                  path: "/marketplace",
                  color: "text-blue-500 bg-blue-500/10",
                },
                {
                  title: "Mental Wellness",
                  desc: "Mindfulness, therapy and yoga instructors.",
                  icon: HeartPulse,
                  path: "/marketplace/wellness",
                  color: "text-rose-500 bg-rose-500/10",
                },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-805/50 transition-colors"
                >
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              ))}

              <Link
                to="/marketplace"
                className="col-span-2 mt-2 pt-3 border-t border-border/40 text-center text-xs font-bold text-accent hover:underline flex items-center justify-center gap-1"
              >
                <span>Explore Marketplace Directory</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <Link to="/calculator" className="hover:text-accent transition-colors uppercase tracking-wider text-xs font-bold">
            Health Calculator
          </Link>
          <Link to="/about" className="hover:text-accent transition-colors uppercase tracking-wider text-xs font-bold">
            About
          </Link>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-4">
          <Link
            to="/portal/login"
            className="hidden sm:inline-flex items-center rounded-full bg-brand-gradient px-5 py-2.5 text-xs font-black uppercase text-white shadow-soft hover:opacity-90 transition-all hover:scale-105 duration-300"
          >
            Client Portal
          </Link>

          <Link
            to="/admin/login"
            className="hidden md:inline-flex text-[10px] font-bold uppercase text-slate-400 hover:text-accent transition-colors"
          >
            Admin Panel
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-border/60 bg-secondary/35 text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-lg absolute top-20 inset-x-0 p-6 flex flex-col gap-5 shadow-glow animate-fade-in z-45 text-left">
          <nav className="flex flex-col gap-4 text-base font-semibold text-foreground">
            <Link
              to="/"
              hash="programs"
              className="hover:text-accent py-2 transition-colors border-b border-border/30"
              onClick={closeMenu}
            >
              Programs
            </Link>
            <Link
              to="/marketplace"
              className="hover:text-accent py-2 transition-colors border-b border-border/30"
              onClick={closeMenu}
            >
              Marketplace
            </Link>
            <Link
              to="/calculator"
              className="hover:text-accent py-2 transition-colors border-b border-border/30"
              onClick={closeMenu}
            >
              Health Calculator
            </Link>
            <Link
              to="/about"
              className="hover:text-accent py-2 transition-colors border-b border-border/30"
              onClick={closeMenu}
            >
              About
            </Link>
            <Link
              to="/portal/login"
              className="hover:text-accent py-2 transition-colors border-b border-border/30 font-black text-emerald-650 dark:text-emerald-400"
              onClick={closeMenu}
            >
              Client Portal
            </Link>
            <Link
              to="/admin/login"
              className="hover:text-accent py-2 transition-colors border-b border-border/30 text-slate-500"
              onClick={closeMenu}
            >
              Admin Login
            </Link>
          </nav>

          <Link
            to="/calculator"
            onClick={closeMenu}
            className="w-full text-center rounded-full bg-brand-gradient py-3.5 text-sm font-bold text-white shadow-glow"
          >
            🩺 Start Free Health Check
          </Link>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10 text-left">
        <div>
          <Link to="/" className="inline-block mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-md hover:scale-105 transition-transform duration-300">
              <img src={logoAsset.url} alt="Optivita" className="h-24 w-24 object-contain" />
            </div>
          </Link>
          <p className="mt-3 text-sm opacity-80 max-w-xs leading-normal">
            Your precision health partner. Precision nutrition, sustainable results, lifelong
            wellness.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-emerald-405 dark:text-emerald-400">Programs</h4>
          <ul className="space-y-2 text-sm opacity-90">
            <li>
              <Link to="/programs/$programId" params={{ programId: "30-day-weight-loss" }}>
                30-Day Weight Loss
              </Link>
            </li>
            <li>
              <Link to="/programs/$programId" params={{ programId: "diabetes-nutrition" }}>
                Diabetes Nutrition
              </Link>
            </li>
            <li>
              <Link to="/programs/$programId" params={{ programId: "pcos-nutrition" }}>
                PCOS Program
              </Link>
            </li>
            <li>
              <Link to="/programs/$programId" params={{ programId: "fat-loss-premium" }}>
                Fat Loss Premium
              </Link>
            </li>
            <li>
              <Link to="/calculator" className="font-semibold text-accent">
                Free Health Calculator
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-emerald-405 dark:text-emerald-400">Marketplace Providers</h4>
          <ul className="space-y-2 text-sm opacity-90">
            <li>
              <Link to="/provider/login" className="hover:text-accent hover:underline transition-colors">
                Provider Login
              </Link>
            </li>
            <li>
              <Link to="/provider/register" className="hover:text-accent hover:underline transition-colors">
                Join as Provider
              </Link>
            </li>
            <li>
              <Link to="/marketplace" className="hover:text-accent hover:underline transition-colors">
                Browse Directory
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-emerald-405 dark:text-emerald-400">Get in touch</h4>
          <p className="text-sm opacity-90">optivita.support@gmail.com</p>
          <p className="text-sm opacity-90 mt-1">WhatsApp coaching support</p>
          <p className="text-[10px] opacity-60 mt-4 leading-normal">
            Precision health calculations conform with internationally accepted BMI/daily calorie standards.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs opacity-70 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
        <span>© {new Date().getFullYear()} Optivita — Your Precision Health Partner</span>
        <span className="hidden sm:inline">|</span>
        <Link to="/privacy-policy" className="hover:text-accent hover:underline transition-colors">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}

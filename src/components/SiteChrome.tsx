import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import logoAsset from "@/assets/optivita-logo.png.asset.json";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          <div className="p-1.5 bg-white rounded-xl shadow-sm border border-border/40 hover:scale-105 transition-transform duration-300">
            <img src={logoAsset.url} alt="Optivita" className="h-16 w-16 object-contain" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="/#programs" className="hover:text-accent transition-colors">Programs</a>
          <Link to="/calculator" className="hover:text-accent transition-colors">Health Calculator</Link>
          <Link to="/about" className="hover:text-accent transition-colors">About</Link>
          <Link to="/portal/login" className="hover:text-accent transition-colors text-emerald-600 dark:text-emerald-400 font-bold">Client Portal</Link>
          <Link to="/admin/login" className="hover:text-accent transition-colors text-slate-500">Admin Login</Link>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="/#programs"
            onClick={closeMenu}
            className="hidden sm:inline-flex items-center rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:opacity-90 transition-all hover:scale-105 duration-300"
          >
            Book Consultation
          </a>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-border/60 bg-secondary/35 text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-lg absolute top-24 inset-x-0 p-6 flex flex-col gap-5 shadow-glow animate-fade-in z-40">
          <nav className="flex flex-col gap-4 text-base font-semibold text-foreground">
            <a href="/#programs" className="hover:text-accent py-2 transition-colors border-b border-border/30" onClick={closeMenu}>Programs</a>
            <Link to="/calculator" className="hover:text-accent py-2 transition-colors border-b border-border/30" onClick={closeMenu}>Health Calculator</Link>
            <Link to="/about" className="hover:text-accent py-2 transition-colors border-b border-border/30" onClick={closeMenu}>About</Link>
            <Link to="/portal/login" className="hover:text-accent py-2 transition-colors border-b border-border/30 font-bold text-emerald-600 dark:text-emerald-400" onClick={closeMenu}>Client Portal</Link>
            <Link to="/admin/login" className="hover:text-accent py-2 transition-colors border-b border-border/30 text-slate-500" onClick={closeMenu}>Admin Login</Link>
            <a href="/#approach" className="hover:text-accent py-2 transition-colors border-b border-border/30" onClick={closeMenu}>Approach</a>
            <a href="/#contact" className="hover:text-accent py-2 transition-colors" onClick={closeMenu}>Contact</a>
          </nav>
          
          <a
            href="/#programs"
            onClick={closeMenu}
            className="w-full text-center rounded-full bg-brand-gradient py-3.5 text-sm font-bold text-white shadow-glow"
          >
            Book Consultation
          </a>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <Link to="/" className="inline-block mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-md hover:scale-105 transition-transform duration-300">
              <img src={logoAsset.url} alt="Optivita" className="h-24 w-24 object-contain" />
            </div>
          </Link>
          <p className="mt-3 text-sm opacity-80 max-w-xs">
            Your precision health partner. Precision nutrition, sustainable results, lifelong wellness.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Programs</h4>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link to="/programs/$programId" params={{ programId: "30-day-weight-loss" }}>30-Day Weight Loss</Link></li>
            <li><Link to="/programs/$programId" params={{ programId: "diabetes-nutrition" }}>Diabetes Nutrition</Link></li>
            <li><Link to="/programs/$programId" params={{ programId: "pcos-nutrition" }}>PCOS Program</Link></li>
            <li><Link to="/programs/$programId" params={{ programId: "fat-loss-premium" }}>Fat Loss Premium</Link></li>
            <li><Link to="/calculator" className="font-semibold text-accent">Free Health Calculator</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Get in touch</h4>
          <p className="text-sm opacity-90">optivita.support@gmail.com</p>
          <p className="text-sm opacity-90 mt-1">WhatsApp coaching support</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs opacity-70">
        © {new Date().getFullYear()} Optivita — Your Precision Health Partner
      </div>
    </footer>
  );
}

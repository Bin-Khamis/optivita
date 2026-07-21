import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { programs } from "@/lib/programs";
import { X, Sparkles } from "lucide-react";
import heroVideo from "@/assets/optivita-hero.mp4.asset.json";
import logoAsset from "@/assets/optivita-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Home,
});

const values = [
  { title: "Precision", desc: "Personalized solutions based on individual needs.", image: "/value-precision.png" },
  { title: "Science", desc: "Evidence-based nutrition and wellness practices.", image: "/value-science.png" },
  { title: "Compassion", desc: "Supporting every client's journey with empathy.", image: "/value-compassion.png" },
  { title: "Accountability", desc: "Structured guidance and consistent progress tracking.", image: "/value-accountability.png" },
];

function Home() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Delay showing the popup slightly for a premium feel (e.g. 1.2 seconds)
    const timer = setTimeout(() => {
      setShowWelcomeModal(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="relative h-screen min-h-[640px] w-full overflow-hidden pt-24">
        {heroVideo.url.endsWith(".mp4") ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={heroVideo.url}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={heroVideo.url}
            alt="Optivita Hero"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero-overlay)" }}
          aria-hidden
        />
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center text-white">
          <div className="w-fit p-5 rounded-3xl bg-white border border-border/20 mb-6 shadow-glow hover:scale-105 transition-transform duration-300">
            <img 
              src={logoAsset.url} 
              alt="Optivita" 
              className="h-36 w-36 object-contain" 
            />
          </div>
          <p className="uppercase tracking-[0.3em] text-xs md:text-sm font-semibold text-white/80 mb-4">
            Your Precision Health Partner
          </p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl lg:text-7xl max-w-3xl leading-tight">
            Precision nutrition.<br />
            <span style={{
              background: "linear-gradient(90deg, #7ee0c8, #a5f3a5)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Sustainable results.
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl max-w-2xl text-white/90">
            Personalized coaching programs that combine evidence-based nutrition science,
            technology-enabled tracking, and genuine human support.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#programs"
              className="inline-flex items-center rounded-full bg-white text-primary px-7 py-3 font-semibold shadow-glow hover:scale-105 transition"
            >
              Explore Programs
            </a>
            <a
              href="#about"
              className="inline-flex items-center rounded-full border border-white/60 px-7 py-3 font-semibold hover:bg-white/10 transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="py-24 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="text-accent font-semibold uppercase tracking-widest text-xs">Our Approach</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">Health built on precision, delivered with care.</h2>
            <p className="mt-5 text-muted-foreground text-lg">
              Rather than selling generic diet plans, Optivita delivers structured, time-bound programs
              with clear deliverables, weekly accountability, and a brand experience that feels premium
              and caring.
            </p>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="group bg-card rounded-2xl p-6 shadow-soft border border-border/60 hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
                <div 
                  className="h-24 w-24 rounded-full flex items-center justify-center mb-5 shadow-soft overflow-hidden p-2 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: "url('/icon-bg.png')" }}
                >
                  <img src={v.image} alt={v.title} className="h-full w-full object-contain transition-transform duration-1000 ease-in-out group-hover:rotate-[360deg]" />
                </div>
                <h3 className="font-display font-bold text-xl">{v.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="programs" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <p className="text-accent font-semibold uppercase tracking-widest text-xs">Signature Programs</p>
              <h2 className="mt-3 text-3xl md:text-5xl font-bold max-w-2xl">Pick the program that fits your goal.</h2>
            </div>
            <p className="text-muted-foreground max-w-md">
              Every program starts with a personalized assessment. Select one to view details and complete the tailored intake form.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((p, i) => (
              <Link
                key={p.id}
                to="/programs/$programId"
                params={{ programId: p.id }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft hover:shadow-glow transition-all hover:-translate-y-1 flex flex-col justify-between"
              >
                <div
                  className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-20 group-hover:opacity-40 transition"
                  style={{ background: "var(--gradient-brand)" }}
                />
                <div>
                  {p.image && (
                    <div className="relative aspect-[1.4] w-full overflow-hidden rounded-2xl mb-5 border border-border/50">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">Program {i + 1}</p>
                  <h3 className="mt-3 font-display font-bold text-2xl">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.duration}</p>
                <p className="mt-4 text-sm">{p.tagline}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {p.focus.map((f) => (
                    <span key={f} className="text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1">
                      {f}
                    </span>
                  ))}
                </div>
                </div>
                <div className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:gap-2 transition-all">
                  View & Enroll <span aria-hidden>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-white/70 font-semibold uppercase tracking-widest text-xs">What Makes Optivita Different</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">Outcomes, not diet plans.</h2>
            <p className="mt-5 text-white/85 text-lg">
              We sell measurable transformations backed by weekly check-ins, WhatsApp support, and
              data-driven progress tracking — never guesswork.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              "Personalized assessments before every program",
              "Weekly check-ins and real accountability",
              "WhatsApp / direct support channels",
              "Progress tracked with data, not guesswork",
              "Evidence-based nutrition science",
              "Technology-assisted, human-delivered",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <span className="mt-1 h-2 w-2 rounded-full" style={{ background: "var(--vital)" }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Welcome Modal Popup */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWelcomeModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-card border border-border/80 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-glow animate-scale-up z-10 overflow-hidden text-foreground">
            {/* Top decorative gradient border/bar */}
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
                <span className="text-xs font-bold tracking-widest uppercase text-vital bg-vital/10 px-3.5 py-1.5 rounded-full border border-vital/20">
                  Welcome to OPTIVITA
                </span>
              </div>
              <h3 className="font-display font-extrabold text-2xl md:text-3xl text-foreground leading-tight">
                Your Precision Health Partner
              </h3>
              
              <div className="mt-4 bg-secondary/40 rounded-2xl p-4 border border-border/50">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-accent animate-pulse" />
                  How Healthy Are You? Find out in just one minute.
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Complete your FREE Optivita Health Assessment and discover your current health status instantly. We'll generate a personalized health report designed using internationally accepted health calculations.
                </p>
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-6 mb-3">
                You'll receive your personalized:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm text-foreground mb-6 font-light">
                {[
                  "Health Score (0–100)",
                  "BMI Analysis & Classification",
                  "Healthy Weight Target Range",
                  "Daily Calorie Needs Target",
                  "Hydration Volume Goal",
                  "Wellness Recommendation"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-vital shrink-0 font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-lg border border-border/20 text-center font-light">
                No registration required. Results are available immediately.
              </p>
            </div>

            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              <Link 
                to="/calculator"
                onClick={() => setShowWelcomeModal(false)}
                className="w-full text-center bg-brand-gradient text-white font-bold py-3.5 rounded-full shadow-glow hover:opacity-95 hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                🩺 Check My Health
              </Link>
              <button 
                onClick={() => setShowWelcomeModal(false)}
                className="w-full text-center bg-card border border-border text-foreground hover:bg-secondary/40 font-bold py-3.5 rounded-full transition-all duration-300 text-sm"
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

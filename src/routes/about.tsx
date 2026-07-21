import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { 
  Target, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  Cpu, 
  Check, 
  ChevronRight,
  TrendingUp, 
  Users,
  Compass
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Optivita" },
      { name: "description", content: "Learn about Optivita, your precision health partner. Guided by science, tailored to the individual." },
      { property: "og:title", content: "About Us — Optivita" },
      { property: "og:description", content: "Learn about Optivita, your precision health partner." },
    ],
  }),
  component: About,
});

const values = [
  { 
    title: "Precision", 
    desc: "Every nutrition plan is personalized based on your unique health profile, goals, and lifestyle.",
    image: "/value-precision.png"
  },
  { 
    title: "Science", 
    desc: "Our recommendations are grounded in current nutrition science and evidence-based practices.",
    image: "/value-science.png"
  },
  { 
    title: "Compassion", 
    desc: "We believe lasting change happens through encouragement, understanding, and continuous support.",
    image: "/value-compassion.png"
  },
  { 
    title: "Accountability", 
    desc: "Structured guidance, daily check-ins, and clear progress monitoring to keep you on track.",
    image: "/value-accountability.png"
  }
];

const offerings = [
  "Personalized Nutrition Consultations",
  "Customized Meal Plans",
  "Weight Management Programs",
  "PCOS Nutrition Support",
  "Diabetes Nutrition Coaching",
  "Healthy Lifestyle Transformation Programs",
  "Sports Nutrition Guidance",
  "Pregnancy and Postpartum Nutrition",
  "Child and Family Nutrition",
  "Corporate Wellness Programs",
  "Ongoing Health Coaching & Progress Tracking"
];

const chooseUsPoints = [
  { title: "Tailored to You", desc: "Personalized nutrition plans centered entirely around your unique needs." },
  { title: "Science-Backed", desc: "Evidence-based, practical recommendations that deliver results." },
  { title: "Sustainable Focus", desc: "Coaching built for long-term lifestyle changes — not quick fixes." },
  { title: "Always Connected", desc: "Convenient online consultations from the comfort of your home." },
  { title: "Real Accountability", desc: "Continuous progress monitoring and proactive check-ins." },
  { title: "Client-Centered", desc: "Professional, outcome-driven care focused on your wellness success." }
];

function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero Header */}
      <section className="relative pt-40 pb-20 bg-brand-gradient text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{ background: "radial-gradient(circle at 70% 30%, white 0%, transparent 60%)" }}
          aria-hidden
        />
        <div className="relative max-w-5xl mx-auto px-6 text-center md:text-left">
          <p className="uppercase tracking-[0.25em] text-xs md:text-sm font-semibold text-white/80 mb-2">
            Your Precision Health Partner
          </p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-tight">
            About Optivita
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/95 max-w-2xl font-light">
            Empowering individuals to achieve lasting health through personalized nutrition, evidence-based science, and sustainable habit changes.
          </p>
        </div>
      </section>

      {/* Intro Narrative Section */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <p className="text-accent font-semibold uppercase tracking-wider text-xs">Our Core Belief</p>
              <h2 className="mt-3 font-display font-bold text-2xl md:text-4xl leading-tight">
                Health is unique.<br />Your nutrition should be too.
              </h2>
              <div className="mt-6 space-y-4 text-muted-foreground text-base md:text-lg leading-relaxed">
                <p>
                  At <strong className="text-foreground">Optivita</strong>, we believe that good health begins with the right nutrition, guided by science and tailored to the individual. Our mission is to empower people to achieve lasting health through personalized nutrition, evidence-based education, and sustainable lifestyle changes.
                </p>
                <p>
                  We understand that every individual is unique. Age, lifestyle, health conditions, goals, culture, and daily routines all influence nutritional needs. That's why we don't believe in one-size-fits-all diets. Instead, we provide personalized nutrition strategies designed to help you build healthier habits and achieve long-term success.
                </p>
                <p>
                  Whether your goal is to lose weight, manage a medical condition, improve energy levels, enhance athletic performance, or simply adopt a healthier lifestyle, Optivita is committed to supporting you every step of the way.
                </p>
              </div>
            </div>

            <div className="md:col-span-5 space-y-6">
              {/* Mission Card */}
              <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-soft relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-vital/5 -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-300" />
                <div className="h-10 w-10 rounded-xl bg-vital/10 flex items-center justify-center text-vital mb-4">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">Our Mission</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  To improve lives through personalized nutrition, scientific guidance, and sustainable lifestyle coaching, helping individuals achieve lifelong health and wellness.
                </p>
              </div>

              {/* Vision Card */}
              <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-soft relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-teal/5 -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-300" />
                <div className="h-10 w-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal mb-4">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">Our Vision</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  To become one of the world's most trusted digital health and nutrition platforms, making expert nutritional care accessible, personalized, and affordable for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-secondary/35 border-y border-border/60">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-accent font-semibold uppercase tracking-wider text-xs">Optivita Culture</p>
            <h2 className="mt-3 font-display font-bold text-3xl md:text-4xl">Our Core Values</h2>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">
              The fundamental principles that guide our interactions, coaching philosophies, and clinical methods.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val) => {
              return (
                <div 
                  key={val.title} 
                  className="group bg-card rounded-2xl p-6 shadow-soft border border-border/50 hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
                >
                  <div 
                    className="h-24 w-24 rounded-full flex items-center justify-center mb-5 shadow-soft overflow-hidden p-2 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/icon-bg.png')" }}
                  >
                    <img src={val.image} alt={val.title} className="h-full w-full object-contain transition-transform duration-1000 ease-in-out group-hover:rotate-[360deg]" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground">{val.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Offerings and Why Choose Us Section */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-12">
            
            {/* What We Offer (Left Column) */}
            <div className="md:col-span-5">
              <p className="text-accent font-semibold uppercase tracking-wider text-xs">Comprehensive Services</p>
              <h2 className="mt-3 font-display font-bold text-3xl mb-6">What We Offer</h2>
              <div className="space-y-3.5">
                {offerings.map((offer) => (
                  <div key={offer} className="flex items-start gap-3 bg-secondary/30 border border-border/40 rounded-xl p-3">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-vital/15 flex items-center justify-center text-vital shrink-0">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{offer}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Choose Optivita (Right Column) */}
            <div className="md:col-span-7">
              <p className="text-accent font-semibold uppercase tracking-wider text-xs">Our Advantage</p>
              <h2 className="mt-3 font-display font-bold text-3xl mb-6">Why Choose Optivita?</h2>
              
              <div className="grid sm:grid-cols-2 gap-5">
                {chooseUsPoints.map((point) => (
                  <div key={point.title} className="bg-card border border-border/70 rounded-2xl p-5 shadow-soft hover:border-accent/40 transition-colors duration-300">
                    <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      {point.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{point.desc}</p>
                  </div>
                ))}
              </div>

              {/* Our Commitment Banner inside Right Column */}
              <div className="mt-8 bg-brand-gradient text-white rounded-2xl p-6 md:p-8 shadow-soft relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 100% 100%, white 0%, transparent 50%)" }} />
                <h3 className="font-display font-bold text-xl mb-3">Our Commitment</h3>
                <p className="text-sm text-white/90 leading-relaxed font-light">
                  At Optivita, we measure success by the positive impact we make on our clients' lives. We are committed to providing trusted nutritional guidance, continuous support, and practical solutions that help people build healthier habits with confidence.
                </p>
                <p className="mt-4 text-xs font-semibold tracking-wider text-white/80 uppercase">
                  Your health journey is unique, and we're honored to be your trusted partner every step of the way.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-secondary/20 border-t border-border/60 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            Optivita — Your Precision Health Partner.
          </h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base">
            Ready to design a nutrition program tailored exactly to your body and lifestyle goals?
          </p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Link
              to="/"
              className="rounded-full bg-brand-gradient text-white font-semibold px-8 py-3 shadow-glow hover:opacity-95 transition-all hover:scale-105 duration-300"
            >
              Explore Programs
            </Link>
            <a
              href="/#contact"
              className="rounded-full border border-border bg-card text-foreground font-semibold px-8 py-3 shadow-soft hover:bg-secondary/40 transition-all hover:scale-105 duration-300"
            >
              Get In Touch
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ShieldAlert, Lock, Eye, FileText, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Optivita" },
      {
        name: "description",
        content: "Learn how Optivita collects, uses, and protects your personal health and wellness data.",
      },
      { property: "og:title", content: "Privacy Policy — Optivita" },
      {
        property: "og:description",
        content: "Read our privacy statement for website and mobile application usage.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* Hero Header */}
      <section className="relative pt-40 pb-20 bg-brand-gradient text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{ background: "radial-gradient(circle at 70% 30%, white 0%, transparent 60%)" }}
          aria-hidden
        />
        <div className="relative max-w-4xl mx-auto px-6 text-center md:text-left">
          <p className="uppercase tracking-[0.25em] text-xs font-semibold text-white/80 mb-2">
            Optivita Legal Statement
          </p>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Last Updated: August 9, 2026
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 max-w-4xl mx-auto px-6 flex-1">
        <div className="bg-card border border-border/80 rounded-3xl p-8 md:p-12 shadow-soft leading-relaxed text-muted-foreground space-y-8">
          
          <p className="text-foreground text-lg font-light leading-relaxed">
            Optivita (&ldquo;Optivita&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect information when you use the Optivita website, mobile application, and related services.
          </p>
          
          <div className="flex items-center gap-4 bg-teal/5 border border-teal/10 rounded-2xl p-4 text-teal text-sm">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <p>
              By using Optivita, you agree to the practices described in this Privacy Policy.
            </p>
          </div>

          <hr className="border-border/60" />

          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <span className="h-8 w-8 rounded-xl bg-vital/15 text-vital flex items-center justify-center shrink-0 text-sm">1</span>
              Information We Collect
            </h2>
            <p>
              Depending on how you use Optivita, we may collect the following information:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div className="bg-secondary/20 border border-border/40 rounded-2xl p-5">
                <h3 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-teal" /> Personal Information
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Date of birth or age</li>
                  <li>Gender (where voluntarily provided)</li>
                  <li>Account login credentials</li>
                  <li>Profile metadata</li>
                </ul>
              </div>
              <div className="bg-secondary/20 border border-border/40 rounded-2xl p-5">
                <h3 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-teal" /> Health &amp; Wellness Data
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Health questionnaire responses</li>
                  <li>Height and weight</li>
                  <li>Lifestyle and nutrition metrics</li>
                  <li>Fitness and activity stats</li>
                  <li>Individual wellness goals</li>
                  <li>Daily check-in logs</li>
                </ul>
              </div>
            </div>
            <p className="text-sm mt-3">
              We also automatically collect technical details such as your device type, operating system, app version, IP address, and crash diagnostics to improve system performance.
            </p>
          </div>

          <hr className="border-border/60" />

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <span className="h-8 w-8 rounded-xl bg-vital/15 text-vital flex items-center justify-center shrink-0 text-sm">2</span>
              How We Use Your Information
            </h2>
            <p>
              We process your details only for appropriate, secure, and operational purposes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm">
              <li>Creating, managing, and authenticating your account</li>
              <li>Designing meal and workout plans tailored to your health goals</li>
              <li>Tracking health markers and presenting graphical progress feedback</li>
              <li>Facilitating secure, real-time message communications with nutritional coaches</li>
              <li>Improving our website layout and diagnostics</li>
              <li>Fulfilling compliance or security requirements</li>
            </ul>
          </div>

          <hr className="border-border/60" />

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <span className="h-8 w-8 rounded-xl bg-vital/15 text-vital flex items-center justify-center shrink-0 text-sm">3</span>
              Health Information
            </h2>
            <p>
              Some Optivita features require inputting biometric measurements. We use this exclusively to customize wellness recommendations.
            </p>
            <div className="flex gap-3 bg-destructive/5 border border-destructive/10 text-destructive rounded-xl p-4 text-sm mt-2">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                <strong>Disclaimer:</strong> Optivita is a lifestyle support service and does not replace medical advice, diagnosis, treatment, or emergency clinical care. Consult a physician for all medical decisions.
              </p>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <span className="h-8 w-8 rounded-xl bg-vital/15 text-vital flex items-center justify-center shrink-0 text-sm">4</span>
              Information Sharing
            </h2>
            <p>
              <strong>We do not sell your personal information.</strong> We only share it when necessary to carry out operations, including with:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
              <li>Authorized Optivita coaching staff</li>
              <li>Hosting, database, and backend service providers</li>
              <li>SMS, email, or chat gateway providers</li>
              <li>Legal authorities if required under applicable laws</li>
            </ul>
          </div>

          <hr className="border-border/60" />

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <span className="h-8 w-8 rounded-xl bg-vital/15 text-vital flex items-center justify-center shrink-0 text-sm">5</span>
              Data Security
            </h2>
            <p>
              We implement industry-standard technical measures (SSL encryption, secure APIs, Firestore security rules) to defend against breach or unauthorized modification. While we prioritize data protection, no transmission over the internet can be 100% secure.
            </p>
          </div>

          <hr className="border-border/60" />

          {/* Section 6 & 7 */}
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal" /> Retention
              </h3>
              <p className="text-sm">
                We store your data as long as your account remains active or to fulfill tax/service logs, after which we securely purge or anonymize it.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-teal" /> Your Rights
              </h3>
              <p className="text-sm">
                You have complete rights to view, request rectification of, restrict processing, or request full deletion of your wellness profiles at any time.
              </p>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Contact Section */}
          <div className="space-y-3 text-center md:text-left bg-secondary/10 rounded-2xl p-6 border border-border/40">
            <h2 className="text-xl font-display font-bold text-teal">Contact Support</h2>
            <p className="text-sm">
              For any questions regarding this policy or data management requests, reach our team:
            </p>
            <div className="text-sm font-medium text-foreground space-y-1 pt-1">
              <p>Email: <a href="mailto:optivita.support@gmail.com" className="text-teal hover:underline">optivita.support@gmail.com</a></p>
              <p>Website: <a href="https://optivita.netlify.app" className="text-teal hover:underline">https://optivita.netlify.app</a></p>
            </div>
          </div>

        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

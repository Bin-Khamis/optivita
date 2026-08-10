import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Sparkles, Building, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/corporate/register")({
  component: CorporateRegistration,
});

function CorporateRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [companySize, setCompanySize] = useState("50-200");
  const [monthlyBudget, setMonthlyBudget] = useState(25000);
  const [billingPlan, setBillingPlan] = useState("monthly");

  const stepsList = [
    "Company Profile",
    "Business Contact",
    "Documents Verification",
    "Employee Setup",
    "Wellness Budget",
    "Benefits Configuration",
    "Provider Preferences",
    "Billing Details",
    "Terms of Use",
    "Registration Review"
  ];

  const handleNext = () => {
    if (step === 1 && !companyName) {
      toast.warning("Please fill in the Company Name.");
      return;
    }
    if (step === 2 && !businessEmail) {
      toast.warning("Please fill in the Business Email.");
      return;
    }
    if (step < 10) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("B2B registration request successfully submitted!");
    
    // Save mock session status
    const mockSession = {
      companyName,
      businessEmail,
      city,
      status: "Approved",
      budget: monthlyBudget,
      billingPlan
    };
    localStorage.setItem("optivita_corporate_session", JSON.stringify(mockSession));
    
    navigate({ to: "/corporate" });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-xs text-left">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex h-12 w-12 rounded-full bg-accent/15 items-center justify-center text-accent">
          <Building className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-black text-foreground">Optivita Corporate Wellness</h1>
          <p className="text-[10px] text-muted-foreground">Empower your company employees with precision wellness and coaching benefits</p>
        </div>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="space-y-3 mb-10">
        <div className="flex justify-between font-bold text-[9px] text-muted-foreground uppercase">
          <span>Step {step} of 10: {stepsList[step - 1]}</span>
          <span>{Math.round((step / 10) * 100)}% Complete</span>
        </div>
        <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
          <div style={{ width: `${(step / 10) * 100}%` }} className="h-full bg-accent rounded-full transition-all duration-300" />
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 shadow-soft space-y-6">
        
        {/* Step 1: Company Profile */}
        {step === 1 && (
          <div className="space-y-4 animate-scale-up">
            <h3 className="font-bold text-sm text-foreground">Company Information</h3>
            <div className="space-y-2">
              <label className="font-bold uppercase text-[9px] text-muted-foreground">Company legal name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Saudi Aramco Tech Corp"
                className="w-full p-3 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-bold uppercase text-[9px] text-muted-foreground">City Office Location</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Riyadh">Riyadh</option>
                  <option value="Jeddah">Jeddah</option>
                  <option value="Dammam">Dammam</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-bold uppercase text-[9px] text-muted-foreground">Company Size</label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
                >
                  <option value="10-50">10 - 50 staff</option>
                  <option value="50-200">50 - 200 staff</option>
                  <option value="200-1000">200 - 1000 staff</option>
                  <option value="1000+">1000+ staff</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact Details */}
        {step === 2 && (
          <div className="space-y-4 animate-scale-up">
            <h3 className="font-bold text-sm text-foreground">Contact Information</h3>
            <div className="space-y-2">
              <label className="font-bold uppercase text-[9px] text-muted-foreground">Primary Business Email</label>
              <input
                type="email"
                required
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="e.g. hr@company.com"
                className="w-full p-3 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold uppercase text-[9px] text-muted-foreground">Business phone number</label>
              <input
                type="text"
                required
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="e.g. +966 11 123 4567"
                className="w-full p-3 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 3 && (
          <div className="space-y-4 animate-scale-up">
            <h3 className="font-bold text-sm text-foreground">Upload Corporate Documents</h3>
            <p className="text-slate-400">Please upload your official commercial registration (CR) registry file for B2B portal verification.</p>
            <div className="p-8 border border-dashed rounded-2xl bg-secondary/5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary/10">
              <span className="font-bold text-accent">Click here to upload CR registration PDF</span>
              <span className="text-[9px] text-slate-400">Max size 10MB</span>
            </div>
          </div>
        )}

        {/* Step 4: Employee list */}
        {step === 4 && (
          <div className="space-y-4 animate-scale-up">
            <h3 className="font-bold text-sm text-foreground">Pre-Onboard Employees</h3>
            <p className="text-slate-400">Add comma-separated emails of staff you want to invite on launch.</p>
            <textarea
              rows={4}
              placeholder="e.g. user1@company.com, user2@company.com"
              className="w-full p-3 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
            />
          </div>
        )}

        {/* Step 5: Wellness Budget */}
        {step === 5 && (
          <div className="space-y-4 animate-scale-up">
            <h3 className="font-bold text-sm text-foreground">Define Wellness Credit Budgets</h3>
            <div className="space-y-2">
              <label className="font-bold uppercase text-[9px] text-muted-foreground">Monthly company spending allowance (SAR)</label>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                className="w-full p-3 border rounded-xl bg-secondary/15 border-border/60 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 6: Benefits Configuration */}
        {step === 6 && (
          <div className="space-y-4 animate-scale-up">
            <h3 className="font-bold text-sm text-foreground">Sponsorship Rules</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-xl bg-secondary/5">
                <div>
                  <span className="font-bold block">100% Sponsoring</span>
                  <span className="text-[9px] text-slate-400">Company pays total consult fee (SAR 0 co-payment)</span>
                </div>
                <input type="radio" name="sponsor" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-xl bg-secondary/5">
                <div>
                  <span className="font-bold block">Co-payment Model</span>
                  <span className="text-[9px] text-slate-400">Company pays 80%, Employee co-payment pays 20%</span>
                </div>
                <input type="radio" name="sponsor" />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Preferences */}
        {step === 7 && (
          <div className="space-y-4 animate-scale-up">
            <h3 className="font-bold text-sm text-foreground">Provider Categories Selection</h3>
            <p className="text-slate-400">Filter category permissions allowed to be booked with benefits.</p>
            <div className="grid grid-cols-2 gap-3">
              {["Nutritionists", "Fitness Coaches", "Gym Centers", "Stress Specialists"].map((cat) => (
                <div key={cat} className="flex items-center gap-2.5 p-3 border rounded-xl bg-secondary/15">
                  <input type="checkbox" defaultChecked className="h-4.5 w-4.5 text-accent" />
                  <span className="font-bold">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Billing */}
        {step === 8 && (
          <div className="space-y-4 animate-scale-up">
            <h3 className="font-bold text-sm text-foreground">Billing Arrangements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setBillingPlan("monthly")}
                className={`p-4 border rounded-2xl cursor-pointer text-center space-y-1 ${
                  billingPlan === "monthly" ? "border-accent bg-accent/5" : "bg-card"
                }`}
              >
                <span className="font-bold block">Monthly Invoiced Invoice</span>
                <span className="text-[9px] text-slate-400">Billed monthly after session completions</span>
              </div>
              <div
                onClick={() => setBillingPlan("payg")}
                className={`p-4 border rounded-2xl cursor-pointer text-center space-y-1 ${
                  billingPlan === "payg" ? "border-accent bg-accent/5" : "bg-card"
                }`}
              >
                <span className="font-bold block">Pay As You Go</span>
                <span className="text-[9px] text-slate-400">Immediate card payment upon checkout</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Terms */}
        {step === 9 && (
          <div className="space-y-4 animate-scale-up">
            <h3 className="font-bold text-sm text-foreground">Optivita B2B Agreement</h3>
            <p className="text-slate-400 leading-relaxed">
              By registering, you confirm the employee lists uploaded are verified team members. You agree to Optivita's B2B cancellation rules (24-hour notice required to avoid benefit deduction credit forfeiture).
            </p>
            <div className="flex items-center gap-2.5">
              <input type="checkbox" required className="h-4.5 w-4.5" />
              <span className="font-bold text-[10px]">I accept the B2B Service Terms & Conditions</span>
            </div>
          </div>
        )}

        {/* Step 10: Confirmation */}
        {step === 10 && (
          <div className="space-y-5 animate-scale-up text-center py-4">
            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-foreground">Onboarding Complete!</h3>
              <p className="text-slate-400">Review your company metrics, budget limits, and complete setup.</p>
            </div>
            <div className="p-4 border rounded-2xl bg-secondary/15 text-left space-y-2">
              <div className="flex justify-between"><span>Company:</span> <span className="font-bold text-foreground">{companyName}</span></div>
              <div className="flex justify-between"><span>Monthly Allowance:</span> <span className="font-bold text-foreground">SAR {monthlyBudget}</span></div>
              <div className="flex justify-between"><span>Billing Plan:</span> <span className="font-bold text-foreground capitalize">{billingPlan}</span></div>
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-brand-gradient text-white text-xs font-bold rounded-full shadow-soft flex items-center justify-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              <span>Launch B2B Corporate Portal</span>
            </button>
          </div>
        )}

        {/* Form Action Controls */}
        {step < 10 && (
          <div className="pt-6 border-t border-border/30 flex justify-between items-center">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="px-5 py-2.5 rounded-full border border-border/60 hover:bg-secondary/25 font-bold flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-accent text-white font-bold flex items-center gap-1 shadow-soft hover:opacity-95"
            >
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </form>
    </div>
  );
}

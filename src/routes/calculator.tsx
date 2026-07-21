import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { toast } from "sonner";
import { 
  Calculator, 
  Activity, 
  Droplet, 
  Footprints, 
  Flame, 
  Weight, 
  Sparkles,
  Phone, 
  Calendar, 
  ClipboardCheck, 
  User, 
  ChevronRight,
  TrendingUp,
  X
} from "lucide-react";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Free Health & BMI Calculator — Optivita" },
      { name: "description", content: "Calculate your BMI, daily calorie needs, recommended water intake, and overall health score instantly with the Optivita Health Calculator." },
      { property: "og:title", content: "Free Health & BMI Calculator — Optivita" },
      { property: "og:description", content: "Get your personalized BMI, calorie target, and health score instantly." },
    ],
  }),
  component: HealthCalculatorPage,
});

type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
type PrimaryGoal = "lose" | "gain" | "maintain" | "fitness" | "diabetes" | "pcos";

interface CalculatorInputs {
  fullName: string;
  dob: string;
  gender: string;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  primaryGoal: PrimaryGoal;
}

interface CalculatorResults {
  bmi: number;
  bmiCategory: "Underweight" | "Normal" | "Overweight" | "Obese";
  minHealthyWeight: number;
  maxHealthyWeight: number;
  dailyCalories: number;
  dailyWater: number;
  dailySteps: number;
  healthScore: number;
  personalizedMessage: string;
  recommendedProgramId: string;
  recommendedProgramName: string;
}

function HealthCalculatorPage() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    fullName: "",
    dob: "2001-01-01",
    gender: "female",
    height: 170,
    weight: 70,
    activityLevel: "moderate",
    primaryGoal: "lose",
  });

  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name === "height" || name === "weight" ? Number(value) : value
    }));
  };

  const calculateHealth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    // Simulate a premium loading feel
    setTimeout(() => {
      const { height, weight, dob, gender, activityLevel, primaryGoal, fullName } = inputs;
      const heightInMeters = height / 100;
      
      // Calculate age from Date of Birth
      const birthDate = new Date(dob);
      const today = new Date();
      let calculatedAgeVal = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAgeVal--;
      }
      const age = isNaN(calculatedAgeVal) ? 25 : Math.max(1, calculatedAgeVal);
      
      // 1. BMI
      const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
      
      // 2. BMI Category
      let bmiCategory: "Underweight" | "Normal" | "Overweight" | "Obese" = "Normal";
      if (bmi < 18.5) bmiCategory = "Underweight";
      else if (bmi >= 18.5 && bmi < 25) bmiCategory = "Normal";
      else if (bmi >= 25 && bmi < 30) bmiCategory = "Overweight";
      else bmiCategory = "Obese";

      // 3. Healthy Weight Range (BMI 18.5 to 24.9)
      const minHealthyWeight = Math.round(18.5 * (heightInMeters * heightInMeters));
      const maxHealthyWeight = Math.round(24.9 * (heightInMeters * heightInMeters));

      // 4. Daily Calories (Mifflin-St Jeor)
      let bmr = 10 * weight + 6.25 * height - 5 * age;
      if (gender === "male") {
        bmr += 5;
      } else {
        bmr -= 161;
      }

      let activityMultiplier = 1.2; // sedentary
      if (activityLevel === "light") activityMultiplier = 1.375;
      else if (activityLevel === "moderate") activityMultiplier = 1.55;
      else if (activityLevel === "active") activityMultiplier = 1.725;

      let maintenanceCalories = bmr * activityMultiplier;
      let dailyCalories = Math.round(maintenanceCalories);

      if (primaryGoal === "lose") dailyCalories -= 500;
      else if (primaryGoal === "gain") dailyCalories += 400;

      // 5. Water Intake (Weight in kg * 35 ml)
      let waterMultiplier = 35;
      if (activityLevel === "active") waterMultiplier += 5;
      const dailyWater = Number(((weight * waterMultiplier) / 1000).toFixed(1));

      // 6. Steps
      let dailySteps = 10000;
      if (activityLevel === "sedentary") dailySteps = 6000;
      else if (activityLevel === "light") dailySteps = 8000;
      else if (activityLevel === "moderate") dailySteps = 10000;
      else if (activityLevel === "active") dailySteps = 12000;

      // 7. Overall Health Score (0-100)
      let score = 100;
      
      // Deduct for BMI deviation
      if (bmi < 18.5) {
        score -= Math.round((18.5 - bmi) * 12);
      } else if (bmi >= 25) {
        score -= Math.round((bmi - 25) * 6);
      }

      // Deduct for sedentary lifestyle
      if (activityLevel === "sedentary") {
        score -= 15;
      } else if (activityLevel === "light") {
        score -= 5;
      }

      // Safeguard score bounds
      score = Math.max(40, Math.min(100, score));

      // 8. Program Recommendation
      let recommendedProgramId = "healthy-lifestyle-reset";
      let recommendedProgramName = "Healthy Lifestyle Reset";
      if (primaryGoal === "lose" || bmiCategory === "Overweight" || bmiCategory === "Obese") {
        recommendedProgramId = "30-day-weight-loss";
        recommendedProgramName = "30-Day Weight Loss Challenge";
      } else if (primaryGoal === "diabetes") {
        recommendedProgramId = "diabetes-nutrition";
        recommendedProgramName = "Diabetes Nutrition Program";
      } else if (primaryGoal === "pcos") {
        recommendedProgramId = "pcos-nutrition";
        recommendedProgramName = "PCOS Nutrition Program";
      } else if (primaryGoal === "fitness" || primaryGoal === "gain") {
        recommendedProgramId = "fat-loss-premium";
        recommendedProgramName = "Fat Loss Premium Coaching";
      }

      // 9. Personalized Message
      let personalizedMessage = `Hello ${fullName || "there"}, based on your calculations, your BMI is ${bmi}, which falls within the ${bmiCategory.toLowerCase()} range. `;
      
      if (bmiCategory === "Normal") {
        personalizedMessage += "You are in a healthy weight category, which is fantastic! To maintain this progress and align your habits, our certified health coaches recommend staying active and following a tailored plan.";
      } else if (bmiCategory === "Underweight") {
        personalizedMessage += "Your weight is slightly below the recommended range for your height. Building lean muscle mass and optimizing your nutrition can help you achieve a stronger, healthier profile safely.";
      } else {
        personalizedMessage += "This indicates that you carry some excess weight. With precision nutrition adjustments and structured coaching, you can safely work towards your ideal weight range while boosting your daily energy.";
      }

      personalizedMessage += ` Considering your main goal is to ${
        primaryGoal === "lose" ? "lose weight" : 
        primaryGoal === "gain" ? "gain weight" : 
        primaryGoal === "maintain" ? "maintain weight" : 
        primaryGoal === "fitness" ? "improve fitness" :
        primaryGoal === "diabetes" ? "manage blood sugar" :
        "support PCOS hormones"
      }, we highly recommend checking out our specialized programs.`;

      setResults({
        bmi,
        bmiCategory,
        minHealthyWeight,
        maxHealthyWeight,
        dailyCalories,
        dailyWater,
        dailySteps,
        healthScore: score,
        personalizedMessage,
        recommendedProgramId,
        recommendedProgramName
      });

      setIsCalculating(false);
      toast.success("Health Assessment calculations complete!");

      // Submit to Google Sheets Webhook with action webhookSubmit
      const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
      console.log("Optivita Debug: Webhook URL is:", webhookUrl);
      const payload = {
        action: "webhookSubmit",
        sheetName: "Health Assessments",
        fullName,
        dob,
        age,
        gender,
        height,
        weight,
        activityLevel,
        primaryGoal,
        bmi,
        bmiCategory,
        minHealthyWeight,
        maxHealthyWeight,
        dailyCalories,
        dailyWater,
        dailySteps,
        healthScore: score,
        recommendedProgram: recommendedProgramName,
        "Lead Status": "New Lead",
        "Assigned To": "Unassigned",
        "WhatsApp Action": "",
        "Action Notes": `Submitted online health assessment. DOB: ${dob}, Calculated age: ${age}`
      };
      console.log("Optivita Debug: Sending Health Calculator Payload:", payload);

      if (webhookUrl && webhookUrl !== "https://script.google.com/macros/s/AKfycbx_placeholder/exec") {
        fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify(payload)
        })
        .then(() => console.log("Optivita Debug: Webhook submit complete (no-cors response is opaque)"))
        .catch(err => console.error("Optivita Debug: Webhook submit error:", err));
      } else {
        console.warn("Optivita Debug: Webhook not submitted (using offline placeholder).");
      }

      // Always save record to local CRM cache so it appears immediately in the Admin Panel leads manager
      const cached = localStorage.getItem("optivita_crm_cache");
      let parsedCache: any = { "Health Assessments": [], "Program Enrollments": [] };
      if (cached) {
        try {
          parsedCache = JSON.parse(cached);
        } catch (e) {
          console.error("Failed to parse local CRM cache", e);
        }
      }
      
      const formatTime = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${day}-${month}-${year} | ${hours}:${minutes}:${seconds}`;
      };

      parsedCache["Health Assessments"].unshift({
        Timestamp: formatTime(new Date()),
        fullName: fullName || "Guest User",
        age,
        dob,
        gender,
        height,
        weight,
        bmi,
        bmiCategory,
        healthScore: score,
        dailyCalories,
        dailyWater,
        dailySteps,
        recommendedProgram: recommendedProgramName,
        "Lead Status": "New Lead",
        "Assigned To": "Unassigned",
        "WhatsApp Action": "",
        "Action Notes": `Submitted online health assessment. DOB: ${dob}, Calculated age: ${age}`
      });

      localStorage.setItem("optivita_crm_cache", JSON.stringify(parsedCache));

      // Scroll to results smoothly after state update
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        // Show lead generation modal 3 seconds after results appear
        setTimeout(() => {
          setShowModal(true);
        }, 3500);
      }, 100);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero Header */}
      <section className="relative pt-40 pb-16 bg-brand-gradient text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{ background: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }}
          aria-hidden
        />
        <div className="relative max-w-5xl mx-auto px-6 text-center md:text-left">
          <span className="bg-white/10 text-white border border-white/20 text-xs uppercase tracking-widest font-semibold px-4 py-1.5 rounded-full inline-block mb-3">
            Interactive Assessment
          </span>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-tight">
            Optivita Health Calculator
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/90 max-w-2xl font-light">
            Enter your details below to get instant scientific insights about your BMI, healthy weight range, calorie goals, and a personalized wellness recommendation.
          </p>
        </div>
      </section>

      {/* Main Section */}
      <section className="py-16 bg-secondary/30 flex-grow">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-12 gap-8 items-start">
          
          {/* Calculator Input Form */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-soft md:col-span-7">
            <h2 className="font-display font-bold text-2xl mb-6 flex items-center gap-2.5">
              <span className="h-10 w-10 rounded-xl bg-vital/15 text-vital flex items-center justify-center shrink-0">
                <Calculator className="h-5.5 w-5.5" />
              </span>
              Health Profile Details
            </h2>

            <form onSubmit={calculateHealth} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-4 w-4 text-muted-foreground" /> Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={inputs.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center justify-between">
                    <span>Date of Birth</span>
                    {inputs.dob && (
                      <span className="text-xs text-vital font-semibold">
                        Age: {(() => {
                          const birthDate = new Date(inputs.dob);
                          const today = new Date();
                          let calcAge = today.getFullYear() - birthDate.getFullYear();
                          const m = today.getMonth() - birthDate.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                            calcAge--;
                          }
                          return isNaN(calcAge) ? "" : `${calcAge} yrs`;
                        })()}
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={inputs.dob}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Gender</label>
                  <select
                    name="gender"
                    value={inputs.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-slate-800 dark:text-slate-100"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Height */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={inputs.height}
                    onChange={handleInputChange}
                    required
                    min="100"
                    max="250"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={inputs.weight}
                    onChange={handleInputChange}
                    required
                    min="30"
                    max="250"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Activity Level */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Daily Activity Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "sedentary", title: "Sedentary", desc: "Desk job, little exercise" },
                    { val: "light", title: "Lightly Active", desc: "Light exercise 1-3 days/wk" },
                    { val: "moderate", title: "Moderately Active", desc: "Moderate exercise 3-5 days/wk" },
                    { val: "active", title: "Very Active", desc: "Hard exercise 6-7 days/wk" },
                  ].map((act) => (
                    <label 
                      key={act.val} 
                      className={`border rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:bg-secondary/40 transition-colors ${
                        inputs.activityLevel === act.val ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{act.title}</span>
                        <input
                          type="radio"
                          name="activityLevel"
                          value={act.val}
                          checked={inputs.activityLevel === act.val}
                          onChange={handleInputChange}
                          className="accent-[var(--accent)] h-3.5 w-3.5 shrink-0"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 leading-tight">{act.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Primary Goal */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Primary Health Goal</label>
                <select
                  name="primaryGoal"
                  value={inputs.primaryGoal}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="lose">Lose Weight</option>
                  <option value="gain">Gain Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="fitness">Improve Fitness & Energy</option>
                  <option value="diabetes">Manage Diabetes / Blood Sugar</option>
                  <option value="pcos">PCOS Support / Hormonal Balance</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isCalculating}
                className="w-full rounded-full bg-brand-gradient text-white font-semibold py-4 text-base shadow-glow hover:opacity-95 transition-all hover:scale-[1.01] duration-300 flex items-center justify-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calculating your Health Profile...
                  </>
                ) : (
                  <>
                    <Calculator className="h-5 w-5" />
                    Calculate Health Report
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Calculator Guidance panel */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft">
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-accent" /> Why Calculate?
              </h3>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Health isn't just about weight—it's about understanding how your body utilizes energy and processes hydration. Our calculator runs calculations based on established medical equations:
              </p>
              
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-vital mt-1.5 shrink-0" />
                  <span><strong>BMI Analysis</strong>: Identifies standard clinical weight classifications for your height.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-vital mt-1.5 shrink-0" />
                  <span><strong>Calorie TDEE Needed</strong>: Mifflin-St Jeor formula calculates your Total Daily Energy Expenditure.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-vital mt-1.5 shrink-0" />
                  <span><strong>Hydration Target</strong>: Matches custom volume requirements to your body mass and activity profile.</span>
                </li>
              </ul>
            </div>

            <div className="bg-brand-gradient text-white rounded-3xl p-6 shadow-soft relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_0%_100%,_white_0%,_transparent_50%)]" />
              <h3 className="font-display font-bold text-lg">Looking for Precision?</h3>
              <p className="text-xs text-white/80 mt-2 leading-relaxed">
                Calculators provide great general benchmarks, but they cannot replace a personalized health scan. Connect with Optivita coach for clinical assessment.
              </p>
              <Link 
                to="/#programs" 
                className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-2 mt-4 transition-all duration-300"
              >
                Explore Coaching Programs <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Results Section */}
      {results && (
        <div ref={resultsRef} className="py-20 bg-background border-t border-border/80 scroll-mt-6">
          <div className="max-w-5xl mx-auto px-6">
            
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="bg-vital/10 text-vital text-xs uppercase tracking-widest font-semibold px-4 py-1.5 rounded-full inline-block mb-3">
                Calculations Complete
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl">Your Personalized Health Report</h2>
            </div>

            {/* Health Score and Message Card */}
            <div className="grid md:grid-cols-12 gap-8 mb-8">
              
              {/* Health Score circle progress card */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft md:col-span-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <h3 className="font-display font-bold text-lg text-foreground mb-4">Overall Health Score</h3>
                
                {/* SVG Progress Circle */}
                <div className="relative h-40 w-40 flex items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="68"
                      className="text-secondary"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="68"
                      className="text-vital transition-all duration-1000 ease-out"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 68}
                      strokeDashoffset={2 * Math.PI * 68 * (1 - results.healthScore / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-display font-extrabold text-4xl text-foreground leading-none">
                      {results.healthScore}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
                      Score / 100
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border/40">
                  <span className="h-2 w-2 rounded-full bg-vital animate-pulse" />
                  Score based on BMI & activity level
                </div>
              </div>

              {/* Personalized message details */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-soft md:col-span-7 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
                    <ClipboardCheck className="h-5.5 w-5.5 text-accent" />
                    Hi {inputs.fullName}, here are your insights:
                  </h3>
                  <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed font-light">
                    {results.personalizedMessage}
                  </p>
                </div>
                <div className="mt-6 border-t border-border/50 pt-4 text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-vital" />
                  We recommend program consultation below.
                </div>
              </div>

            </div>

            {/* Calculations Dashboard Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              
              {/* BMI Card with gauge bar */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">BMI Summary</span>
                    <Weight className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-foreground">{results.bmi}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      results.bmiCategory === "Normal" ? "bg-vital/15 text-vital" :
                      results.bmiCategory === "Underweight" ? "bg-cyan-500/15 text-cyan-500" :
                      results.bmiCategory === "Overweight" ? "bg-amber-500/15 text-amber-500" :
                      "bg-rose-500/15 text-rose-500"
                    }`}>
                      {results.bmiCategory}
                    </span>
                  </div>
                </div>

                {/* BMI Gauge Visual */}
                <div className="mt-6 space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex relative">
                    <div className="h-full bg-cyan-400" style={{ width: "18.5%" }} />
                    <div className="h-full bg-vital" style={{ width: "21.5%" }} />
                    <div className="h-full bg-amber-400" style={{ width: "10%" }} />
                    <div className="h-full bg-rose-500" style={{ width: "50%" }} />
                    
                    {/* Marker pointer */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-foreground shadow-md ring-2 ring-white transform -translate-x-1/2 transition-all duration-1000"
                      style={{ 
                        left: `${Math.min(100, Math.max(0, ((results.bmi - 15) / 25) * 100))}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-semibold">
                    <span>18.5 (Min)</span>
                    <span>25.0 (Over)</span>
                    <span>30.0 (Obese)</span>
                  </div>
                </div>
              </div>

              {/* Healthy Weight Card */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Healthy weight range</span>
                    <Activity className="h-5 w-5 text-vital" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-display font-bold text-foreground">
                      {results.minHealthyWeight} – {results.maxHealthyWeight}
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">kg</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Recommended target weight range for a height of {inputs.height} cm.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 text-[10px] text-muted-foreground">
                  Based on WHO BMI recommendations.
                </div>
              </div>

              {/* Calories Card */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Recommended Calories</span>
                    <Flame className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-display font-bold text-foreground">{results.dailyCalories}</span>
                    <span className="text-sm font-semibold text-muted-foreground">kcal/day</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Estimated calorie target adjusted for your goal: <strong className="text-foreground">{
                      inputs.primaryGoal === "lose" ? "Lose Weight" : 
                      inputs.primaryGoal === "gain" ? "Gain Weight" : 
                      inputs.primaryGoal === "maintain" ? "Maintain Weight" : 
                      "Optimized Wellness"
                    }</strong>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 text-[10px] text-muted-foreground">
                  Mifflin-St Jeor standard equations.
                </div>
              </div>

              {/* Water Intake Card */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Daily Water Target</span>
                    <Droplet className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-display font-bold text-foreground">{results.dailyWater}</span>
                    <span className="text-sm font-semibold text-muted-foreground">Litres</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Optimal daily hydration target adjusted to your body weight and metabolic profile.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 text-[10px] text-muted-foreground">
                  Roughly {Math.round(results.dailyWater * 4)} glasses (250ml each).
                </div>
              </div>

              {/* Walking Goal Card */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Walking steps goal</span>
                    <Footprints className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-display font-bold text-foreground">{results.dailySteps.toLocaleString()}</span>
                    <span className="text-sm font-semibold text-muted-foreground">Steps/day</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Personalized active movement target based on your current physical activity level.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 text-[10px] text-muted-foreground">
                  Helps boost cardiovascular and metabolic rate.
                </div>
              </div>

              {/* Programs Recommendations Card */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft relative overflow-hidden flex flex-col justify-between bg-accent/5 border-accent/20">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-accent uppercase font-bold tracking-wider">Recommended Program</span>
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <h4 className="font-display font-bold text-lg text-foreground mt-1">
                    {results.recommendedProgramName}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    This program has been selected as the optimal match for your goals and assessment score.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-accent/20">
                  <Link 
                    to="/programs/$programId" 
                    params={{ programId: results.recommendedProgramId }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline hover:gap-2 transition-all duration-300"
                  >
                    View Details & Apply <ChevronRight className="h-3 w-3" strokeWidth={3} />
                  </Link>
                </div>
              </div>

            </div>

            {/* Call to Action Box (Very Important) */}
            <div className="bg-brand-gradient text-white rounded-3xl p-8 md:p-10 shadow-glow text-center md:text-left relative overflow-hidden mb-8">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_0%,_white_0%,_transparent_60%)]" />
              <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
                
                <div className="md:col-span-8 space-y-4">
                  <span className="inline-block text-xs font-bold tracking-widest uppercase bg-white/10 text-white border border-white/20 rounded-full px-4.5 py-1.5">
                    🎯 Ready to Transform Your Health?
                  </span>
                  <h3 className="font-display font-extrabold text-2xl md:text-4xl leading-tight">
                    Start your transformation with Optivita.
                  </h3>
                  
                  <div className="space-y-2 mt-4 text-white/90 text-sm md:text-base font-light">
                    <p className="flex items-center gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0">✓</span>
                      Based on your results, we recommend: <strong className="font-bold underline ml-1">{results.recommendedProgramName}</strong>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0">✓</span>
                      Structured deliverables, weekly clinical checks, and direct coach chat support.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col gap-3 shrink-0">
                  <button 
                    onClick={() => setShowModal(true)}
                    className="w-full text-center bg-white text-primary font-bold py-3.5 rounded-full shadow-soft hover:scale-105 transition-all duration-300 text-sm flex items-center justify-center gap-2"
                  >
                    <ClipboardCheck className="h-4.5 w-4.5" />
                    Get Personalized Plan
                  </button>
                  <Link 
                    to="/programs/$programId" 
                    params={{ programId: results.recommendedProgramId }}
                    className="w-full text-center bg-white/10 border border-white/20 text-white font-bold py-3.5 rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300 text-sm flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-4.5 w-4.5" />
                    Book Free Consultation
                  </Link>
                  <a 
                    href="https://wa.me/yourwhatsappnumber" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full text-center bg-emerald-500 text-white font-bold py-3.5 rounded-full shadow-md hover:bg-emerald-600 hover:scale-105 transition-all duration-300 text-sm flex items-center justify-center gap-2 border border-emerald-400/20"
                  >
                    <Phone className="h-4.5 w-4.5" />
                    Chat on WhatsApp
                  </a>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Lead Generation Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-card border border-border/80 rounded-3xl w-full max-w-md p-7 shadow-glow animate-scale-up z-10">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mt-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-vital/10 text-vital flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground">
                Want a personalized nutrition plan?
              </h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Get your **FREE** health assessment from our certified nutrition experts. We will review your BMI calculations and design a customized path to your goals.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <a 
                href="#enroll" 
                onClick={() => {
                  setShowModal(false);
                  if (results) {
                    window.location.href = `/programs/${results.recommendedProgramId}#enroll`;
                  } else {
                    window.location.href = "/#programs";
                  }
                }}
                className="w-full text-center bg-brand-gradient text-white font-bold py-3.5 rounded-full shadow-glow hover:opacity-95 transition-all duration-300 block text-sm"
              >
                Join Now
              </a>
              <a 
                href="https://wa.me/yourwhatsappnumber" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-full shadow-md hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <Phone className="h-4 w-4" />
                WhatsApp Us
              </a>
              <a 
                href="/#programs" 
                onClick={() => setShowModal(false)}
                className="w-full text-center bg-card border border-border text-foreground hover:bg-secondary/40 font-bold py-3.5 rounded-full transition-all duration-300 block text-sm"
              >
                Book Consultation
              </a>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-5 leading-normal">
              No commitments. Your details are safe and secured under privacy policies.
            </p>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

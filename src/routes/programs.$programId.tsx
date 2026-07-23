import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { getProgram, type FormField, type Program } from "@/lib/programs";
import { Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getNextEnrollmentId, saveEnrollmentToFirestore, markEnrollmentSynced } from "@/lib/firebase";
import { isWebhookOffline } from "@/lib/utils";

export const Route = createFileRoute("/programs/$programId")({
  loader: ({ params }) => {
    const program = getProgram(params.programId);
    if (!program) throw notFound();
    return { program };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.program.name} — Optivita` },
          { name: "description", content: loaderData.program.tagline },
          { property: "og:title", content: `${loaderData.program.name} — Optivita` },
          { property: "og:description", content: loaderData.program.tagline },
        ]
      : [],
  }),
  component: ProgramPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Program not found</h1>
        <Link to="/" className="mt-4 inline-block text-accent underline">← Back to programs</Link>
      </div>
    </div>
  ),
  errorComponent: ErrorView,
});

function ErrorView({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

const optionTooltips: Record<string, string> = {
  // Health Background conditions
  "Diabetes": "A chronic condition affecting how your body processes blood sugar (glucose).",
  "Hypertension": "High blood pressure, which can increase the risk of heart disease and stroke.",
  "Thyroid": "Thyroid gland disorders affecting metabolism, energy levels, and hormonal balance.",
  "PCOS": "Polycystic Ovary Syndrome, a hormonal disorder common in women of reproductive age.",
  "Asthma": "A respiratory condition causing airway inflammation and breathing difficulties.",
  "Arthritis": "Inflammation of the joints causing pain, swelling, and stiffness.",
  "None": "Select if you do not have any of the listed conditions.",
  "Other": "Select if you have a condition not listed here.",

  // Goals
  "Lose weight": "Reduce body weight through sustainable fat loss.",
  "Reduce belly fat": "Focus on abdominal fat reduction and metabolic health.",
  "Improve overall health": "Enhance general wellness, immunity, and daily function.",
  "Increase energy": "Improve stamina, alertness, and reduce daily fatigue.",
  "Improve fitness": "Enhance strength, flexibility, and cardiovascular endurance.",

  // Diabetes details
  "Type 1": "An autoimmune condition where the pancreas produces little or no insulin.",
  "Type 2": "A chronic condition where the body resists insulin or doesn't make enough.",
  "Prediabetes": "Elevated blood sugar levels, indicating risk of developing Type 2 diabetes.",
  "Gestational": "High blood sugar levels that develop during pregnancy.",
  "Not sure": "Diagnosed with diabetes but type is not officially confirmed.",

  // General options
  "Yes": "Affirmative response.",
  "No": "Negative response.",
  "Prefer not to say": "Choose this to keep this information private.",
  "Female": "Female biological sex or gender identity.",
  "Male": "Male biological sex or gender identity.",
  
  // Sleep Quality
  "Excellent": "Sleep soundly for 7-8 hours, waking up fully refreshed.",
  "Good": "Generally good sleep with minimal disturbances.",
  "Fair": "Restless sleep or waking up feeling partially rested.",
  "Poor": "Frequent insomnia, waking up fatigued.",
  
  // Energy Levels
  "Low": "Feeling sluggish or tired throughout most of the day.",
  "Medium": "Standard energy levels, normal daily functioning.",
  "High": "Feeling vibrant, active, and mentally alert.",
  
  // Stress Levels
  "Low Stress": "Calm state of mind, manageable daily demands.",
  "Medium Stress": "Occasions of pressure, normal coping capacity.",
  "High Stress": "Persistent overwhelm, affecting sleep or well-being.",
  
  // Activity levels
  "Sedentary": "Little to no exercise, desk-based routine.",
  "Light": "Light exercise or walking 1-3 days per week.",
  "Moderate": "Moderate exercise or active movement 3-5 days per week.",
  "Active": "Intense exercise or sport 6-7 days per week.",
  "Very active": "Highly physical job or dual daily training sessions."
};

function DateField({ field, id, req, base }: { field: FormField; id: string; req?: boolean; base: string }) {
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setCalculatedAge(null);
      return;
    }
    const birthDate = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setCalculatedAge(isNaN(age) ? null : age);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{field.label}{req && <span className="text-destructive"> *</span>}</label>
      <input 
        id={id} 
        name={field.name} 
        type="date" 
        required={req} 
        onChange={handleDateChange}
        className={`${base} text-foreground`} 
      />
      {calculatedAge !== null && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
          Calculated Age: {calculatedAge} years old
        </p>
      )}
    </div>
  );
}

function SelectField({ field, id, req, base }: { field: FormField; id: string; req?: boolean; base: string }) {
  const [showOtherSpecify, setShowOtherSpecify] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{field.label}{req && <span className="text-destructive"> *</span>}</label>
      <select 
        id={id} 
        name={field.name} 
        required={req} 
        className={base} 
        defaultValue="" 
        onChange={(e) => setShowOtherSpecify(e.target.value === "Other")}
      >
        <option value="" disabled>Select…</option>
        {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {showOtherSpecify && (
        <input
          type="text"
          name={`${field.name}_other`}
          placeholder="Please specify other details..."
          required
          className={`${base} mt-2 animate-fade-in`}
        />
      )}
    </div>
  );
}

function RadioField({ field, req, base }: { field: FormField; req?: boolean; base: string }) {
  const [showOtherSpecify, setShowOtherSpecify] = useState(false);

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{field.label}{req && <span className="text-destructive"> *</span>}</legend>
      <div className="flex flex-wrap gap-2">
        {field.options?.map((o) => {
          const tooltipText = optionTooltips[o];
          return (
            <label key={o} className="relative group inline-flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm cursor-pointer hover:bg-secondary/60">
              <input 
                type="radio" 
                name={field.name} 
                value={o} 
                required={req} 
                className="accent-[var(--accent)]" 
                onChange={(e) => setShowOtherSpecify(e.target.value === "Other")} 
              />
              {o}
              {tooltipText && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 text-xs text-white bg-primary rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 text-center shadow-glow border border-white/10 leading-normal">
                  {tooltipText}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-primary" />
                </span>
              )}
            </label>
          );
        })}
      </div>
      {showOtherSpecify && (
        <input
          type="text"
          name={`${field.name}_other`}
          placeholder="Please specify other details..."
          required
          className={`${base} mt-2 animate-fade-in`}
        />
      )}
    </fieldset>
  );
}

function CheckboxGroupField({ field, base }: { field: FormField; base: string }) {
  const [checkedOptions, setCheckedOptions] = useState<string[]>([]);
  const [showOtherSpecify, setShowOtherSpecify] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const isChecked = e.target.checked;
    let updated: string[];
    if (isChecked) {
      updated = [...checkedOptions, val];
    } else {
      updated = checkedOptions.filter((item) => item !== val);
    }
    setCheckedOptions(updated);
    setShowOtherSpecify(updated.includes("Other"));
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{field.label}</legend>
      <div className="flex flex-wrap gap-2">
        {field.options?.map((o) => {
          const tooltipText = optionTooltips[o];
          return (
            <label key={o} className="relative group inline-flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm cursor-pointer hover:bg-secondary/60">
              <input type="checkbox" name={field.name} value={o} className="accent-[var(--accent)]" onChange={handleCheckboxChange} />
              {o}
              {tooltipText && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 text-xs text-white bg-primary rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 text-center shadow-glow border border-white/10 leading-normal">
                  {tooltipText}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-primary" />
                </span>
              )}
            </label>
          );
        })}
      </div>
      {showOtherSpecify && (
        <input
          type="text"
          name={`${field.name}_other`}
          placeholder="Please specify other details..."
          required
          className={`${base} mt-2 animate-fade-in`}
        />
      )}
    </fieldset>
  );
}

function Field({ field }: { field: FormField }) {
  const id = `f-${field.name}`;
  const req = field.required;
  const base = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  if (field.type === "date") {
    return <DateField field={field} id={id} req={req} base={base} />;
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">{field.label}{req && <span className="text-destructive"> *</span>}</label>
        <textarea id={id} name={field.name} required={req} placeholder={field.placeholder} rows={4} className={base} />
      </div>
    );
  }

  if (field.type === "select") {
    return <SelectField field={field} id={id} req={req} base={base} />;
  }

  if (field.type === "radio") {
    return <RadioField field={field} req={req} base={base} />;
  }

  if (field.type === "checkbox" && field.options) {
    return <CheckboxGroupField field={field} base={base} />;
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name={field.name} required={req} className="mt-1 accent-[var(--accent)]" />
        <span>{field.label}{req && <span className="text-destructive"> *</span>}</span>
      </label>
    );
  }

  if (field.type === "tel") {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">{field.label}{req && <span className="text-destructive"> *</span>}</label>
        <div className="flex gap-2">
          <select 
            name={`${field.name}_country_code`} 
            required={req} 
            defaultValue="+91" 
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-28 text-foreground"
          >
            <option value="+91">🇮🇳 +91</option>
            <option value="+965">🇰🇼 +965</option>
            <option value="+971">🇦🇪 +971</option>
            <option value="+966">🇸🇦 +966</option>
            <option value="+974">🇶🇦 +974</option>
            <option value="+973">🇧🇭 +973</option>
            <option value="+968">🇴🇲 +968</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+44">🇬🇧 +44</option>
            <option value="+61">🇦🇺 +61</option>
            <option value="+65">🇸🇬 +65</option>
          </select>
          <input 
            id={id} 
            name={field.name} 
            type="tel" 
            required={req} 
            placeholder={field.placeholder || "Enter phone number"} 
            className={`${base} flex-1`} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{field.label}{req && <span className="text-destructive"> *</span>}</label>
      <input id={id} name={field.name} type={field.type} required={req} placeholder={field.placeholder} className={base} />
    </div>
  );
}

function ProgramPage() {
  const { program } = Route.useLoaderData() as { program: Program };
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePrintSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    document.body.classList.add("printing-active");
    element.classList.add("print-section");
    
    setTimeout(() => {
      window.print();
      const cleanup = () => {
        document.body.classList.remove("printing-active");
        element.classList.remove("print-section");
      };
      if ("onafterprint" in window) {
        window.addEventListener("afterprint", cleanup, { once: true });
      } else {
        setTimeout(cleanup, 500);
      }
    }, 150);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {
      action: "webhookSubmit",
      sheetName: "Program Enrollments",
      programId: program.id,
      programName: program.name,
    };
    
    // Parse form values
    formData.forEach((value, key) => {
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    });

    // Merge country code and phone number fields
    if (data.phone && data.phone_country_code) {
      data.phone = `${data.phone_country_code}${data.phone.replace(/[^0-9]/g, "")}`;
      delete data.phone_country_code;
    }

    // Format array values as strings (e.g. joined by comma)
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        data[key] = data[key].join(", ");
      }
    });

    // Calculate age from Date of Birth
    if (data.dob) {
      const birthDate = new Date(data.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      data.age = isNaN(calculatedAge) ? 0 : calculatedAge;
    }

    // Determine mode
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = isWebhookOffline(webhookUrl);

    setSubmitting(true);

    let enrollmentId = "";
    try {
      enrollmentId = await getNextEnrollmentId();
    } catch (err) {
      console.error("Failed to generate Firestore Enrollment ID, using backup:", err);
      enrollmentId = `OPT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    data["Enrollment ID"] = enrollmentId;

    const formatTime = (date: Date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${day}-${month}-${year} | ${hours}:${minutes}:${seconds}`;
    };

    data["Timestamp"] = formatTime(new Date());
    data["Payment Status"] = "Unpaid";
    data["Lead Status"] = "New Lead";
    data["Loyalty Points"] = 500;
    data["Loyalty Tier"] = "Silver";
    data["Referral Code"] = `OPT-${(data.fullName || "GUEST").split(" ")[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Save client record to Firestore for instant authentication portal (run in background)
    saveEnrollmentToFirestore(enrollmentId, data).catch((err) => {
      console.warn("Firestore save enrollment background error:", err);
    });

    // 3. Always save to local CRM cache so lead appears immediately in Admin Panel / Portal
    try {
      const cached = localStorage.getItem("optivita_crm_cache");
      let dbCache = cached ? JSON.parse(cached) : null;
      if (!dbCache) {
        dbCache = {
          "Program Enrollments": [],
          "Health Assessments": [],
          "Loyalty Ledger": [],
          "Invoices": [],
          "Receipts": [],
          "Journal Ledger": [],
          "Audit Logs": []
        };
      }
      
      if (!dbCache["Program Enrollments"]) dbCache["Program Enrollments"] = [];
      if (!dbCache["Loyalty Ledger"]) dbCache["Loyalty Ledger"] = [];
      if (!dbCache["Invoices"]) dbCache["Invoices"] = [];

      const newEnrollment = {
        "Timestamp": data.Timestamp,
        "Enrollment ID": enrollmentId,
        "fullName": data.fullName,
        "email": data.email,
        "phone": data.phone,
        "programName": data.programName,
        "dob": data.dob,
        "age": data.age,
        "Lead Status": "New Lead",
        "Assigned To": "None",
        "Priority": "Medium",
        "Payment Status": "Unpaid",
        "Loyalty Points": 500,
        "Loyalty Tier": "Silver",
        "Referral Code": data["Referral Code"],
        "Action Notes": ""
      };

      dbCache["Program Enrollments"].unshift(newEnrollment);

      dbCache["Loyalty Ledger"].unshift({
        Timestamp: data.Timestamp,
        "Enrollment ID": enrollmentId,
        "Customer Name": data.fullName,
        Activity: "Welcome & Program Enrollment Bonus",
        "Points Earned": 500,
        "Points Redeemed": 0,
        "Current Balance": 500
      });

      const formatDateStr = (d: Date) => {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };

      dbCache["Invoices"].unshift({
        InvoiceId: "INV-" + Math.floor(100000 + Math.random() * 900000),
        "Enrollment ID": enrollmentId,
        "Customer Name": data.fullName,
        "Program Name": data.programName,
        Amount: 299,
        Date: formatDateStr(new Date()),
        Status: "Unpaid"
      });

      localStorage.setItem("optivita_crm_cache", JSON.stringify(dbCache));
    } catch (err) {
      console.error("Optivita Debug: Local CRM cache save error:", err);
    }

    // 4. Dispatch to Google Sheets Webhook with mode: no-cors and AbortController timeout to prevent Netlify CORS hanging
    if (!isOffline) {
      try {
        console.log("Optivita Debug: Sending Webhook Payload:", data);
        
        // Attempt standard JSON fetch first, fallback to no-cors on error or timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch(webhookUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(data),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          console.log("Optivita Debug: Webhook submit complete (no-cors).", response);
          await markEnrollmentSynced(enrollmentId).catch(() => {});
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          console.warn("Optivita Debug: Webhook dispatch note:", fetchErr);
        }
      } catch (err) {
        console.error("Optivita Debug: Outer Webhook error:", err);
      }
    }

    // 5. Always display confirmation screen and unlock form state
    const finalData = { ...data, "Enrollment ID": enrollmentId };
    setSubmittedData(finalData);
    setSubmitted(true);
    setSubmitting(false);
    toast.success("Application received successfully!");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted && submittedData) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <SiteHeader />
        
        <main className="flex-1 max-w-3xl mx-auto px-6 pt-32 pb-16 w-full space-y-6 no-print">
          <div className="rounded-[32px] bg-card p-10 text-center shadow-soft border border-border/80 w-full animate-scale-up space-y-6">
            <div 
              className="mx-auto h-14 w-14 rounded-full flex items-center justify-center text-white text-xl shadow-md"
              style={{ background: "linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #14b8a6 100%)" }}
            >
              ✓
            </div>
            <h2 className="font-display font-bold text-3xl text-[#032b27] dark:text-[#a7f3d0] tracking-tight">Application Received</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
              Thank you for enrolling in <strong>{program.name}</strong>. Your Optivita coach will contact you via WhatsApp or email within 24 hours.
            </p>
            <p className="text-xs text-slate-400 font-semibold font-mono">
              Intake Reference: <span className="text-emerald-600 dark:text-emerald-400">{submittedData["Enrollment ID"]}</span>
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button 
                onClick={() => handlePrintSection("intake-summary-sheet")} 
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft flex items-center gap-2 transition"
              >
                <Printer className="h-4 w-4" /> Download/Print Filled Form
              </button>
              <Link 
                to="/" 
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 text-xs font-bold flex items-center gap-1.5 transition"
              >
                ← Back to home
              </Link>
            </div>
          </div>

          {/* Collapsible/Viewable summary in page itself */}
          <div className="bg-card border border-border rounded-[24px] p-6 shadow-soft space-y-4">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 border-b pb-2">Review Submitted Information</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <p className="text-slate-400">Enrollment Number</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{submittedData["Enrollment ID"]}</p>
              </div>
              <div>
                <p className="text-slate-400">Submission Date</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{submittedData["Timestamp"]}</p>
              </div>
              <div>
                <p className="text-slate-400">Full Name</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{submittedData["fullName"]}</p>
              </div>
              <div>
                <p className="text-slate-400">Date of Birth</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{submittedData["dob"]}</p>
              </div>
              <div>
                <p className="text-slate-400">Calculated Age</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{submittedData["age"]} years</p>
              </div>
              <div>
                <p className="text-slate-400">Phone / WhatsApp</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{submittedData["phone"]}</p>
              </div>
              <div>
                <p className="text-slate-400">Gender</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{submittedData["gender"]}</p>
              </div>
              <div>
                <p className="text-slate-400">City / Country</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{submittedData["city"] || "-"}</p>
              </div>
            </div>
          </div>
        </main>

        {/* Hidden A4 Print Sheet Container */}
        <div id="intake-summary-sheet" className="hidden print:block bg-white text-black p-8 max-w-4xl mx-auto space-y-6 text-sm" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4">
            <div className="flex items-center gap-3">
              <img src="/optivita-logo.png" alt="Optivita" className="h-10 w-10 object-contain" />
              <div>
                <h2 className="font-black text-xl text-emerald-800 uppercase tracking-tight">Optivita Precision Health</h2>
                <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase">Client Intake Application</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Enrollment Number</p>
              <p className="font-mono font-black text-lg text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200 inline-block">{submittedData["Enrollment ID"]}</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-1">Program Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Selected Program</span>
                <span className="font-bold text-slate-900">{program.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Intake Timestamp</span>
                <span className="font-bold text-slate-900">{submittedData["Timestamp"]}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-1">Personal Details</h3>
            <div className="grid grid-cols-3 gap-y-4 gap-x-6">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Full Name</span>
                <span className="font-bold text-slate-900">{submittedData["fullName"]}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Date of Birth</span>
                <span className="font-bold text-slate-900">{submittedData["dob"]}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Calculated Age</span>
                <span className="font-bold text-slate-900">{submittedData["age"]} years</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Phone / WhatsApp</span>
                <span className="font-bold text-slate-900">{submittedData["phone"]}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Email Address</span>
                <span className="font-bold text-slate-900">{submittedData["email"]}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Gender</span>
                <span className="font-bold text-slate-900">{submittedData["gender"]}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">City / Country</span>
                <span className="font-bold text-slate-900">{submittedData["city"] || "-"}</span>
              </div>
            </div>
          </div>

          {/* Measurements */}
          {(submittedData["height"] || submittedData["weight"]) && (
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-1">Vital Statistics</h3>
              <div className="grid grid-cols-4 gap-4">
                {submittedData["height"] && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Height</span>
                    <span className="font-bold text-slate-900">{submittedData["height"]} cm</span>
                  </div>
                )}
                {submittedData["weight"] && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Weight</span>
                    <span className="font-bold text-slate-900">{submittedData["weight"]} kg</span>
                  </div>
                )}
                {submittedData["waist"] && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Waist Line</span>
                    <span className="font-bold text-slate-900">{submittedData["waist"]} cm</span>
                  </div>
                )}
                {submittedData["hip"] && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Hip Line</span>
                    <span className="font-bold text-slate-900">{submittedData["hip"]} cm</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lifestyle or other answers */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-xs uppercase text-slate-500 border-b pb-1">Additional Intake Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
              {Object.keys(submittedData).map((key) => {
                const skipKeys = [
                  "action", "sheetName", "programId", "programName", "fullName", "email",
                  "phone", "gender", "city", "height", "weight", "waist", "hip", "dob", "age",
                  "Timestamp", "Enrollment ID", "Payment Status", "Lead Status", "Loyalty Points",
                  "Loyalty Tier", "Referral Code"
                ];
                if (skipKeys.includes(key) || !submittedData[key]) return null;
                
                // Humanize key labels
                const label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
                return (
                  <div key={key} className="border-b pb-2">
                    <span className="text-slate-400 font-medium block">{label}</span>
                    <span className="font-semibold text-slate-900 block">{String(submittedData[key])}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer statement */}
          <div className="pt-8 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
            <p>Optivita Medical Accountability Systems &bull; Confidential Intake Record</p>
            <p>Verification Signature: _______________________ Date: __________________</p>
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="relative pt-40 pb-16 bg-brand-gradient text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(circle at 20% 30%, white 0%, transparent 50%)" }}
          aria-hidden
        />
        <div className="relative max-w-5xl mx-auto px-6">
          <Link to="/" className="text-white/80 text-sm hover:text-white">← All Programs</Link>
          <p className="mt-6 uppercase tracking-widest text-xs font-semibold text-white/80">{program.duration}</p>
          <h1 className="mt-2 font-display font-extrabold text-4xl md:text-6xl leading-tight max-w-3xl">{program.name}</h1>
          <p className="mt-5 text-lg md:text-xl text-white/90 max-w-2xl">{program.tagline}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {program.image && (
              <div className="mb-10 overflow-hidden rounded-3xl border border-border shadow-glow hover:shadow-soft transition-shadow duration-300">
                <img 
                  src={program.image} 
                  alt={`${program.name} Infographic`} 
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
            <h2 className="font-display font-bold text-2xl">About this program</h2>
            <p className="mt-3 text-muted-foreground">{program.description}</p>
            <h3 className="mt-8 font-display font-bold text-xl">What's included</h3>
            <ul className="mt-3 space-y-2">
              {program.includes.map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full" style={{ background: "var(--vital)" }} />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="bg-secondary/60 rounded-2xl p-6 border border-border h-fit">
            <p className="text-sm text-muted-foreground">Investment</p>
            <p className="mt-1 font-display font-bold text-2xl">{program.price}</p>
            <a href="#enroll" className="mt-5 block text-center rounded-full bg-brand-gradient text-white font-semibold py-3 shadow-soft hover:opacity-90 transition">
              Enroll Now
            </a>
            <p className="mt-3 text-xs text-muted-foreground">
              Complete the intake form and your coach will confirm next steps within 24 hours.
            </p>
          </aside>
        </div>
      </section>

      <section id="enroll" className="py-16 bg-secondary/40 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-accent font-semibold uppercase tracking-widest text-xs">Enrollment Form</p>
          <h2 className="mt-3 font-display font-bold text-3xl">Tailored intake for {program.name}</h2>
          <p className="mt-2 text-muted-foreground">This form is customized to the program you selected. It takes ~5 minutes.</p>

          <form onSubmit={onSubmit} className="mt-10 space-y-10">
            {program.formSections.map((section) => (
              <div key={section.title} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-soft">
                <h3 className="font-display font-bold text-xl">{section.title}</h3>
                <div className="mt-6 grid md:grid-cols-2 gap-5">
                  {section.fields.map((f) => (
                    <div key={f.name} className={f.type === "textarea" || f.type === "checkbox" || f.type === "radio" ? "md:col-span-2" : ""}>
                      <Field field={f} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full rounded-full bg-brand-gradient text-white font-semibold py-4 text-lg shadow-glow hover:opacity-95 transition flex items-center justify-center gap-2 ${
                submitting ? "cursor-not-allowed opacity-75" : ""
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting Application...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

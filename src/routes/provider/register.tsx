import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Apple,
  Dumbbell,
  Building,
  HeartPulse,
  Plus,
  Trash2,
  FileText,
  CreditCard,
  Calendar,
  Lock,
} from "lucide-react";
import { saveProviderToStorage, saveServiceToStorage } from "@/lib/marketplaceData";
import { validateUploadedFile } from "@/lib/securityHelpers";

export const Route = createFileRoute("/provider/register")({
  component: ProviderRegisterWizard,
});

function ProviderRegisterWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 12;

  // Onboarding Form States
  const [providerType, setProviderType] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [address, setAddress] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Arabic"]);
  
  // Qualifications List
  const [qualifications, setQualifications] = useState<any[]>([
    { degree: "", school: "", year: "" }
  ]);
  
  // Certifications List
  const [certifications, setCertifications] = useState<any[]>([
    { name: "", issuer: "", number: "" }
  ]);
  
  // Specializations Chips
  const [specializations, setSpecializations] = useState<string[]>([]);
  
  // Custom Services
  const [serviceTitle, setServiceTitle] = useState("");
  const [servicePrice, setServicePrice] = useState(150);
  const [serviceDuration, setServiceDuration] = useState(45);
  const [serviceMode, setServiceMode] = useState<"online" | "in-person">("online");
  const [serviceDesc, setServiceDesc] = useState("");
  
  // Availability Slots
  const [workingDays, setWorkingDays] = useState<string[]>(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]);
  const [workStart, setWorkStart] = useState("09:00 AM");
  const [workEnd, setWorkEnd] = useState("06:00 PM");
  
  // Bank details
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  
  // Document upload statuses
  const [docsUploaded, setDocsUploaded] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [infoAccurate, setInfoAccurate] = useState(false);

  // Helper to add/remove list items
  const addQualification = () => setQualifications([...qualifications, { degree: "", school: "", year: "" }]);
  const removeQualification = (idx: number) => setQualifications(qualifications.filter((_, i) => i !== idx));

  const addCertification = () => setCertifications([...certifications, { name: "", issuer: "", number: "" }]);
  const removeCertification = (idx: number) => setCertifications(certifications.filter((_, i) => i !== idx));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = validateUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!res.valid) {
      toast.error(res.error || "File validation failed.");
      return;
    }

    setDocsUploaded(true);
    toast.success(`Successfully uploaded secure document: ${docName}`);
  };

  const toggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter((s) => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !providerType) {
      toast.warning("Please select your provider type first.");
      return;
    }
    if (step === 2 && (!fullName || !email || !phone)) {
      toast.warning("Please fill in your name, email, and phone number.");
      return;
    }
    if (step === 11 && (!termsAgreed || !infoAccurate)) {
      toast.warning("You must accept the terms and conditions to proceed.");
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmitApplication = () => {
    // Generate a custom ID
    const newProviderId = `prov-${Math.floor(200 + Math.random() * 800)}`;
    
    const newProvider = {
      id: newProviderId,
      name: fullName,
      type: providerType,
      verified: false, // Pending Review
      rating: 0.0,
      reviewCount: 0,
      location: `Riyadh, ${city}`,
      onlineAvailability: serviceMode === "online",
      startingPrice: Number(servicePrice) || 150,
      specializations: specializations.length > 0 ? specializations : ["Metabolic Health"],
      languages: languages,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
      bio: bio || `Verified ${providerType} professional specialized in wellness coaching.`,
      qualifications: qualifications.map((q) => `${q.degree} - ${q.school} (${q.year})`),
      experience: `${experience || "2"} years experience`,
      email: email,
    };

    // Save Provider and Service
    saveProviderToStorage(newProvider);
    
    if (serviceTitle) {
      saveServiceToStorage({
        id: `srv-${Math.floor(300 + Math.random() * 700)}`,
        providerId: newProviderId,
        title: serviceTitle,
        description: serviceDesc || "Consultation plan.",
        price: Number(servicePrice),
        duration: Number(serviceDuration),
        type: serviceMode,
        cancellationPolicy: "Cancel up to 24 hours in advance.",
        whatsIncluded: ["Initial consult", "Nutrition recommendations"],
      });
    }

    // Set Provider Session
    localStorage.setItem("optivita_provider_session", JSON.stringify(newProvider));
    
    toast.success("Application Submitted Successfully!");
    setStep(12);
  };

  // Helper for Category icons
  const getProviderIcon = (type: string) => {
    switch (type) {
      case "nutrition":
      case "dietitian":
        return <Apple className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case "trainer":
      case "coach":
        return <Dumbbell className="h-6 w-6 text-teal-600 dark:text-teal-400" />;
      case "gym":
        return <Building className="h-6 w-6 text-sky-600 dark:text-sky-400" />;
      default:
        return <HeartPulse className="h-6 w-6 text-rose-600 dark:text-rose-400" />;
    }
  };

  const getStepProgressWidth = () => {
    return `${(step / totalSteps) * 100}%`;
  };

  return (
    <div className="min-h-screen py-10 px-6 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-2xl bg-card rounded-3xl border border-border/60 p-8 space-y-8 shadow-soft">
        
        {/* Wizard Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/30">
          <div>
            <h1 className="text-lg font-display font-black text-foreground">Become an Optivita Provider</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Grow your business by connecting with local clients</p>
          </div>
          <span className="text-xs font-mono font-bold text-accent">
            Step {String(step).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>
        </div>

        {/* Progress Bar */}
        {step < 12 && (
          <div className="w-full h-1.5 bg-secondary/35 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{ width: getStepProgressWidth() }}
            />
          </div>
        )}

        {/* STEP 1: PROVIDER TYPE */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-foreground">What type of provider are you?</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { id: "nutritionist", label: "🥗 Nutritionist", desc: "Private dietary consultation" },
                { id: "dietitian", label: "🥗 Dietitian", desc: "Registered clinical dietitian" },
                { id: "trainer", label: "🏋️ Personal Trainer", desc: "1-on-1 muscle & fat loss workouts" },
                { id: "coach", label: "🏃 Fitness Coach", desc: "Athletics and sports mentoring" },
                { id: "gym", label: "🏢 Gym Facility", desc: "Fitness club or weightlifting center" },
                { id: "wellness", label: "🧘 Wellness Coach", desc: "Yoga, therapy, and mindfulness" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setProviderType(opt.id)}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all ${
                    providerType === opt.id
                      ? "bg-accent/10 border-accent shadow-soft"
                      : "bg-secondary/15 border-border/60 hover:bg-secondary/25 text-foreground"
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-secondary/40 flex items-center justify-center">
                    {getProviderIcon(opt.id)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">{opt.label}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL / BUSINESS INFO */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-foreground">Basic Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Business / Clinic Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Leave empty if individual"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jane@clinic.com"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +966 50 123 4567"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Operating Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Olaya Street, Riyadh"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PROFESSIONAL INFORMATION */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-foreground">Professional Profile Setup</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Professional Title</label>
                <input
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="e.g. Clinical Dietitian, Senior Trainer"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Years of Experience</label>
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Professional Biography</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your approach, focus, and history..."
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: QUALIFICATIONS */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-foreground">Academic Qualifications</h2>
              <button
                onClick={addQualification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent/20 bg-accent/5 text-[10px] font-bold text-accent"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add More</span>
              </button>
            </div>

            <div className="space-y-4">
              {qualifications.map((q, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-secondary/10 relative grid grid-cols-3 gap-3">
                  {qualifications.length > 1 && (
                    <button
                      onClick={() => removeQualification(idx)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className="space-y-2 col-span-2">
                    <label className="text-[9px] font-bold text-muted-foreground">Degree / Major</label>
                    <input
                      type="text"
                      value={q.degree}
                      onChange={(e) => {
                        const updated = [...qualifications];
                        updated[idx].degree = e.target.value;
                        setQualifications(updated);
                      }}
                      placeholder="e.g. Bachelor of Clinical Nutrition"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted-foreground">Graduation Year</label>
                    <input
                      type="text"
                      value={q.year}
                      onChange={(e) => {
                        const updated = [...qualifications];
                        updated[idx].year = e.target.value;
                        setQualifications(updated);
                      }}
                      placeholder="e.g. 2021"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2 col-span-3">
                    <label className="text-[9px] font-bold text-muted-foreground">Institution / University</label>
                    <input
                      type="text"
                      value={q.school}
                      onChange={(e) => {
                        const updated = [...qualifications];
                        updated[idx].school = e.target.value;
                        setQualifications(updated);
                      }}
                      placeholder="e.g. King Saud University"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: CERTIFICATIONS */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-foreground">Certifications & Licenses</h2>
              <button
                onClick={addCertification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent/20 bg-accent/5 text-[10px] font-bold text-accent"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Certification</span>
              </button>
            </div>

            <div className="space-y-4">
              {certifications.map((c, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-secondary/10 relative grid grid-cols-2 gap-3">
                  {certifications.length > 1 && (
                    <button
                      onClick={() => removeCertification(idx)}
                      className="absolute top-2 right-2 text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className="space-y-2 col-span-2">
                    <label className="text-[9px] font-bold text-muted-foreground">Certification Name</label>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => {
                        const updated = [...certifications];
                        updated[idx].name = e.target.value;
                        setCertifications(updated);
                      }}
                      placeholder="e.g. Registered Nutritionist License"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted-foreground">Issuing Authority</label>
                    <input
                      type="text"
                      value={c.issuer}
                      onChange={(e) => {
                        const updated = [...certifications];
                        updated[idx].issuer = e.target.value;
                        setCertifications(updated);
                      }}
                      placeholder="e.g. Saudi Commission for Health Specialties"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted-foreground">License / Number</label>
                    <input
                      type="text"
                      value={c.number}
                      onChange={(e) => {
                        const updated = [...certifications];
                        updated[idx].number = e.target.value;
                        setCertifications(updated);
                      }}
                      placeholder="e.g. SCHS-902148"
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: SPECIALIZATIONS */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-foreground">Select Your Core Specializations</h2>
            <div className="flex flex-wrap gap-2.5">
              {[
                "Weight Loss",
                "Muscle Building",
                "PCOS Nutrition",
                "Diabetes Management",
                "Ketogenic Dieting",
                "Hormonal Health",
                "Sports Nutrition",
                "Strength Conditioning",
                "Mobility Training",
                "Stress Relief",
                "Guided Meditation",
                "Group Classes",
              ].map((spec) => {
                const isSelected = specializations.includes(spec);
                return (
                  <button
                    key={spec}
                    onClick={() => toggleSpecialization(spec)}
                    className={`px-4.5 py-2 rounded-full border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-accent border-accent text-white shadow-soft"
                        : "bg-secondary/15 border-border/60 hover:bg-secondary/35 text-foreground"
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 7: DEFAULT SERVICES SETUP */}
        {step === 7 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-foreground">Publish Your First Bookable Service</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Name</label>
                <input
                  type="text"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="e.g. 1-on-1 Weight Loss Assessment"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Duration (Minutes)</label>
                <input
                  type="number"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(Number(e.target.value))}
                  placeholder="45"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Starting Price (SAR)</label>
                <input
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(Number(e.target.value))}
                  placeholder="150"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Consultation Mode</label>
                <select
                  value={serviceMode}
                  onChange={(e) => setServiceMode(e.target.value as "online" | "in-person")}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                >
                  <option value="online">Online Call (Video Meet)</option>
                  <option value="in-person">In-Person Visit (Direct)</option>
                </select>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Description</label>
                <textarea
                  rows={3}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="What can clients expect during this session?"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: WORKING LOCATION & AVAILABILITY */}
        {step === 8 && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-foreground">Working Hours & Available Days</h2>
            
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground block">Select Working Days</span>
              <div className="flex flex-wrap gap-2">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
                  const isChecked = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        if (isChecked) {
                          setWorkingDays(workingDays.filter((d) => d !== day));
                        } else {
                          setWorkingDays([...workingDays, day]);
                        }
                      }}
                      className={`px-3 py-2 rounded-xl border text-[10px] font-bold ${
                        isChecked ? "bg-accent border-accent text-white" : "bg-secondary/15 border-border/60"
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Shift Start</label>
                <input
                  type="text"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 text-center focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Shift End</label>
                <input
                  type="text"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  placeholder="06:00 PM"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 text-center focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: BANK DETAILS */}
        {step === 9 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-foreground">Billing & Bank Payout Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-accent" />
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Al Rajhi Bank, SNB"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">IBAN / Account Number</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="SA03 8000 0000 •••• •••• ••••"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-secondary/15 border-border/60 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: DOCUMENT UPLOADS */}
        {step === 10 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-foreground">Verification Documents Upload</h2>
            <div className="space-y-4">
              {[
                { name: "Professional Qualification (Degree / Diploma)", size: "4.2 MB" },
                { name: "Clinical Licensing License (SCHS Accredited)", size: "2.8 MB" },
                { name: "Identity Document (Iqama / National ID)", size: "1.1 MB" },
              ].map((doc, idx) => (
                <div key={idx} className="p-4 border border-border/60 rounded-2xl bg-secondary/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-none">{doc.name}</h4>
                      <span className="text-[9px] text-muted-foreground mt-1 block">Maximum size 10MB (PDF/JPG)</span>
                    </div>
                  </div>
                  
                  <label
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-all ${
                      docsUploaded ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-card border-border/65 text-foreground hover:bg-secondary/20"
                    }`}
                  >
                    <span>{docsUploaded ? "Uploaded" : "Upload File"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, doc.name)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 11: TERMS AND CONDITIONS */}
        {step === 11 && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-foreground">Terms & Conditions Agreement</h2>
            
            <div className="p-5 rounded-2xl border bg-secondary/15 max-h-[160px] overflow-y-auto text-[10px] text-muted-foreground leading-relaxed space-y-3">
              <p className="font-bold text-foreground">1. Professional Veracity</p>
              <p>Optivita Providers agree to maintain up-to-date and accurate credentials, professional qualifications, and medical classifications. Any misrepresentation will result in immediate profile suspension.</p>
              <p className="font-bold text-foreground">2. Commission Splits</p>
              <p>By registering on the Optivita Marketplace, you agree that Optivita will deduct a commission fee (the standard service fee is 15%) from each confirmed booking transacted through our payment simulation gateway.</p>
            </div>

            <div className="space-y-3 pt-3">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="infoAccurate"
                  checked={infoAccurate}
                  onChange={(e) => setInfoAccurate(e.target.checked)}
                  className="h-4.5 w-4.5 accent-accent shrink-0 mt-0.5"
                />
                <label htmlFor="infoAccurate" className="text-xs font-semibold text-foreground cursor-pointer">
                  I confirm that all submitted licenses, certificates, and academic credentials are true and accurate.
                </label>
              </div>

              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="termsAgreed"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="h-4.5 w-4.5 accent-accent shrink-0 mt-0.5"
                />
                <label htmlFor="termsAgreed" className="text-xs font-semibold text-foreground cursor-pointer">
                  I accept the Optivita Marketplace Provider Terms and Conditions.
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 12: APPLICATION UNDER REVIEW */}
        {step === 12 && (
          <div className="text-center py-10 space-y-6 animate-scale-up">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <Calendar className="h-9 w-9 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-black text-foreground">Application Under Review! ⏳</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Your credentials and license documentation are being reviewed by the Optivita administrative board.
              </p>
            </div>

            <div className="max-w-xs mx-auto p-4 rounded-xl bg-secondary/15 border border-border/50 text-[10px] text-muted-foreground flex flex-col gap-2">
              <div className="flex justify-between">
                <span>Account Status</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Verification Pending</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Review Time</span>
                <span className="font-bold text-foreground">24-48 Hours</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/provider"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-accent text-white font-bold text-xs shadow-soft hover:opacity-95"
              >
                <span>Go to Dashboard</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Action Button Row */}
        {step < 12 && (
          <div className="flex items-center justify-between pt-6 border-t border-border/30">
            <button
              onClick={handlePrevStep}
              disabled={step === 1}
              className="px-5 py-2.5 rounded-full border border-border/60 bg-card hover:bg-secondary/20 text-xs font-bold text-foreground disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {step < totalSteps - 1 ? (
              <button
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-soft flex items-center gap-1"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitApplication}
                className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-soft flex items-center gap-1"
              >
                <span>Submit for Verification</span>
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export interface Provider {
  id: string;
  name: string;
  type: string; // Nutritionist, Dietitian, Personal Trainer, Fitness Coach, Gym, Wellness Center
  verified: boolean;
  rating: number;
  reviewCount: number;
  location: string;
  onlineAvailability: boolean;
  startingPrice: number;
  specializations: string[];
  languages: string[];
  avatar: string;
  bio: string;
  qualifications: string[];
  experience: string;
}

export interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  type: "online" | "in-person";
  cancellationPolicy: string;
  whatsIncluded: string[];
}

export interface Review {
  id: string;
  providerId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export const CATEGORIES = [
  {
    id: "nutrition",
    title: "Nutrition",
    subtitle: "Nutritionists and Dietitians",
    description: "Get personalized diet plans, medical nutrition therapy, and lifestyle guidance from certified experts.",
    icon: "Apple",
  },
  {
    id: "fitness",
    title: "Fitness",
    subtitle: "Personal Trainers & Fitness Coaches",
    description: "Work with professional trainers to reach your muscle building, strength, or weight loss goals.",
    icon: "Dumbbell",
  },
  {
    id: "gyms",
    title: "Gyms",
    subtitle: "Gyms and Fitness Centers",
    description: "Browse high-end facilities, group class schedules, and local fitness centers near you.",
    icon: "Building",
  },
  {
    id: "wellness",
    title: "Wellness",
    subtitle: "Wellness Professionals",
    description: "Connect with mental wellness experts, physiotherapists, yoga instructors, and holistic health coaches.",
    icon: "HeartPulse",
  },
];

export const PROVIDERS: Provider[] = [
  {
    id: "prov-101",
    name: "Dr. Ahmed Al-Ahmad",
    type: "dietitian",
    verified: true,
    rating: 4.9,
    reviewCount: 128,
    location: "Riyadh, Olaya",
    onlineAvailability: true,
    startingPrice: 150,
    specializations: ["Weight Management", "Sports Nutrition", "Diabetes Care"],
    languages: ["Arabic", "English"],
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop",
    bio: "Dr. Ahmed is a certified clinical dietitian with over 8 years of experience helping clients achieve sustainable weight loss, improve sports performance, and manage chronic conditions through targeted nutrition.",
    qualifications: ["Ph.D. in Clinical Nutrition - KSU", "Registered Dietitian (RD) License", "Certified Sports Nutritionist (ISSN)"],
    experience: "8+ years in clinical nutrition and metabolic wellness",
  },
  {
    id: "prov-102",
    name: "Sarah Jenkins",
    type: "nutritionist",
    verified: true,
    rating: 4.8,
    reviewCount: 94,
    location: "Riyadh, Al-Yasmin",
    onlineAvailability: true,
    startingPrice: 180,
    specializations: ["PCOS Diet", "Hormonal Balance", "Healthy Eating"],
    languages: ["English"],
    avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?w=400&h=400&fit=crop",
    bio: "Sarah specializes in women's metabolic health, hormone regulation, and plant-based nutrition therapy. She focuses on realistic, whole-food diets that fit active lifestyles.",
    qualifications: ["B.Sc. in Nutritional Sciences - Boston University", "Certified Holistic Nutritionist", "Maternal Nutrition Specialist"],
    experience: "6 years specializing in hormonal and women's health nutrition",
  },
  {
    id: "prov-103",
    name: "Captain Khalid Mansoor",
    type: "trainers",
    verified: true,
    rating: 4.95,
    reviewCount: 242,
    location: "Riyadh, Sulaimaniyah",
    onlineAvailability: false,
    startingPrice: 200,
    specializations: ["Fat Loss", "Strength Training", "Bodybuilding"],
    languages: ["Arabic", "English"],
    avatar: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&h=400&fit=crop",
    bio: "Captain Khalid is a premium fitness coach who has transformed over 300 clients. He design rigorous custom strength schedules and coaches you one-on-one at certified local gyms.",
    qualifications: ["NASM Certified Personal Trainer", "ISSA Strength and Conditioning Specialist", "CPR/AED First Aid Certified"],
    experience: "10+ years coaching elite athletes and local clients",
  },
  {
    id: "prov-104",
    name: "Elite Iron Gym & Fitness",
    type: "gyms",
    verified: true,
    rating: 4.7,
    reviewCount: 312,
    location: "Riyadh, Al-Malqa",
    onlineAvailability: false,
    startingPrice: 350,
    specializations: ["Group Classes", "Weightlifting", "Sauna & Spa"],
    languages: ["Arabic", "English"],
    avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop",
    bio: "Elite Iron is a state-of-the-art facility featuring premium machinery, professional coaches, group high-intensity classes, and a post-workout recovery spa center.",
    qualifications: ["KSA Ministry of Sports Accredited Facility", "Official Hammer Strength Partner Center", "Certified Professional Trainers on site"],
    experience: "Operating premium wellness facilities since 2019",
  },
  {
    id: "prov-105",
    name: "Dr. Laila Al-Otaibi",
    type: "wellness",
    verified: true,
    rating: 4.9,
    reviewCount: 76,
    location: "Riyadh, Al-Nuzha",
    onlineAvailability: true,
    startingPrice: 250,
    specializations: ["Yoga Therapy", "Mindfulness Coaching", "Stress Relief"],
    languages: ["Arabic", "English"],
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    bio: "Dr. Laila is a wellness professional and mindfulness instructor. She works with clients to build healthy meditation habits, reduce cortisol levels, and restore mental-body balance.",
    qualifications: ["Ph.D. in Health Psychology - KSU", "Certified RYT-500 Yoga Instructor", "Mindfulness-Based Stress Reduction Certificate"],
    experience: "7 years counseling and leading therapeutic stress-relief groups",
  },
];

export const SERVICES: Service[] = [
  {
    id: "srv-201",
    providerId: "prov-101",
    title: "Weight Loss Initial Consultation",
    description: "A comprehensive metabolic analysis and customized meal structure setup tailored to your calorie requirements.",
    price: 150,
    duration: 45,
    type: "online",
    cancellationPolicy: "Cancel up to 24 hours in advance for a full refund.",
    whatsIncluded: ["Body composition analysis questionnaire", "45-minute live consultation", "7-day customized starter meal schedule", "WhatsApp check-in log setup"],
  },
  {
    id: "srv-202",
    providerId: "prov-101",
    title: "Diabetes Nutritional Plan",
    description: "Targeted dietary planner focused on blood sugar stabilization, low-glycemic recipes, and portion controls.",
    price: 220,
    duration: 60,
    type: "online",
    cancellationPolicy: "Cancel up to 12 hours in advance.",
    whatsIncluded: ["Glycemic load profile review", "60-minute therapeutic session", "Daily diabetic carb calculator sheet", "Follow-up schedule planner"],
  },
  {
    id: "srv-203",
    providerId: "prov-102",
    title: "PCOS & Hormone Assessment Plan",
    description: "Detailed investigation of dietary triggers affecting insulin resistance and ovulation cycles with targeted supplements guidance.",
    price: 180,
    duration: 50,
    type: "online",
    cancellationPolicy: "Free rescheduling. Cancellation non-refundable within 24 hours.",
    whatsIncluded: ["Hormonal profile survey review", "50-minute video session", "Anti-inflammatory grocery shopping list", "Supplement recommendation doc"],
  },
  {
    id: "srv-204",
    providerId: "prov-103",
    title: "1-on-1 Personal Training Session",
    description: "Rigorous custom gym routine coaching. Includes posture correction, bodybuilding sets, and high-intensity fat burn monitoring.",
    price: 200,
    duration: 60,
    type: "in-person",
    cancellationPolicy: "No-shows or cancellations within 6 hours forfeit booking price.",
    whatsIncluded: ["60-minute private trainer session", "Gym entrance pass included", "Workout log tracking feedback", "Post-workout protein shake"],
  },
  {
    id: "srv-205",
    providerId: "prov-104",
    title: "1-Month Elite Gym Access Pass",
    description: "All-access membership to Elite Iron Gym. Includes entry to weightlifting area, cardio equipment, and steam baths.",
    price: 350,
    duration: 1440, // 24 hours access daily
    type: "in-person",
    cancellationPolicy: "Non-refundable once membership starts.",
    whatsIncluded: ["Unlimited gym entry for 30 days", "Free locker and towels", "2 trial group high-intensity classes", "Sauna & steam bath access"],
  },
  {
    id: "srv-206",
    providerId: "prov-105",
    title: "Mindfulness & Guided Meditation Session",
    description: "Interactive session learning stress mitigation, diaphragmatic breathing techniques, and body scan alignment.",
    price: 250,
    duration: 60,
    type: "online",
    cancellationPolicy: "Cancel up to 24 hours in advance.",
    whatsIncluded: ["60-minute stress release lesson", "Guided meditation audio files", "Daily journal PDF worksheet"],
  },
];

export const REVIEWS: Review[] = [
  {
    id: "rev-301",
    providerId: "prov-101",
    author: "Fahad K.",
    rating: 5,
    comment: "Dr. Ahmed's weight loss approach was exactly what I needed. Lost 8kg in 6 weeks without feeling starved!",
    date: "2026-08-01",
  },
  {
    id: "rev-302",
    providerId: "prov-101",
    author: "Noor S.",
    rating: 4.8,
    comment: "Excellent advice on managing my gestational diabetes. Very responsive to inquiries.",
    date: "2026-07-28",
  },
  {
    id: "rev-303",
    providerId: "prov-102",
    author: "Reema A.",
    rating: 5,
    comment: "Sarah helped me regulate my hormones. My PCOS fatigue is completely gone!",
    date: "2026-08-05",
  },
  {
    id: "rev-304",
    providerId: "prov-103",
    author: "Tariq M.",
    rating: 5,
    comment: "Captain Khalid is tough but very dedicated. Highly recommend for pure strength transformation.",
    date: "2026-08-03",
  },
];

// Helper to generate dynamic appointment slots for the next 7 days
export function generateAvailableSlots(): { dateStr: string; slots: string[] }[] {
  const dates = [];
  const startDay = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(startDay);
    nextDate.setDate(startDay.getDate() + i);
    
    // Format: YYYY-MM-DD
    const dateStr = nextDate.toISOString().split("T")[0];
    
    // Skip Fridays (weekend rest)
    if (nextDate.getDay() === 5) continue;
    
    dates.push({
      dateStr,
      slots: ["09:00 AM", "10:30 AM", "12:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"],
    });
  }
  
  return dates;
}

// -------------------------------------------------------------
// Provider Portal LocalStorage Persistence Helpers
// -------------------------------------------------------------

export function getStoredProviders(): Provider[] {
  if (typeof window === "undefined") return PROVIDERS;
  const custom = localStorage.getItem("optivita_custom_providers");
  if (!custom) return PROVIDERS;
  try {
    const parsed = JSON.parse(custom) as Provider[];
    // Ensure we merge and override defaults if IDs match
    const merged = [...PROVIDERS];
    parsed.forEach((p) => {
      const idx = merged.findIndex((m) => m.id === p.id);
      if (idx !== -1) {
        merged[idx] = p;
      } else {
        merged.push(p);
      }
    });
    return merged;
  } catch {
    return PROVIDERS;
  }
}

export function saveProviderToStorage(provider: Provider) {
  if (typeof window === "undefined") return;
  const custom = localStorage.getItem("optivita_custom_providers");
  let list: Provider[] = [];
  if (custom) {
    try {
      list = JSON.parse(custom);
    } catch {}
  }
  const idx = list.findIndex((p) => p.id === provider.id);
  if (idx !== -1) {
    list[idx] = provider;
  } else {
    list.push(provider);
  }
  localStorage.setItem("optivita_custom_providers", JSON.stringify(list));
  
  // Also update active session if it matches the current provider
  const session = localStorage.getItem("optivita_provider_session");
  if (session) {
    try {
      const parsedSession = JSON.parse(session);
      if (parsedSession.id === provider.id) {
        localStorage.setItem("optivita_provider_session", JSON.stringify(provider));
      }
    } catch {}
  }
}

export function getStoredServices(): Service[] {
  if (typeof window === "undefined") return SERVICES;
  const custom = localStorage.getItem("optivita_custom_services");
  if (!custom) return SERVICES;
  try {
    const parsed = JSON.parse(custom) as Service[];
    const merged = [...SERVICES];
    parsed.forEach((s) => {
      const idx = merged.findIndex((m) => m.id === s.id);
      if (idx !== -1) {
        merged[idx] = s;
      } else {
        merged.push(s);
      }
    });
    return merged;
  } catch {
    return SERVICES;
  }
}

export function saveServiceToStorage(service: Service) {
  if (typeof window === "undefined") return;
  const custom = localStorage.getItem("optivita_custom_services");
  let list: Service[] = [];
  if (custom) {
    try {
      list = JSON.parse(custom);
    } catch {}
  }
  const idx = list.findIndex((s) => s.id === service.id);
  if (idx !== -1) {
    list[idx] = service;
  } else {
    list.push(service);
  }
  localStorage.setItem("optivita_custom_services", JSON.stringify(list));
}

export function deleteServiceFromStorage(serviceId: string) {
  if (typeof window === "undefined") return;
  const custom = localStorage.getItem("optivita_custom_services");
  if (!custom) return;
  try {
    let list: Service[] = JSON.parse(custom);
    list = list.filter((s) => s.id !== serviceId);
    localStorage.setItem("optivita_custom_services", JSON.stringify(list));
  } catch {}
}

export function getProviderAppointments(providerId: string): any[] {
  if (typeof window === "undefined") return [];
  const key = `optivita_appointments_${providerId}`;
  const custom = localStorage.getItem(key);
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch {}
  }

  // Generate initial mock appointments if empty
  const mockAppointments = [
    {
      id: "APT-801",
      customerName: "Fahad Khalid",
      serviceTitle: "Weight Loss Initial Consultation",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Tomorrow
      time: "10:30 AM",
      duration: 45,
      type: "online",
      status: "Upcoming",
    },
    {
      id: "APT-802",
      customerName: "Amal Al-Otaibi",
      serviceTitle: "PCOS Diet Consultation",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      time: "02:30 PM",
      duration: 50,
      type: "online",
      status: "Pending",
    },
    {
      id: "APT-803",
      customerName: "Tariq Mansoor",
      serviceTitle: "Muscle Building Routine Setup",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Past
      time: "09:00 AM",
      duration: 60,
      type: "in-person",
      status: "Completed",
    },
  ];

  localStorage.setItem(key, JSON.stringify(mockAppointments));
  return mockAppointments;
}

export function saveProviderAppointments(providerId: string, list: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`optivita_appointments_${providerId}`, JSON.stringify(list));
}

export function getProviderPayouts(providerId: string): any[] {
  if (typeof window === "undefined") return [];
  const key = `optivita_payouts_${providerId}`;
  const custom = localStorage.getItem(key);
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch {}
  }
  
  const mockPayouts = [
    {
      id: "PAY-901",
      amount: 450,
      status: "Completed",
      date: "2026-07-30",
      bankRef: "SAR-TXN-902184",
    },
    {
      id: "PAY-902",
      amount: 320,
      status: "Pending",
      date: "2026-08-08",
      bankRef: "-",
    },
  ];
  localStorage.setItem(key, JSON.stringify(mockPayouts));
  return mockPayouts;
}

export function savePayoutRequest(providerId: string, amount: number) {
  if (typeof window === "undefined") return;
  const list = getProviderPayouts(providerId);
  list.unshift({
    id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
    amount,
    status: "Pending",
    date: new Date().toISOString().split("T")[0],
    bankRef: "-",
  });
  localStorage.setItem(`optivita_payouts_${providerId}`, JSON.stringify(list));
}

export function getProviderPromotions(providerId: string): any[] {
  if (typeof window === "undefined") return [];
  const key = `optivita_promotions_${providerId}`;
  const custom = localStorage.getItem(key);
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch {}
  }
  
  const mockPromos = [
    {
      id: "PRM-501",
      name: "Summer Health Kickoff",
      discount: 15, // percent
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      status: "Approved",
    },
  ];
  localStorage.setItem(key, JSON.stringify(mockPromos));
  return mockPromos;
}

export function savePromotion(providerId: string, promo: any) {
  if (typeof window === "undefined") return;
  const list = getProviderPromotions(providerId);
  list.unshift(promo);
  localStorage.setItem(`optivita_promotions_${providerId}`, JSON.stringify(list));
}

export function getProviderReviews(providerId: string): Review[] {
  return REVIEWS.filter((r) => r.providerId === providerId);
}


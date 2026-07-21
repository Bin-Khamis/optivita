export type FieldType = "text" | "email" | "tel" | "number" | "textarea" | "select" | "radio" | "checkbox" | "date";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface Program {
  id: string;
  name: string;
  duration: string;
  tagline: string;
  description: string;
  focus: string[];
  includes: string[];
  price: string;
  accent: "teal" | "vital" | "primary";
  formSections: FormSection[];
  image?: string;
}

const personalInfo: FormSection = {
  title: "Personal Information",
  fields: [
    { name: "fullName", label: "Full Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone / WhatsApp", type: "tel", required: true },
    { name: "dob", label: "Date of Birth", type: "date", required: true },
    { name: "gender", label: "Gender", type: "radio", options: ["Female", "Male", "Prefer not to say"], required: true },
    { name: "city", label: "City / Country", type: "text" },
  ],
};

const measurements: FormSection = {
  title: "Current Measurements",
  fields: [
    { name: "height", label: "Height (cm)", type: "number", required: true },
    { name: "weight", label: "Current Weight (kg)", type: "number", required: true },
    { name: "waist", label: "Waist (cm)", type: "number" },
    { name: "hip", label: "Hip (cm)", type: "number" },
  ],
};

const lifestyle: FormSection = {
  title: "Lifestyle Assessment",
  fields: [
    { name: "meals", label: "Meals per day", type: "select", options: ["1", "2", "3", "4", "5+"] },
    { name: "water", label: "Daily water intake (litres)", type: "select", options: ["<1", "1–2", "2–3", "3+"] },
    { name: "sleep", label: "Hours of sleep", type: "select", options: ["<5", "5–6", "7–8", ">8"] },
    { name: "stress", label: "Stress level", type: "radio", options: ["Low", "Medium", "High"] },
    { name: "activity", label: "Physical activity", type: "select", options: ["Sedentary", "Light", "Moderate", "Active", "Very active"] },
  ],
};

const commitment: FormSection = {
  title: "Commitment",
  fields: [
    { name: "notes", label: "Anything else your coach should know?", type: "textarea", placeholder: "Allergies, medical conditions, preferences…" },
    { name: "agree", label: "I commit to following the program guidance and weekly check-ins.", type: "checkbox", required: true },
  ],
};

export const programs: Program[] = [
  {
    id: "30-day-weight-loss",
    name: "30-Day Weight Loss Challenge",
    duration: "30 Days",
    tagline: "Kickstart measurable weight loss in one month.",
    image: "/weight-loss-challenge.jpg",
    description: "A structured 30-day sprint with personalized meal planning, weekly check-ins, and daily WhatsApp accountability to help you lose weight sustainably.",
    focus: ["Weight loss", "Meal planning", "Accountability"],
    includes: ["Initial Assessment", "Personalized Meal Plan", "Weekly Check-ins", "WhatsApp Support", "Progress Tracking"],
    price: "Contact for pricing",
    accent: "vital",
    formSections: [
      personalInfo,
      measurements,
      {
        title: "Your Goals",
        fields: [
          { name: "goal", label: "Main goal", type: "radio", options: ["Lose weight", "Reduce belly fat", "Improve overall health", "Increase energy", "Improve fitness"], required: true },
          { name: "targetLoss", label: "Weight loss goal (kg)", type: "number" },
          { name: "motivation", label: "Why do you want to lose weight?", type: "textarea" },
        ],
      },
      {
        title: "Health Background",
        fields: [
          { name: "conditions", label: "Any of the following?", type: "checkbox", options: ["Diabetes", "Hypertension", "Thyroid", "PCOS", "Asthma", "Arthritis", "None", "Other"] },
          { name: "underDoctor", label: "Currently under a doctor's care?", type: "radio", options: ["Yes", "No"] },
          { name: "medications", label: "Current medications", type: "text" },
        ],
      },
      {
        title: "Diet Preferences",
        fields: [
          { name: "dietStyle", label: "Preferred diet style", type: "select", options: ["No preference", "Vegetarian", "Vegan", "Keto", "Low Carb", "Mediterranean", "Other"] },
          { name: "dislikes", label: "Foods you dislike", type: "text" },
          { name: "allergies", label: "Allergies / intolerances", type: "text" },
        ],
      },
      lifestyle,
      commitment,
    ],
  },
  {
    id: "diabetes-nutrition",
    name: "Diabetes Nutrition Program",
    duration: "8 Weeks",
    tagline: "Manage blood sugar through evidence-based nutrition.",
    image: "/diabetes-nutrition.jpg",
    description: "Structured 8-week program combining meal planning, blood sugar education, and lifestyle coaching for people living with diabetes or prediabetes.",
    focus: ["Blood sugar", "Structured meals", "Lifestyle coaching"],
    includes: ["Structured Meal Planning", "Blood Sugar Education", "Lifestyle Coaching", "Weekly Check-ins"],
    price: "Contact for pricing",
    accent: "teal",
    formSections: [
      personalInfo,
      measurements,
      {
        title: "Diabetes Details",
        fields: [
          { name: "diabetesType", label: "Diabetes type", type: "radio", options: ["Type 1", "Type 2", "Prediabetes", "Gestational", "Not sure"], required: true },
          { name: "diagnosedYear", label: "Year diagnosed", type: "text" },
          { name: "diagnosedBy", label: "Diagnosed by", type: "select", options: ["Family Physician", "Endocrinologist", "Hospital", "Other"] },
          { name: "hba1c", label: "Latest HbA1c (if known)", type: "text" },
          { name: "monitoring", label: "Blood sugar monitoring", type: "radio", options: ["Daily", "Twice daily", "Before meals", "After meals", "As advised"] },
          { name: "readings", label: "Typical readings (fasting / post-meal)", type: "text" },
        ],
      },
      {
        title: "Medical History",
        fields: [
          { name: "comorbidities", label: "Other conditions", type: "checkbox", options: ["High Blood Pressure", "High Cholesterol", "Kidney issues", "Heart disease", "None"] },
          { name: "medications", label: "Current medications / insulin", type: "textarea" },
        ],
      },
      lifestyle,
      {
        title: "Goals",
        fields: [
          { name: "goals", label: "What matters most?", type: "checkbox", options: ["Better blood sugar control", "Weight loss", "More energy", "Confidence in food choices"] },
        ],
      },
      commitment,
    ],
  },
  {
    id: "healthy-lifestyle-reset",
    name: "Healthy Lifestyle Reset",
    duration: "21 Days",
    tagline: "Rebuild the habits that make health effortless.",
    image: "/healthy-lifestyle-reset.jpg",
    description: "A gentle 21-day reset focused on foundational habits: sleep, hydration, daily walking, and nutrition basics — perfect for a fresh start.",
    focus: ["Habits", "Sleep", "Hydration", "Walking"],
    includes: ["Habit tracker", "Nutrition basics", "Sleep coaching", "Weekly check-ins"],
    price: "Contact for pricing",
    accent: "vital",
    formSections: [
      personalInfo,
      {
        title: "Health Snapshot",
        fields: [
          { name: "sleepQuality", label: "Sleep quality", type: "radio", options: ["Excellent", "Good", "Fair", "Poor"] },
          { name: "energy", label: "Energy levels", type: "radio", options: ["Low", "Medium", "High"] },
          { name: "stress", label: "Stress level", type: "radio", options: ["Low", "Medium", "High"] },
        ],
      },
      {
        title: "Nutrition & Hydration",
        fields: [
          { name: "mealsPerDay", label: "Meals per day", type: "select", options: ["1", "2", "3", "4", "5+"] },
          { name: "water", label: "Daily water intake", type: "select", options: ["<1L", "1–2L", "2–3L", "3L+"] },
          { name: "processed", label: "How often do you eat processed foods?", type: "radio", options: ["Rarely", "Sometimes", "Often", "Always"] },
        ],
      },
      {
        title: "Movement",
        fields: [
          { name: "activities", label: "Activities you enjoy", type: "checkbox", options: ["Walking", "Gym", "Running", "Cycling", "Swimming", "Yoga", "Sports", "Home workouts"] },
          { name: "steps", label: "Average daily steps (if known)", type: "number" },
        ],
      },
      {
        title: "Goals for the 21 Days",
        fields: [
          { name: "goals", label: "Choose what matters", type: "checkbox", options: ["Improve sleep", "Walk more", "Eat healthier meals", "Reduce processed foods", "Drink more water", "Build routine"] },
        ],
      },
      commitment,
    ],
  },
  {
    id: "pcos-nutrition",
    name: "PCOS Nutrition Program",
    duration: "12 Weeks",
    tagline: "Hormone-friendly nutrition for real, lasting change.",
    image: "/pcos-nutrition.jpg",
    description: "A dedicated 12-week program addressing PCOS through hormone-supportive nutrition, weight management, and lifestyle adjustments.",
    focus: ["Hormones", "Weight management", "Lifestyle"],
    includes: ["Hormone-friendly meal plans", "Weekly coaching", "Cycle & symptom tracking", "Lifestyle guidance"],
    price: "Contact for pricing",
    accent: "teal",
    formSections: [
      personalInfo,
      measurements,
      {
        title: "PCOS & Cycle",
        fields: [
          { name: "diagnosed", label: "Have you been formally diagnosed with PCOS?", type: "radio", options: ["Yes", "No", "Suspected"], required: true },
          { name: "cycle", label: "Menstrual cycle", type: "radio", options: ["Regular", "Irregular", "Very infrequent", "No periods"] },
          { name: "cycleLength", label: "Average cycle length (days, if known)", type: "number" },
          { name: "lastPeriod", label: "When was your last period?", type: "date" },
          { name: "symptoms", label: "Symptoms you experience", type: "checkbox", options: ["Acne", "Hair loss", "Excess hair growth", "Weight gain", "Mood swings", "Fatigue", "Fertility concerns", "Other"] },
        ],
      },
      {
        title: "Medical History",
        fields: [
          { name: "conditions", label: "Related conditions", type: "checkbox", options: ["Insulin resistance", "Thyroid", "High cholesterol", "Hypertension", "None"] },
          { name: "medications", label: "Current medications / supplements", type: "textarea" },
        ],
      },
      lifestyle,
      commitment,
    ],
  },
  {
    id: "fat-loss-premium",
    name: "Fat Loss Premium Coaching",
    duration: "12 Weeks",
    tagline: "High-touch coaching for serious transformation.",
    image: "/fat-loss-premium.jpg",
    description: "Our flagship 12-week premium program: weekly video calls, custom meal plans, workout guidance, and daily accountability.",
    focus: ["Fat loss", "1:1 coaching", "Training"],
    includes: ["Weekly Video Calls", "Custom Meal Plans", "Workout Guidance", "Daily Accountability"],
    price: "Premium — contact for pricing",
    accent: "primary",
    formSections: [
      personalInfo,
      measurements,
      {
        title: "Goals & Timeline",
        fields: [
          { name: "targetLoss", label: "Target fat loss (kg)", type: "number", required: true },
          { name: "deadline", label: "Deadline / event date", type: "date" },
          { name: "motivation", label: "What's driving this transformation?", type: "textarea" },
        ],
      },
      {
        title: "Training Background",
        fields: [
          { name: "trainingLevel", label: "Training experience", type: "radio", options: ["Beginner", "Intermediate", "Advanced"] },
          { name: "trainingDays", label: "Training days available per week", type: "select", options: ["2", "3", "4", "5", "6"] },
          { name: "equipment", label: "Equipment access", type: "checkbox", options: ["Full gym", "Home dumbbells", "Bodyweight only", "Outdoor / cardio"] },
          { name: "injuries", label: "Injuries / limitations", type: "text" },
        ],
      },
      {
        title: "Nutrition Preferences",
        fields: [
          { name: "dietStyle", label: "Preferred diet style", type: "select", options: ["No preference", "Vegetarian", "Vegan", "Keto", "Low Carb", "Mediterranean"] },
          { name: "mealsPerDay", label: "Preferred meals per day", type: "select", options: ["3", "4", "5", "6"] },
          { name: "allergies", label: "Allergies / dislikes", type: "text" },
        ],
      },
      lifestyle,
      commitment,
    ],
  },
];

export const getProgram = (id: string) => programs.find((p) => p.id === id);

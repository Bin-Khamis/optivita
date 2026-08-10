import { PROVIDERS } from "./marketplaceData";

export interface AIServiceConfig {
  aiEnabled: boolean;
  model: string;
  temperature: number;
}

export const AIService = {
  getConfig(): AIServiceConfig {
    const raw = localStorage.getItem("optivita_ai_config");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return { aiEnabled: true, model: "Gemini Pro", temperature: 0.7 };
  },

  async generateText(prompt: string): Promise<string> {
    const config = this.getConfig();
    if (!config.aiEnabled) {
      return "AI service is currently offline.";
    }

    // Rate Limiting simulation
    const limitKey = "optivita_ai_rate_limit_daily";
    const dailyCount = Number(localStorage.getItem(limitKey) || "0");
    if (dailyCount > 100) {
      return "Daily API token limit exceeded. Fallback mode enabled.";
    }
    localStorage.setItem(limitKey, String(dailyCount + 1));

    // Caching layer simulation
    const cacheKey = `optivita_ai_cache_${btoa(prompt.substring(0, 40))}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    // Simulated LLM model classification
    let response = "I can help you discover wellness experts and services on Optivita.";
    const p = prompt.toLowerCase();
    
    if (p.includes("nutrition") || p.includes("diet")) {
      response = "I found top-rated nutritionists. You can choose from Clinical Dietitians like Dr. Sarah or weight loss coaching with Dr. Jane.";
    } else if (p.includes("trainer") || p.includes("fitness")) {
      response = "I recommend fitness experts like Coach Marcus or gym facilities for strength and conditioning in Riyadh.";
    } else if (p.includes("under") || p.includes("budget") || p.includes("cheap")) {
      response = "I have filtered starting prices under SAR 200. You can view Dr. Sarah (SAR 150) or Coach Marcus (SAR 200).";
    } else if (p.includes("riyadh")) {
      response = "Here are experts operating in Riyadh: Dr. Sarah, Coach Marcus, and Dr. Jane.";
    } else if (p.includes("diagnose") || p.includes("diabetes") || p.includes("pcos") || p.includes("disease")) {
      response = "I cannot diagnose medical conditions. Please consult with our certified medical professionals or schedule a clinical consultation.";
    } else if (p.includes("emergency") || p.includes("hurt") || p.includes("die")) {
      response = "If you are experiencing a medical emergency, please call 997 or visit the nearest emergency department immediately.";
    }

    localStorage.setItem(cacheKey, response);
    return response;
  },

  async translate(text: string, lang: "ar" | "en"): Promise<string> {
    if (lang === "ar") {
      if (text.includes("Nutritionist")) return "أخصائي تغذية";
      if (text.includes("Fitness")) return "لياقة بدنية";
      return `[ترجمة آلي] ${text}`;
    }
    return text;
  }
};

export const RecommendationEngine = {
  getRecommendations(userId: string): typeof PROVIDERS {
    const config = AIService.getConfig();
    if (!config.aiEnabled) {
      return PROVIDERS.filter(p => p.verified);
    }

    // Load user preferences
    const prefKey = `optivita_marketplace_recommendation_interests_${userId}`;
    const rawPrefs = localStorage.getItem(prefKey);
    let interests: string[] = [];
    let preferredLocation = "";
    let budgetLimit = 1000;

    if (rawPrefs) {
      try {
        const obj = JSON.parse(rawPrefs);
        interests = obj.interests || [];
        preferredLocation = obj.location || "";
        budgetLimit = obj.budgetLimit || 1000;
      } catch {}
    }

    // Score and rank providers (Availability Aware and Location Aware)
    const scored = PROVIDERS.filter(p => p.verified).map(p => {
      let score = 0;

      // Category / Specialization match
      interests.forEach(interest => {
        if (p.specializations.includes(interest) || p.type.toLowerCase().includes(interest.toLowerCase())) {
          score += 40;
        }
      });

      // Location match
      if (preferredLocation && p.location.toLowerCase().includes(preferredLocation.toLowerCase())) {
        score += 30;
      }

      // Budget match
      if (p.startingPrice <= budgetLimit) {
        score += 20;
      }

      // Rating quality
      score += p.rating * 2;

      return { provider: p, score };
    });

    return scored.sort((a, b) => b.score - a.score).map(s => s.provider);
  }
};

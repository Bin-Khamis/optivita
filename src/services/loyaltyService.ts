import { saveCRMDataToFirestore } from "@/lib/firebase";
import { getLoyaltyPoints } from "@/lib/utils";

export interface LoyaltyEvent {
  eventId: string;
  eventType: string;
  customerId: string;
  referenceId: string;
  referenceType: string;
  source: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export const LoyaltyService = {
  // Read dataset safely
  getDataset(): any {
    const raw = localStorage.getItem("optivita_crm_cache");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return {};
  },

  // Save dataset safely to local storage and mirror to Firestore
  async saveDataset(dataset: any): Promise<void> {
    localStorage.setItem("optivita_crm_cache", JSON.stringify(dataset));
    try {
      await saveCRMDataToFirestore(dataset);
    } catch (e) {
      console.warn("Firestore sync deferred:", e);
    }
  },

  getBalance(customerId: string): number {
    const data = this.getDataset();
    const enrollments = data["Program Enrollments"] || [];
    const client = enrollments.find(
      (e: any) =>
        e["Enrollment ID"] &&
        String(e["Enrollment ID"]).trim() === String(customerId).trim()
    );
    return client ? Number(getLoyaltyPoints(client) || 0) : 500; // Fallback to 500
  },

  getHistory(customerId: string): any[] {
    const data = this.getDataset();
    const ledger = data["Loyalty Ledger"] || [];
    return ledger.filter(
      (l: any) =>
        l["Enrollment ID"] &&
        String(l["Enrollment ID"]).trim() === String(customerId).trim()
    );
  },

  async processEvent(event: LoyaltyEvent): Promise<"already_processed" | "success" | "failed"> {
    const data = this.getDataset();
    const ledger = data["Loyalty Ledger"] || [];

    // Idempotency check: unique eventId based on eventType and referenceId
    const dedupId = event.eventId || `${event.eventType}:${event.referenceId}`;
    const exists = ledger.some((l: any) => l.eventId === dedupId);
    if (exists) {
      console.log(`Idempotency guard triggered: event ${dedupId} already processed.`);
      return "already_processed";
    }

    const enrollments = data["Program Enrollments"] || [];
    const clientIdx = enrollments.findIndex(
      (e: any) =>
        e["Enrollment ID"] &&
        String(e["Enrollment ID"]).trim() === String(event.customerId).trim()
    );

    if (clientIdx === -1) {
      console.warn(`Customer ${event.customerId} not found for loyalty event.`);
      return "failed";
    }

    const client = enrollments[clientIdx];
    const currentPoints = Number(getLoyaltyPoints(client) || 0);

    let pointsChanged = 0;
    let activityText = "";

    if (event.eventType === "BOOKING_COMPLETED") {
      pointsChanged = 200; // Configured reward rule: 200 points for normal completions
      activityText = `Completed Appointment Session (Ref: ${event.referenceId})`;
    } else if (event.eventType === "CORPORATE_BOOKING_COMPLETED") {
      // Evaluate eligibility: only award if co-payment or configured
      const isEligible = event.metadata?.coPaymentAmount && Number(event.metadata.coPaymentAmount) > 0;
      pointsChanged = isEligible ? 100 : 0; // Award 100 points if co-payment exists
      activityText = `Completed Corporate Wellness Session (Ref: ${event.referenceId})`;
    } else if (event.eventType === "BOOKING_REFUNDED") {
      // Reversal: deduct previously awarded points
      pointsChanged = -200;
      activityText = `Reversal - Refunded Booking Session (Ref: ${event.referenceId})`;
    } else {
      return "failed";
    }

    if (pointsChanged === 0 && event.eventType === "CORPORATE_BOOKING_COMPLETED") {
      // No points awarded but event is processed
      return "success";
    }

    const newPoints = Math.max(0, currentPoints + pointsChanged);

    // Update customer points
    client["Loyalty Points"] = newPoints;
    
    // Evaluate new tier
    if (newPoints >= 5000) client["Loyalty Tier"] = "Diamond";
    else if (newPoints >= 2000) client["Loyalty Tier"] = "Platinum";
    else if (newPoints >= 1000) client["Loyalty Tier"] = "Gold";
    else if (newPoints >= 500) client["Loyalty Tier"] = "Silver";
    else client["Loyalty Tier"] = "Bronze";

    // Format Timestamp
    const timestampStr = new Date(event.occurredAt).toLocaleString();

    // Log transaction record to ledger
    const newLedgerRow = {
      Timestamp: timestampStr,
      "Enrollment ID": event.customerId,
      "Customer Name": client.fullName || "Customer",
      Activity: activityText,
      "Points Earned": pointsChanged > 0 ? pointsChanged : 0,
      "Points Redeemed": pointsChanged < 0 ? Math.abs(pointsChanged) : 0,
      "Current Balance": newPoints,
      eventId: dedupId,
      source: event.source,
    };

    ledger.unshift(newLedgerRow);
    data["Loyalty Ledger"] = ledger;
    data["Program Enrollments"] = enrollments;

    await this.saveDataset(data);
    return "success";
  },

  validateReward(customerId: string, rewardId: string): { valid: boolean; discount?: number; reason?: string } {
    const data = this.getDataset();
    const rewards = data["Rewards Catalog"] || [];
    const reward = rewards.find((r: any) => String(r.RewardId) === String(rewardId));
    if (!reward) {
      return { valid: false, reason: "Reward not found in catalogue." };
    }

    const balance = this.getBalance(customerId);
    if (balance < Number(reward.PointsRequired)) {
      return { valid: false, reason: `Insufficient points balance. Required: ${reward.PointsRequired}` };
    }

    // Default discount mapping if not specified in reward catalog
    const discountVal = reward.RewardName.toLowerCase().includes("50") ? 50 : 25;
    return { valid: true, discount: discountVal };
  },

  async redeemReward(customerId: string, rewardId: string): Promise<boolean> {
    const validation = this.validateReward(customerId, rewardId);
    if (!validation.valid) return false;

    const data = this.getDataset();
    const rewards = data["Rewards Catalog"] || [];
    const reward = rewards.find((r: any) => String(r.RewardId) === String(rewardId));
    const pointsRequired = Number(reward.PointsRequired);

    const enrollments = data["Program Enrollments"] || [];
    const clientIdx = enrollments.findIndex(
      (e: any) =>
        e["Enrollment ID"] &&
        String(e["Enrollment ID"]).trim() === String(customerId).trim()
    );

    if (clientIdx === -1) return false;

    const client = enrollments[clientIdx];
    const currentPoints = Number(getLoyaltyPoints(client) || 0);
    const newPoints = Math.max(0, currentPoints - pointsRequired);

    client["Loyalty Points"] = newPoints;

    const timestampStr = new Date().toLocaleString();
    const ledger = data["Loyalty Ledger"] || [];
    const newLedgerRow = {
      Timestamp: timestampStr,
      "Enrollment ID": customerId,
      "Customer Name": client.fullName || "Customer",
      Activity: `Redeemed Reward: ${reward.RewardName}`,
      "Points Earned": 0,
      "Points Redeemed": pointsRequired,
      "Current Balance": newPoints,
      eventId: `REDEEM:${rewardId}:${Date.now()}`,
      source: "MARKETPLACE",
    };

    ledger.unshift(newLedgerRow);
    data["Loyalty Ledger"] = ledger;
    data["Program Enrollments"] = enrollments;

    await this.saveDataset(data);
    return true;
  }
};

export interface NotificationLog {
  id: string;
  recipientId: string;
  recipientRole: "customer" | "provider" | "admin";
  event: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  deepLink: string;
}

export interface CommunicationLog {
  id: string;
  recipientId: string;
  channel: "in-app" | "email" | "push" | "whatsapp";
  event: string;
  templateId: string;
  sentAt: string;
  status: "Sent" | "Delivered" | "Failed" | "Queued";
  failureReason?: string;
}

const TEMPLATES: Record<string, { en: { title: string; body: string }; ar: { title: string; body: string } }> = {
  "booking.confirmed": {
    en: {
      title: "Booking Confirmed",
      body: "Hi {customerName}, your appointment with {providerName} is confirmed for {date} at {time}.",
    },
    ar: {
      title: "تم تأكيد الحجز",
      body: "مرحباً {customerName}، تم تأكيد موعدك مع {providerName} بتاريخ {date} الساعة {time}.",
    },
  },
  "payment.success": {
    en: {
      title: "Payment Received",
      body: "Thank you! Your payment of SAR {amount} for {serviceName} was processed successfully.",
    },
    ar: {
      title: "تم استلام الدفعة",
      body: "شكراً لك! تم معالجة دفعتك البالغة {amount} ريال بنجاح مقابل خدمة {serviceName}.",
    },
  },
  "payout.paid": {
    en: {
      title: "Payout Transferred",
      body: "Your payout request of SAR {amount} has been successfully transferred to your bank account.",
    },
    ar: {
      title: "تم تحويل المستحقات",
      body: "تم تحويل طلب السحب الخاص بك البالغ {amount} ريال بنجاح إلى حسابك البنكي.",
    },
  },
  "refund.completed": {
    en: {
      title: "Refund Processed",
      body: "Your refund of SAR {amount} for booking reference {bookingRef} has been completed.",
    },
    ar: {
      title: "تمت عملية الإرجاع",
      body: "تم إكمال عملية إرجاع مبلغ {amount} ريال لرقم الحجز {bookingRef}.",
    },
  },
};

export class NotificationEngine {
  static sendNotification(
    event: string,
    recipientId: string,
    recipientRole: "customer" | "provider" | "admin",
    variables: Record<string, string | number>
  ) {
    const language = (variables.lang as "en" | "ar") || "en";
    const template = TEMPLATES[event]?.[language] || {
      title: "New Update",
      body: "You have a new update regarding your marketplace account.",
    };

    // Compile body text
    let message = template.body;
    Object.entries(variables).forEach(([k, v]) => {
      message = message.replace(`{${k}}`, String(v));
    });

    const deepLink = this.getDeepLink(event, variables);

    // 1. Check Recipient Channel Preferences
    const prefKey = `optivita_marketplace_notification_preferences_${recipientId}`;
    const rawPrefs = localStorage.getItem(prefKey);
    let prefs = { inApp: true, email: true, push: true, whatsapp: false };
    if (rawPrefs) {
      try { prefs = JSON.parse(rawPrefs); } catch {}
    }

    // Required/Non-optional bypasses (e.g., payout notifications and security alerts are always active)
    const isCritical = ["payout.paid", "payment.success", "refund.completed"].includes(event);
    const allowInApp = prefs.inApp || isCritical;
    const allowEmail = prefs.email || isCritical;
    const allowPush = prefs.push || isCritical;
    const allowWhatsapp = prefs.whatsapp;

    // 2. Write In-App Notification (if permitted)
    if (allowInApp) {
      const rawInApp = localStorage.getItem("optivita_marketplace_notifications") || "[]";
      let inAppList = [];
      try { inAppList = JSON.parse(rawInApp); } catch {}

      const newInApp: NotificationLog = {
        id: `NTF-${Math.floor(100000 + Math.random() * 900000)}`,
        recipientId,
        recipientRole,
        event,
        title: template.title,
        message,
        read: false,
        timestamp: new Date().toISOString(),
        deepLink,
      };
      inAppList.unshift(newInApp);
      localStorage.setItem("optivita_marketplace_notifications", JSON.stringify(inAppList));
    }

    // 3. Write Deliveries logs to general Communications Log
    const rawComms = localStorage.getItem("optivita_marketplace_communication_logs") || "[]";
    let commLogs = [];
    try { commLogs = JSON.parse(rawComms); } catch {}

    const channels: ("in-app" | "email" | "push" | "whatsapp")[] = ["in-app"];
    if (allowEmail) channels.push("email");
    if (allowPush) channels.push("push");
    if (allowWhatsapp) channels.push("whatsapp");

    channels.forEach((chan) => {
      // Simulate partial failures for email sometimes to demonstrate multi-channel capabilities
      const status = (chan === "email" && Math.random() > 0.9) ? "Failed" : "Delivered";
      const failureReason = status === "Failed" ? "SMTP Server Handshake Timeout" : undefined;

      const newCommLog: CommunicationLog = {
        id: `COM-${Math.floor(100000 + Math.random() * 900000)}`,
        recipientId,
        channel: chan,
        event,
        templateId: event,
        sentAt: new Date().toISOString(),
        status,
        failureReason,
      };
      commLogs.unshift(newCommLog);
    });

    localStorage.setItem("optivita_marketplace_communication_logs", JSON.stringify(commLogs));
  }

  private static getDeepLink(event: string, vars: Record<string, any>): string {
    if (event.startsWith("booking")) return `/portal/appointments`;
    if (event.startsWith("payment")) return `/portal/wallet`;
    if (event.startsWith("payout")) return `/provider/payouts`;
    return "/";
  }
}

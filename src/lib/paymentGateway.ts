export interface PaymentSession {
  paymentSessionId: string;
  bookingReference: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: "Created" | "Pending" | "Paid" | "Failed" | "Cancelled" | "Expired";
  expiresAt: string;
  createdAt: string;
}

export interface PaymentGateway {
  createPaymentSession(params: {
    customerId: string;
    providerId: string;
    serviceId: string;
    amount: number;
    paymentMethod: string;
  }): Promise<PaymentSession>;

  verifyPayment(sessionId: string): Promise<{ success: boolean; session: PaymentSession }>;
  refundPayment(transactionId: string, amount: number): Promise<{ success: boolean; refundRef: string }>;
}

export class MockPaymentGateway implements PaymentGateway {
  async createPaymentSession(params: {
    customerId: string;
    providerId: string;
    serviceId: string;
    amount: number;
    paymentMethod: string;
  }): Promise<PaymentSession> {
    const sessionId = `SES-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingRef = `BKG-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const newSession: PaymentSession = {
      paymentSessionId: sessionId,
      bookingReference: bookingRef,
      customerId: params.customerId,
      providerId: params.providerId,
      serviceId: params.serviceId,
      amount: params.amount,
      currency: "SAR",
      paymentMethod: params.paymentMethod,
      status: "Pending",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins expiration
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage payments namespace
    const raw = localStorage.getItem("optivita_marketplace_payments");
    let sessions = [];
    if (raw) {
      try { sessions = JSON.parse(raw); } catch {}
    }
    sessions.unshift(newSession);
    localStorage.setItem("optivita_marketplace_payments", JSON.stringify(sessions));

    return newSession;
  }

  async verifyPayment(sessionId: string): Promise<{ success: boolean; session: PaymentSession }> {
    const raw = localStorage.getItem("optivita_marketplace_payments");
    let sessions: PaymentSession[] = [];
    if (raw) {
      try { sessions = JSON.parse(raw); } catch {}
    }

    const sessionIdx = sessions.findIndex((s) => s.paymentSessionId === sessionId);
    if (sessionIdx === -1) {
      throw new Error("Invalid payment session reference.");
    }

    const session = sessions[sessionIdx];
    
    // Safety check: check expiration
    if (new Date(session.expiresAt) < new Date()) {
      session.status = "Expired";
      sessions[sessionIdx] = session;
      localStorage.setItem("optivita_marketplace_payments", JSON.stringify(sessions));
      return { success: false, session };
    }

    // Update status to Paid
    session.status = "Paid";
    sessions[sessionIdx] = session;
    localStorage.setItem("optivita_marketplace_payments", JSON.stringify(sessions));

    return { success: true, session };
  }

  async refundPayment(transactionId: string, amount: number): Promise<{ success: boolean; refundRef: string }> {
    // Generate mock refund reference
    const refundRef = `REF-GTW-${Math.floor(100000 + Math.random() * 900000)}`;
    return { success: true, refundRef };
  }
}

// Global active gateway loader
export const getActivePaymentGateway = (): PaymentGateway => {
  // Configured mode mock/sandbox/production defaults to mock for prototype
  return new MockPaymentGateway();
};

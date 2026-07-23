import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isWebhookOffline(webhookUrl?: string): boolean {
  return !webhookUrl || 
         webhookUrl.includes("placeholder") || 
         webhookUrl === "undefined" || 
         webhookUrl === "null" || 
         webhookUrl.trim() === "";
}

export function getValSafe(obj: any, keys: string[]): any {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  const lowerKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const actualKey of Object.keys(obj)) {
    const cleanKey = actualKey.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (lowerKeys.includes(cleanKey)) {
      return obj[actualKey];
    }
  }
  return undefined;
}

export const getEnrollmentId = (obj: any) => getValSafe(obj, ["Enrollment ID", "EnrollmentID", "enrollmentId"]);
export const getJoiningStatus = (obj: any) => getValSafe(obj, ["Joining Status", "JoiningStatus", "joiningStatus", "Status", "status", "Lead Status", "LeadStatus"]);
export const getPhone = (obj: any) => getValSafe(obj, ["phone", "Phone", "Mobile Number", "MobileNumber", "mobile"]);
export const getEmail = (obj: any) => getValSafe(obj, ["email", "Email", "Email Address", "EmailAddress"]);
export const getLoyaltyPoints = (obj: any) => getValSafe(obj, ["Loyalty Points", "LoyaltyPoints", "loyaltyPoints", "points", "Points"]);
export const getLoyaltyTier = (obj: any) => getValSafe(obj, ["Loyalty Tier", "LoyaltyTier", "loyaltyTier", "tier", "Tier"]);
export const getReferralCode = (obj: any) => getValSafe(obj, ["Referral Code", "ReferralCode", "referralCode"]);
export const getProgress = (obj: any) => getValSafe(obj, ["Progress", "progress", "Completion Progress", "CompletionProgress"]);
export const getAssignedTo = (obj: any) => getValSafe(obj, ["Assigned To", "AssignedTo", "assignedTo", "Coach", "coach"]);
export const getAmount = (obj: any) => getValSafe(obj, ["Amount", "amount", "Price", "price"]);
export const getInvoiceId = (obj: any) => getValSafe(obj, ["InvoiceId", "Invoice ID", "InvoiceID", "invoiceId"]);
export const getProgramName = (obj: any) => getValSafe(obj, ["Program Name", "ProgramName", "programName", "Program", "program"]);
export const getCustomerName = (obj: any) => getValSafe(obj, ["Customer Name", "CustomerName", "customerName", "Client Name", "ClientName", "clientName", "fullName", "FullName"]);
export const getInvoiceStatus = (obj: any) => getValSafe(obj, ["Status", "status", "InvoiceStatus", "invoiceStatus"]);
export const getInvoiceDate = (obj: any) => getValSafe(obj, ["Date", "date", "InvoiceDate", "invoiceDate", "Billing Date", "BillingDate"]);


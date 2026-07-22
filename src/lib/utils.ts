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

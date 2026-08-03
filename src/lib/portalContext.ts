import { createContext, useContext } from "react";

export interface CustomerSession {
  enrollmentId: string;
  fullName: string;
  phone: string;
  email: string;
  programName: string;
}

export interface PortalContextType {
  data: any;
  loading: boolean;
  refreshData: () => Promise<void>;
  customer: CustomerSession | null;
  logout: () => void;
}

export const PortalContext = createContext<PortalContextType | null>(null);

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    return {
      data: null,
      loading: true,
      refreshData: async () => {},
      customer: null,
      logout: () => {},
    };
  }
  return context;
}

import { createContext, useContext } from "react";

export interface UserSession {
  userId: string;
  username: string;
  role: string;
  branches: string;
  permissions: string;
}

export interface CRMContextType {
  data: any;
  loading: boolean;
  refreshData: (forceSpinner?: boolean) => Promise<void>;
  user: UserSession | null;
  logout: () => void;
}

export const CRMContext = createContext<CRMContextType | null>(null);

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within CRMProvider");
  }
  return context;
}

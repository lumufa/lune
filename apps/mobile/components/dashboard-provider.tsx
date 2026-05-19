import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import type { CycleDashboard } from "@/constants/shared";
import { api } from "@/services/api";

type DashboardContextValue = {
  dashboard: CycleDashboard | null;
  loading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [dashboard, setDashboard] = useState<CycleDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getDashboard();
      setDashboard(response);
    } catch {
      // Errors are handled silently here; consumers can check dashboard === null
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setDashboard(null), []);

  const value = useMemo<DashboardContextValue>(
    () => ({ dashboard, loading, refresh, clear }),
    [dashboard, loading, refresh, clear]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }

  return context;
}

/**
 * Convenience hook: triggers a refresh each time the screen is focused.
 */
export function useDashboardOnFocus() {
  const ctx = useDashboard();

  useFocusEffect(
    useCallback(() => {
      void ctx.refresh();
    }, [ctx.refresh])
  );

  return ctx;
}

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadCyclePreferences, saveCyclePreferences } from "../utils/storage";

type CyclePreferencesContextValue = {
  cycleLength: number;
  periodLength: number;
  setCycleLength: (value: number) => void;
  setPeriodLength: (value: number) => void;
  syncFromSummary: (cycleLength?: number, periodLength?: number) => void;
};

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

const CyclePreferencesContext = createContext<CyclePreferencesContextValue | null>(null);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function CyclePreferencesProvider({ children }: { children: ReactNode }) {
  const [cycleLength, setCycleLengthState] = useState(DEFAULT_CYCLE_LENGTH);
  const [periodLength, setPeriodLengthState] = useState(DEFAULT_PERIOD_LENGTH);
  const [isCustomized, setIsCustomized] = useState(false);

  useEffect(() => {
    void loadCyclePreferences().then((saved) => {
      if (saved.cycleLength) {
        setCycleLengthState(clamp(saved.cycleLength, 20, 45));
        setIsCustomized(true);
      }
      if (saved.periodLength) {
        setPeriodLengthState(clamp(saved.periodLength, 2, 10));
        setIsCustomized(true);
      }
    });
  }, []);

  const value = useMemo<CyclePreferencesContextValue>(
    () => ({
      cycleLength,
      periodLength,
      setCycleLength: (next) => {
        const clamped = clamp(next, 20, 45);
        setIsCustomized(true);
        setCycleLengthState(clamped);
        void saveCyclePreferences(clamped, periodLength);
      },
      setPeriodLength: (next) => {
        const clamped = clamp(next, 2, 10);
        setIsCustomized(true);
        setPeriodLengthState(clamped);
        void saveCyclePreferences(cycleLength, clamped);
      },
      syncFromSummary: (nextCycleLength, nextPeriodLength) => {
        if (isCustomized) {
          return;
        }

        if (typeof nextCycleLength === "number" && nextCycleLength > 0) {
          setCycleLengthState(clamp(nextCycleLength, 20, 45));
        }

        if (typeof nextPeriodLength === "number" && nextPeriodLength > 0) {
          setPeriodLengthState(clamp(nextPeriodLength, 2, 10));
        }
      }
    }),
    [cycleLength, isCustomized, periodLength]
  );

  return <CyclePreferencesContext.Provider value={value}>{children}</CyclePreferencesContext.Provider>;
}

export function useCyclePreferences() {
  const context = useContext(CyclePreferencesContext);

  if (!context) {
    throw new Error("useCyclePreferences must be used within CyclePreferencesProvider");
  }

  return context;
}

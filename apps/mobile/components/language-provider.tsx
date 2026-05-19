import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AppLanguage } from "../constants/copy";
import { appCopy } from "../constants/copy";
import { loadLanguage, saveLanguage } from "../utils/storage";

type LanguageContextValue = {
  language: AppLanguage;
  toggleLanguage: () => void;
  copy: (typeof appCopy)[AppLanguage];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>("zh");

  useEffect(() => {
    void loadLanguage().then((saved) => {
      if (saved === "zh" || saved === "en") {
        setLanguage(saved);
      }
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      toggleLanguage: () => {
        setLanguage((current) => {
          const next = current === "zh" ? "en" : "zh";
          void saveLanguage(next);
          return next;
        });
      },
      copy: appCopy[language]
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}

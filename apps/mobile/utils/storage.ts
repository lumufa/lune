import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  language: "app:language",
  cycleLength: "app:cycleLength",
  periodLength: "app:periodLength",
  onboarded: "app:onboarded"
} as const;

export async function loadLanguage(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.language);
}

export async function saveLanguage(value: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.language, value);
}

export async function loadCyclePreferences(): Promise<{ cycleLength?: number; periodLength?: number }> {
  const [cycle, period] = await Promise.all([
    AsyncStorage.getItem(KEYS.cycleLength),
    AsyncStorage.getItem(KEYS.periodLength)
  ]);

  return {
    cycleLength: cycle ? Number(cycle) : undefined,
    periodLength: period ? Number(period) : undefined
  };
}

export async function saveCyclePreferences(cycleLength: number, periodLength: number): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEYS.cycleLength, String(cycleLength)),
    AsyncStorage.setItem(KEYS.periodLength, String(periodLength))
  ]);
}

export async function loadOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.onboarded);
  return value === "true";
}

export async function saveOnboardingComplete(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.onboarded, value ? "true" : "false");
}

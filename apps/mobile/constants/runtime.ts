const DEFAULT_API_BASE_URL = "https://period-api-235126-9-1412339053.sh.run.tcloudbase.com";
const DEFAULT_USER_ID = "mobile-preview-user-cn";

export const CONSENT_VERSION = "2026.03";

export function getApiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export function getRuntimeUserId(): string {
  return process.env.EXPO_PUBLIC_USER_ID || DEFAULT_USER_ID;
}

export function getReleaseChannel(): string {
  return "expo-mobile";
}

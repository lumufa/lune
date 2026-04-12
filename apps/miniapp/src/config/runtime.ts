type MiniProgramEnvVersion = "develop" | "trial" | "release";

interface RuntimeConfig {
  apiBaseUrl: string;
  userId: string;
  releaseChannel: string;
  envVersion: MiniProgramEnvVersion;
  usesDemoUser: boolean;
}

const USER_ID_STORAGE_KEY = "runtime-user-id";
const CLOUDRUN_API_BASE_URL = "https://period-api-235126-9-1412339053.sh.run.tcloudbase.com";

// Point every environment to Cloud Hosting for now so DevTools, trial, and release
// all exercise the same remote API. Switch develop back to localhost when local API
// iteration is needed again.
const API_BASE_URL_BY_ENV: Record<MiniProgramEnvVersion, string> = {
  develop: CLOUDRUN_API_BASE_URL,
  trial: CLOUDRUN_API_BASE_URL,
  release: CLOUDRUN_API_BASE_URL
};

function isSupportedEnvVersion(value: string): value is MiniProgramEnvVersion {
  return value === "develop" || value === "trial" || value === "release";
}

function getMiniProgramEnvVersion(): MiniProgramEnvVersion {
  try {
    const accountInfo = wx.getAccountInfoSync();
    const envVersion = accountInfo.miniProgram.envVersion;
    return isSupportedEnvVersion(envVersion) ? envVersion : "develop";
  } catch {
    return "develop";
  }
}

function isLocalApiBaseUrl(value: string): boolean {
  return value.includes("127.0.0.1") || value.includes("localhost");
}

function buildAnonymousUserId(envVersion: MiniProgramEnvVersion): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `wxmp-${envVersion}-${Date.now().toString(36)}-${randomPart}`;
}

function getOrCreateStoredUserId(envVersion: MiniProgramEnvVersion): string {
  try {
    const existing = wx.getStorageSync(USER_ID_STORAGE_KEY);
    if (typeof existing === "string" && existing) {
      return existing;
    }
  } catch {
    // Ignore storage read failures and generate a new id below.
  }

  const nextUserId = buildAnonymousUserId(envVersion);

  try {
    wx.setStorageSync(USER_ID_STORAGE_KEY, nextUserId);
  } catch {
    // Ignore storage write failures and still return the generated value.
  }

  return nextUserId;
}

export function resolveRuntimeConfig(): RuntimeConfig {
  const envVersion = getMiniProgramEnvVersion();
  const apiBaseUrl = API_BASE_URL_BY_ENV[envVersion];
  const usesDemoUser = envVersion === "develop" && isLocalApiBaseUrl(apiBaseUrl);
  const userId = usesDemoUser ? "demo-user-cn" : getOrCreateStoredUserId(envVersion);

  return {
    apiBaseUrl,
    userId,
    releaseChannel: "wechat-miniapp",
    envVersion,
    usesDemoUser
  };
}

import { api, isApiNetworkError } from "../../services/api";
import {
  getDisplayLanguageToggleLabel,
  getNextDisplayLanguage,
  getStoredDisplayLanguage,
  setStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";

const CONSENT_VERSION = "2026.03";
const ONBOARDED_STORAGE_KEY = "onboarding-complete";

function isAlreadyOnboarded(): boolean {
  try {
    return wx.getStorageSync(ONBOARDED_STORAGE_KEY) === true;
  } catch {
    return false;
  }
}

function markOnboarded(): void {
  try {
    wx.setStorageSync(ONBOARDED_STORAGE_KEY, true);
  } catch {}
}

interface OnboardingCopy {
  langLabel: string;
  heroA: string;
  heroB: string;
  heroSub: string;
  featureTitle: string;
  trustTitle: string;
  btnLearn: string;
  btnContinue: string;
  btnStart: string;
  skip: string;
  footerNote: string;
  networkModalTitle: string;
  networkModalContent: string;
  initFailedToast: string;
  privacyPurpose: string;
  sensitivePurpose: string;
}

interface FeatureItem {
  icon: string;
  title: string;
}

interface TrustItem {
  icon: string;
  label: string;
}

function buildCopy(language: DisplayLanguage): OnboardingCopy {
  const isEn = language === "en";
  return {
    langLabel: getDisplayLanguageToggleLabel(language),
    heroA: isEn ? "Your cycle data" : "你的经期数据",
    heroB: isEn ? "stays in your hands" : "只留在你手里",
    heroSub: isEn ? "Precise forecast · Smart reminders · No sign-up" : "精准预测 · 智能提醒 · 无需注册",
    featureTitle: isEn ? "Core features" : "核心功能",
    trustTitle: isEn ? "Privacy promise" : "隐私承诺",
    btnLearn: isEn ? "Learn more" : "了解更多",
    btnContinue: isEn ? "Continue" : "继 续",
    btnStart: isEn ? "Start tracking" : "开始记录",
    skip: isEn ? "Skip" : "跳过",
    footerNote: isEn ? "No sign-up · Data stays local" : "无需注册 · 数据仅存本地",
    networkModalTitle: isEn ? "Local API is offline" : "本地接口未连接",
    networkModalContent: isEn
      ? "Run npm.cmd run start:api in C:\\women_period, then submit again."
      : "请在 C:\\women_period 执行 npm.cmd run start:api，然后回到开发者工具重新提交。",
    initFailedToast: isEn ? "Initialization failed, try again later" : "初始化失败，请稍后重试",
    privacyPurpose: isEn ? "Display privacy policy and user agreement" : "展示隐私政策与用户协议",
    sensitivePurpose: isEn
      ? "Record cycle and symptoms to generate prediction"
      : "记录经期与症状数据，用于生成周期预测"
  };
}

function buildFeatures(language: DisplayLanguage): FeatureItem[] {
  const isEn = language === "en";
  return [
    { icon: "📅", title: isEn ? "No account, open and use" : "零账号，打开就用" },
    { icon: "✅", title: isEn ? "Export your data anytime" : "数据随时带走" },
    { icon: "🔔", title: isEn ? "Quiet reminders" : "安静提醒" }
  ];
}

function buildTrustItems(language: DisplayLanguage): TrustItem[] {
  const isEn = language === "en";
  return [
    { icon: "🔒", label: isEn ? "End-to-end encrypted" : "端到端加密存储" },
    { icon: "📱", label: isEn ? "Data stays on device" : "数据仅存设备本地" },
    { icon: "🚫", label: isEn ? "Never sell user data" : "绝不出售用户数据" },
    { icon: "🧹", label: isEn ? "Delete anytime" : "随时一键彻底删除" }
  ];
}

const DEFAULT_LANGUAGE = getStoredDisplayLanguage();

Page({
  data: {
    currentPage: 0,
    isSubmitting: false,
    language: DEFAULT_LANGUAGE as DisplayLanguage,
    copy: buildCopy(DEFAULT_LANGUAGE),
    features: buildFeatures(DEFAULT_LANGUAGE),
    trustItems: buildTrustItems(DEFAULT_LANGUAGE)
  },

  onShow() {
    if (isAlreadyOnboarded()) {
      wx.switchTab({ url: "/pages/home/index" });
      return;
    }
    const language = getStoredDisplayLanguage();
    if (language !== this.data.language) {
      this.applyLanguage(language);
    }
  },

  applyLanguage(language: DisplayLanguage) {
    this.setData({
      language,
      copy: buildCopy(language),
      features: buildFeatures(language),
      trustItems: buildTrustItems(language)
    });
    wx.setNavigationBarTitle({ title: "Lune" });
  },

  toggleLanguage() {
    const next = getNextDisplayLanguage(this.data.language as DisplayLanguage);
    setStoredDisplayLanguage(next);
    this.applyLanguage(next);
  },

  onMainAction() {
    if (this.data.currentPage < 2) {
      this.setData({ currentPage: this.data.currentPage + 1 });
    } else {
      void this.completeOnboarding();
    }
  },

  skipToEnd() {
    this.setData({ currentPage: 2 });
  },

  goToPage(event: WechatMiniprogram.BaseEvent) {
    const page = Number(event.currentTarget.dataset.page);
    if (page !== this.data.currentPage) {
      this.setData({ currentPage: page });
    }
  },

  async completeOnboarding() {
    this.setData({ isSubmitting: true });
    try {
      await Promise.all([
        api.grantConsent({
          type: "privacy_policy",
          version: CONSENT_VERSION,
          purpose: this.data.copy.privacyPurpose
        }),
        api.grantConsent({
          type: "sensitive_health_data",
          version: CONSENT_VERSION,
          purpose: this.data.copy.sensitivePurpose
        })
      ]);
      markOnboarded();
      void api.trackEvent("onboarding_complete").catch(() => undefined);
      wx.switchTab({ url: "/pages/home/index" });
    } catch (error) {
      if (isApiNetworkError(error)) {
        wx.showModal({
          title: this.data.copy.networkModalTitle,
          content: this.data.copy.networkModalContent,
          showCancel: false
        });
      } else {
        wx.showToast({ title: this.data.copy.initFailedToast, icon: "none" });
      }
    } finally {
      this.setData({ isSubmitting: false });
    }
  }
});

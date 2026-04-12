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
  } catch {
    // Ignore storage failures; user can still complete onboarding this session.
  }
}

interface OnboardingCopy {
  navTitle: string;
  languageButtonLabel: string;
  brandChip: string;
  heroTitleA: string;
  heroTitleB: string;
  heroSubtitle: string;
  promiseValueA: string;
  promiseNoteA: string;
  promiseValueB: string;
  promiseNoteB: string;
  promiseValueC: string;
  promiseNoteC: string;
  authTitleA: string;
  authTitleB: string;
  authTitleC: string;
  accessButtonLabel: string;
  toastNeedConsent: string;
  networkModalTitle: string;
  networkModalContent: string;
  initFailedToast: string;
  privacyPurpose: string;
  sensitivePurpose: string;
}

function buildCopy(language: DisplayLanguage): OnboardingCopy {
  const isEn = language === "en";

  return {
    navTitle: "Lune",
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    brandChip: "LUNE",
    heroTitleA: isEn ? "Track your cycle" : "把经期记录做得",
    heroTitleB: isEn ? "quietly and reliably." : "更安静，也更可信。",
    heroSubtitle: isEn
      ? "Recording, forecasting, reminders and privacy control — nothing more."
      : "只保留记录、预测、提醒与隐私控制，不多也不少。",
    promiseValueA: isEn ? "Minimal" : "最小化",
    promiseNoteA: isEn ? "Only required fields kept" : "只保留记录所需字段",
    promiseValueB: isEn ? "Exportable" : "可导出",
    promiseNoteB: isEn ? "View and deletion paths available" : "支持查看与删除链路",
    promiseValueC: isEn ? "Gentle" : "轻提醒",
    promiseNoteC: isEn ? "No disturbance, no panic" : "不打扰，不夸张",
    authTitleA: isEn ? "Privacy Policy" : "隐私政策",
    authTitleB: isEn ? "Sensitive Health Data" : "敏感健康数据",
    authTitleC: isEn ? "Data Sync" : "数据同步",
    accessButtonLabel: isEn ? "Access Data Log" : "访问数据日志",
    toastNeedConsent: isEn ? "Please confirm required consent first" : "请先确认必要授权",
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

const DEFAULT_LANGUAGE = getStoredDisplayLanguage();

Page({
  data: {
    acceptsPrivacyPolicy: false,
    acceptsSensitiveData: false,
    syncReady: false,
    isSubmitting: false,
    language: DEFAULT_LANGUAGE as DisplayLanguage,
    copy: buildCopy(DEFAULT_LANGUAGE)
  },

  onShow() {
    if (isAlreadyOnboarded()) {
      wx.switchTab({
        url: "/pages/home/index"
      });
      return;
    }

    const language = getStoredDisplayLanguage();
    this.applyLanguage(language);
  },

  toggleLanguage() {
    const nextLanguage = getNextDisplayLanguage(this.data.language as DisplayLanguage);
    setStoredDisplayLanguage(nextLanguage);
    this.applyLanguage(nextLanguage);
  },

  applyLanguage(language: DisplayLanguage) {
    const copy = buildCopy(language);
    this.setData({
      language,
      copy
    });
    wx.setNavigationBarTitle({
      title: copy.navTitle
    });
  },

  togglePrivacyPolicy(event: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    const acceptsPrivacyPolicy = Boolean(event.detail.value);
    const acceptsSensitiveData = this.data.acceptsSensitiveData;
    this.setData({
      acceptsPrivacyPolicy,
      syncReady: acceptsPrivacyPolicy && acceptsSensitiveData
    });
  },

  toggleSensitiveData(event: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    const acceptsPrivacyPolicy = this.data.acceptsPrivacyPolicy;
    const acceptsSensitiveData = Boolean(event.detail.value);
    this.setData({
      acceptsSensitiveData,
      syncReady: acceptsPrivacyPolicy && acceptsSensitiveData
    });
  },

  async completeOnboarding() {
    if (!this.data.acceptsPrivacyPolicy || !this.data.acceptsSensitiveData) {
      wx.showToast({
        title: this.data.copy.toastNeedConsent,
        icon: "none"
      });
      return;
    }

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

      wx.switchTab({
        url: "/pages/home/index"
      });
    } catch (error) {
      if (isApiNetworkError(error)) {
        wx.showModal({
          title: this.data.copy.networkModalTitle,
          content: this.data.copy.networkModalContent,
          showCancel: false
        });
      } else {
        wx.showToast({
          title: this.data.copy.initFailedToast,
          icon: "none"
        });
      }
    } finally {
      this.setData({ isSubmitting: false });
    }
  }
});

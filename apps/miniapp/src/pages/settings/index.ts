import type { ReminderPreferenceItem } from "@women-period/shared";
import type { ReminderPreferenceResponse } from "../../types";
import { api, isApiNetworkError } from "../../services/api";
import {
  getDisplayLanguageToggleLabel,
  getNextDisplayLanguage,
  getReminderTypeLabel,
  getStoredDisplayLanguage,
  setStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";

const CYCLE_LENGTH_KEY = "settings-cycle-length";
const PERIOD_LENGTH_KEY = "settings-period-length";
const CYCLE_MIN = 20;
const CYCLE_MAX = 45;
const PERIOD_MIN = 2;
const PERIOD_MAX = 10;

interface SettingsCopy {
  languageButtonLabel: string;
  title: string;
  subtitle: string;
  cycleLengthLabel: string;
  periodLengthLabel: string;
  dayUnit: string;
  remindersTitle: string;
  privacyTitle: string;
  privacyBody: string;
  exportLabel: string;
  deleteLabel: string;
  networkError: string;
  exportFailed: string;
  deleteFailed: string;
  deleteConfirmTitle: string;
  deleteConfirmContent: string;
  deleted: string;
}

function buildCopy(language: DisplayLanguage): SettingsCopy {
  return {
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    title: language === "en" ? "Settings" : "设置",
    subtitle:
      language === "en"
        ? "Keep preferences, reminders, and privacy in one place."
        : "把周期参数、提醒和隐私放在一个地方。",
    cycleLengthLabel: language === "en" ? "Average cycle length" : "平均周期长度",
    periodLengthLabel: language === "en" ? "Average period length" : "平均经期长度",
    dayUnit: language === "en" ? "days" : "天",
    remindersTitle: language === "en" ? "Reminders & quiet hours" : "提醒和免打扰",
    privacyTitle: language === "en" ? "Privacy & data" : "隐私与数据",
    privacyBody:
      language === "en"
        ? "Your data stays under the current account and can be exported or deleted."
        : "数据仅在当前账号下维护，可随时导出或删除。",
    exportLabel: language === "en" ? "Export data" : "导出数据",
    deleteLabel: language === "en" ? "Delete account" : "删除账号",
    networkError: language === "en" ? "API offline" : "接口未连接",
    exportFailed: language === "en" ? "Export failed" : "导出失败",
    deleteFailed: language === "en" ? "Delete failed" : "删除失败",
    deleteConfirmTitle: language === "en" ? "Delete account" : "删除账号",
    deleteConfirmContent: language === "en" ? "This clears all current user data." : "这会清除当前用户的全部数据。",
    deleted: language === "en" ? "Deleted" : "已删除"
  };
}

function clampProgress(value: number, min: number, max: number): number {
  return Math.min(Math.max(((value - min) / (max - min)) * 100, 8), 100);
}

function getStoredCycleLength(): number {
  try {
    const stored = wx.getStorageSync(CYCLE_LENGTH_KEY);
    const value = Number(stored);
    return value >= CYCLE_MIN && value <= CYCLE_MAX ? value : 28;
  } catch {
    return 28;
  }
}

function getStoredPeriodLength(): number {
  try {
    const stored = wx.getStorageSync(PERIOD_LENGTH_KEY);
    const value = Number(stored);
    return value >= PERIOD_MIN && value <= PERIOD_MAX ? value : 5;
  } catch {
    return 5;
  }
}

function saveCycleLength(value: number): void {
  try {
    wx.setStorageSync(CYCLE_LENGTH_KEY, value);
  } catch { /* ignore */ }
}

function savePeriodLength(value: number): void {
  try {
    wx.setStorageSync(PERIOD_LENGTH_KEY, value);
  } catch { /* ignore */ }
}

Page({
  data: {
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage()),
    cycleLength: getStoredCycleLength(),
    periodLength: getStoredPeriodLength(),
    cycleFillPercent: 0,
    periodFillPercent: 0,
    reminderSummary: "",
    preference: null as ReminderPreferenceResponse | null
  },

  onLoad() {
    this.updateFills();
  },

  onShow() {
    const language = getStoredDisplayLanguage();
    if (language !== this.data.language) {
      this.applyLanguage(language);
    }
    void this.loadDashboardSync();
    void this.loadPreference();
  },

  applyLanguage(language: DisplayLanguage) {
    this.setData({ language, copy: buildCopy(language) });
    this.updateReminderSummary();
  },

  toggleLanguage() {
    const nextLanguage = getNextDisplayLanguage(this.data.language as DisplayLanguage);
    setStoredDisplayLanguage(nextLanguage);
    this.applyLanguage(nextLanguage);
  },

  updateFills() {
    this.setData({
      cycleFillPercent: clampProgress(this.data.cycleLength, CYCLE_MIN, CYCLE_MAX),
      periodFillPercent: clampProgress(this.data.periodLength, PERIOD_MIN, PERIOD_MAX)
    });
  },

  decreaseCycle() {
    const next = Math.max(CYCLE_MIN, this.data.cycleLength - 1);
    this.setData({ cycleLength: next });
    saveCycleLength(next);
    this.updateFills();
  },

  increaseCycle() {
    const next = Math.min(CYCLE_MAX, this.data.cycleLength + 1);
    this.setData({ cycleLength: next });
    saveCycleLength(next);
    this.updateFills();
  },

  decreasePeriod() {
    const next = Math.max(PERIOD_MIN, this.data.periodLength - 1);
    this.setData({ periodLength: next });
    savePeriodLength(next);
    this.updateFills();
  },

  increasePeriod() {
    const next = Math.min(PERIOD_MAX, this.data.periodLength + 1);
    this.setData({ periodLength: next });
    savePeriodLength(next);
    this.updateFills();
  },

  async loadDashboardSync() {
    try {
      const dashboard = await api.getDashboard();
      const summary = dashboard.summary;
      if (summary) {
        const cycleLength = summary.averageCycleLength || this.data.cycleLength;
        const periodLength = summary.averagePeriodLength || this.data.periodLength;
        this.setData({ cycleLength, periodLength });
        saveCycleLength(cycleLength);
        savePeriodLength(periodLength);
        this.updateFills();
      }
    } catch { /* silent */ }
  },

  async loadPreference() {
    try {
      const preference = await api.getReminderPreferences();
      this.setData({ preference });
      this.updateReminderSummary();
    } catch { /* silent */ }
  },

  updateReminderSummary() {
    const preference = this.data.preference;
    const language = this.data.language as DisplayLanguage;
    if (!preference) {
      this.setData({ reminderSummary: "" });
      return;
    }

    const enabledCount = preference.items.filter((item: ReminderPreferenceItem) => item.enabled).length;
    const quietHours = `${preference.quietHours.start} - ${preference.quietHours.end}`;

    const summary =
      language === "en"
        ? `${enabledCount} reminders enabled, quiet hours ${quietHours}`
        : `已开启 ${enabledCount} 项提醒，免打扰时段 ${quietHours}`;

    this.setData({ reminderSummary: summary });
  },

  openReminders() {
    wx.navigateTo({ url: "/pages/reminders/index" });
  },

  async exportData() {
    try {
      const bundle = await api.exportData();
      const dateStr = bundle.exportedAt.slice(0, 16);
      wx.showModal({
        title: this.data.copy.exportLabel,
        content: dateStr,
        showCancel: false
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkError : this.data.copy.exportFailed,
        icon: "none"
      });
    }
  },

  async deleteAccount() {
    const confirmed = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: this.data.copy.deleteConfirmTitle,
        content: this.data.copy.deleteConfirmContent,
        confirmColor: "#FF5B8D",
        success: (result) => resolve(Boolean(result.confirm)),
        fail: () => resolve(false)
      });
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteAccount();
      wx.showToast({
        title: this.data.copy.deleted,
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkError : this.data.copy.deleteFailed,
        icon: "none"
      });
    }
  }
});

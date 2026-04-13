import type { ReminderPreferenceItem, ReminderType } from "@women-period/shared";
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

interface ReminderCopy {
  languageButtonLabel: string;
  timePickerLabel: string;
  heroEyebrow: string;
  heroTitlePrefix: string;
  heroSubtitle: string;
  quietStartLabel: string;
  quietEndLabel: string;
  reminderSectionTitle: string;
  saveLabel: string;
  backToCalendarLabel: string;
  saveSuccess: string;
  saveFailed: string;
  loadFailed: string;
  networkUnavailable: string;
}

interface ReminderItemView {
  type: ReminderType;
  label: string;
  detail: string;
  icon: string;
  enabled: boolean;
}

function buildCopy(language: DisplayLanguage): ReminderCopy {
  return {
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    timePickerLabel: language === "en" ? "Refined Time-Picker" : "精细时间选择",
    heroEyebrow: language === "en" ? "Quiet Hours" : "免打扰时段",
    heroTitlePrefix: language === "en" ? "No-Disturb" : "免打扰",
    heroSubtitle:
      language === "en"
        ? "Reminder pushes stay outside your quiet window."
        : "提醒推送会自动避开你的免打扰时间。",
    quietStartLabel: language === "en" ? "Quiet starts" : "免打扰开始",
    quietEndLabel: language === "en" ? "Quiet ends" : "免打扰结束",
    reminderSectionTitle: language === "en" ? "Reminder items" : "提醒项目",
    saveLabel: language === "en" ? "Save settings" : "保存设置",
    backToCalendarLabel: language === "en" ? "Back to calendar" : "返回日历",
    saveSuccess: language === "en" ? "Reminder settings saved" : "提醒设置已保存",
    saveFailed: language === "en" ? "Save failed" : "保存失败",
    loadFailed: language === "en" ? "Failed to load reminder settings" : "提醒设置加载失败",
    networkUnavailable:
      language === "en"
        ? "API offline. Run npm.cmd run start:api."
        : "接口未连接，请先执行 npm.cmd run start:api"
  };
}

function buildReminderDetail(item: ReminderPreferenceItem, language: DisplayLanguage): string {
  if (language === "en") {
    return `${item.leadDays} day(s) ahead · ${item.time}`;
  }

  return `提前 ${item.leadDays} 天 · 时间 ${item.time}`;
}

function getReminderIcon(type: ReminderType): string {
  switch (type) {
    case "period_due":
      return "📅";
    case "delayed":
      return "⏰";
    default:
      return "📝";
  }
}

function buildReminderViews(
  items: ReminderPreferenceItem[],
  language: DisplayLanguage
): ReminderItemView[] {
  return items.map((item) => ({
    type: item.type,
    enabled: item.enabled,
    label: getReminderTypeLabel(item.type, language),
    detail: buildReminderDetail(item, language),
    icon: getReminderIcon(item.type)
  }));
}

Page({
  data: {
    preference: null as ReminderPreferenceResponse | null,
    reminderViews: [] as ReminderItemView[],
    isSaving: false,
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage())
  },

  onShow() {
    const language = getStoredDisplayLanguage();

    if (language !== this.data.language) {
      this.applyLanguage(language);
    }

    void this.loadPreference();
  },

  applyLanguage(language: DisplayLanguage) {
    const nextData: WechatMiniprogram.IAnyObject = {
      language,
      copy: buildCopy(language)
    };

    if (this.data.preference) {
      nextData.reminderViews = buildReminderViews(this.data.preference.items, language);
    }

    this.setData(nextData);
  },

  toggleLanguage() {
    const nextLanguage = getNextDisplayLanguage(this.data.language as DisplayLanguage);
    setStoredDisplayLanguage(nextLanguage);
    this.applyLanguage(nextLanguage);
  },

  async loadPreference() {
    try {
      const preference = await api.getReminderPreferences();
      this.setData({
        preference,
        reminderViews: buildReminderViews(preference.items, this.data.language as DisplayLanguage)
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.loadFailed,
        icon: "none"
      });
    }
  },

  toggleItem(event: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    const type = event.currentTarget.dataset.type as string;
    const enabled = Boolean(event.detail.value);
    const nextItems = this.data.preference?.items.map((item) =>
      item.type === type ? { ...item, enabled } : item
    );
    this.setData({
      preference: {
        ...(this.data.preference as ReminderPreferenceResponse),
        items: nextItems ?? []
      },
      reminderViews: buildReminderViews(nextItems ?? [], this.data.language as DisplayLanguage)
    });
  },

  changeQuietStart(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.updateQuietHours("start", event.detail.value);
  },

  changeQuietEnd(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.updateQuietHours("end", event.detail.value);
  },

  updateQuietHours(field: "start" | "end", value: string) {
    if (!this.data.preference) {
      return;
    }

    this.setData({
      preference: {
        ...this.data.preference,
        quietHours: {
          ...this.data.preference.quietHours,
          [field]: value
        }
      }
    });
  },

  async savePreference() {
    if (!this.data.preference) {
      return;
    }

    this.setData({ isSaving: true });

    try {
      await api.updateReminderPreferences(this.data.preference);
      void api.trackEvent("reminder_opt_in").catch(() => undefined);
      wx.showToast({
        title: this.data.copy.saveSuccess,
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.saveFailed,
        icon: "none"
      });
    } finally {
      this.setData({ isSaving: false });
    }
  },

  backToCalendar() {
    wx.switchTab({
      url: "/pages/calendar/index"
    });
  }
});

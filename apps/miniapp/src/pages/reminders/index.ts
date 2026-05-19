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

const LEAD_DAYS_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "7"];

interface ReminderCopy {
  languageButtonLabel: string;
  title: string;
  quietTitle: string;
  quietStartLabel: string;
  quietEndLabel: string;
  reminderSectionTitle: string;
  currentTimeLabel: string;
  leadDaysLabel: string;
  timeLabel: string;
  saveLabel: string;
  saveSuccess: string;
  saveFailed: string;
  loadFailed: string;
  networkUnavailable: string;
}

interface ReminderItemView {
  type: ReminderType;
  label: string;
  enabled: boolean;
  leadDays: number;
  leadDaysIndex: number;
  time: string;
}

function buildCopy(language: DisplayLanguage): ReminderCopy {
  return {
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    title: language === "en" ? "Reminder settings" : "提醒设置",
    quietTitle: language === "en" ? "Quiet hours" : "免打扰时段",
    quietStartLabel: language === "en" ? "Start" : "开始",
    quietEndLabel: language === "en" ? "End" : "结束",
    reminderSectionTitle: language === "en" ? "Reminder items" : "提醒项目",
    currentTimeLabel: language === "en" ? "Current time" : "当前时间",
    leadDaysLabel: language === "en" ? "Lead days" : "提前天数",
    timeLabel: language === "en" ? "Time" : "提醒时间",
    saveLabel: language === "en" ? "Save settings" : "保存设置",
    saveSuccess: language === "en" ? "Reminder settings saved" : "提醒设置已保存",
    saveFailed: language === "en" ? "Save failed" : "保存失败",
    loadFailed: language === "en" ? "Failed to load reminder settings" : "提醒设置加载失败",
    networkUnavailable:
      language === "en"
        ? "API offline. Run npm.cmd run start:api."
        : "接口未连接，请先执行 npm.cmd run start:api"
  };
}

function clampLeadIndex(value: number): number {
  if (value < 0) return 0;
  if (value > LEAD_DAYS_OPTIONS.length - 1) return LEAD_DAYS_OPTIONS.length - 1;
  return value;
}

function buildReminderViews(
  items: ReminderPreferenceItem[],
  language: DisplayLanguage
): ReminderItemView[] {
  return items.map((item) => ({
    type: item.type,
    enabled: item.enabled,
    label: getReminderTypeLabel(item.type, language),
    leadDays: item.leadDays,
    leadDaysIndex: clampLeadIndex(item.leadDays),
    time: item.time
  }));
}

Page({
  data: {
    preference: null as ReminderPreferenceResponse | null,
    reminderViews: [] as ReminderItemView[],
    leadDaysOptions: LEAD_DAYS_OPTIONS,
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

  applyItemPatch(type: string, patch: Partial<ReminderPreferenceItem>) {
    if (!this.data.preference) return;
    const nextItems = this.data.preference.items.map((item) =>
      item.type === type ? { ...item, ...patch } : item
    );
    this.setData({
      preference: { ...this.data.preference, items: nextItems },
      reminderViews: buildReminderViews(nextItems, this.data.language as DisplayLanguage)
    });
  },

  toggleItem(event: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    const type = event.currentTarget.dataset.type as string;
    this.applyItemPatch(type, { enabled: Boolean(event.detail.value) });
  },

  changeItemLeadDays(event: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const type = event.currentTarget.dataset.type as string;
    const index = clampLeadIndex(Number(event.detail.value));
    this.applyItemPatch(type, { leadDays: Number(LEAD_DAYS_OPTIONS[index]) });
  },

  changeItemTime(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const type = event.currentTarget.dataset.type as string;
    this.applyItemPatch(type, { time: event.detail.value });
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
  }
});

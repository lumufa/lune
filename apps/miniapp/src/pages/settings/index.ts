import type { ReminderPreferenceItem, ReminderType } from "@women-period/shared";
import type { ReminderPreferenceResponse } from "../../types";
import { api, isApiNetworkError } from "../../services/api";
import {
  getReminderTypeLabel,
  getStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";

const CYCLE_LENGTH_KEY = "settings-cycle-length";
const PERIOD_LENGTH_KEY = "settings-period-length";
const CYCLE_MIN = 20;
const CYCLE_MAX = 45;
const PERIOD_MIN = 2;
const PERIOD_MAX = 10;

interface SettingsCopy {
  title: string;
  cycleParamSection: string;
  cycleLengthLabel: string;
  periodLengthLabel: string;
  reminderSection: string;
  leadDaysLabel: string;
  dayBefore: string;
  quietHoursLabel: string;
  privacySection: string;
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
    title: language === "en" ? "Settings" : "设置",
    cycleParamSection: language === "en" ? "CYCLE PARAMETERS" : "周期参数",
    cycleLengthLabel: language === "en" ? "Cycle length" : "周期长度",
    periodLengthLabel: language === "en" ? "Period length" : "经期长度",
    reminderSection: language === "en" ? "REMINDERS" : "提醒",
    leadDaysLabel: language === "en" ? "Remind in advance" : "提前提醒",
    dayBefore: language === "en" ? "d" : "天前",
    quietHoursLabel: language === "en" ? "Quiet hours" : "免打扰时段",
    privacySection: language === "en" ? "PRIVACY & DATA" : "隐私与数据",
    privacyBody:
      language === "en"
        ? "Your data stays under the current account."
        : "数据仅在当前账号下维护。",
    exportLabel: language === "en" ? "Export data" : "导出数据",
    deleteLabel: language === "en" ? "Delete all data" : "删除所有数据",
    networkError: language === "en" ? "API offline" : "接口未连接",
    exportFailed: language === "en" ? "Export failed" : "导出失败",
    deleteFailed: language === "en" ? "Delete failed" : "删除失败",
    deleteConfirmTitle: language === "en" ? "Delete all data" : "删除所有数据",
    deleteConfirmContent:
      language === "en"
        ? "This action cannot be undone. All records will be permanently removed."
        : "此操作不可撤销，所有记录将被永久清除。",
    deleted: language === "en" ? "Deleted" : "已删除"
  };
}

interface ReminderItemView {
  type: ReminderType;
  label: string;
  detail: string;
  enabled: boolean;
}

function buildReminderDetail(item: ReminderPreferenceItem, language: DisplayLanguage): string {
  if (language === "en") return `${item.leadDays}d ahead · ${item.time}`;
  return `提前${item.leadDays}天 · ${item.time}`;
}

function buildReminderViews(items: ReminderPreferenceItem[], language: DisplayLanguage): ReminderItemView[] {
  return items.map((item) => ({
    type: item.type,
    enabled: item.enabled,
    label: getReminderTypeLabel(item.type, language),
    detail: buildReminderDetail(item, language)
  }));
}

function getStoredCycleLength(): number {
  try {
    const stored = wx.getStorageSync(CYCLE_LENGTH_KEY);
    const value = Number(stored);
    return value >= CYCLE_MIN && value <= CYCLE_MAX ? value : 28;
  } catch { return 28; }
}

function getStoredPeriodLength(): number {
  try {
    const stored = wx.getStorageSync(PERIOD_LENGTH_KEY);
    const value = Number(stored);
    return value >= PERIOD_MIN && value <= PERIOD_MAX ? value : 5;
  } catch { return 5; }
}

function saveCycleLength(value: number): void {
  try { wx.setStorageSync(CYCLE_LENGTH_KEY, value); } catch { /* ignore */ }
}

function savePeriodLength(value: number): void {
  try { wx.setStorageSync(PERIOD_LENGTH_KEY, value); } catch { /* ignore */ }
}

Page({
  data: {
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage()),
    cycleLength: getStoredCycleLength(),
    periodLength: getStoredPeriodLength(),
    preference: null as ReminderPreferenceResponse | null,
    hasPreference: false,
    reminderViews: [] as ReminderItemView[],
    anyReminderEnabled: false,
    leadDays: 2,
    quietStart: "22:00",
    quietEnd: "08:00"
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
    if (this.data.preference) {
      this.setData({
        reminderViews: buildReminderViews(this.data.preference.items, language)
      });
    }
  },

  decreaseCycle() {
    const next = Math.max(CYCLE_MIN, this.data.cycleLength - 1);
    this.setData({ cycleLength: next });
    saveCycleLength(next);
  },

  increaseCycle() {
    const next = Math.min(CYCLE_MAX, this.data.cycleLength + 1);
    this.setData({ cycleLength: next });
    saveCycleLength(next);
  },

  decreasePeriod() {
    const next = Math.max(PERIOD_MIN, this.data.periodLength - 1);
    this.setData({ periodLength: next });
    savePeriodLength(next);
  },

  increasePeriod() {
    const next = Math.min(PERIOD_MAX, this.data.periodLength + 1);
    this.setData({ periodLength: next });
    savePeriodLength(next);
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
      }
    } catch { /* silent */ }
  },

  async loadPreference() {
    try {
      const preference = await api.getReminderPreferences();
      const language = this.data.language as DisplayLanguage;
      const periodDue = preference.items.find((i: ReminderPreferenceItem) => i.type === "period_due");
      const anyEnabled = preference.items.some((i: ReminderPreferenceItem) => i.enabled);
      this.setData({
        preference,
        hasPreference: true,
        reminderViews: buildReminderViews(preference.items, language),
        anyReminderEnabled: anyEnabled,
        leadDays: periodDue?.leadDays ?? 2,
        quietStart: preference.quietHours.start,
        quietEnd: preference.quietHours.end
      });
    } catch { /* silent */ }
  },

  toggleItem(event: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    const type = event.currentTarget.dataset.type as string;
    const enabled = Boolean(event.detail.value);
    if (!this.data.preference) return;

    const nextItems = this.data.preference.items.map((item: ReminderPreferenceItem) =>
      item.type === type ? { ...item, enabled } : item
    );
    const language = this.data.language as DisplayLanguage;
    const anyEnabled = nextItems.some((i: ReminderPreferenceItem) => i.enabled);
    const nextPref = { ...this.data.preference, items: nextItems };

    this.setData({
      preference: nextPref,
      reminderViews: buildReminderViews(nextItems, language),
      anyReminderEnabled: anyEnabled
    });
    void this.autoSavePreference(nextPref);
  },

  setLeadDays(event: WechatMiniprogram.BaseEvent) {
    const days = Number(event.currentTarget.dataset.days);
    if (!this.data.preference) return;

    const nextItems = this.data.preference.items.map((item: ReminderPreferenceItem) =>
      item.type === "period_due" ? { ...item, leadDays: days } : item
    );
    const language = this.data.language as DisplayLanguage;
    const nextPref = { ...this.data.preference, items: nextItems };

    this.setData({
      leadDays: days,
      preference: nextPref,
      reminderViews: buildReminderViews(nextItems, language)
    });
    void this.autoSavePreference(nextPref);
  },

  changeQuietStart(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    if (!this.data.preference) return;
    const nextPref = {
      ...this.data.preference,
      quietHours: { ...this.data.preference.quietHours, start: event.detail.value }
    };
    this.setData({ quietStart: event.detail.value, preference: nextPref });
    void this.autoSavePreference(nextPref);
  },

  changeQuietEnd(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    if (!this.data.preference) return;
    const nextPref = {
      ...this.data.preference,
      quietHours: { ...this.data.preference.quietHours, end: event.detail.value }
    };
    this.setData({ quietEnd: event.detail.value, preference: nextPref });
    void this.autoSavePreference(nextPref);
  },

  async autoSavePreference(pref: ReminderPreferenceResponse) {
    try {
      await api.updateReminderPreferences(pref);
    } catch { /* silent auto-save */ }
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
        confirmColor: "#E53E3E",
        success: (result) => resolve(Boolean(result.confirm)),
        fail: () => resolve(false)
      });
    });

    if (!confirmed) return;

    try {
      await api.deleteAccount();
      wx.showToast({ title: this.data.copy.deleted, icon: "success" });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkError : this.data.copy.deleteFailed,
        icon: "none"
      });
    }
  }
});

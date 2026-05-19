import type { ReminderPreferenceItem } from "@women-period/shared";
import type { ReminderPreferenceResponse } from "../../types";
import { api, isApiNetworkError } from "../../services/api";
import {
  getStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";

interface SettingsCopy {
  title: string;
  cycleLengthLabel: string;
  periodLengthLabel: string;
  pendingHint: string;
  dayUnit: string;
  autoBadgePrefix: string;
  autoBadgeSuffix: string;
  trendsTitle: string;
  trendsBody: string;
  reminderSummaryTitle: string;
  reminderSummaryEmpty: string;
  privacyTitle: string;
  exportLabel: string;
  deleteLabel: string;
  networkError: string;
  exportFailed: string;
  deleteFailed: string;
  deleteConfirmTitle: string;
  deleteConfirmContent: string;
  deleted: string;
}

const AUTO_COMPUTE_THRESHOLD = 3;

function buildCopy(language: DisplayLanguage): SettingsCopy {
  return {
    title: language === "en" ? "Settings" : "设置",
    cycleLengthLabel: language === "en" ? "Average cycle length" : "平均周期长度",
    periodLengthLabel: language === "en" ? "Average period length" : "平均经期长度",
    pendingHint:
      language === "en"
        ? `Auto-computed once you have ${AUTO_COMPUTE_THRESHOLD}+ records`
        : `记录满 ${AUTO_COMPUTE_THRESHOLD} 条后将自动计算`,
    dayUnit: language === "en" ? "days" : "天",
    autoBadgePrefix: language === "en" ? "Auto-computed from your " : "基于你的 ",
    autoBadgeSuffix: language === "en" ? " records" : " 条记录自动计算",
    trendsTitle: language === "en" ? "Trends" : "趋势分析",
    trendsBody:
      language === "en"
        ? "View cycle length, period duration and symptom trends."
        : "查看周期长度、经期时长与症状趋势。",
    reminderSummaryTitle: language === "en" ? "Reminders & quiet hours" : "提醒和免打扰",
    reminderSummaryEmpty: language === "en" ? "Loading reminder settings..." : "正在加载提醒设置…",
    privacyTitle: language === "en" ? "Privacy & data" : "隐私与数据",
    exportLabel: language === "en" ? "Export data" : "导出数据",
    deleteLabel: language === "en" ? "Delete account" : "删除账号",
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

function buildReminderSummary(
  preference: ReminderPreferenceResponse | null,
  language: DisplayLanguage,
  emptyText: string
): string {
  if (!preference) return emptyText;
  const enabledCount = preference.items.filter((i: ReminderPreferenceItem) => i.enabled).length;
  const quietRange = `${preference.quietHours.start} - ${preference.quietHours.end}`;
  return language === "en"
    ? `${enabledCount} reminders enabled, quiet hours ${quietRange}`
    : `已开启 ${enabledCount} 项提醒，免打扰时段 ${quietRange}`;
}

Page({
  data: {
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage()),
    cycleLength: 0,
    periodLength: 0,
    recordCount: 0,
    isAutoComputed: false,
    preference: null as ReminderPreferenceResponse | null,
    reminderSummaryText: buildCopy(getStoredDisplayLanguage()).reminderSummaryEmpty
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
    const copy = buildCopy(language);
    this.setData({
      language,
      copy,
      reminderSummaryText: buildReminderSummary(this.data.preference, language, copy.reminderSummaryEmpty)
    });
  },

  async loadDashboardSync() {
    try {
      const dashboard = await api.getDashboard();
      const summary = dashboard.summary;
      const recordCount = summary?.recordCount ?? dashboard.records?.length ?? 0;
      const isAutoComputed = recordCount >= AUTO_COMPUTE_THRESHOLD;
      this.setData({
        cycleLength: isAutoComputed ? summary!.averageCycleLength : 0,
        periodLength: isAutoComputed ? summary!.averagePeriodLength : 0,
        recordCount,
        isAutoComputed
      });
    } catch { /* silent */ }
  },

  async loadPreference() {
    try {
      const preference = await api.getReminderPreferences();
      const language = this.data.language as DisplayLanguage;
      this.setData({
        preference,
        reminderSummaryText: buildReminderSummary(preference, language, this.data.copy.reminderSummaryEmpty)
      });
    } catch { /* silent */ }
  },

  openReminders() {
    wx.navigateTo({ url: "/pages/reminders/index" });
  },

  openTrends() {
    wx.navigateTo({ url: "/pages/trends/index" });
  },

  openPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/index" });
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

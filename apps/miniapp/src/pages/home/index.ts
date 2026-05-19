import type { CycleRecord } from "@women-period/shared";
import type { DashboardResponse } from "../../types";
import { api, isApiNetworkError } from "../../services/api";
import {
  getDisplayLanguageToggleLabel,
  getFlowLabel,
  getMoodLabel,
  getNextDisplayLanguage,
  getStoredDisplayLanguage,
  setStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";
import { todayIso } from "../../utils/date";

interface HomeCopy {
  languageButtonLabel: string;
  cycleDayLabel: string;
  dayUnit: string;
  emptyMessage: string;
  untilNextPrefix: string;
  untilNextSuffix: string;
  latePrefix: string;
  lateSuffix: string;
  predictedDatePrefix: string;
  logToday: string;
  editTodayLog: string;
  cycleSummary: string;
  averageCycle: string;
  averagePeriod: string;
  logCount: string;
  logCountUnit: string;
  recentEntryTitle: string;
  symptomUnit: string;
  networkError: string;
  loadFailed: string;
}

interface RecentEntry {
  id: string;
  dateLabel: string;
  flowLabel: string;
  moodLabel: string;
  symptomsLabel: string;
}

function buildCopy(language: DisplayLanguage): HomeCopy {
  return {
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    cycleDayLabel: language === "en" ? "Cycle day" : "周期第",
    dayUnit: language === "en" ? "days" : "天",
    emptyMessage: language === "en" ? "No records\nStart today" : "尚无记录\n今天开始",
    untilNextPrefix: language === "en" ? "" : "距下次 ",
    untilNextSuffix: language === "en" ? "d to next" : " 天",
    latePrefix: language === "en" ? "" : "迟到 ",
    lateSuffix: language === "en" ? "d late" : " 天",
    predictedDatePrefix: language === "en" ? "Est. " : "预计 ",
    logToday: language === "en" ? "Log today" : "记录今天",
    editTodayLog: language === "en" ? "Edit today" : "编辑今日记录",
    cycleSummary: language === "en" ? "Cycle summary" : "周期概览",
    averageCycle: language === "en" ? "Average cycle" : "平均周期",
    averagePeriod: language === "en" ? "Average period" : "平均经期",
    logCount: language === "en" ? "Logs" : "记录次数",
    logCountUnit: language === "en" ? "items" : "条",
    recentEntryTitle: language === "en" ? "Last entry" : "上次记录",
    symptomUnit: language === "en" ? "symptom" : "项症状",
    networkError: language === "en" ? "API offline" : "接口未连接",
    loadFailed: language === "en" ? "Load failed" : "加载失败"
  };
}

function formatTodayDisplay(language: DisplayLanguage): string {
  const now = new Date();
  if (language === "en") {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(now);
  }
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(now);
}

function formatPredictionDate(value: string | undefined, language: DisplayLanguage): string {
  if (!value) {
    return language === "en" ? "Not available" : "暂无";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return language === "en" ? "Not available" : "暂无";
  }
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatRecentDate(value: string, language: DisplayLanguage): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", {
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function buildRecentEntry(records: CycleRecord[], language: DisplayLanguage, symptomUnit: string): RecentEntry | null {
  if (!records.length) return null;
  const sorted = records.slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
  const latest = sorted[0];
  const nonNoneSymptoms = (latest.symptoms ?? []).filter((s) => s !== "none");
  return {
    id: latest.id,
    dateLabel: formatRecentDate(latest.startDate, language),
    flowLabel: getFlowLabel(latest.flowLevel, language),
    moodLabel: getMoodLabel(latest.mood, language),
    symptomsLabel: nonNoneSymptoms.length > 0 ? `${nonNoneSymptoms.length} ${symptomUnit}` : ""
  };
}

function buildCycleInfo(records: CycleRecord[], cycleLength: number) {
  if (!records.length) {
    return { currentCycleDay: 0, nextPeriodDate: null, daysUntilNext: 0, isLate: false, lastPeriodStart: null };
  }

  const sorted = records.slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastRecord = sorted[0];
  const lastStart = new Date(lastRecord.startDate);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastStartDay = new Date(lastStart.getFullYear(), lastStart.getMonth(), lastStart.getDate());
  const daysSinceLast = Math.round((todayStart.getTime() - lastStartDay.getTime()) / (1000 * 60 * 60 * 24));
  const currentCycleDay = daysSinceLast + 1;
  const daysUntilNext = cycleLength - daysSinceLast;
  const nextPeriodDate = new Date(lastStartDay.getTime() + cycleLength * 24 * 60 * 60 * 1000);
  const isLate = daysUntilNext < 0;

  return {
    currentCycleDay: Math.max(1, currentCycleDay),
    nextPeriodDate,
    daysUntilNext: Math.abs(daysUntilNext),
    isLate,
    lastPeriodStart: lastStartDay
  };
}

function findTodayRecord(records: CycleRecord[]): string | undefined {
  const today = todayIso();
  for (const record of records) {
    const startDate = record.startDate.slice(0, 10);
    const endDate = record.endDate.slice(0, 10);
    if (startDate <= today && endDate >= today) {
      return record.id;
    }
  }
  return undefined;
}

const DEFAULT_CYCLE_LENGTH = 28;
const PLACEHOLDER = "—";

Page({
  data: {
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage()),
    todayLabel: formatTodayDisplay(getStoredDisplayLanguage()),
    dashboard: null as DashboardResponse | null,
    hasCycleInfo: false,
    cycleDay: 0,
    hasNextPeriod: false,
    daysUntilNext: 0,
    isLate: false,
    ringSubText: "",
    predictedDate: "",
    todayRecordId: "",
    averageCycleLength: PLACEHOLDER as string | number,
    averagePeriodLength: PLACEHOLDER as string | number,
    recordCount: 0,
    recentEntry: null as RecentEntry | null
  },

  onShow() {
    const language = getStoredDisplayLanguage();
    if (language !== this.data.language) {
      this.applyLanguage(language);
    }
    void this.loadDashboard();
  },

  applyLanguage(language: DisplayLanguage) {
    this.setData({
      language,
      copy: buildCopy(language),
      todayLabel: formatTodayDisplay(language)
    });
    if (this.data.dashboard) {
      this.buildDerived(this.data.dashboard, language);
    }
  },

  toggleLanguage() {
    const nextLanguage = getNextDisplayLanguage(this.data.language as DisplayLanguage);
    setStoredDisplayLanguage(nextLanguage);
    this.applyLanguage(nextLanguage);
  },

  async loadDashboard() {
    try {
      const dashboard = await api.getDashboard();
      this.setData({ dashboard });
      this.buildDerived(dashboard, this.data.language as DisplayLanguage);
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkError : this.data.copy.loadFailed,
        icon: "none"
      });
    }
  },

  buildDerived(dashboard: DashboardResponse, language: DisplayLanguage) {
    const records = dashboard.records ?? [];
    const summary = dashboard.summary;
    const cycleLength = summary?.averageCycleLength || DEFAULT_CYCLE_LENGTH;
    const cycleInfo = buildCycleInfo(records, cycleLength);
    const todayRecordId = findTodayRecord(records) ?? "";
    const hasCycleInfo = records.length > 0;
    const copy = this.data.copy as HomeCopy;
    const ringSubText = hasCycleInfo
      ? cycleInfo.isLate
        ? `${copy.latePrefix}${cycleInfo.daysUntilNext}${copy.lateSuffix}`
        : `${copy.untilNextPrefix}${cycleInfo.daysUntilNext}${copy.untilNextSuffix}`
      : "";
    const recentEntry = buildRecentEntry(records, language, copy.symptomUnit);
    const recordCount = summary?.recordCount || 0;
    const hasRecords = recordCount > 0;

    this.setData({
      hasCycleInfo,
      cycleDay: cycleInfo.currentCycleDay,
      hasNextPeriod: Boolean(cycleInfo.nextPeriodDate && records.length > 0),
      daysUntilNext: cycleInfo.daysUntilNext,
      isLate: cycleInfo.isLate,
      ringSubText,
      predictedDate: cycleInfo.nextPeriodDate
        ? formatPredictionDate(cycleInfo.nextPeriodDate.toISOString(), language)
        : "",
      todayRecordId,
      averageCycleLength: hasRecords ? summary!.averageCycleLength : PLACEHOLDER,
      averagePeriodLength: hasRecords ? summary!.averagePeriodLength : PLACEHOLDER,
      recordCount,
      recentEntry
    });
  },

  openCalendar() {
    wx.switchTab({ url: "/pages/calendar/index" });
  },

  openLog() {
    const todayRecordId = this.data.todayRecordId;
    if (todayRecordId) {
      const app = getApp<{ editRecordId?: string }>();
      app.editRecordId = todayRecordId;
    }
    wx.navigateTo({ url: "/pages/record/index" });
  },

  openRecentLog() {
    const recent = this.data.recentEntry as RecentEntry | null;
    if (!recent) return;
    const app = getApp<{ editRecordId?: string }>();
    app.editRecordId = recent.id;
    wx.navigateTo({ url: "/pages/record/index" });
  }
});

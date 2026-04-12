import type { CycleRecord } from "@women-period/shared";
import type { DashboardResponse } from "../../types";
import { api, isApiNetworkError } from "../../services/api";
import {
  getDisplayLanguageToggleLabel,
  getNextDisplayLanguage,
  getStoredDisplayLanguage,
  setStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";
import { todayIso } from "../../utils/date";

interface HomeCopy {
  languageButtonLabel: string;
  todayOverview: string;
  cycleDayLabel: string;
  dayUnit: string;
  noRecordsYet: string;
  untilNextPeriod: string;
  periodLate: string;
  predictedDatePrefix: string;
  waitingFirstRecord: string;
  waitingFirstRecordHint: string;
  logToday: string;
  editTodayLog: string;
  cycleSummary: string;
  averageCycle: string;
  averagePeriod: string;
  logCount: string;
  logCountUnit: string;
}

function buildCopy(language: DisplayLanguage): HomeCopy {
  return {
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    todayOverview: language === "en" ? "Today overview" : "今日概览",
    cycleDayLabel: language === "en" ? "Cycle day" : "周期第",
    dayUnit: language === "en" ? "days" : "天",
    noRecordsYet: language === "en" ? "No records yet. Start today." : "还没有记录，从今天开始。",
    untilNextPeriod: language === "en" ? "Until next period" : "距离下次月经还有",
    periodLate: language === "en" ? "Period is late" : "月经迟到了",
    predictedDatePrefix: language === "en" ? "Predicted date: " : "预测日期：",
    waitingFirstRecord: language === "en" ? "Waiting for your first record" : "还在等第一条记录",
    waitingFirstRecordHint:
      language === "en"
        ? "Log a start date and the home screen will begin to estimate your cycle."
        : "记下一次开始时间，首页就会开始给出周期状态。",
    logToday: language === "en" ? "Log today" : "记录今天",
    editTodayLog: language === "en" ? "Edit today's log" : "编辑今日记录",
    cycleSummary: language === "en" ? "Cycle summary" : "周期概览",
    averageCycle: language === "en" ? "Average cycle" : "平均周期",
    averagePeriod: language === "en" ? "Average period" : "平均经期",
    logCount: language === "en" ? "Logs" : "记录次数",
    logCountUnit: language === "en" ? "items" : "条"
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
const DEFAULT_PERIOD_LENGTH = 5;

Page({
  data: {
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage()),
    todayLabel: formatTodayDisplay(getStoredDisplayLanguage()),
    dashboard: null as DashboardResponse | null,
    cycleDay: 0,
    hasNextPeriod: false,
    daysUntilNext: 0,
    isLate: false,
    predictedDate: "",
    todayRecordId: "",
    averageCycleLength: DEFAULT_CYCLE_LENGTH,
    averagePeriodLength: DEFAULT_PERIOD_LENGTH,
    recordCount: 0
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
        title: isApiNetworkError(error) ? "接口未连接" : "加载失败",
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

    this.setData({
      cycleDay: cycleInfo.currentCycleDay,
      hasNextPeriod: Boolean(cycleInfo.nextPeriodDate && records.length > 0),
      daysUntilNext: cycleInfo.daysUntilNext,
      isLate: cycleInfo.isLate,
      predictedDate: cycleInfo.nextPeriodDate
        ? formatPredictionDate(cycleInfo.nextPeriodDate.toISOString(), language)
        : "",
      todayRecordId,
      averageCycleLength: summary?.averageCycleLength || DEFAULT_CYCLE_LENGTH,
      averagePeriodLength: summary?.averagePeriodLength || DEFAULT_PERIOD_LENGTH,
      recordCount: summary?.recordCount || 0
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
    wx.switchTab({ url: "/pages/record/index" });
  }
});

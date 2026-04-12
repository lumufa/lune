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

interface CalendarCopy {
  languageButtonLabel: string;
  tapDateHint: string;
  legendTitle: string;
  legendPeriod: string;
  legendPredicted: string;
  legendSymptom: string;
}

interface CalendarDay {
  key: string;
  day: number;
  dateKey: string;
  isEmpty: boolean;
  isToday: boolean;
  isPeriod: boolean;
  isPredicted: boolean;
  hasSymptoms: boolean;
  recordId: string;
}

function buildCopy(language: DisplayLanguage): CalendarCopy {
  return {
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    tapDateHint: language === "en" ? "Tap a date to log quickly" : "点击日期可快速记录",
    legendTitle: language === "en" ? "Legend" : "图例",
    legendPeriod: language === "en" ? "Period" : "经期",
    legendPredicted: language === "en" ? "Predicted" : "预测期",
    legendSymptom: language === "en" ? "Symptoms" : "症状记录"
  };
}

function formatMonthLabel(year: number, month: number, language: DisplayLanguage): string {
  const date = new Date(year, month, 1);
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long"
  }).format(date);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildPeriodDayMap(records: CycleRecord[]): Map<string, CycleRecord> {
  const map = new Map<string, CycleRecord>();
  for (const record of records) {
    const start = new Date(record.startDate);
    const end = new Date(record.endDate);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const cursor = new Date(startDay);
    while (cursor <= endDay) {
      map.set(formatDateKey(cursor), record);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return map;
}

function isPredictedDay(
  date: Date,
  lastPeriodStart: Date | null,
  cycleLength: number,
  periodLength: number
): boolean {
  if (!lastPeriodStart || cycleLength <= 0 || periodLength <= 0) {
    return false;
  }
  const diff = Math.round(
    (date.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) {
    return false;
  }
  const dayInCycle = ((diff % cycleLength) + cycleLength) % cycleLength;
  return dayInCycle < periodLength;
}

function buildCalendarDays(
  year: number,
  month: number,
  periodMap: Map<string, CycleRecord>,
  todayKey: string,
  lastPeriodStart: Date | null,
  cycleLength: number,
  periodLength: number
): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const startPadding = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: CalendarDay[] = [];

  for (let i = 0; i < startPadding; i++) {
    days.push({
      key: `empty-${i}`,
      day: 0,
      dateKey: "",
      isEmpty: true,
      isToday: false,
      isPeriod: false,
      isPredicted: false,
      hasSymptoms: false,
      recordId: ""
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateKey = formatDateKey(date);
    const record = periodMap.get(dateKey);
    const isToday = dateKey === todayKey;
    const isPeriod = Boolean(record);
    const isPredicted =
      !isPeriod && isPredictedDay(date, lastPeriodStart, cycleLength, periodLength);
    const hasSymptoms = Boolean(
      record?.symptoms?.length && record.symptoms[0] !== "none"
    );

    days.push({
      key: dateKey,
      day: d,
      dateKey,
      isEmpty: false,
      isToday,
      isPeriod,
      isPredicted,
      hasSymptoms,
      recordId: record?.id ?? ""
    });
  }

  return days;
}

const WEEK_DAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const WEEK_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

Page({
  data: {
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage()),
    weekDays: getStoredDisplayLanguage() === "en" ? WEEK_DAYS_EN : WEEK_DAYS_ZH,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    monthLabel: "",
    calendarDays: [] as CalendarDay[],
    dashboard: null as DashboardResponse | null
  },

  onLoad() {
    this.updateMonthLabel();
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
      weekDays: language === "en" ? WEEK_DAYS_EN : WEEK_DAYS_ZH
    });
    this.updateMonthLabel();
    if (this.data.dashboard) {
      this.buildCalendar(this.data.dashboard);
    }
  },

  toggleLanguage() {
    const nextLanguage = getNextDisplayLanguage(this.data.language as DisplayLanguage);
    setStoredDisplayLanguage(nextLanguage);
    this.applyLanguage(nextLanguage);
  },

  updateMonthLabel() {
    this.setData({
      monthLabel: formatMonthLabel(
        this.data.currentYear,
        this.data.currentMonth,
        this.data.language as DisplayLanguage
      )
    });
  },

  prevMonth() {
    let year = this.data.currentYear;
    let month = this.data.currentMonth - 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    this.setData({ currentYear: year, currentMonth: month });
    this.updateMonthLabel();
    if (this.data.dashboard) {
      this.buildCalendar(this.data.dashboard);
    }
  },

  nextMonth() {
    let year = this.data.currentYear;
    let month = this.data.currentMonth + 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    this.setData({ currentYear: year, currentMonth: month });
    this.updateMonthLabel();
    if (this.data.dashboard) {
      this.buildCalendar(this.data.dashboard);
    }
  },

  async loadDashboard() {
    try {
      const dashboard = await api.getDashboard();
      this.setData({ dashboard });
      this.buildCalendar(dashboard);
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? "接口未连接" : "加载失败",
        icon: "none"
      });
    }
  },

  buildCalendar(dashboard: DashboardResponse) {
    const records = dashboard.records ?? [];
    const summary = dashboard.summary;
    const cycleLength = summary?.averageCycleLength || DEFAULT_CYCLE_LENGTH;
    const periodLength = summary?.averagePeriodLength || DEFAULT_PERIOD_LENGTH;
    const periodMap = buildPeriodDayMap(records);

    const sorted = records.slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
    let lastPeriodStart: Date | null = null;
    if (sorted.length > 0) {
      const start = new Date(sorted[0].startDate);
      lastPeriodStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    }

    const today = new Date();
    const todayKey = formatDateKey(today);
    const calendarDays = buildCalendarDays(
      this.data.currentYear,
      this.data.currentMonth,
      periodMap,
      todayKey,
      lastPeriodStart,
      cycleLength,
      periodLength
    );

    this.setData({ calendarDays });
  },

  openDate(event: WechatMiniprogram.BaseEvent) {
    const dateKey = event.currentTarget.dataset.dateKey as string | undefined;
    const recordId = event.currentTarget.dataset.recordId as string | undefined;
    if (!dateKey) {
      return;
    }
    if (recordId) {
      wx.navigateTo({ url: `/pages/record/index?id=${encodeURIComponent(recordId)}` });
    } else {
      wx.navigateTo({ url: "/pages/record/index" });
    }
  }
});

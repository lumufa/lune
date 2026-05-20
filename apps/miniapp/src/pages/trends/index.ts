import type { CycleRecord, FlowLevel } from "@women-period/shared";
import type { DashboardResponse } from "../../types";
import { api, isApiNetworkError } from "../../services/api";
import {
  getFlowLabel,
  getStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";

const SUFFICIENT_RECORDS = 3;

interface TrendsCopy {
  title: string;
  avgCycleLabel: string;
  avgPeriodLabel: string;
  dayUnit: string;
  itemUnit: string;
  flowDistTitle: string;
  recentTitle: string;
  noData: string;
  noDataHint: string;
  guidanceText: string;
  encourageText: string;
  viewAllPrefix: string;
  viewAllSuffix: string;
  networkError: string;
  loadFailed: string;
  aiEntryTitle: string;
  aiEntrySubtitle: string;
}

function buildCopy(language: DisplayLanguage, remaining?: number): TrendsCopy {
  const r = remaining ?? SUFFICIENT_RECORDS;
  return {
    title: language === "en" ? "Trends" : "趋势",
    avgCycleLabel: language === "en" ? "Avg cycle" : "平均周期",
    avgPeriodLabel: language === "en" ? "Avg period" : "平均经期",
    dayUnit: language === "en" ? "days" : "天",
    itemUnit: language === "en" ? "entries" : "条",
    flowDistTitle: language === "en" ? "Flow distribution" : "流量分布",
    recentTitle: language === "en" ? "Recent records" : "最近记录",
    noData: language === "en" ? "No data yet" : "暂无数据",
    noDataHint:
      language === "en"
        ? "Start logging to see your trends here."
        : "开始记录后，趋势数据会出现在这里。",
    guidanceText:
      language === "en"
        ? `${r} more record${r > 1 ? "s" : ""} needed for trend analysis`
        : `再记录 ${r} 次即可查看趋势分析`,
    encourageText:
      language === "en"
        ? "Keep logging — trends get more accurate over time."
        : "坚持记录，趋势会越来越准确。",
    viewAllPrefix: language === "en" ? "View all " : "查看全部 ",
    viewAllSuffix: language === "en" ? " records" : " 条记录",
    networkError: language === "en" ? "API offline" : "接口未连接",
    loadFailed: language === "en" ? "Load failed" : "加载失败",
    aiEntryTitle: language === "en" ? "AI monthly interpretation" : "AI 月度解读",
    aiEntrySubtitle:
      language === "en"
        ? "Generate a pattern summary from this month's records"
        : "基于本月记录生成模式解读"
  };
}

interface FlowDistItem {
  label: string;
  count: number;
  percent: number;
}

interface RecentItem {
  id: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  flowLabel: string;
}

function buildFlowDist(records: CycleRecord[], language: DisplayLanguage): FlowDistItem[] {
  const counts: Record<FlowLevel, number> = { light: 0, medium: 0, heavy: 0 };
  for (const r of records) {
    if (counts[r.flowLevel] !== undefined) counts[r.flowLevel]++;
  }
  const total = records.length || 1;
  return (["light", "medium", "heavy"] as FlowLevel[]).map((level) => ({
    label: getFlowLabel(level, language),
    count: counts[level],
    percent: Math.round((counts[level] / total) * 100)
  }));
}

function buildRecentList(records: CycleRecord[], language: DisplayLanguage, limit: number): RecentItem[] {
  const sorted = records.slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
  return sorted.slice(0, limit).map((r) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const duration = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      id: r.id,
      startDate: r.startDate.slice(0, 10),
      endDate: r.endDate.slice(0, 10),
      durationDays: Math.max(1, duration),
      flowLabel: getFlowLabel(r.flowLevel, language)
    };
  });
}

const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;

Page({
  data: {
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage()),
    avgCycle: DEFAULT_CYCLE,
    avgPeriod: DEFAULT_PERIOD,
    recordCount: 0,
    hasData: false,
    hasSufficientData: false,
    guidancePercent: 0,
    flowDist: [] as FlowDistItem[],
    recentList: [] as RecentItem[],
    totalRecords: 0,
    showViewAll: false,
    allRecords: [] as RecentItem[],
    expanded: false
  },

  onShow() {
    const language = getStoredDisplayLanguage();
    if (language !== this.data.language) {
      this.setData({ language, copy: buildCopy(language) });
    }
    void this.loadData();
  },

  async loadData() {
    try {
      const dashboard = await api.getDashboard();
      this.buildDerived(dashboard);
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkError : this.data.copy.loadFailed,
        icon: "none"
      });
    }
  },

  buildDerived(dashboard: DashboardResponse) {
    const records = dashboard.records ?? [];
    const summary = dashboard.summary;
    const language = this.data.language as DisplayLanguage;
    const count = summary?.recordCount || 0;
    const hasSufficient = count >= SUFFICIENT_RECORDS;
    const remaining = Math.max(0, SUFFICIENT_RECORDS - count);
    const allItems = buildRecentList(records, language, 999);

    this.setData({
      avgCycle: summary?.averageCycleLength || DEFAULT_CYCLE,
      avgPeriod: summary?.averagePeriodLength || DEFAULT_PERIOD,
      recordCount: count,
      hasData: records.length > 0,
      hasSufficientData: hasSufficient,
      guidancePercent: Math.round((Math.min(count, SUFFICIENT_RECORDS) / SUFFICIENT_RECORDS) * 100),
      flowDist: buildFlowDist(records, language),
      recentList: allItems.slice(0, 3),
      allRecords: allItems,
      totalRecords: allItems.length,
      showViewAll: allItems.length > 3,
      expanded: false,
      copy: buildCopy(language, remaining)
    });
  },

  viewAllRecent() {
    this.setData({
      recentList: this.data.allRecords,
      expanded: true,
      showViewAll: false
    });
  },

  goToInsights() {
    wx.navigateTo({ url: "/pages/insights/index" });
  }
});

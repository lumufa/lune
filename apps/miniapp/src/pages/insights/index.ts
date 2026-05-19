import type {
  AIInterpretationSnapshot,
  AILanguage,
  CycleRecord,
  FlowLevel,
  MoodTag,
  SymptomTag
} from "@women-period/shared";
import type { ApiRequestError } from "../../services/api";
import type { DashboardResponse } from "../../types";
import { api, isApiNetworkError } from "../../services/api";

const AI_CONSENT_VERSION = "2026-04-24";
const AI_CONSENT_PURPOSE =
  "将脱敏的周期统计数据（周期长度/流量分布/高频症状等）发送给第三方大模型，用于生成本月模式解读，原始日志与 ID 不会出端。";
const MIN_CYCLES_FOR_AI = 2;
import {
  getDisplayLanguageToggleLabel,
  getFlowLabel,
  getMoodLabel,
  getNextDisplayLanguage,
  getStoredDisplayLanguage,
  getSymptomLabel,
  setStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";

interface InsightsCopy {
  languageButtonLabel: string;
  heroTitle: string;
  interactiveLabel: string;
  breakdownTitle: string;
  symptomTitle: string;
  predictabilityTitle: string;
  predictabilitySubtitle: string;
  scoreLabel: string;
  tapToExpand: string;
  tapToCollapse: string;
  breakdownDetailCaption: string;
  correlationDetailCaption: string;
  predictabilityDetailCaption: string;
  topSymptomsLabel: string;
  emptyState: string;
  loadFailed: string;
  networkUnavailable: string;
  aiTitle: string;
  aiSubtitle: string;
  aiButtonLabel: string;
  aiLoadingLabel: string;
  aiNotEnough: string;
  aiConsentTitle: string;
  aiConsentContent: string;
  aiConsentConfirm: string;
  aiConsentCancel: string;
  aiErrorGeneric: string;
  aiErrorUpstream: string;
  aiErrorUnconfigured: string;
}

interface BreakdownItem {
  key: FlowLevel;
  label: string;
  percent: number;
  fillStyle: string;
}

const FALLBACK_BARS = [34, 58, 76, 42, 68];
const EMPTY_SYMPTOM: SymptomTag = "none";

function buildCopy(language: DisplayLanguage): InsightsCopy {
  return {
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    heroTitle: language === "en" ? "Period Insight" : "周期洞察",
    interactiveLabel: language === "en" ? "Interactive" : "可交互",
    breakdownTitle: language === "en" ? "Period Breakdown" : "经期分布",
    symptomTitle: language === "en" ? "Symptom Correlation" : "症状关联",
    predictabilityTitle: language === "en" ? "Cycle Predictability" : "周期可预测性",
    predictabilitySubtitle:
      language === "en" ? "Stability score from your own records." : "基于历史记录的稳定度评分。",
    scoreLabel: language === "en" ? "Score" : "评分",
    tapToExpand: language === "en" ? "Tap to view details" : "点击查看详情",
    tapToCollapse: language === "en" ? "Tap to collapse" : "点击收起",
    breakdownDetailCaption:
      language === "en"
        ? "Bars show flow-level proportion across your recent records."
        : "横条展示你最近记录中不同流量等级的占比。",
    correlationDetailCaption:
      language === "en"
        ? "Top symptoms and mood pairing are extracted from your own logs."
        : "从你的记录里提取高频症状与情绪搭配。",
    predictabilityDetailCaption:
      language === "en"
        ? "Higher score means your cycle length and duration are more stable."
        : "评分越高，说明你的周期长度与经期时长越稳定。",
    topSymptomsLabel: language === "en" ? "Top symptoms" : "高频症状",
    emptyState:
      language === "en"
        ? "Not enough data yet. Insights appear after your first logs."
        : "记录量还不足，完成首次记录后会生成洞察。",
    loadFailed: language === "en" ? "Failed to load insights" : "洞察加载失败",
    networkUnavailable:
      language === "en"
        ? "API offline. Run npm.cmd run start:api."
        : "接口未连接，请先执行 npm.cmd run start:api",
    aiTitle: language === "en" ? "AI Monthly Reading" : "AI 本月解读",
    aiSubtitle:
      language === "en"
        ? "Pattern summary from anonymized stats — not medical advice."
        : "基于脱敏统计的模式总结，不作医疗建议",
    aiButtonLabel: language === "en" ? "Generate" : "生成解读",
    aiLoadingLabel: language === "en" ? "Generating…" : "生成中…",
    aiNotEnough:
      language === "en"
        ? "Log at least 2 cycles to enable AI reading."
        : "至少完成 2 个周期记录后可使用 AI 解读",
    aiConsentTitle: language === "en" ? "Enable AI Reading" : "开启 AI 解读",
    aiConsentContent:
      language === "en"
        ? "Anonymized stats (cycle length, flow distribution, top symptoms) will be sent to a third-party LLM. Raw notes and your ID never leave the server."
        : "我们会将脱敏的统计数据（周期长度、流量分布、高频症状等）发送给第三方大模型，原始笔记与用户 ID 不会出端。",
    aiConsentConfirm: language === "en" ? "Agree" : "同意并继续",
    aiConsentCancel: language === "en" ? "Cancel" : "取消",
    aiErrorGeneric: language === "en" ? "AI reading failed" : "AI 解读失败",
    aiErrorUpstream:
      language === "en" ? "Upstream model error, please retry later" : "模型服务异常，请稍后重试",
    aiErrorUnconfigured:
      language === "en"
        ? "AI provider not configured on this server"
        : "该环境未配置 AI 服务"
  };
}

function flowWeight(level: FlowLevel): number {
  switch (level) {
    case "heavy":
      return 1;
    case "medium":
      return 0.72;
    default:
      return 0.4;
  }
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(99, Math.round(value)));
}

function getTopMoods(records: DashboardResponse["records"]): [MoodTag, MoodTag] {
  const moodCount = new Map<MoodTag, number>();

  for (const item of records) {
    moodCount.set(item.mood, (moodCount.get(item.mood) ?? 0) + 1);
  }

  const sorted = [...moodCount.entries()].sort((a, b) => b[1] - a[1]).map((entry) => entry[0]);
  const first = sorted[0] ?? "steady";
  const second = sorted[1] ?? "energetic";

  return [first, second];
}

function getTopSymptoms(records: DashboardResponse["records"]): SymptomTag[] {
  const counts = new Map<SymptomTag, number>();

  for (const record of records) {
    for (const symptom of record.symptoms) {
      counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
    }
  }

  const sorted = [...counts.entries()]
    .filter(([symptom]) => symptom !== EMPTY_SYMPTOM)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);

  return sorted.length ? sorted : [EMPTY_SYMPTOM];
}

function toDate(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function getDayDiff(start: string, end: string): number {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) {
    return 0;
  }
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / oneDay) + 1);
}

function getPredictabilityBars(records: DashboardResponse["records"]): number[] {
  if (!records.length) {
    return FALLBACK_BARS;
  }

  const source = records
    .slice(-5)
    .map((item) => getDayDiff(item.startDate, item.endDate))
    .filter((value) => value > 0);

  if (!source.length) {
    return FALLBACK_BARS;
  }

  const max = Math.max(...source, 1);
  return source.map((value) => Math.max(26, Math.round((value / max) * 80)));
}

function buildBreakdownItems(records: CycleRecord[], language: DisplayLanguage): BreakdownItem[] {
  const total = records.length || 1;
  const counters: Record<FlowLevel, number> = {
    light: 0,
    medium: 0,
    heavy: 0
  };

  for (const record of records) {
    counters[record.flowLevel] += 1;
  }

  return (["light", "medium", "heavy"] as FlowLevel[]).map((level) => {
    const percent = clampPercent((counters[level] / total) * 100);
    const width = Math.max(8, percent);

    return {
      key: level,
      label: getFlowLabel(level, language),
      percent,
      fillStyle: `width: ${width}%;`
    };
  });
}

type CardKey = "breakdown" | "correlation" | "predictability" | "";

Page({
  data: {
    dashboard: null as DashboardResponse | null,
    activeCard: "" as CardKey,
    isBreakdownExpanded: false,
    isCorrelationExpanded: false,
    isPredictabilityExpanded: false,
    breakdownPercent: 0,
    correlationPercent: 0,
    predictabilityPercent: 0,
    barHeights: FALLBACK_BARS,
    breakdownItems: [] as BreakdownItem[],
    moodA: "",
    moodB: "",
    symptomLabels: [] as string[],
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage()),
    predictabilityRationale: "",
    aiLoading: false,
    aiResult: null as AIInterpretationSnapshot | null,
    aiError: "",
    canRequestAI: false
  },

  onShow() {
    const language = getStoredDisplayLanguage();

    if (language !== this.data.language) {
      this.applyLanguage(language);
    }

    void this.loadData();
  },

  applyLanguage(language: DisplayLanguage) {
    const copy = buildCopy(language);
    const nextData: WechatMiniprogram.IAnyObject = {
      language,
      copy
    };

    if (this.data.dashboard) {
      const [moodA, moodB] = getTopMoods(this.data.dashboard.records);
      nextData.moodA = getMoodLabel(moodA, language);
      nextData.moodB = getMoodLabel(moodB, language);
      nextData.breakdownItems = buildBreakdownItems(this.data.dashboard.records, language);
      nextData.symptomLabels = getTopSymptoms(this.data.dashboard.records).map((item) =>
        getSymptomLabel(item, language)
      );
    }

    this.setData(nextData);
  },

  toggleLanguage() {
    const nextLanguage = getNextDisplayLanguage(this.data.language as DisplayLanguage);
    setStoredDisplayLanguage(nextLanguage);
    this.applyLanguage(nextLanguage);
  },

  toggleCard(event: WechatMiniprogram.BaseEvent) {
    const card = event.currentTarget.dataset.card as CardKey;
    const activeCard = this.data.activeCard === card ? "" : card;

    this.setData({
      activeCard,
      isBreakdownExpanded: activeCard === "breakdown",
      isCorrelationExpanded: activeCard === "correlation",
      isPredictabilityExpanded: activeCard === "predictability"
    });
  },

  async loadData() {
    try {
      const dashboard = await api.getDashboard();
      const flowValues = dashboard.records.map((item) => flowWeight(item.flowLevel));
      const averageFlow = flowValues.length
        ? flowValues.reduce((total, current) => total + current, 0) / flowValues.length
        : 0;
      const breakdownPercent = clampPercent(averageFlow * 100);
      const predictabilityPercent = clampPercent(dashboard.prediction.confidence * 100);
      const correlationPercent = clampPercent(predictabilityPercent * 0.76 + 22);
      const [moodA, moodB] = getTopMoods(dashboard.records);
      const language = this.data.language as DisplayLanguage;

      this.setData({
        dashboard,
        breakdownPercent,
        correlationPercent,
        predictabilityPercent,
        barHeights: getPredictabilityBars(dashboard.records),
        moodA: getMoodLabel(moodA, language),
        moodB: getMoodLabel(moodB, language),
        breakdownItems: buildBreakdownItems(dashboard.records, language),
        symptomLabels: getTopSymptoms(dashboard.records).map((item) => getSymptomLabel(item, language)),
        predictabilityRationale: dashboard.prediction.rationale,
        canRequestAI: dashboard.summary.recordCount >= MIN_CYCLES_FOR_AI
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.loadFailed,
        icon: "none"
      });
    }
  },

  async onTapAIInterpret() {
    if (this.data.aiLoading || !this.data.canRequestAI) {
      return;
    }

    const copy = this.data.copy;
    try {
      const granted = await this.ensureAIConsent();
      if (!granted) {
        return;
      }
    } catch (error) {
      this.setData({ aiError: copy.aiErrorGeneric });
      return;
    }

    const apiLanguage: AILanguage = this.data.language === "en" ? "en" : "zh";
    this.setData({ aiLoading: true, aiError: "", aiResult: null });

    try {
      const result = await api.requestAIInterpretation({ language: apiLanguage });
      this.setData({ aiResult: result, aiLoading: false });
    } catch (error) {
      const apiError = error as ApiRequestError;
      let message = copy.aiErrorGeneric;
      if (isApiNetworkError(error)) {
        message = copy.networkUnavailable;
      } else if (apiError?.kind === "http" && apiError.statusCode === 503) {
        message = copy.aiErrorUnconfigured;
      } else if (apiError?.kind === "http" && apiError.statusCode === 502) {
        message = copy.aiErrorUpstream;
      }
      this.setData({ aiLoading: false, aiError: message });
    }
  },

  async ensureAIConsent(): Promise<boolean> {
    const copy = this.data.copy;
    try {
      const consents = await api.listConsents();
      const hasGranted = consents.some(
        (record) => record.type === "ai_monthly_interpretation" && record.status === "granted"
      );
      if (hasGranted) {
        return true;
      }
    } catch {
      // If list fails, still try to show the modal; grant may still succeed.
    }

    const modalResult = await new Promise<WechatMiniprogram.ShowModalSuccessCallbackResult>(
      (resolve, reject) => {
        wx.showModal({
          title: copy.aiConsentTitle,
          content: copy.aiConsentContent,
          confirmText: copy.aiConsentConfirm,
          cancelText: copy.aiConsentCancel,
          success: resolve,
          fail: reject
        });
      }
    );

    if (!modalResult.confirm) {
      return false;
    }

    await api.grantConsent({
      type: "ai_monthly_interpretation",
      version: AI_CONSENT_VERSION,
      purpose: AI_CONSENT_PURPOSE
    });
    return true;
  }
});

import type {
  ConsentStatus,
  ConsentType,
  FlowLevel,
  MoodTag,
  PainLevel,
  PredictionStatus,
  PrivacyActionStatus,
  PrivacyActionType,
  ReminderType,
  SymptomTag
} from "@women-period/shared";

type LocalizedCopy = {
  zh: string;
  en: string;
};

export type DisplayLanguage = "zh-CN" | "en";

const STORAGE_KEY = "display-language";

const FLOW_COPY: Record<FlowLevel, LocalizedCopy> = {
  light: { zh: "少量", en: "Light" },
  medium: { zh: "中等", en: "Medium" },
  heavy: { zh: "较多", en: "Heavy" }
};

const MOOD_COPY: Record<MoodTag, LocalizedCopy> = {
  steady: { zh: "平稳", en: "Steady" },
  low: { zh: "低落", en: "Low" },
  irritable: { zh: "烦躁", en: "Irritable" },
  tired: { zh: "困倦", en: "Tired" },
  energetic: { zh: "有精神", en: "Energetic" }
};

const SYMPTOM_COPY: Record<SymptomTag, LocalizedCopy> = {
  cramps: { zh: "腹部痉挛", en: "Cramps" },
  bloating: { zh: "腹胀", en: "Bloating" },
  headache: { zh: "头痛", en: "Headache" },
  fatigue: { zh: "乏力", en: "Fatigue" },
  back_pain: { zh: "腰背痛", en: "Back pain" },
  acne: { zh: "爆痘", en: "Acne" },
  none: { zh: "无明显症状", en: "No obvious symptoms" }
};

const REMINDER_COPY: Record<ReminderType, LocalizedCopy> = {
  period_due: { zh: "经期将至提醒", en: "Upcoming period" },
  delayed: { zh: "经期延迟提醒", en: "Period delayed" },
  logging_gap: { zh: "记录中断提醒", en: "Logging gap" }
};

const CONSENT_TYPE_COPY: Record<ConsentType, LocalizedCopy> = {
  privacy_policy: { zh: "隐私政策确认", en: "Privacy policy consent" },
  sensitive_health_data: { zh: "敏感健康数据授权", en: "Sensitive health-data consent" },
  notifications: { zh: "通知提醒授权", en: "Notification consent" }
};

const CONSENT_STATUS_COPY: Record<ConsentStatus, LocalizedCopy> = {
  granted: { zh: "已授权", en: "Granted" },
  withdrawn: { zh: "已撤回", en: "Withdrawn" }
};

const PRIVACY_ACTION_TYPE_COPY: Record<PrivacyActionType, LocalizedCopy> = {
  export_data: { zh: "导出数据", en: "Export data" },
  delete_account: { zh: "删除账号", en: "Delete account" },
  logout: { zh: "登出", en: "Logout" },
  withdraw_sensitive_consent: { zh: "撤回敏感授权", en: "Withdraw sensitive consent" }
};

const PRIVACY_ACTION_STATUS_COPY: Record<PrivacyActionStatus, LocalizedCopy> = {
  requested: { zh: "已发起", en: "Requested" },
  completed: { zh: "已完成", en: "Completed" }
};

const PAIN_COPY: Record<
  PainLevel,
  {
    title: LocalizedCopy;
    description: LocalizedCopy;
  }
> = {
  0: {
    title: { zh: "无疼痛", en: "No pain" },
    description: {
      zh: "几乎没有不适，不影响学习、工作或休息。",
      en: "Almost no discomfort and no impact on work, study, or rest."
    }
  },
  1: {
    title: { zh: "轻微疼痛", en: "Mild" },
    description: {
      zh: "有轻度坠胀或隐痛，通常不需要止痛药。",
      en: "Mild cramps or dull pain, usually manageable without medication."
    }
  },
  2: {
    title: { zh: "中度疼痛", en: "Moderate" },
    description: {
      zh: "疼痛明显，可能需要热敷或止痛药，日常活动略受影响。",
      en: "Noticeable pain that may need heat or pain relief and can affect daily activity."
    }
  },
  3: {
    title: { zh: "重度疼痛", en: "Severe" },
    description: {
      zh: "疼痛强烈，影响工作或休息；若反复出现建议及时就医。",
      en: "Strong pain that disrupts work or rest. Seek medical advice if this happens often."
    }
  }
};

const PREDICTION_STATUS_COPY: Record<PredictionStatus, LocalizedCopy> = {
  insufficient_data: { zh: "样本不足", en: "Insufficient data" },
  estimated: { zh: "波动中", en: "Estimated" },
  stable: { zh: "较稳定", en: "Stable" }
};

function translate(copy: LocalizedCopy, language: DisplayLanguage): string {
  return language === "en" ? copy.en : copy.zh;
}

function formatPainPrefix(level: PainLevel, language: DisplayLanguage): string {
  return language === "en" ? `Level ${level}` : `${level}级`;
}

export function getStoredDisplayLanguage(): DisplayLanguage {
  try {
    return wx.getStorageSync(STORAGE_KEY) === "en" ? "en" : "zh-CN";
  } catch {
    return "zh-CN";
  }
}

export function setStoredDisplayLanguage(language: DisplayLanguage): void {
  try {
    wx.setStorageSync(STORAGE_KEY, language);
  } catch {
    // Ignore storage failures in simulator.
  }
}

export function getNextDisplayLanguage(language: DisplayLanguage): DisplayLanguage {
  return language === "en" ? "zh-CN" : "en";
}

export function getDisplayLanguageToggleLabel(language: DisplayLanguage): string {
  return language === "en" ? "中文" : "EN";
}

export function getFlowLabel(value: FlowLevel, language: DisplayLanguage): string {
  return translate(FLOW_COPY[value], language);
}

export function getMoodLabel(value: MoodTag, language: DisplayLanguage): string {
  return translate(MOOD_COPY[value], language);
}

export function getSymptomLabel(value: SymptomTag, language: DisplayLanguage): string {
  return translate(SYMPTOM_COPY[value], language);
}

export function getReminderTypeLabel(value: ReminderType, language: DisplayLanguage): string {
  return translate(REMINDER_COPY[value], language);
}

export function getConsentTypeLabel(value: ConsentType, language: DisplayLanguage): string {
  return translate(CONSENT_TYPE_COPY[value], language);
}

export function getConsentStatusLabel(value: ConsentStatus, language: DisplayLanguage): string {
  return translate(CONSENT_STATUS_COPY[value], language);
}

export function getPrivacyActionTypeLabel(value: PrivacyActionType, language: DisplayLanguage): string {
  return translate(PRIVACY_ACTION_TYPE_COPY[value], language);
}

export function getPrivacyActionStatusLabel(value: PrivacyActionStatus, language: DisplayLanguage): string {
  return translate(PRIVACY_ACTION_STATUS_COPY[value], language);
}

export function getPainLevelLabel(level: PainLevel, language: DisplayLanguage): string {
  return `${formatPainPrefix(level, language)} ${translate(PAIN_COPY[level].title, language)}`;
}

export function getPainLevelDescription(level: PainLevel, language: DisplayLanguage): string {
  return translate(PAIN_COPY[level].description, language);
}

export function buildPainGuide(language: DisplayLanguage): Array<{
  level: PainLevel;
  levelLabel: string;
  description: string;
}> {
  return [0, 1, 2, 3].map((level) => ({
    level: level as PainLevel,
    levelLabel: getPainLevelLabel(level as PainLevel, language),
    description: getPainLevelDescription(level as PainLevel, language)
  }));
}

export function getPredictionStatusLabel(status: PredictionStatus, language: DisplayLanguage): string {
  return translate(PREDICTION_STATUS_COPY[status], language);
}

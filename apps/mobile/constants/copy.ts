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
} from "@/constants/shared";

export type AppLanguage = "zh" | "en";

type Localized = {
  zh: string;
  en: string;
};

const FLOW_LABELS: Record<FlowLevel, Localized> = {
  light: { zh: "少量", en: "Light" },
  medium: { zh: "中等", en: "Medium" },
  heavy: { zh: "较多", en: "Heavy" }
};

const MOOD_LABELS: Record<MoodTag, Localized> = {
  steady: { zh: "平稳", en: "Steady" },
  low: { zh: "低落", en: "Low" },
  irritable: { zh: "烦躁", en: "Irritable" },
  tired: { zh: "困倦", en: "Tired" },
  energetic: { zh: "有精神", en: "Energetic" }
};

const SYMPTOM_LABELS: Record<SymptomTag, Localized> = {
  cramps: { zh: "腹部痉挛", en: "Cramps" },
  bloating: { zh: "腹胀", en: "Bloating" },
  headache: { zh: "头痛", en: "Headache" },
  fatigue: { zh: "乏力", en: "Fatigue" },
  back_pain: { zh: "腰背痛", en: "Back pain" },
  acne: { zh: "痘痘", en: "Acne" },
  none: { zh: "无明显症状", en: "No obvious symptoms" }
};

const REMINDER_LABELS: Record<ReminderType, Localized> = {
  period_due: { zh: "经期将至提醒", en: "Upcoming period" },
  delayed: { zh: "经期延迟提醒", en: "Period delayed" },
  logging_gap: { zh: "记录中断提醒", en: "Logging gap" }
};

const CONSENT_TYPE_LABELS: Record<ConsentType, Localized> = {
  privacy_policy: { zh: "隐私政策", en: "Privacy policy" },
  sensitive_health_data: { zh: "敏感健康数据", en: "Sensitive health data" },
  notifications: { zh: "通知权限", en: "Notifications" }
};

const CONSENT_STATUS_LABELS: Record<ConsentStatus, Localized> = {
  granted: { zh: "已授权", en: "Granted" },
  withdrawn: { zh: "已撤回", en: "Withdrawn" }
};

const PRIVACY_ACTION_TYPE_LABELS: Record<PrivacyActionType, Localized> = {
  export_data: { zh: "导出数据", en: "Export data" },
  delete_account: { zh: "删除账号", en: "Delete account" },
  logout: { zh: "登出", en: "Logout" },
  withdraw_sensitive_consent: { zh: "撤回敏感授权", en: "Withdraw sensitive consent" }
};

const PRIVACY_ACTION_STATUS_LABELS: Record<PrivacyActionStatus, Localized> = {
  requested: { zh: "已发起", en: "Requested" },
  completed: { zh: "已完成", en: "Completed" }
};

const PREDICTION_STATUS_LABELS: Record<PredictionStatus, Localized> = {
  insufficient_data: { zh: "样本不足", en: "Insufficient data" },
  estimated: { zh: "存在波动", en: "Estimated" },
  stable: { zh: "较稳定", en: "Stable" }
};

const PAIN_COPY: Record<
  PainLevel,
  {
    title: Localized;
    description: Localized;
  }
> = {
  0: {
    title: { zh: "无痛", en: "No pain" },
    description: {
      zh: "几乎没有不适，不影响日常活动。",
      en: "Almost no discomfort and no impact on daily activity."
    }
  },
  1: {
    title: { zh: "轻微疼痛", en: "Mild pain" },
    description: {
      zh: "轻度坠胀或隐痛，一般不需要止痛药。",
      en: "Mild cramps or dull pain, usually manageable without medication."
    }
  },
  2: {
    title: { zh: "中度疼痛", en: "Moderate pain" },
    description: {
      zh: "疼痛明显，可能需要热敷或止痛药。",
      en: "Noticeable pain that may need heat therapy or pain relief."
    }
  },
  3: {
    title: { zh: "重度疼痛", en: "Severe pain" },
    description: {
      zh: "疼痛较强，影响工作或休息，建议关注并必要时就医。",
      en: "Strong pain disrupting work or rest. Seek medical advice if frequent."
    }
  }
};

export const appCopy = {
  zh: {
    brand: "Lune",
    languageToggle: "EN",
    shared: {
      loading: "正在同步数据...",
      saving: "保存中...",
      retry: "重试",
      unknown: "未填写",
      save: "保存",
      cancel: "取消",
      refresh: "刷新",
      back: "返回",
      delete: "删除",
      syncFailed: "同步失败",
      noData: "暂无记录，先新增一条吧。"
    },
    tabs: {
      calendar: "日历",
      insights: "洞察",
      reminders: "提醒",
      settings: "隐私与设置"
    },
    calendar: {
      title: "周期日历",
      subtitle: "把关键信息放在第一屏，记录一步完成。",
      windowTitle: "当期窗口",
      nextPeriod: "下次经期预计开始于",
      statusPrefix: "当前周期状态",
      averageCycle: "平均周期",
      averagePeriod: "平均经期",
      cycleUnit: "天",
      primaryAction: "记录本次月经",
      secondaryAction: "提醒设置",
      focusTitle: "专注记录与隐私",
      focusLines: [
        "默认收集最小化：仅保留记录所需字段。",
        "隐私动作可追踪：支持导出与查看链路。",
        "提醒风格轻量：不打扰，不夸张。"
      ],
      breakdownTitle: "经期分布",
      breakdownSubtitle: "最近周期流量趋势",
      symptomTitle: "症状关联",
      symptomSubtitle: "常见症状与情绪关联",
      predictabilityTitle: "周期可预测性",
      predictabilitySubtitle: "基于历史记录的稳定度评分",
      scoreLabel: "评分",
      recentRecords: "最近记录",
      viewEdit: "查看 / 编辑",
      noteLabel: "备注"
    },
    insights: {
      title: "周期洞察",
      subtitle: "点击卡片展开图表和图文说明。",
      expandHint: "点击展开详情",
      collapseHint: "收起详情",
      flowTitle: "经期分布",
      flowSubtitle: "流量分布与趋势",
      symptomTitle: "症状关联",
      symptomSubtitle: "症状与情绪的关系",
      predictabilityTitle: "周期可预测性",
      predictabilitySubtitle: "历史稳定性评分",
      scoreSuffix: "评分",
      noSymptom: "暂无明显关联"
    },
    reminders: {
      title: "提醒设置",
      subtitle: "轻提醒，不打扰。",
      quietHours: "免打扰时段",
      quietStart: "开始",
      quietEnd: "结束",
      reminderItems: "提醒项目",
      leadDays: "提前",
      days: "天",
      backToCalendar: "返回日历",
      save: "保存设置",
      saveSuccess: "提醒设置已保存",
      saveFailed: "提醒设置保存失败"
    },
    settings: {
      title: "隐私与设置",
      subtitle: "授权、导出、删除集中管理。",
      consents: "授权状态",
      actions: "隐私动作",
      exportTitle: "导出数据",
      exportBody: "导出当前用户周期、提醒和授权快照。",
      exportAction: "导出并查看时间",
      deleteTitle: "删除账号",
      deleteBody: "将清理当前用户全部数据。",
      deleteAction: "删除当前账号",
      runtimeTitle: "运行环境",
      runtimeBody: "当前移动端复用微信小程序同一后端。"
    },
    record: {
      createTitle: "记录本次",
      editTitle: "编辑记录",
      dateHint: "日期与时间精确到分钟",
      startAt: "开始时间",
      endAt: "结束时间",
      flow: "流量",
      pain: "疼痛程度",
      painGuide: "疼痛分级说明",
      symptoms: "感受标签",
      mood: "情绪状态",
      note: "备注",
      notePlaceholder: "只记录你真正想留下的内容",
      createSubmit: "保存记录",
      editSubmit: "保存修改",
      deleteAction: "删除这条记录",
      validationError: "开始时间和结束时间不能为空。",
      saveFailed: "记录保存失败",
      deleteFailed: "删除记录失败",
      deleteConfirmTitle: "确认删除？",
      deleteConfirmBody: "删除后会立即刷新首页和洞察页。",
      deleteConfirmAction: "确认删除"
    }
  },
  en: {
    brand: "Lune",
    languageToggle: "中",
    shared: {
      loading: "Syncing data...",
      saving: "Saving...",
      retry: "Retry",
      unknown: "Not set",
      save: "Save",
      cancel: "Cancel",
      refresh: "Refresh",
      back: "Back",
      delete: "Delete",
      syncFailed: "Sync failed",
      noData: "No records yet. Add your first one."
    },
    tabs: {
      calendar: "Calendar",
      insights: "Insights",
      reminders: "Reminders",
      settings: "Privacy"
    },
    calendar: {
      title: "Period Calendar",
      subtitle: "Keep the core actions in one focused screen.",
      windowTitle: "Current window",
      nextPeriod: "Next period estimated to start on",
      statusPrefix: "Cycle status",
      averageCycle: "Cycle average",
      averagePeriod: "Duration average",
      cycleUnit: "days",
      primaryAction: "Log Current Period",
      secondaryAction: "Reminder Settings",
      focusTitle: "Focused Logging & Privacy",
      focusLines: [
        "Default collection is minimal and strictly record-oriented.",
        "Privacy actions stay traceable with export and logs.",
        "Reminder style is calm and non-intrusive."
      ],
      breakdownTitle: "Period Breakdown",
      breakdownSubtitle: "Flow trend in recent cycles",
      symptomTitle: "Symptom Correlation",
      symptomSubtitle: "Common symptom-to-mood relation",
      predictabilityTitle: "Cycle Predictability",
      predictabilitySubtitle: "Stability score from historical records",
      scoreLabel: "Score",
      recentRecords: "Recent Records",
      viewEdit: "View / Edit",
      noteLabel: "Note"
    },
    insights: {
      title: "Period Insights",
      subtitle: "Tap cards to expand charts and notes.",
      expandHint: "Tap to expand",
      collapseHint: "Collapse",
      flowTitle: "Period Breakdown",
      flowSubtitle: "Flow distribution and trend",
      symptomTitle: "Symptom Correlation",
      symptomSubtitle: "Symptom and mood relationships",
      predictabilityTitle: "Cycle Predictability",
      predictabilitySubtitle: "Historical stability score",
      scoreSuffix: "score",
      noSymptom: "No strong relationship yet"
    },
    reminders: {
      title: "Reminder Settings",
      subtitle: "Gentle reminders without disruption.",
      quietHours: "Do Not Disturb",
      quietStart: "Start",
      quietEnd: "End",
      reminderItems: "Reminder Items",
      leadDays: "Lead",
      days: "days",
      backToCalendar: "Back to Calendar",
      save: "Save Settings",
      saveSuccess: "Reminder settings saved",
      saveFailed: "Failed to save reminder settings"
    },
    settings: {
      title: "Privacy & Settings",
      subtitle: "Manage consent, export, and deletion here.",
      consents: "Consent Status",
      actions: "Privacy Actions",
      exportTitle: "Export Data",
      exportBody: "Export cycle, reminder, and consent snapshots.",
      exportAction: "Export and check timestamp",
      deleteTitle: "Delete Account",
      deleteBody: "This clears all data for the current user.",
      deleteAction: "Delete Current Account",
      runtimeTitle: "Runtime",
      runtimeBody: "The mobile app reuses the same backend as miniapp."
    },
    record: {
      createTitle: "Create Record",
      editTitle: "Edit Record",
      dateHint: "Date and time are minute-level",
      startAt: "Start time",
      endAt: "End time",
      flow: "Flow",
      pain: "Pain level",
      painGuide: "Pain Level Guide",
      symptoms: "Symptoms",
      mood: "Mood",
      note: "Note",
      notePlaceholder: "Only keep what you truly want to remember",
      createSubmit: "Save Record",
      editSubmit: "Save Changes",
      deleteAction: "Delete this record",
      validationError: "Start time and end time are required.",
      saveFailed: "Failed to save record",
      deleteFailed: "Failed to delete record",
      deleteConfirmTitle: "Delete this record?",
      deleteConfirmBody: "Calendar and insights will refresh immediately.",
      deleteConfirmAction: "Delete"
    }
  }
} as const;

function t(value: Localized, language: AppLanguage): string {
  return value[language];
}

export function getFlowLabel(value: FlowLevel, language: AppLanguage): string {
  return t(FLOW_LABELS[value], language);
}

export function getMoodLabel(value: MoodTag, language: AppLanguage): string {
  return t(MOOD_LABELS[value], language);
}

export function getSymptomLabel(value: SymptomTag, language: AppLanguage): string {
  return t(SYMPTOM_LABELS[value], language);
}

export function getReminderLabel(value: ReminderType, language: AppLanguage): string {
  return t(REMINDER_LABELS[value], language);
}

export function getConsentTypeLabel(value: ConsentType, language: AppLanguage): string {
  return t(CONSENT_TYPE_LABELS[value], language);
}

export function getConsentStatusLabel(value: ConsentStatus, language: AppLanguage): string {
  return t(CONSENT_STATUS_LABELS[value], language);
}

export function getPrivacyActionTypeLabel(value: PrivacyActionType, language: AppLanguage): string {
  return t(PRIVACY_ACTION_TYPE_LABELS[value], language);
}

export function getPrivacyActionStatusLabel(value: PrivacyActionStatus, language: AppLanguage): string {
  return t(PRIVACY_ACTION_STATUS_LABELS[value], language);
}

export function getPredictionStatusLabel(value: PredictionStatus, language: AppLanguage): string {
  return t(PREDICTION_STATUS_LABELS[value], language);
}

export function getPainLabel(level: PainLevel, language: AppLanguage): string {
  const levelPrefix = language === "zh" ? `${level}级` : `Level ${level}`;
  return `${levelPrefix} ${t(PAIN_COPY[level].title, language)}`;
}

export function getPainDescription(level: PainLevel, language: AppLanguage): string {
  return t(PAIN_COPY[level].description, language);
}

export function buildPainGuide(language: AppLanguage): Array<{
  level: PainLevel;
  levelLabel: string;
  description: string;
}> {
  return ([0, 1, 2, 3] as PainLevel[]).map((level) => ({
    level,
    levelLabel: getPainLabel(level, language),
    description: getPainDescription(level, language)
  }));
}

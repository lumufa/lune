export type FlowLevel = "light" | "medium" | "heavy";
export type PainLevel = 0 | 1 | 2 | 3;
export type MoodTag = "steady" | "low" | "irritable" | "tired" | "energetic";
export type SymptomTag =
  | "cramps"
  | "bloating"
  | "headache"
  | "fatigue"
  | "back_pain"
  | "acne"
  | "none";
export type ReminderType = "period_due" | "delayed" | "logging_gap";
export type ConsentType = "privacy_policy" | "sensitive_health_data" | "notifications";
export type ConsentStatus = "granted" | "withdrawn";
export type PredictionStatus = "insufficient_data" | "estimated" | "stable";
export type PrivacyActionType =
  | "export_data"
  | "delete_account"
  | "logout"
  | "withdraw_sensitive_consent";
export type PrivacyActionStatus = "requested" | "completed";
export type MetricEventName =
  | "onboarding_complete"
  | "first_record"
  | "reminder_opt_in"
  | "weekly_return"
  | "export_data"
  | "delete_account";

export interface CycleRecordInput {
  startDate: string;
  endDate: string;
  flowLevel: FlowLevel;
  painLevel: PainLevel;
  symptoms: SymptomTag[];
  mood: MoodTag;
  note?: string;
}

export interface CycleRecord extends CycleRecordInput {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PredictionSnapshot {
  userId: string;
  predictedStartDate: string;
  windowStartDate: string;
  windowEndDate: string;
  predictedCycleLength: number;
  predictedPeriodLength: number;
  cycleVariability: number;
  confidence: number;
  status: PredictionStatus;
  ruleVersion: string;
  generatedAt: string;
  rationale: string;
}

export interface QuietHours {
  start: string;
  end: string;
}

export interface ReminderPreferenceItem {
  type: ReminderType;
  enabled: boolean;
  leadDays: number;
  time: string;
}

export interface ReminderPreference {
  userId: string;
  timezone: string;
  quietHours: QuietHours;
  items: ReminderPreferenceItem[];
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  type: ConsentType;
  version: string;
  purpose: string;
  status: ConsentStatus;
  grantedAt: string;
  withdrawnAt?: string;
}

export interface UserPrivacyAction {
  id: string;
  userId: string;
  type: PrivacyActionType;
  status: PrivacyActionStatus;
  requestedAt: string;
  completedAt?: string;
  detail?: string;
}

export interface MetricEvent {
  id: string;
  userId: string;
  name: MetricEventName;
  occurredAt: string;
  context?: Record<string, string | number | boolean>;
}

export interface CycleSummary {
  recordCount: number;
  averageCycleLength: number;
  averagePeriodLength: number;
  lastRecordedStartDate?: string;
}

export interface CycleDashboard {
  records: CycleRecord[];
  prediction: PredictionSnapshot;
  summary: CycleSummary;
}

export const DEFAULT_TIMEZONE = "Asia/Shanghai";
export const DEFAULT_RULE_VERSION = "v1.0.0";
export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const MAX_NOTE_LENGTH = 200;
export const DEFAULT_QUIET_HOURS: QuietHours = {
  start: "22:00",
  end: "08:00"
};

export const DEFAULT_REMINDERS: ReminderPreferenceItem[] = [
  { type: "period_due", enabled: true, leadDays: 2, time: "09:00" },
  { type: "delayed", enabled: true, leadDays: 3, time: "09:00" },
  { type: "logging_gap", enabled: false, leadDays: 7, time: "19:30" }
];

export const METRIC_EVENT_NAMES: MetricEventName[] = [
  "onboarding_complete",
  "first_record",
  "reminder_opt_in",
  "weekly_return",
  "export_data",
  "delete_account"
];

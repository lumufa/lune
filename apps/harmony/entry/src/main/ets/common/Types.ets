export interface CycleRecordInput {
  startDate: string;
  endDate: string;
  flowLevel: string;
  painLevel: number;
  symptoms: Array<string>;
  mood: string;
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
  status: string;
  ruleVersion: string;
  generatedAt: string;
  rationale: string;
}

export interface CycleSummary {
  recordCount: number;
  averageCycleLength: number;
  averagePeriodLength: number;
  lastRecordedStartDate?: string;
}

export interface DashboardResponse {
  records: Array<CycleRecord>;
  prediction: PredictionSnapshot;
  summary: CycleSummary;
}

export interface QuietHours {
  start: string;
  end: string;
}

export interface ReminderPreferenceItem {
  type: string;
  enabled: boolean;
  leadDays: number;
  time: string;
}

export interface ReminderPreference {
  userId: string;
  timezone: string;
  quietHours: QuietHours;
  items: Array<ReminderPreferenceItem>;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  type: string;
  version: string;
  purpose: string;
  status: string;
  grantedAt: string;
  withdrawnAt?: string;
}

export interface PrivacyAction {
  id: string;
  userId: string;
  type: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
  detail?: string;
}

export interface ExportBundle {
  exportedAt: string;
  userId: string;
  summary: CycleSummary;
  prediction: PredictionSnapshot;
  cycles: Array<CycleRecord>;
  reminders?: ReminderPreference;
  consents: Array<ConsentRecord>;
  privacyActions: Array<PrivacyAction>;
}

export interface ApiRequestError {
  kind: string;
  statusCode?: number;
  endpoint?: string;
  message: string;
  raw?: string;
}

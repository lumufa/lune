import type {
  ConsentRecord,
  CycleDashboard,
  ReminderPreference,
  UserPrivacyAction
} from "@women-period/shared";

export type DashboardResponse = CycleDashboard;
export type ReminderPreferenceResponse = ReminderPreference;
export type ConsentRecordResponse = ConsentRecord;
export type PrivacyActionResponse = UserPrivacyAction;

export interface ExportBundle {
  exportedAt: string;
  userId: string;
  summary: CycleDashboard["summary"];
  prediction: CycleDashboard["prediction"];
  cycles: CycleDashboard["records"];
  reminders?: ReminderPreference;
  consents: ConsentRecord[];
  privacyActions: UserPrivacyAction[];
}


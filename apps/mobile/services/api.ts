import type {
  ConsentRecord,
  ConsentType,
  CycleRecordInput,
  MetricEventName,
  ReminderPreference
} from "@/constants/shared";
import { getApiBaseUrl, getRuntimeUserId } from "../constants/runtime";
import type {
  ConsentRecordResponse,
  DashboardResponse,
  ExportBundle,
  PrivacyActionResponse,
  ReminderPreferenceResponse
} from "../types/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiRequestErrorKind = "network" | "http" | "unknown";

export interface ApiRequestError {
  kind: ApiRequestErrorKind;
  statusCode?: number;
  endpoint?: string;
  message: string;
  raw?: unknown;
}

async function request<T>(endpoint: string, method: HttpMethod, data?: unknown): Promise<T> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-user-id": getRuntimeUserId()
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const raw = await response.text();
      throw {
        kind: "http",
        statusCode: response.status,
        endpoint,
        message: `HTTP ${response.status}`,
        raw
      } satisfies ApiRequestError;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error && typeof error === "object" && "kind" in error) {
      throw error;
    }

    throw {
      kind: "network",
      endpoint,
      message: error instanceof Error ? error.message : "Request failed",
      raw: error
    } satisfies ApiRequestError;
  }
}

export const api = {
  getDashboard(): Promise<DashboardResponse> {
    return request("/cycles", "GET");
  },
  createRecord(payload: CycleRecordInput): Promise<DashboardResponse> {
    return request("/cycles", "POST", payload);
  },
  updateRecord(id: string, payload: Partial<CycleRecordInput>): Promise<DashboardResponse> {
    return request(`/cycles/${id}`, "PATCH", payload);
  },
  deleteRecord(id: string): Promise<DashboardResponse> {
    return request(`/cycles/${id}`, "DELETE");
  },
  getReminderPreferences(): Promise<ReminderPreferenceResponse> {
    return request("/reminders/preferences", "GET");
  },
  updateReminderPreferences(payload: ReminderPreference): Promise<ReminderPreferenceResponse> {
    return request("/reminders/preferences", "PUT", payload);
  },
  listConsents(): Promise<ConsentRecordResponse[]> {
    return request("/consents", "GET");
  },
  grantConsent(payload: {
    type: ConsentType;
    version: string;
    purpose: string;
  }): Promise<ConsentRecord> {
    return request("/consents", "POST", payload);
  },
  withdrawConsent(id: string): Promise<ConsentRecordResponse> {
    return request(`/consents/${id}/withdraw`, "POST");
  },
  exportData(): Promise<ExportBundle> {
    return request("/privacy/export", "GET");
  },
  listPrivacyActions(): Promise<PrivacyActionResponse[]> {
    return request("/privacy/actions", "GET");
  },
  deleteAccount(): Promise<{ deleted: boolean; deletedAt: string }> {
    return request("/privacy/delete", "POST");
  },
  trackEvent(name: MetricEventName, context?: Record<string, string | number | boolean>): Promise<void> {
    return request("/telemetry/events", "POST", { name, context });
  }
};

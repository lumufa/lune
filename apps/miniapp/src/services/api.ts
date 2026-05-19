import type {
  AIInterpretationRequest,
  AIInterpretationSnapshot,
  ConsentRecord,
  ConsentType,
  CycleRecordInput,
  MetricEventName,
  ReminderPreference
} from "@women-period/shared";
import type {
  ConsentRecordResponse,
  DashboardResponse,
  ExportBundle,
  PrivacyActionResponse,
  ReminderPreferenceResponse
} from "../types";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type RequestPayload = WechatMiniprogram.IAnyObject | string | ArrayBuffer | undefined;

export type ApiRequestErrorKind = "network" | "http" | "unknown";

export interface ApiRequestError {
  kind: ApiRequestErrorKind;
  statusCode?: number;
  endpoint?: string;
  message: string;
  raw?: unknown;
}

function toApiError(error: ApiRequestError): ApiRequestError {
  return error;
}

function request<T>(url: string, method: HttpMethod, data?: unknown): Promise<T> {
  const app = getApp<IAppOption>();

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBaseUrl}${url}`,
      method: method as unknown as WechatMiniprogram.RequestOption["method"],
      data: data as RequestPayload,
      header: {
        "content-type": "application/json",
        "x-user-id": app.globalData.userId
      },
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data as T);
          return;
        }

        reject(
          toApiError({
            kind: "http",
            statusCode: response.statusCode,
            endpoint: url,
            message: `HTTP ${response.statusCode}`,
            raw: response.data
          })
        );
      },
      fail: (error) => {
        const errMsg = typeof error?.errMsg === "string" ? error.errMsg : "Request failed";
        // wx.request's fail callback only fires on request-level failures (not HTTP
        // errors), so any "request:fail ..." message is a network/transport issue.
        // The Node-style codes (ECONNREFUSED/ENOTFOUND) are kept for the dev loop
        // where the miniapp hits a local Node server via a proxy.
        const isNetworkFailure =
          errMsg.startsWith("request:fail") ||
          errMsg.includes("ECONNREFUSED") ||
          errMsg.includes("ENOTFOUND") ||
          errMsg.includes("connect") ||
          errMsg.includes("timeout");

        reject(
          toApiError({
            kind: isNetworkFailure ? "network" : "unknown",
            endpoint: url,
            message: errMsg,
            raw: error
          })
        );
      }
    });
  });
}

export function isApiNetworkError(error: unknown): error is ApiRequestError {
  return Boolean(error && typeof error === "object" && (error as ApiRequestError).kind === "network");
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
  requestAIInterpretation(payload: AIInterpretationRequest = {}): Promise<AIInterpretationSnapshot> {
    return request("/cycles/ai-interpretation", "POST", payload);
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

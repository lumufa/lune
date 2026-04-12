import http from '@ohos.net.http';
import {
  ApiRequestError,
  ConsentRecord,
  CycleRecordInput,
  DashboardResponse,
  ExportBundle,
  PrivacyAction,
  ReminderPreference
} from './Types';
import { RuntimeConfig } from './RuntimeConfig';

const REQUEST_TIMEOUT_MS: number = 8000;

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('/')) {
    return `${RuntimeConfig.API_BASE_URL}${endpoint}`;
  }

  return `${RuntimeConfig.API_BASE_URL}/${endpoint}`;
}

function createRequestOptions(method: http.RequestMethod, body?: string): http.HttpRequestOptions {
  const options: http.HttpRequestOptions = {
    method: method,
    connectTimeout: REQUEST_TIMEOUT_MS,
    readTimeout: REQUEST_TIMEOUT_MS,
    header: {
      'Content-Type': 'application/json',
      'x-user-id': RuntimeConfig.USER_ID
    }
  };

  if (body) {
    options.extraData = body;
  }

  return options;
}

async function request<T>(endpoint: string, method: http.RequestMethod, payload?: Object): Promise<T> {
  const client = http.createHttp();
  const body = payload ? JSON.stringify(payload) : '';

  try {
    const response = await client.request(buildUrl(endpoint), createRequestOptions(method, body));
    const statusCode = Number(response.responseCode);
    const raw = response.result ? response.result.toString() : '';

    if (statusCode >= 400) {
      throw {
        kind: 'http',
        statusCode: statusCode,
        endpoint: endpoint,
        message: `HTTP ${statusCode}`,
        raw: raw
      } as ApiRequestError;
    }

    if (statusCode === 204 || raw.length === 0) {
      return undefined as T;
    }

    return JSON.parse(raw) as T;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'kind' in error) {
      throw error;
    }

    throw {
      kind: 'network',
      endpoint: endpoint,
      message: error instanceof Error ? error.message : 'Request failed'
    } as ApiRequestError;
  } finally {
    client.destroy();
  }
}

export class ApiClient {
  getDashboard(): Promise<DashboardResponse> {
    return request<DashboardResponse>('/cycles', http.RequestMethod.GET);
  }

  createRecord(payload: CycleRecordInput): Promise<DashboardResponse> {
    return request<DashboardResponse>('/cycles', http.RequestMethod.POST, payload);
  }

  updateRecord(id: string, payload: Partial<CycleRecordInput>): Promise<DashboardResponse> {
    return request<DashboardResponse>(`/cycles/${id}`, http.RequestMethod.PUT, payload);
  }

  deleteRecord(id: string): Promise<DashboardResponse> {
    return request<DashboardResponse>(`/cycles/${id}`, http.RequestMethod.DELETE);
  }

  getReminderPreferences(): Promise<ReminderPreference> {
    return request<ReminderPreference>('/reminders/preferences', http.RequestMethod.GET);
  }

  updateReminderPreferences(payload: ReminderPreference): Promise<ReminderPreference> {
    return request<ReminderPreference>('/reminders/preferences', http.RequestMethod.PUT, payload);
  }

  listConsents(): Promise<Array<ConsentRecord>> {
    return request<Array<ConsentRecord>>('/consents', http.RequestMethod.GET);
  }

  grantConsent(payload: Object): Promise<ConsentRecord> {
    return request<ConsentRecord>('/consents', http.RequestMethod.POST, payload);
  }

  exportData(): Promise<ExportBundle> {
    return request<ExportBundle>('/privacy/export', http.RequestMethod.GET);
  }

  listPrivacyActions(): Promise<Array<PrivacyAction>> {
    return request<Array<PrivacyAction>>('/privacy/actions', http.RequestMethod.GET);
  }

  deleteAccount(): Promise<Object> {
    return request<Object>('/privacy/delete', http.RequestMethod.POST);
  }

  trackEvent(name: string, context?: Object): Promise<void> {
    return request<void>('/telemetry/events', http.RequestMethod.POST, {
      name: name,
      context: context ?? {}
    });
  }
}

export const api = new ApiClient();

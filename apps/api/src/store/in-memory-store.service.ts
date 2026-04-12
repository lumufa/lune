import { Injectable } from "@nestjs/common";
import {
  ConsentRecord,
  CycleRecord,
  MetricEvent,
  ReminderPreference,
  UserPrivacyAction
} from "@women-period/shared";

@Injectable()
export class InMemoryStoreService {
  private readonly cycles = new Map<string, CycleRecord[]>();
  private readonly reminders = new Map<string, ReminderPreference>();
  private readonly consents = new Map<string, ConsentRecord[]>();
  private readonly privacyActions = new Map<string, UserPrivacyAction[]>();
  private readonly telemetry = new Map<string, MetricEvent[]>();

  listCycles(userId: string): CycleRecord[] {
    return [...(this.cycles.get(userId) ?? [])];
  }

  saveCycles(userId: string, records: CycleRecord[]): void {
    this.cycles.set(userId, [...records]);
  }

  getReminder(userId: string): ReminderPreference | undefined {
    return this.reminders.get(userId);
  }

  saveReminder(userId: string, preference: ReminderPreference): void {
    this.reminders.set(userId, preference);
  }

  listConsents(userId: string): ConsentRecord[] {
    return [...(this.consents.get(userId) ?? [])];
  }

  saveConsents(userId: string, records: ConsentRecord[]): void {
    this.consents.set(userId, [...records]);
  }

  listPrivacyActions(userId: string): UserPrivacyAction[] {
    return [...(this.privacyActions.get(userId) ?? [])];
  }

  savePrivacyActions(userId: string, actions: UserPrivacyAction[]): void {
    this.privacyActions.set(userId, [...actions]);
  }

  listTelemetry(userId: string): MetricEvent[] {
    return [...(this.telemetry.get(userId) ?? [])];
  }

  saveTelemetry(userId: string, events: MetricEvent[]): void {
    this.telemetry.set(userId, [...events]);
  }

  deleteUser(userId: string): void {
    this.cycles.delete(userId);
    this.reminders.delete(userId);
    this.consents.delete(userId);
    this.telemetry.delete(userId);
  }
}


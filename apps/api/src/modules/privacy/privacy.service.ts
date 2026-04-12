import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { buildPredictionSnapshot, buildCycleSummary } from "@women-period/prediction";
import { UserPrivacyAction } from "@women-period/shared";
import { InMemoryStoreService } from "../../store/in-memory-store.service";

@Injectable()
export class PrivacyService {
  constructor(private readonly store: InMemoryStoreService) {}

  listActions(userId: string): UserPrivacyAction[] {
    return this.store
      .listPrivacyActions(userId)
      .sort((left, right) => left.requestedAt.localeCompare(right.requestedAt));
  }

  exportData(userId: string) {
    const cycles = this.store.listCycles(userId);
    const action = this.logAction(userId, "export_data", "requested", "User exported account data.");
    const completedAction = this.completeAction(userId, action.id);

    return {
      exportedAt: new Date().toISOString(),
      userId,
      summary: buildCycleSummary(cycles),
      prediction: buildPredictionSnapshot(userId, cycles),
      cycles,
      reminders: this.store.getReminder(userId),
      consents: this.store.listConsents(userId),
      privacyActions: this.store.listPrivacyActions(userId),
      telemetry: this.store.listTelemetry(userId),
      audit: completedAction
    };
  }

  deleteAccount(userId: string) {
    const action = this.logAction(userId, "delete_account", "requested", "User requested account deletion.");
    this.completeAction(userId, action.id);
    this.store.deleteUser(userId);
    return {
      deleted: true,
      userId,
      deletedAt: new Date().toISOString()
    };
  }

  private logAction(
    userId: string,
    type: UserPrivacyAction["type"],
    status: UserPrivacyAction["status"],
    detail: string
  ): UserPrivacyAction {
    const action: UserPrivacyAction = {
      id: randomUUID(),
      userId,
      type,
      status,
      detail,
      requestedAt: new Date().toISOString()
    };
    const actions = this.store.listPrivacyActions(userId);
    actions.push(action);
    this.store.savePrivacyActions(userId, actions);
    return action;
  }

  private completeAction(userId: string, id: string): UserPrivacyAction {
    const actions = this.store.listPrivacyActions(userId);
    const index = actions.findIndex((action) => action.id === id);
    const completed = {
      ...actions[index],
      status: "completed" as const,
      completedAt: new Date().toISOString()
    };
    actions[index] = completed;
    this.store.savePrivacyActions(userId, actions);
    return completed;
  }
}


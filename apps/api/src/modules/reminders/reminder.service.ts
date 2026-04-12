import { Injectable } from "@nestjs/common";
import { ReminderPreference } from "@women-period/shared";
import {
  buildDefaultReminderPreference,
  validateReminderPreference
} from "../../common/validators";
import { InMemoryStoreService } from "../../store/in-memory-store.service";

@Injectable()
export class ReminderService {
  constructor(private readonly store: InMemoryStoreService) {}

  getPreferences(userId: string): ReminderPreference {
    return this.store.getReminder(userId) ?? buildDefaultReminderPreference(userId);
  }

  updatePreferences(userId: string, input: ReminderPreference): ReminderPreference {
    const nextValue: ReminderPreference = {
      ...input,
      userId,
      updatedAt: new Date().toISOString()
    };
    validateReminderPreference(nextValue);
    this.store.saveReminder(userId, nextValue);
    return nextValue;
  }
}


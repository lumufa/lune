import { BadRequestException } from "@nestjs/common";
import {
  CycleRecordInput,
  DEFAULT_REMINDERS,
  DEFAULT_QUIET_HOURS,
  DEFAULT_TIMEZONE,
  MAX_NOTE_LENGTH,
  ReminderPreference
} from "@women-period/shared";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(?:\.\d{3})?)?(Z|[+-]\d{2}:\d{2})$/;
const HHMM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function assertIsoDate(value: string, fieldName: string): void {
  const matchesPattern = ISO_DATE_PATTERN.test(value) || ISO_DATE_TIME_PATTERN.test(value);
  const parsed = new Date(value);

  if (!matchesPattern || Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName} must be in YYYY-MM-DD or ISO datetime format`);
  }
}

export function assertTime(value: string, fieldName: string): void {
  if (!HHMM_PATTERN.test(value)) {
    throw new BadRequestException(`${fieldName} must be in HH:mm format`);
  }
}

export function validateCycleRecordInput(input: CycleRecordInput): void {
  assertIsoDate(input.startDate, "startDate");
  assertIsoDate(input.endDate, "endDate");

  if (new Date(input.endDate) < new Date(input.startDate)) {
    throw new BadRequestException("endDate must not be earlier than startDate");
  }

  if (input.note && input.note.length > MAX_NOTE_LENGTH) {
    throw new BadRequestException(`note must be at most ${MAX_NOTE_LENGTH} characters`);
  }
}

export function buildDefaultReminderPreference(userId: string): ReminderPreference {
  return {
    userId,
    timezone: DEFAULT_TIMEZONE,
    quietHours: DEFAULT_QUIET_HOURS,
    items: DEFAULT_REMINDERS,
    updatedAt: new Date().toISOString()
  };
}

export function validateReminderPreference(input: ReminderPreference): void {
  assertTime(input.quietHours.start, "quietHours.start");
  assertTime(input.quietHours.end, "quietHours.end");

  if (!input.timezone) {
    throw new BadRequestException("timezone is required");
  }

  input.items.forEach((item) => {
    assertTime(item.time, `${item.type}.time`);
    if (item.leadDays < 0 || item.leadDays > 14) {
      throw new BadRequestException(`${item.type}.leadDays must be between 0 and 14`);
    }
  });
}
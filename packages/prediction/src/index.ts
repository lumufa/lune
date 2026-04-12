import {
  CycleRecord,
  CycleSummary,
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_LENGTH,
  DEFAULT_RULE_VERSION,
  PredictionSnapshot
} from "@women-period/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

function extractDatePart(value: string): string {
  return value.slice(0, 10);
}

function toUtcDayTimestamp(value: string): number {
  return new Date(`${extractDatePart(value)}T00:00:00Z`).getTime();
}

function sortRecords(records: CycleRecord[]): CycleRecord[] {
  return [...records].sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime());
}

function dateDiffInDays(start: string, end: string): number {
  const startTime = toUtcDayTimestamp(start);
  const endTime = toUtcDayTimestamp(end);
  return Math.max(1, Math.round((endTime - startTime) / DAY_MS) + 1);
}

function addDays(value: string, days: number): string {
  const time = toUtcDayTimestamp(value);
  return new Date(time + days * DAY_MS).toISOString().slice(0, 10);
}

function average(values: number[], fallback: number): number {
  if (values.length === 0) {
    return fallback;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function variance(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDistance = values.map((value) => (value - mean) ** 2);
  return Math.sqrt(squaredDistance.reduce((sum, value) => sum + value, 0) / squaredDistance.length);
}

export function buildCycleSummary(records: CycleRecord[]): CycleSummary {
  const sorted = sortRecords(records);
  const lastRecord = sorted.length > 0 ? sorted[sorted.length - 1] : undefined;
  const cycleLengths = sorted.slice(1).map((record, index) => {
    return dateDiffInDays(sorted[index].startDate, record.startDate) - 1;
  });
  const periodLengths = sorted.map((record) => dateDiffInDays(record.startDate, record.endDate));

  return {
    recordCount: sorted.length,
    averageCycleLength: average(cycleLengths, DEFAULT_CYCLE_LENGTH),
    averagePeriodLength: average(periodLengths, DEFAULT_PERIOD_LENGTH),
    lastRecordedStartDate: lastRecord?.startDate
  };
}

export function buildPredictionSnapshot(userId: string, records: CycleRecord[]): PredictionSnapshot {
  const sorted = sortRecords(records);
  const summary = buildCycleSummary(sorted);
  const cycleLengths = sorted.slice(1).map((record, index) => {
    return dateDiffInDays(sorted[index].startDate, record.startDate) - 1;
  });
  const variability = Math.round(variance(cycleLengths));
  const latestStart = summary.lastRecordedStartDate ?? new Date().toISOString().slice(0, 10);
  const predictedCycleLength = summary.averageCycleLength || DEFAULT_CYCLE_LENGTH;
  const predictedPeriodLength = summary.averagePeriodLength || DEFAULT_PERIOD_LENGTH;
  const predictedStartDate = addDays(latestStart, predictedCycleLength);
  const windowRadius = Math.max(2, Math.min(5, variability || 2));
  const status = sorted.length < 2 ? "insufficient_data" : variability <= 2 ? "stable" : "estimated";
  const confidence = sorted.length < 2 ? 0.45 : variability <= 2 ? 0.84 : 0.62;
  const rationale =
    sorted.length < 2
      ? "Using the default cycle model until more records are available."
      : variability <= 2
        ? "Using the recent stable cycle pattern."
        : "Using recent records with a wider confidence window.";

  return {
    userId,
    predictedStartDate,
    windowStartDate: addDays(predictedStartDate, -windowRadius),
    windowEndDate: addDays(predictedStartDate, windowRadius),
    predictedCycleLength,
    predictedPeriodLength,
    cycleVariability: variability,
    confidence,
    status,
    ruleVersion: DEFAULT_RULE_VERSION,
    generatedAt: new Date().toISOString(),
    rationale
  };
}
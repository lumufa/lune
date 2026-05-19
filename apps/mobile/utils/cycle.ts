import type { CycleRecord } from "@/constants/shared";

const DAY_MS = 1000 * 60 * 60 * 24;

export function startOfDay(value: Date | string) {
  const source = typeof value === "string" ? new Date(value) : new Date(value);
  return new Date(source.getFullYear(), source.getMonth(), source.getDate());
}

export function formatDateKey(value: Date | string) {
  const source = startOfDay(value);
  const year = source.getFullYear();
  const month = `${source.getMonth() + 1}`.padStart(2, "0");
  const day = `${source.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(value: Date | string, days: number) {
  const source = startOfDay(value);
  const next = new Date(source);
  next.setDate(next.getDate() + days);
  return next;
}

export function diffDays(from: Date | string, to: Date | string) {
  const start = startOfDay(from).getTime();
  const end = startOfDay(to).getTime();
  return Math.round((end - start) / DAY_MS);
}

export function sortRecordsByStartDate(records: CycleRecord[]) {
  return [...records].sort((left, right) => {
    return startOfDay(right.startDate).getTime() - startOfDay(left.startDate).getTime();
  });
}

export function expandRecordDates(record: CycleRecord) {
  const start = startOfDay(record.startDate);
  const end = startOfDay(record.endDate);
  const total = Math.max(diffDays(start, end), 0);

  return Array.from({ length: total + 1 }).map((_, index) => formatDateKey(addDays(start, index)));
}

export function buildPeriodDayMap(records: CycleRecord[]) {
  const map = new Map<string, CycleRecord>();

  for (const record of records) {
    for (const dateKey of expandRecordDates(record)) {
      map.set(dateKey, record);
    }
  }

  return map;
}

export function findRecordForDate(records: CycleRecord[], dateKey: string) {
  const target = formatDateKey(dateKey);

  return records.find((record) => {
    const start = formatDateKey(record.startDate);
    const end = formatDateKey(record.endDate);
    return target >= start && target <= end;
  });
}

export function buildCycleInfo(records: CycleRecord[], cycleLength: number) {
  const sorted = sortRecordsByStartDate(records);
  const latest = sorted[0];

  if (!latest) {
    return {
      currentCycleDay: null,
      nextPeriodDate: null,
      daysUntilNext: null,
      isLate: false,
      lastPeriodStart: null as Date | null
    };
  }

  const lastPeriodStart = startOfDay(latest.startDate);
  const today = startOfDay(new Date());
  const nextPeriodDate = addDays(lastPeriodStart, cycleLength);
  const currentCycleDay = diffDays(lastPeriodStart, today) + 1;
  const delta = diffDays(today, nextPeriodDate);

  return {
    currentCycleDay,
    nextPeriodDate,
    daysUntilNext: Math.abs(delta),
    isLate: today.getTime() > nextPeriodDate.getTime(),
    lastPeriodStart
  };
}

export function buildCalendarDays(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const days: Array<Date | null> = [];

  for (let index = 0; index < firstDayIndex; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

export function isPredictedPeriodDay(date: Date, lastPeriodStart: Date | null, cycleLength: number, periodLength: number) {
  if (!lastPeriodStart || cycleLength <= 0) {
    return false;
  }

  const current = startOfDay(date);
  const currentTime = current.getTime();

  // Check up to 6 future cycles
  for (let cycle = 1; cycle <= 6; cycle += 1) {
    const predictedStart = addDays(lastPeriodStart, cycleLength * cycle);
    const predictedEnd = addDays(predictedStart, periodLength - 1);

    if (currentTime >= predictedStart.getTime() && currentTime <= predictedEnd.getTime()) {
      return true;
    }

    // Stop early if we've gone past the date
    if (predictedStart.getTime() > currentTime) {
      break;
    }
  }

  return false;
}

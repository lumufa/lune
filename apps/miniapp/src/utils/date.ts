function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toLocalParts(date: Date) {
  return {
    year: date.getFullYear(),
    month: pad2(date.getMonth() + 1),
    day: pad2(date.getDate()),
    hours: pad2(date.getHours()),
    minutes: pad2(date.getMinutes())
  };
}

function formatOffset(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = pad2(Math.floor(absoluteMinutes / 60));
  const minutes = pad2(absoluteMinutes % 60);
  return `${sign}${hours}:${minutes}`;
}

function parseFlexibleDate(value: string): Date {
  if (isDateOnly(value)) {
    return new Date(`${value}T00:00:00`);
  }

  return new Date(value);
}

export function formatWindow(start: string, end: string): string {
  return `${start.slice(5)} - ${end.slice(5)}`;
}

export function todayIso(): string {
  const now = new Date();
  const { year, month, day } = toLocalParts(now);
  return `${year}-${month}-${day}`;
}

export function currentTimeHHmm(): string {
  const now = new Date();
  const { hours, minutes } = toLocalParts(now);
  return `${hours}:${minutes}`;
}

export function combineDateAndTime(datePart: string, timePart: string): string {
  const localDate = new Date(`${datePart}T${timePart}:00`);
  return `${datePart}T${timePart}:00${formatOffset(localDate)}`;
}

export function splitRecordDateTime(value: string): { date: string; time: string } {
  if (isDateOnly(value)) {
    return {
      date: value,
      time: "00:00"
    };
  }

  const parsed = parseFlexibleDate(value);

  if (Number.isNaN(parsed.getTime())) {
    return {
      date: value.slice(0, 10),
      time: value.slice(11, 16) || "00:00"
    };
  }

  const { year, month, day, hours, minutes } = toLocalParts(parsed);
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

export function formatRecordDateTime(value: string): string {
  if (isDateOnly(value)) {
    return value;
  }

  const { date, time } = splitRecordDateTime(value);
  return `${date} ${time}`;
}

export function formatRecordDateTimeRange(start: string, end: string): string {
  return `${formatRecordDateTime(start)} - ${formatRecordDateTime(end)}`;
}
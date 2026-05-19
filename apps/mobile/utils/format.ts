import type { AppLanguage } from "../constants/copy";

const LOCALE_BY_LANGUAGE: Record<AppLanguage, string> = {
  zh: "zh-CN",
  en: "en-US"
};

function parseFlexibleDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }

  return new Date(value);
}

export function formatDate(value: string, language: AppLanguage): string {
  const parsed = parseFlexibleDate(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
    month: "2-digit",
    day: "2-digit"
  }).format(parsed);
}

export function toDateInputValue(value: string): string {
  const parsed = parseFlexibleDate(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(value: string): string {
  const parsed = parseFlexibleDate(value);
  if (Number.isNaN(parsed.getTime())) {
    return "09:00";
  }

  const hour = `${parsed.getHours()}`.padStart(2, "0");
  const minute = `${parsed.getMinutes()}`.padStart(2, "0");
  return `${hour}:${minute}`;
}

export function combineDateTimeToIso(datePart: string, timePart: string): string {
  const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : toDateInputValue(new Date().toISOString());
  const normalizedTime = /^\d{2}:\d{2}$/.test(timePart) ? timePart : "09:00";
  const localDate = new Date(`${normalizedDate}T${normalizedTime}:00`);

  if (Number.isNaN(localDate.getTime())) {
    return new Date().toISOString();
  }

  return localDate.toISOString();
}

export function formatDateRange(start: string, end: string, language: AppLanguage): string {
  const startDate = parseFlexibleDate(start);
  const endDate = parseFlexibleDate(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${start} - ${end}`;
  }

  const formatter = new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

export function formatWindow(start: string, end: string, language: AppLanguage): string {
  return `${formatDate(start, language)} - ${formatDate(end, language)}`;
}

export function formatDateTime(value: string, language: AppLanguage): string {
  const parsed = parseFlexibleDate(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

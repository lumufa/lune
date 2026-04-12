export function formatShortDate(value: string): string {
  if (!value || value.length < 10) {
    return '--';
  }

  const year = value.slice(0, 4);
  const month = value.slice(5, 7);
  const day = value.slice(8, 10);
  return `${year}.${month}.${day}`;
}

export function formatWindow(startDate: string, endDate: string): string {
  if (!startDate || !endDate) {
    return '--';
  }

  return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
}

export function formatRecordRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) {
    return '--';
  }

  return `${formatShortDate(startDate)} ~ ${formatShortDate(endDate)}`;
}

export function formatConfidence(value: number): string {
  const normalized = Math.max(0, Math.min(1, value || 0));
  return `${Math.round(normalized * 100)}%`;
}

export function formatFlowLabel(value: string): string {
  switch (value) {
    case 'light':
      return 'Light';
    case 'medium':
      return 'Medium';
    case 'heavy':
      return 'Heavy';
    default:
      return value || '--';
  }
}

export function formatMoodLabel(value: string): string {
  switch (value) {
    case 'steady':
      return 'Steady';
    case 'low':
      return 'Low';
    case 'irritable':
      return 'Irritable';
    case 'tired':
      return 'Tired';
    case 'energetic':
      return 'Energetic';
    default:
      return value || '--';
  }
}

export function formatPredictionStatus(value: string): string {
  switch (value) {
    case 'stable':
      return 'Stable';
    case 'estimated':
      return 'Estimated';
    case 'insufficient_data':
      return 'Insufficient data';
    default:
      return value || '--';
  }
}

import {
  formatConfidence,
  formatFlowLabel,
  formatPredictionStatus,
  formatShortDate,
  formatWindow
} from './Formatters';
import { CycleRecord, CycleSummary, DashboardResponse, PredictionSnapshot } from './Types';
import { COLORS } from './DesignTokens';

export interface FeatureMilestone {
  title: string;
  detail: string;
}

export interface FlowBreakdownItem {
  id: string;
  label: string;
  percentage: number;
  color: string;
}

export interface TrendBarItem {
  id: string;
  height: number;
  color: string;
}

export interface HeroState {
  eyebrow: string;
  title: string;
  detail: string;
  tag: string;
  tone: string;
}

export const FEATURE_MILESTONES: Array<FeatureMilestone> = [
  {
    title: 'Record editor',
    detail: 'Bring create, edit, and delete cycle records to the Harmony experience.'
  },
  {
    title: 'Reminder center',
    detail: 'Add quiet hours, lead times, and reminder sync to match mobile.'
  },
  {
    title: 'Privacy hub',
    detail: 'Expose export, account deletion, and consent history on-device.'
  }
];

export const EMPTY_SUMMARY: CycleSummary = {
  recordCount: 0,
  averageCycleLength: 0,
  averagePeriodLength: 0
};

export const EMPTY_PREDICTION: PredictionSnapshot = {
  userId: '',
  predictedStartDate: '',
  windowStartDate: '',
  windowEndDate: '',
  predictedCycleLength: 0,
  predictedPeriodLength: 0,
  cycleVariability: 0,
  confidence: 0,
  status: 'insufficient_data',
  ruleVersion: 'v1.0.0',
  generatedAt: '',
  rationale: ''
};

export const EMPTY_DASHBOARD: DashboardResponse = {
  records: [],
  prediction: EMPTY_PREDICTION,
  summary: EMPTY_SUMMARY
};

export function sortRecords(records: Array<CycleRecord>): Array<CycleRecord> {
  const sorted = records.slice(0);
  sorted.sort((left: CycleRecord, right: CycleRecord) => {
    return right.startDate.localeCompare(left.startDate);
  });
  return sorted;
}

export function getAverageLabel(value: number): string {
  return value > 0 ? String(value) : '--';
}

export function getSyncLabel(lastSyncedAt: string): string {
  if (!lastSyncedAt) {
    return 'Not synced yet';
  }

  return `Synced ${lastSyncedAt.slice(11, 16)}`;
}

export function getTodayLabel(): string {
  return formatShortDate(new Date().toISOString().slice(0, 10));
}

export function getWindowLabel(prediction: PredictionSnapshot): string {
  if (!prediction.windowStartDate || !prediction.windowEndDate) {
    return 'Need more records';
  }

  return formatWindow(prediction.windowStartDate, prediction.windowEndDate);
}

export function getHeroState(prediction: PredictionSnapshot): HeroState {
  const status = formatPredictionStatus(prediction.status);

  if (!prediction.predictedStartDate) {
    return {
      eyebrow: 'Cycle status',
      title: 'Log a few more cycles to unlock prediction',
      detail: 'The home view will surface a forecast window after enough records land.',
      tag: status,
      tone: 'neutral'
    };
  }

  if (isWithinWindow(prediction)) {
    return {
      eyebrow: 'Current period window',
      title: 'You are inside the predicted window',
      detail: `Forecast window ${formatWindow(prediction.windowStartDate, prediction.windowEndDate)}`,
      tag: status,
      tone: prediction.status === 'stable' ? 'period' : 'warning'
    };
  }

  const days = daysFromToday(prediction.predictedStartDate);

  if (days === 9999) {
    return {
      eyebrow: 'Prediction status',
      title: 'Prediction ready',
      detail: `Expected start ${formatShortDate(prediction.predictedStartDate)}`,
      tag: status,
      tone: prediction.status === 'stable' ? 'primary' : 'warning'
    };
  }

  if (days > 0) {
    return {
      eyebrow: 'Until the next period',
      title: `Expected in ${days} days`,
      detail: `Forecast window ${formatWindow(prediction.windowStartDate, prediction.windowEndDate)}`,
      tag: status,
      tone: prediction.status === 'stable' ? 'primary' : 'warning'
    };
  }

  if (days === 0) {
    return {
      eyebrow: 'Until the next period',
      title: 'Expected to start today',
      detail: `Forecast window ${formatWindow(prediction.windowStartDate, prediction.windowEndDate)}`,
      tag: status,
      tone: 'warning'
    };
  }

  return {
    eyebrow: 'Until the next period',
    title: `Late by ${Math.abs(days)} days`,
    detail: 'Keep logging changes so the next forecast window can stabilize.',
    tag: status,
    tone: 'warning'
  };
}

export function getHeroBackground(tone: string): string {
  switch (tone) {
    case 'primary':
      return COLORS.primarySoft;
    case 'warning':
      return COLORS.warningSoft;
    case 'period':
      return COLORS.periodSoft;
    default:
      return COLORS.surface;
  }
}

export function getHeroBubble(tone: string): string {
  switch (tone) {
    case 'primary':
      return '#D9F6F3';
    case 'warning':
      return '#FFEAA3';
    case 'period':
      return '#FFD9D6';
    default:
      return '#EEF1F4';
  }
}

export function getHeroTagBackground(tone: string): string {
  switch (tone) {
    case 'primary':
      return '#D9F6F3';
    case 'warning':
      return '#FFF2BF';
    case 'period':
      return '#FFD9D6';
    default:
      return COLORS.neutralSoft;
  }
}

export function getHeroTagColor(tone: string): string {
  switch (tone) {
    case 'primary':
      return COLORS.primary;
    case 'warning':
      return '#8A6B00';
    case 'period':
      return COLORS.period;
    default:
      return COLORS.textPrimary;
  }
}

export function getFlowBreakdown(records: Array<CycleRecord>): Array<FlowBreakdownItem> {
  let light = 0;
  let medium = 0;
  let heavy = 0;

  sortRecords(records).forEach((record: CycleRecord) => {
    if (record.flowLevel === 'light') {
      light += 1;
    } else if (record.flowLevel === 'medium') {
      medium += 1;
    } else if (record.flowLevel === 'heavy') {
      heavy += 1;
    }
  });

  const total = Math.max(light + medium + heavy, 1);

  return [
    {
      id: 'light',
      label: formatFlowLabel('light'),
      percentage: (light / total) * 100,
      color: COLORS.primary
    },
    {
      id: 'medium',
      label: formatFlowLabel('medium'),
      percentage: (medium / total) * 100,
      color: COLORS.warning
    },
    {
      id: 'heavy',
      label: formatFlowLabel('heavy'),
      percentage: (heavy / total) * 100,
      color: COLORS.period
    }
  ];
}

export function getDominantFlowLabel(records: Array<CycleRecord>): string {
  const breakdown = getFlowBreakdown(records);
  let current = breakdown[0];

  for (let index = 1; index < breakdown.length; index += 1) {
    if (breakdown[index].percentage > current.percentage) {
      current = breakdown[index];
    }
  }

  if (current.percentage <= 0) {
    return '--';
  }

  return `${current.label} ${Math.round(current.percentage)}%`;
}

export function getReliabilityLabel(prediction: PredictionSnapshot, summary: CycleSummary): string {
  return `${formatPredictionStatus(prediction.status)} | ${summary.recordCount} records`;
}

export function getTrendBars(records: Array<CycleRecord>): Array<TrendBarItem> {
  const values = sortRecords(records)
    .slice(0, 6)
    .reverse()
    .map((record: CycleRecord, index: number) => {
      const start = new Date(record.startDate);
      const end = new Date(record.endDate);
      const diff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      return {
        id: `${record.id}-${index}`,
        height: Math.max(18, Math.min(82, diff * 12)),
        color: index % 2 === 0 ? COLORS.accent : COLORS.primary
      };
    });

  if (values.length > 0) {
    return values;
  }

  return [
    { id: 'empty-1', height: 24, color: '#FFD7D7' },
    { id: 'empty-2', height: 32, color: '#D9F6F3' },
    { id: 'empty-3', height: 28, color: '#FFD7D7' },
    { id: 'empty-4', height: 36, color: '#D9F6F3' },
    { id: 'empty-5', height: 30, color: '#FFD7D7' },
    { id: 'empty-6', height: 40, color: '#D9F6F3' }
  ];
}

function isWithinWindow(prediction: PredictionSnapshot): boolean {
  if (!prediction.windowStartDate || !prediction.windowEndDate) {
    return false;
  }

  const current = Date.now();
  const start = new Date(prediction.windowStartDate).getTime();
  const end = new Date(prediction.windowEndDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }

  return current >= start && current <= end;
}

function daysFromToday(value: string): number {
  if (!value) {
    return 9999;
  }

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(value);

  if (Number.isNaN(target.getTime())) {
    return 9999;
  }

  const startTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((startTarget.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
}

import { api } from '../common/ApiClient';
import { COLORS, RADII, SPACING } from '../common/DesignTokens';
import {
  formatConfidence,
  formatFlowLabel,
  formatMoodLabel,
  formatPredictionStatus,
  formatRecordRange,
  formatShortDate,
  formatWindow
} from '../common/Formatters';
import {
  EMPTY_DASHBOARD,
  EMPTY_PREDICTION,
  EMPTY_SUMMARY,
  FlowBreakdownItem,
  getAverageLabel,
  getFlowBreakdown,
  getHeroState,
  getReliabilityLabel,
  getSyncLabel,
  getTodayLabel,
  getTrendBars,
  getWindowLabel,
  sortRecords,
  TrendBarItem
} from '../common/HomePresenter';
import { RuntimeConfig } from '../common/RuntimeConfig';
import {
  CycleRecord,
  CycleRecordInput,
  CycleSummary,
  DashboardResponse,
  PredictionSnapshot,
  ReminderPreference
} from '../common/Types';

/* ─── helpers ─── */

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface CalendarDayInfo {
  key: string;
  day: number;
  dateKey: string;
  isEmpty: boolean;
  isToday: boolean;
  isPeriod: boolean;
  isPredicted: boolean;
  hasSymptoms: boolean;
}

function buildPeriodMap(records: Array<CycleRecord>): Map<string, CycleRecord> {
  const map = new Map<string, CycleRecord>();
  records.forEach((rec: CycleRecord) => {
    const s = new Date(rec.startDate);
    const e = new Date(rec.endDate);
    const sd = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const ed = new Date(e.getFullYear(), e.getMonth(), e.getDate());
    const cur = new Date(sd);
    while (cur <= ed) {
      map.set(formatDateKey(cur), rec);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return map;
}

function buildCalendarDays(year: number, month: number, periodMap: Map<string, CycleRecord>,
  todayKey: string, lastStart: Date | null, cycleLen: number, periodLen: number): Array<CalendarDayInfo> {
  const first = new Date(year, month, 1);
  const pad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: Array<CalendarDayInfo> = [];
  for (let i = 0; i < pad; i++) {
    result.push({ key: `e${i}`, day: 0, dateKey: '', isEmpty: true, isToday: false, isPeriod: false, isPredicted: false, hasSymptoms: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dk = formatDateKey(date);
    const rec = periodMap.get(dk);
    const isP = !!rec;
    let isPred = false;
    if (!isP && lastStart && cycleLen > 0 && periodLen > 0) {
      const diff = Math.round((date.getTime() - lastStart.getTime()) / 86400000);
      if (diff > 0) {
        isPred = ((diff % cycleLen) + cycleLen) % cycleLen < periodLen;
      }
    }
    result.push({
      key: dk, day: d, dateKey: dk, isEmpty: false,
      isToday: dk === todayKey, isPeriod: isP, isPredicted: isPred,
      hasSymptoms: !!(rec?.symptoms?.length && rec.symptoms[0] !== 'none')
    });
  }
  return result;
}

const WEEK_LABELS: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FLOW_OPTIONS: string[] = ['light', 'medium', 'heavy'];
const PAIN_OPTIONS: number[] = [0, 1, 2, 3];
const MOOD_OPTIONS: string[] = ['steady', 'low', 'irritable', 'tired', 'energetic'];
const SYMPTOM_OPTIONS: string[] = ['cramps', 'bloating', 'headache', 'fatigue', 'back_pain', 'acne'];

function formatSymptomLabel(s: string): string {
  switch (s) {
    case 'cramps': return 'Cramps';
    case 'bloating': return 'Bloating';
    case 'headache': return 'Headache';
    case 'fatigue': return 'Fatigue';
    case 'back_pain': return 'Back pain';
    case 'acne': return 'Acne';
    default: return s;
  }
}

function clampProgress(v: number, min: number, max: number): number {
  return Math.min(Math.max(((v - min) / (max - min)) * 100, 8), 100);
}

@Entry
@Component
struct Index {
  @State private dashboard: DashboardResponse = EMPTY_DASHBOARD;
  @State private isLoading: boolean = true;
  @State private hasLoaded: boolean = false;
  @State private errorMessage: string = '';
  @State private lastSyncedAt: string = '';
  @State private currentTab: number = 0;

  /* calendar state */
  @State private calYear: number = new Date().getFullYear();
  @State private calMonth: number = new Date().getMonth();
  @State private calDays: Array<CalendarDayInfo> = [];

  /* record form state */
  @State private recStartDate: string = formatDateKey(new Date());
  @State private recEndDate: string = formatDateKey(new Date());
  @State private recFlow: string = 'medium';
  @State private recPain: number = 1;
  @State private recMood: string = 'steady';
  @State private recSymptoms: Array<string> = ['cramps'];
  @State private recNote: string = '';
  @State private recSubmitting: boolean = false;

  /* settings state */
  @State private cycleLength: number = 28;
  @State private periodLength: number = 5;
  @State private preference: ReminderPreference | null = null;

  aboutToAppear(): void {
    this.refreshDashboard();
  }

  private async refreshDashboard(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const response = await api.getDashboard();
      this.dashboard = response;
      this.hasLoaded = true;
      this.lastSyncedAt = new Date().toISOString();
      if (response.summary) {
        if (response.summary.averageCycleLength > 0) this.cycleLength = response.summary.averageCycleLength;
        if (response.summary.averagePeriodLength > 0) this.periodLength = response.summary.averagePeriodLength;
      }
      this.rebuildCalendar();
    } catch (error) {
      this.errorMessage = `Sync failed: ${String(error)}`;
    } finally {
      this.isLoading = false;
    }
  }

  private prediction(): PredictionSnapshot { return this.dashboard.prediction ?? EMPTY_PREDICTION; }
  private summary(): CycleSummary { return this.dashboard.summary ?? EMPTY_SUMMARY; }
  private allRecords(): Array<CycleRecord> { return sortRecords(this.dashboard.records); }
  private recentRecords(): Array<CycleRecord> { return this.allRecords().slice(0, 3); }

  private cycleDay(): number {
    const recs = this.allRecords();
    if (!recs.length) return 0;
    const last = new Date(recs[0].startDate);
    const today = new Date();
    const diff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime()) / 86400000);
    return Math.max(1, diff + 1);
  }

  private daysUntilNext(): number {
    const recs = this.allRecords();
    if (!recs.length) return 0;
    const last = new Date(recs[0].startDate);
    const today = new Date();
    const diff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime()) / 86400000);
    return Math.abs(this.cycleLength - diff);
  }

  private isLate(): boolean {
    const recs = this.allRecords();
    if (!recs.length) return false;
    const last = new Date(recs[0].startDate);
    const today = new Date();
    const diff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime()) / 86400000);
    return diff > this.cycleLength;
  }

  private rebuildCalendar(): void {
    const recs = this.dashboard.records ?? [];
    const map = buildPeriodMap(recs);
    const sorted = sortRecords(recs);
    let lastStart: Date | null = null;
    if (sorted.length > 0) {
      const s = new Date(sorted[0].startDate);
      lastStart = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    }
    this.calDays = buildCalendarDays(this.calYear, this.calMonth, map, formatDateKey(new Date()),
      lastStart, this.cycleLength, this.periodLength);
  }

  private monthLabel(): string {
    const d = new Date(this.calYear, this.calMonth, 1);
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(d);
  }

  private async submitRecord(): Promise<void> {
    this.recSubmitting = true;
    const payload: CycleRecordInput = {
      startDate: `${this.recStartDate}T09:00:00.000Z`,
      endDate: `${this.recEndDate}T18:00:00.000Z`,
      flowLevel: this.recFlow,
      painLevel: this.recPain,
      symptoms: this.recSymptoms,
      mood: this.recMood,
      note: this.recNote.trim() || undefined
    };
    try {
      await api.createRecord(payload);
      this.recNote = '';
      this.recSymptoms = ['cramps'];
      this.recPain = 1;
      this.recFlow = 'medium';
      this.recMood = 'steady';
      await this.refreshDashboard();
      this.currentTab = 0;
    } catch (error) {
      this.errorMessage = `Save failed: ${String(error)}`;
    } finally {
      this.recSubmitting = false;
    }
  }

  /* ─── Builder: Home Tab ─── */
  @Builder
  private HomeTab() {
    Scroll() {
      Column({ space: SPACING.lg }) {
        // Top bar
        Row({ space: SPACING.sm }) {
          Column().width(40).height(40).borderRadius(20).backgroundColor('#D9F6F3')
          Column({ space: 2 }) {
            Text(getTodayLabel()).fontSize(26).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
            Text('Today overview').fontSize(12).fontColor(COLORS.floMuted)
          }.alignItems(HorizontalAlign.Center).layoutWeight(1)
          Text('📅').fontSize(22).onClick(() => { this.currentTab = 1; })
        }.width('100%').alignItems(VerticalAlign.Center)

        // Hero panel
        Column({ space: SPACING.xl }) {
          // Ring
          Column() {
            if (this.cycleDay() > 0) {
              Text('Cycle day').fontSize(14).fontColor('#7F808B')
              Text(String(this.cycleDay())).fontSize(56).fontWeight(FontWeight.Bold).fontColor(COLORS.floPink)
              Text('days').fontSize(14).fontColor('#7F808B')
            } else {
              Text('No records yet.\nStart today.')
                .fontSize(14).fontColor('#8A8B95').textAlign(TextAlign.Center)
            }
          }
          .width(200).height(200).borderRadius(100)
          .borderWidth(6).borderColor(COLORS.ringBorder)
          .backgroundColor(COLORS.surface)
          .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)

          // Copy
          Column({ space: SPACING.xs }) {
            if (this.allRecords().length > 0) {
              Text(this.isLate() ? 'Period is late' : 'Until next period')
                .fontSize(24).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk).textAlign(TextAlign.Center)
              Text(`${this.daysUntilNext()} days`)
                .fontSize(40).fontWeight(FontWeight.Bold).fontColor(this.isLate() ? '#F2A94A' : COLORS.floPink)
              if (this.prediction().predictedStartDate) {
                Text(`Predicted date: ${formatShortDate(this.prediction().predictedStartDate)}`)
                  .fontSize(14).fontColor('#616270').textAlign(TextAlign.Center)
              }
            } else {
              Text('Waiting for your first record')
                .fontSize(24).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk).textAlign(TextAlign.Center)
              Text('Log a start date and the home screen will begin to estimate your cycle.')
                .fontSize(14).fontColor('#616270').textAlign(TextAlign.Center)
            }
          }.alignItems(HorizontalAlign.Center)

          // CTA button
          Button('Log today')
            .width('100%').height(52).borderRadius(26)
            .backgroundColor(COLORS.floPink).fontColor(COLORS.surface)
            .fontSize(17).fontWeight(FontWeight.Bold)
            .onClick(() => { this.currentTab = 2; })
        }
        .width('100%').padding(20).borderRadius(RADII.xl)
        .backgroundColor(COLORS.floHero).alignItems(HorizontalAlign.Center)

        // Summary card
        Column() {
          Row() {
            Text('Cycle summary').fontSize(18).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
            Blank()
            Text('→').fontSize(18).fontColor(COLORS.floMuted).onClick(() => { this.currentTab = 1; })
          }.width('100%').height(54).padding({ left: 18, right: 18 })
          .borderWidth({ bottom: 0.5 }).borderColor(COLORS.floBorder)

          Row() {
            Text('Average cycle').fontSize(15).fontColor(COLORS.textBody)
            Blank()
            Text(`${getAverageLabel(this.summary().averageCycleLength)} days`)
              .fontSize(15).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          }.width('100%').height(54).padding({ left: 18, right: 18 })
          .borderWidth({ bottom: 0.5 }).borderColor(COLORS.floBorder)

          Row() {
            Text('Average period').fontSize(15).fontColor(COLORS.textBody)
            Blank()
            Text(`${getAverageLabel(this.summary().averagePeriodLength)} days`)
              .fontSize(15).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          }.width('100%').height(54).padding({ left: 18, right: 18 })
          .borderWidth({ bottom: 0.5 }).borderColor(COLORS.floBorder)

          Row() {
            Text('Logs').fontSize(15).fontColor(COLORS.textBody)
            Blank()
            Text(`${this.summary().recordCount} items`)
              .fontSize(15).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          }.width('100%').height(54).padding({ left: 18, right: 18 })
        }
        .width('100%').borderRadius(RADII.lg)
        .backgroundColor(COLORS.surface)
        .borderWidth(1).borderColor(COLORS.floBorder)
      }
      .width('100%').padding({ left: SPACING.lg, right: SPACING.lg, top: SPACING.md, bottom: SPACING.xxl })
    }
  }

  /* ─── Builder: Calendar Tab ─── */
  @Builder
  private CalendarTab() {
    Scroll() {
      Column({ space: 18 }) {
        // Header with nav
        Row() {
          Text('‹').fontSize(24).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
            .width(40).height(40).textAlign(TextAlign.Center)
            .onClick(() => {
              let m = this.calMonth - 1;
              let y = this.calYear;
              if (m < 0) { m = 11; y -= 1; }
              this.calMonth = m; this.calYear = y; this.rebuildCalendar();
            })

          Column({ space: 2 }) {
            Text(this.monthLabel()).fontSize(22).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
            Text('Tap a date to log quickly').fontSize(12).fontColor(COLORS.floMuted)
          }.layoutWeight(1).alignItems(HorizontalAlign.Center)

          Text('›').fontSize(24).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
            .width(40).height(40).textAlign(TextAlign.Center)
            .onClick(() => {
              let m = this.calMonth + 1;
              let y = this.calYear;
              if (m > 11) { m = 0; y += 1; }
              this.calMonth = m; this.calYear = y; this.rebuildCalendar();
            })
        }.width('100%').alignItems(VerticalAlign.Center)

        // Calendar grid
        Column({ space: SPACING.sm }) {
          // Week headers
          Row() {
            ForEach(WEEK_LABELS, (label: string) => {
              Text(label).fontSize(12).fontColor(COLORS.mutedSoft).fontWeight(FontWeight.Medium)
                .width('14.28%').textAlign(TextAlign.Center)
            }, (label: string) => label)
          }.width('100%')

          // Day cells — use Flex for wrapping
          Flex({ wrap: FlexWrap.Wrap }) {
            ForEach(this.calDays, (item: CalendarDayInfo) => {
              Column() {
                if (item.isEmpty) {
                  Column().width(40).height(40)
                } else {
                  Column() {
                    Text(String(item.day))
                      .fontSize(15)
                      .fontWeight(item.isToday || item.isPeriod ? FontWeight.Bold : FontWeight.Medium)
                      .fontColor(item.isPeriod ? COLORS.surface : item.isPredicted ? COLORS.floPink : item.isToday ? COLORS.floInk : COLORS.textBody)
                  }
                  .width(40).height(40).borderRadius(20)
                  .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
                  .backgroundColor(item.isPeriod ? COLORS.floPink : item.isToday ? COLORS.pinkMist : 'transparent')
                  .borderWidth(item.isPredicted ? 2 : 0).borderColor(COLORS.floPinkBorder)

                  if (item.hasSymptoms && !item.isPeriod) {
                    Column().width(6).height(6).borderRadius(3)
                      .backgroundColor(COLORS.symptomDot).margin({ top: 4 })
                  } else {
                    Column().height(10)
                  }
                }
              }
              .width('14.28%').alignItems(HorizontalAlign.Center).margin({ bottom: 14 })
            }, (item: CalendarDayInfo) => item.key)
          }.width('100%')
        }
        .width('100%').borderRadius(RADII.xl).backgroundColor(COLORS.surface)
        .padding({ left: 10, right: 10, top: 16, bottom: 12 })

        // Legend
        Row({ space: 16 }) {
          Row({ space: 6 }) {
            Column().width(12).height(12).borderRadius(6).backgroundColor(COLORS.floPink)
            Text('Period').fontSize(12).fontColor(COLORS.textBody)
          }
          Row({ space: 6 }) {
            Column().width(12).height(12).borderRadius(6)
              .borderWidth(2).borderColor(COLORS.floPinkBorder)
            Text('Predicted').fontSize(12).fontColor(COLORS.textBody)
          }
          Row({ space: 6 }) {
            Column().width(12).height(12).borderRadius(6).backgroundColor(COLORS.symptomDot)
            Text('Symptoms').fontSize(12).fontColor(COLORS.textBody)
          }
        }
        .width('100%').padding(16).borderRadius(18)
        .backgroundColor('#FFF5F7').borderWidth(1).borderColor('#FFE2E8')
      }
      .width('100%').padding({ left: SPACING.md, right: SPACING.md, top: SPACING.md, bottom: SPACING.xxl })
    }
  }

  /* ─── Builder: Record Tab ─── */
  @Builder
  private RecordTab() {
    Scroll() {
      Column({ space: 18 }) {
        Column({ space: 4 }) {
          Text('Log').fontSize(24).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          Text('Quick entry for this cycle').fontSize(14).fontColor(COLORS.floMuted)
        }.width('100%').alignItems(HorizontalAlign.Start)

        // Date card
        Column({ space: 14 }) {
          Text('Date range').fontSize(17).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          Row({ space: 12 }) {
            Column({ space: 6 }) {
              Text('Start').fontSize(12).fontColor('#8A8B95').fontWeight(FontWeight.Medium)
              Text(this.recStartDate).fontSize(15).fontWeight(FontWeight.Medium).fontColor(COLORS.floInk)
                .height(48).borderRadius(14).backgroundColor(COLORS.neutralSoft)
                .padding({ left: 14, right: 14 }).width('100%').textAlign(TextAlign.Center)
            }.layoutWeight(1)
            Column({ space: 6 }) {
              Text('End').fontSize(12).fontColor('#8A8B95').fontWeight(FontWeight.Medium)
              Text(this.recEndDate).fontSize(15).fontWeight(FontWeight.Medium).fontColor(COLORS.floInk)
                .height(48).borderRadius(14).backgroundColor(COLORS.neutralSoft)
                .padding({ left: 14, right: 14 }).width('100%').textAlign(TextAlign.Center)
            }.layoutWeight(1)
          }.width('100%')
        }.cardStyle()

        // Flow card
        Column({ space: 14 }) {
          Text('Flow').fontSize(17).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          Row({ space: 10 }) {
            ForEach(FLOW_OPTIONS, (opt: string) => {
              Text(formatFlowLabel(opt))
                .fontSize(15).fontWeight(FontWeight.Medium)
                .fontColor(this.recFlow === opt ? COLORS.floPink : COLORS.textBody)
                .height(46).layoutWeight(1).textAlign(TextAlign.Center).borderRadius(14)
                .borderWidth(1).borderColor(this.recFlow === opt ? '#F7C9D6' : '#E3E4EA')
                .backgroundColor(this.recFlow === opt ? '#FFF1F5' : COLORS.surface)
                .onClick(() => { this.recFlow = opt; })
            }, (opt: string) => opt)
          }.width('100%')
        }.cardStyle()

        // Pain card
        Column({ space: 14 }) {
          Text('Pain level').fontSize(17).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          Row({ space: 10 }) {
            ForEach(PAIN_OPTIONS, (opt: number) => {
              Text(String(opt))
                .fontSize(15).fontWeight(FontWeight.Medium)
                .fontColor(this.recPain === opt ? COLORS.floPink : COLORS.textBody)
                .height(46).layoutWeight(1).textAlign(TextAlign.Center).borderRadius(14)
                .borderWidth(1).borderColor(this.recPain === opt ? '#F7C9D6' : '#E3E4EA')
                .backgroundColor(this.recPain === opt ? '#FFF1F5' : COLORS.surface)
                .onClick(() => { this.recPain = opt; })
            }, (opt: number) => String(opt))
          }.width('100%')
        }.cardStyle()

        // Symptoms card
        Column({ space: 14 }) {
          Text('Symptoms').fontSize(17).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          Flex({ wrap: FlexWrap.Wrap }) {
            ForEach(SYMPTOM_OPTIONS, (opt: string) => {
              Column() {
                Text(formatSymptomLabel(opt))
                  .fontSize(12).fontColor(this.recSymptoms.indexOf(opt) >= 0 ? COLORS.floPink : COLORS.textBody)
                  .fontWeight(this.recSymptoms.indexOf(opt) >= 0 ? FontWeight.Medium : FontWeight.Regular)
              }
              .width('30.5%').height(82).borderRadius(16)
              .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
              .borderWidth(1).borderColor(this.recSymptoms.indexOf(opt) >= 0 ? '#FFD6E2' : '#E3E4EA')
              .backgroundColor(this.recSymptoms.indexOf(opt) >= 0 ? '#FFF1F5' : COLORS.surface)
              .margin({ right: '3%', bottom: 12 })
              .onClick(() => {
                const idx = this.recSymptoms.indexOf(opt);
                if (idx >= 0) {
                  this.recSymptoms = this.recSymptoms.filter((s: string) => s !== opt);
                } else {
                  this.recSymptoms = [...this.recSymptoms, opt];
                }
              })
            }, (opt: string) => opt)
          }.width('100%')
        }.cardStyle()

        // Mood card
        Column({ space: 14 }) {
          Text('Mood').fontSize(17).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          Flex({ wrap: FlexWrap.Wrap }) {
            ForEach(MOOD_OPTIONS, (opt: string) => {
              Text(formatMoodLabel(opt))
                .fontSize(14).fontWeight(FontWeight.Medium)
                .fontColor(this.recMood === opt ? COLORS.floPink : COLORS.textBody)
                .height(38).padding({ left: 14, right: 14 }).borderRadius(19)
                .backgroundColor(this.recMood === opt ? '#FFE7EE' : COLORS.neutralSoft)
                .margin({ right: 10, bottom: 10 })
                .onClick(() => { this.recMood = opt; })
            }, (opt: string) => opt)
          }.width('100%')
        }.cardStyle()

        // Note card
        Column({ space: 14 }) {
          Text('Note').fontSize(17).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          TextInput({ placeholder: 'Optional note for today', text: this.recNote })
            .height(110).borderRadius(14).backgroundColor(COLORS.neutralSoft)
            .fontSize(15).fontColor(COLORS.floInk)
            .onChange((value: string) => { this.recNote = value; })
        }.cardStyle()

        // Save
        Button(this.recSubmitting ? 'Saving...' : 'Save log')
          .width('100%').height(56).borderRadius(18)
          .backgroundColor('#111217').fontColor(COLORS.surface)
          .fontSize(17).fontWeight(FontWeight.Bold)
          .onClick(() => { this.submitRecord(); })
      }
      .width('100%').padding({ left: SPACING.lg, right: SPACING.lg, top: 18, bottom: SPACING.xxl })
    }
  }

  /* ─── Builder: Settings Tab ─── */
  @Builder
  private SettingsTab() {
    Scroll() {
      Column({ space: 18 }) {
        Column({ space: 4 }) {
          Text('Settings').fontSize(24).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          Text('Keep preferences, reminders, and privacy in one place.')
            .fontSize(14).lineHeight(20).fontColor(COLORS.floMuted)
        }.width('100%').alignItems(HorizontalAlign.Start)

        // Cycle stepper
        Column({ space: 14 }) {
          Row() {
            Text('Average cycle length').fontSize(16).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
            Blank()
            Text(`${this.cycleLength} days`).fontSize(18).fontWeight(FontWeight.Bold).fontColor(COLORS.floPink)
          }.width('100%')
          Row({ space: 12 }) {
            Button('-').type(ButtonType.Circle).width(42).height(42)
              .backgroundColor(COLORS.neutralSoft).fontColor(COLORS.floInk).fontSize(24)
              .onClick(() => { if (this.cycleLength > 20) this.cycleLength -= 1; })
            Column().layoutWeight(1).height(10).borderRadius(999).backgroundColor('#EFEFF3')
            Column()
              .width(`${clampProgress(this.cycleLength, 20, 45)}%`)
              .height(10).borderRadius(999).backgroundColor(COLORS.floPink)
              .margin({ left: -this.cycleLength })  // overlay hack — use stack in prod
            Button('+').type(ButtonType.Circle).width(42).height(42)
              .backgroundColor(COLORS.neutralSoft).fontColor(COLORS.floInk).fontSize(24)
              .onClick(() => { if (this.cycleLength < 45) this.cycleLength += 1; })
          }.width('100%').alignItems(VerticalAlign.Center)
        }.cardStyle()

        // Period stepper
        Column({ space: 14 }) {
          Row() {
            Text('Average period length').fontSize(16).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
            Blank()
            Text(`${this.periodLength} days`).fontSize(18).fontWeight(FontWeight.Bold).fontColor(COLORS.floPink)
          }.width('100%')
          Row({ space: 12 }) {
            Button('-').type(ButtonType.Circle).width(42).height(42)
              .backgroundColor(COLORS.neutralSoft).fontColor(COLORS.floInk).fontSize(24)
              .onClick(() => { if (this.periodLength > 2) this.periodLength -= 1; })
            Column().layoutWeight(1).height(10).borderRadius(999).backgroundColor('#EFEFF3')
            Button('+').type(ButtonType.Circle).width(42).height(42)
              .backgroundColor(COLORS.neutralSoft).fontColor(COLORS.floInk).fontSize(24)
              .onClick(() => { if (this.periodLength < 10) this.periodLength += 1; })
          }.width('100%').alignItems(VerticalAlign.Center)
        }.cardStyle()

        // Reminders card
        Column({ space: 14 }) {
          Text('Reminders & quiet hours').fontSize(17).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          Text('Configure reminder preferences and quiet hours for gentle notifications.')
            .fontSize(14).lineHeight(21).fontColor(COLORS.textBody)
        }.cardStyle()

        // Privacy card
        Column({ space: 14 }) {
          Text('Privacy & data').fontSize(17).fontWeight(FontWeight.Bold).fontColor(COLORS.floInk)
          Text('Your data stays under the current account and can be exported or deleted.')
            .fontSize(14).lineHeight(21).fontColor(COLORS.textBody)
          Row({ space: 12 }) {
            Button('Export data')
              .layoutWeight(1).height(48).borderRadius(16)
              .backgroundColor('#111217').fontColor(COLORS.surface)
              .fontSize(15).fontWeight(FontWeight.Bold)
              .onClick(async () => {
                try { await api.exportData(); } catch { /* silent */ }
              })
            Button('Delete account')
              .layoutWeight(1).height(48).borderRadius(16)
              .backgroundColor('#FFF1F3').fontColor('#D14A72')
              .fontSize(15).fontWeight(FontWeight.Bold)
              .borderWidth(1).borderColor('#FCD6DD')
              .onClick(async () => {
                try { await api.deleteAccount(); this.refreshDashboard(); } catch { /* silent */ }
              })
          }.width('100%')
        }.cardStyle()
      }
      .width('100%').padding({ left: SPACING.lg, right: SPACING.lg, top: 18, bottom: SPACING.xxl })
    }
  }

  build() {
    Tabs({ barPosition: BarPosition.End, index: this.currentTab }) {
      TabContent() {
        this.HomeTab()
      }.tabBar(this.TabItem('Home', 0))

      TabContent() {
        this.CalendarTab()
      }.tabBar(this.TabItem('Calendar', 1))

      TabContent() {
        this.RecordTab()
      }.tabBar(this.TabItem('Log', 2))

      TabContent() {
        this.SettingsTab()
      }.tabBar(this.TabItem('Settings', 3))
    }
    .onChange((index: number) => { this.currentTab = index; })
    .barHeight(72)
    .backgroundColor(COLORS.page)
  }

  @Builder
  private TabItem(label: string, index: number) {
    Column({ space: 4 }) {
      Text(label === 'Home' ? '🏠' : label === 'Calendar' ? '📅' : label === 'Log' ? '✏️' : '⚙️')
        .fontSize(20)
      Text(label)
        .fontSize(12).fontWeight(FontWeight.Medium)
        .fontColor(this.currentTab === index ? COLORS.primary : COLORS.floMuted)
    }
    .width('100%').height(60).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
  }
}

@Extend(Column)
function cardStyle() {
  .width('100%')
  .borderRadius(20)
  .backgroundColor(COLORS.surface)
  .borderWidth(1)
  .borderColor('#EFEFF3')
  .padding(18)
}

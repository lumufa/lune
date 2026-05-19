import router from '@ohos.router';
import { api } from '../common/ApiClient';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADII, SPACING } from '../common/DesignTokens';
import { DEFAULT_LANGUAGE, LANGUAGE_KEY, getCopy, getLanguageToggleLabel, getNextLanguage } from '../common/I18n';
import { formatMoodLabel, formatShortDate } from '../common/Formatters';
import {
  EMPTY_DASHBOARD,
  EMPTY_PREDICTION,
  EMPTY_SUMMARY,
  getAverageLabel,
  getTodayLabel,
  sortRecords
} from '../common/HomePresenter';
import {
  CycleRecord,
  CycleSummary,
  DashboardResponse,
  PredictionSnapshot
} from '../common/Types';

/* ─── helpers ─── */

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatFullDate(dateKey: string, zh: boolean): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (zh) return `${y}年${m}月${d}日`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function formatSymptomLabel(s: string, zh: boolean): string {
  if (zh) {
    switch (s) {
      case 'cramps': return '痛经';
      case 'bloating': return '腹胀';
      case 'headache': return '头痛';
      case 'fatigue': return '疲惫';
      case 'back_pain': return '腰痛';
      case 'acne': return '长痘';
      default: return s;
    }
  }
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

interface LogNavParams {
  date: string;
  recordId?: string;
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

function clampProgress(v: number, min: number, max: number): number {
  return Math.min(Math.max(((v - min) / (max - min)) * 100, 0), 100);
}

const AUTO_COMPUTE_THRESHOLD: number = 3;

function __initLangStorage(): string {
  if (!AppStorage.Has(LANGUAGE_KEY)) {
    AppStorage.SetOrCreate(LANGUAGE_KEY, DEFAULT_LANGUAGE);
  }
  return DEFAULT_LANGUAGE;
}
const __LANG_INIT: string = __initLangStorage();

@Entry
@Component
struct Index {
  @State private lang: string = 'en';
  @State private dashboard: DashboardResponse = EMPTY_DASHBOARD;
  @State private isLoading: boolean = true;
  @State private hasLoaded: boolean = false;
  @State private errorMessage: string = '';
  @State private currentTab: number = 0;

  /* calendar state */
  @State private calYear: number = new Date().getFullYear();
  @State private calMonth: number = new Date().getMonth();
  @State private calDays: Array<CalendarDayInfo> = [];
  @State private selectedCalDate: string = formatDateKey(new Date());
  @State private selectedRecord: CycleRecord | null = null;
  @State private selectedIsPredicted: boolean = false;

  /* settings state */
  @State private cycleLength: number = 28;
  @State private periodLength: number = 5;

  aboutToAppear(): void {
    this.rebuildCalendar();
  }

  onPageShow(): void {
    this.rebuildCalendar();
  }

  private async refreshDashboard(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const response = await api.getDashboard();
      this.dashboard = response;
      this.hasLoaded = true;
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
    this.syncSelectedRecord();
  }

  private syncSelectedRecord(): void {
    const map = buildPeriodMap(this.dashboard.records ?? []);
    this.selectedRecord = map.get(this.selectedCalDate) ?? null;
    const info = this.calDays.find((d: CalendarDayInfo) => d.dateKey === this.selectedCalDate);
    this.selectedIsPredicted = !!(info && info.isPredicted);
  }

  private selectDate(dateKey: string): void {
    this.selectedCalDate = dateKey;
    this.syncSelectedRecord();
  }

  private monthLabel(): string {
    const d = new Date(this.calYear, this.calMonth, 1);
    const locale = this.lang === 'zh' ? 'zh-CN' : 'en-US';
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(d);
  }

  private flowOptionLabel(opt: string): string {
    const copy = getCopy(this.lang).trends;
    if (opt === 'light') return copy.flowLight;
    if (opt === 'medium') return copy.flowMedium;
    return copy.flowHeavy;
  }

  private recordForDate(dateKey: string): CycleRecord | null {
    if (!dateKey) return null;
    const map = buildPeriodMap(this.dashboard.records ?? []);
    return map.get(dateKey) ?? null;
  }

  private isPredictedDate(dateKey: string): boolean {
    if (!dateKey) return false;
    const info = this.calDays.find((d: CalendarDayInfo) => d.dateKey === dateKey);
    return !!(info && info.isPredicted);
  }

  private todayRecord(): CycleRecord | null {
    return this.recordForDate(formatDateKey(new Date()));
  }

  private openLog(date: string, recordId?: string): void {
    const params: LogNavParams = { date };
    if (recordId) params.recordId = recordId;
    router.pushUrl({ url: 'pages/LogEntry', params });
  }

  private openTrends(): void {
    router.pushUrl({ url: 'pages/Trends' });
  }

  private openPrivacy(): void {
    router.pushUrl({ url: 'pages/Privacy' });
  }

  /* ─── Builder: Home Tab ─── */
  @Builder
  private HomeTab() {
    Stack({ alignContent: Alignment.BottomEnd }) {
      Scroll() {
        Column({ space: SPACING.md }) {
          // Top bar
          Row({ space: SPACING.sm }) {
            Column().width(40).height(40).borderRadius(20).backgroundColor(COLORS.pinkMist)
            Column() {
              Text(getTodayLabel())
                .fontSize(FONT_SIZE.displaySmall).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
            }.alignItems(HorizontalAlign.Center).layoutWeight(1)
            Text(getLanguageToggleLabel(this.lang))
              .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.accentDeep)
              .width(40).height(32).borderRadius(16).backgroundColor(COLORS.pinkMist)
              .textAlign(TextAlign.Center)
              .onClick(() => { this.lang = getNextLanguage(this.lang); })
          }.width('100%').alignItems(VerticalAlign.Center)

          // Hero panel — compact ring
          Column({ space: SPACING.sm }) {
            // Ring (≤40% screen width)
            Stack({ alignContent: Alignment.Center }) {
              Column()
                .width(150).height(150).borderRadius(75)
                .borderWidth(5).borderColor(COLORS.ringBorder)
                .backgroundColor(COLORS.surface)

              if (this.allRecords().length > 0) {
                Column({ space: 2 }) {
                  Text(getCopy(this.lang).home.cycleDay)
                    .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted)
                  Text(String(this.cycleDay()))
                    .fontSize(42).fontWeight(FONT_WEIGHT.heavy).fontColor(COLORS.accent)
                  Text(this.isLate()
                    ? (this.lang === 'zh' ? `迟到 ${this.daysUntilNext()} 天` : `${this.daysUntilNext()}d late`)
                    : (this.lang === 'zh' ? `距下次 ${this.daysUntilNext()} 天` : `${this.daysUntilNext()}d to next`))
                    .fontSize(FONT_SIZE.footnote)
                    .fontColor(this.isLate() ? COLORS.warning : COLORS.inkSecondary)
                    .fontWeight(FONT_WEIGHT.semibold)
                }.alignItems(HorizontalAlign.Center)
              } else {
                Text(getCopy(this.lang).home.noRecordsLine)
                  .fontSize(FONT_SIZE.metaLabel).fontColor(COLORS.muted).textAlign(TextAlign.Center)
              }
            }.width(150).height(150)

            // Predicted date caption
            if (this.allRecords().length > 0 && this.prediction().predictedStartDate) {
              Text(`${getCopy(this.lang).home.predictedDate} · ${formatShortDate(this.prediction().predictedStartDate)}`)
                .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted).textAlign(TextAlign.Center)
            } else if (this.allRecords().length === 0) {
              Text(getCopy(this.lang).home.waitingBody)
                .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted).textAlign(TextAlign.Center)
                .margin({ top: SPACING.xxs, left: SPACING.md, right: SPACING.md })
            }

            // CTA — compact, not full-width
            Button(getCopy(this.lang).home.logToday)
              .height(44).borderRadius(22)
              .backgroundColor(COLORS.accent).fontColor(COLORS.surface)
              .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold)
              .padding({ left: SPACING.lg, right: SPACING.lg })
              .constraintSize({ minWidth: 160 })
              .margin({ top: SPACING.xs })
              .onClick(() => {
                const today = formatDateKey(new Date());
                const rec = this.todayRecord();
                this.openLog(today, rec?.id);
              })
          }
          .width('100%').padding(SPACING.md).borderRadius(RADII.xl)
          .backgroundColor(COLORS.pinkMist).alignItems(HorizontalAlign.Center)

          // Summary — 3-column grid
          Column({ space: SPACING.sm }) {
            Row() {
              Text(getCopy(this.lang).home.cycleSummary)
                .fontSize(FONT_SIZE.title).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
              Blank()
              Text(this.lang === 'zh' ? '趋势 ›' : 'Trends ›')
                .fontSize(FONT_SIZE.metaLabel).fontColor(COLORS.accent).fontWeight(FONT_WEIGHT.semibold)
                .onClick(() => this.openTrends())
            }.width('100%')

            Row({ space: SPACING.xs }) {
              Column({ space: 2 }) {
                Text(getAverageLabel(this.summary().averageCycleLength))
                  .fontSize(FONT_SIZE.heading).fontWeight(FONT_WEIGHT.heavy).fontColor(COLORS.ink)
                Text(getCopy(this.lang).home.dayUnit)
                  .fontSize(FONT_SIZE.caption).fontColor(COLORS.muted)
                Text(getCopy(this.lang).home.avgCycle)
                  .fontSize(FONT_SIZE.footnote).fontColor(COLORS.inkSecondary).textAlign(TextAlign.Center)
              }.layoutWeight(1).padding(SPACING.sm).borderRadius(RADII.md)
                .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
                .alignItems(HorizontalAlign.Center)

              Column({ space: 2 }) {
                Text(getAverageLabel(this.summary().averagePeriodLength))
                  .fontSize(FONT_SIZE.heading).fontWeight(FONT_WEIGHT.heavy).fontColor(COLORS.ink)
                Text(getCopy(this.lang).home.dayUnit)
                  .fontSize(FONT_SIZE.caption).fontColor(COLORS.muted)
                Text(getCopy(this.lang).home.avgPeriod)
                  .fontSize(FONT_SIZE.footnote).fontColor(COLORS.inkSecondary).textAlign(TextAlign.Center)
              }.layoutWeight(1).padding(SPACING.sm).borderRadius(RADII.md)
                .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
                .alignItems(HorizontalAlign.Center)

              Column({ space: 2 }) {
                Text(String(this.summary().recordCount))
                  .fontSize(FONT_SIZE.heading).fontWeight(FONT_WEIGHT.heavy).fontColor(COLORS.ink)
                Text(getCopy(this.lang).home.itemsUnit)
                  .fontSize(FONT_SIZE.caption).fontColor(COLORS.muted)
                Text(getCopy(this.lang).home.logs)
                  .fontSize(FONT_SIZE.footnote).fontColor(COLORS.inkSecondary).textAlign(TextAlign.Center)
              }.layoutWeight(1).padding(SPACING.sm).borderRadius(RADII.md)
                .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
                .alignItems(HorizontalAlign.Center)
            }.width('100%')
          }.width('100%')

          // Recent record card
          if (this.allRecords().length > 0) {
            Column({ space: SPACING.xs }) {
              Row() {
                Text(this.lang === 'zh' ? '最近记录' : 'Recent log')
                  .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
                Blank()
                Text(this.lang === 'zh' ? '编辑 ›' : 'Edit ›')
                  .fontSize(FONT_SIZE.metaLabel).fontColor(COLORS.accent).fontWeight(FONT_WEIGHT.semibold)
              }.width('100%')

              Row({ space: SPACING.xs }) {
                Text(formatShortDate(this.allRecords()[0].startDate))
                  .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.ink)
                Blank()
                Text(this.flowOptionLabel(this.allRecords()[0].flowLevel))
                  .fontSize(FONT_SIZE.caption).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.accent)
                  .padding({ left: 8, right: 8, top: 3, bottom: 3 })
                  .borderRadius(10).backgroundColor(COLORS.accentSoft)
                Text(formatMoodLabel(this.allRecords()[0].mood))
                  .fontSize(FONT_SIZE.caption).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.inkSecondary)
                  .padding({ left: 8, right: 8, top: 3, bottom: 3 })
                  .borderRadius(10).backgroundColor(COLORS.chipIdle)
                if ((this.allRecords()[0].symptoms ?? []).length > 0) {
                  Text(`${(this.allRecords()[0].symptoms ?? []).length} ${this.lang === 'zh' ? '项症状' : 'symptoms'}`)
                    .fontSize(FONT_SIZE.caption).fontWeight(FONT_WEIGHT.medium).fontColor(COLORS.muted)
                }
              }.width('100%').alignItems(VerticalAlign.Center)
            }
            .width('100%').padding(SPACING.md).borderRadius(RADII.lg)
            .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
            .onClick(() => {
              const rec = this.allRecords()[0];
              this.openLog(rec.startDate.slice(0, 10), rec.id);
            })
          }
        }
        .width('100%').padding({ left: SPACING.md, right: SPACING.md, top: SPACING.md, bottom: SPACING.xxl })
      }.layoutWeight(1).scrollBar(BarState.Off)
    }
    .width('100%').height('100%')
  }

  /* ─── Builder: Calendar Tab ─── */
  @Builder
  private CalendarTab() {
    Stack({ alignContent: Alignment.BottomEnd }) {
      Scroll() {
        Column({ space: SPACING.sm }) {
          // Header with nav — no duplicate status bar
          Row() {
            Text('‹').fontSize(22).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
              .width(40).height(40).textAlign(TextAlign.Center)
              .onClick(() => {
                let m = this.calMonth - 1;
                let y = this.calYear;
                if (m < 0) { m = 11; y -= 1; }
                this.calMonth = m; this.calYear = y; this.rebuildCalendar();
              })

            Text(this.monthLabel())
              .fontSize(FONT_SIZE.titleLarge).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
              .layoutWeight(1).textAlign(TextAlign.Center)

            Text('›').fontSize(22).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
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
            Row() {
              ForEach(getCopy(this.lang).calendar.weekLabels, (label: string) => {
                Text(label).fontSize(FONT_SIZE.footnote).fontColor(COLORS.mutedSoft)
                  .fontWeight(FONT_WEIGHT.medium)
                  .width('14.28%').textAlign(TextAlign.Center)
              }, (label: string) => label)
            }.width('100%')

            Flex({ wrap: FlexWrap.Wrap }) {
              ForEach(this.calDays, (item: CalendarDayInfo) => {
                Column() {
                  if (item.isEmpty) {
                    Column().width(40).height(40)
                  } else {
                    Column() {
                      Text(String(item.day))
                        .fontSize(FONT_SIZE.bodyLarge)
                        .fontWeight(item.isToday || item.isPeriod ? FONT_WEIGHT.bold : FONT_WEIGHT.medium)
                        .fontColor(item.isPeriod ? COLORS.surface
                          : item.isPredicted ? COLORS.accent
                          : item.isToday ? COLORS.ink : COLORS.textBody)
                    }
                    .width(40).height(40).borderRadius(20)
                    .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
                    .backgroundColor(item.isPeriod ? COLORS.accent
                      : item.isToday ? COLORS.pinkMist : 'transparent')
                    .borderWidth(this.selectedCalDate === item.dateKey ? 2 : (item.isPredicted ? 2 : 0))
                    .borderColor(this.selectedCalDate === item.dateKey ? COLORS.accent : COLORS.pinkBorder)
                    .onClick(() => { this.selectDate(item.dateKey); })

                    if (item.hasSymptoms && !item.isPeriod) {
                      Column().width(6).height(6).borderRadius(3)
                        .backgroundColor(COLORS.symptomDot).margin({ top: 4 })
                    } else {
                      Column().height(10)
                    }
                  }
                }
                .width('14.28%').alignItems(HorizontalAlign.Center).margin({ bottom: 8 })
              }, (item: CalendarDayInfo) => item.key)
            }.width('100%')
          }
          .width('100%').borderRadius(RADII.lg).backgroundColor(COLORS.surface)
          .padding({ left: 10, right: 10, top: SPACING.md, bottom: SPACING.sm })
          .borderWidth(1).borderColor(COLORS.lineStrong)

          // Selected day detail card
          this.SelectedDayDetail()

          // Legend
          Row({ space: SPACING.md }) {
            Row({ space: 6 }) {
              Column().width(10).height(10).borderRadius(5).backgroundColor(COLORS.accent)
              Text(getCopy(this.lang).calendar.period).fontSize(FONT_SIZE.footnote).fontColor(COLORS.textBody)
            }
            Row({ space: 6 }) {
              Column().width(10).height(10).borderRadius(5)
                .borderWidth(2).borderColor(COLORS.pinkBorder)
              Text(getCopy(this.lang).calendar.predicted).fontSize(FONT_SIZE.footnote).fontColor(COLORS.textBody)
            }
            Row({ space: 6 }) {
              Column().width(10).height(10).borderRadius(5).backgroundColor(COLORS.symptomDot)
              Text(getCopy(this.lang).calendar.symptoms).fontSize(FONT_SIZE.footnote).fontColor(COLORS.textBody)
            }
          }.width('100%').padding(SPACING.sm).borderRadius(RADII.md)
            .backgroundColor(COLORS.pinkMist).borderWidth(1).borderColor(COLORS.pinkBorder)
        }
        .width('100%').padding({ left: SPACING.md, right: SPACING.md, top: SPACING.md, bottom: 100 })
      }.layoutWeight(1).scrollBar(BarState.Off)

      // FAB
      Button() {
        Text('+').fontSize(28).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.surface)
      }
      .width(56).height(56).borderRadius(28)
      .backgroundColor(COLORS.accent)
      .margin({ right: SPACING.lg, bottom: SPACING.lg })
      .onClick(() => {
        const target = this.selectedCalDate || formatDateKey(new Date());
        const rec = this.selectedCalDate === target ? this.selectedRecord : this.recordForDate(target);
        this.openLog(target, rec?.id);
      })
    }
    .width('100%').height('100%')
  }

  @Builder
  private SelectedDayDetail() {
    Column({ space: SPACING.xs }) {
      Row() {
        Text(formatFullDate(this.selectedCalDate, this.lang === 'zh'))
          .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
        Blank()
        if (this.selectedCalDate === formatDateKey(new Date())) {
          Text(this.lang === 'zh' ? '今天' : 'Today')
            .fontSize(FONT_SIZE.caption).fontColor(COLORS.accent).fontWeight(FONT_WEIGHT.semibold)
            .padding({ left: 8, right: 8, top: 3, bottom: 3 })
            .borderRadius(10).backgroundColor(COLORS.accentSoft)
        } else if (this.selectedIsPredicted) {
          Text(this.lang === 'zh' ? '预测' : 'Predicted')
            .fontSize(FONT_SIZE.caption).fontColor(COLORS.accent).fontWeight(FONT_WEIGHT.semibold)
            .padding({ left: 8, right: 8, top: 3, bottom: 3 })
            .borderRadius(10).backgroundColor(COLORS.accentSoft)
        }
      }.width('100%').alignItems(VerticalAlign.Center)

      if (this.selectedRecord !== null) {
        Row() {
          Text(this.lang === 'zh' ? '流量' : 'Flow')
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted)
          Blank()
          Text(this.flowOptionLabel(this.selectedRecord!.flowLevel))
            .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.ink)
        }.width('100%')
        Row() {
          Text(this.lang === 'zh' ? '疼痛' : 'Pain')
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted)
          Blank()
          Text(String(this.selectedRecord!.painLevel))
            .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.ink)
        }.width('100%')
        Row() {
          Text(this.lang === 'zh' ? '心情' : 'Mood')
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted)
          Blank()
          Text(formatMoodLabel(this.selectedRecord!.mood))
            .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.ink)
        }.width('100%')
        if ((this.selectedRecord!.symptoms ?? []).length > 0) {
          Flex({ wrap: FlexWrap.Wrap }) {
            ForEach(this.selectedRecord!.symptoms ?? [], (s: string) => {
              Text(formatSymptomLabel(s, this.lang === 'zh'))
                .fontSize(FONT_SIZE.caption).fontWeight(FONT_WEIGHT.medium).fontColor(COLORS.inkSecondary)
                .padding({ left: 8, right: 8, top: 3, bottom: 3 })
                .borderRadius(10).backgroundColor(COLORS.chipIdle)
                .margin({ right: 6, bottom: 6 })
            }, (s: string) => s)
          }.width('100%')
        }
        Button(this.lang === 'zh' ? '编辑记录' : 'Edit log')
          .height(40).borderRadius(20)
          .backgroundColor(COLORS.chipIdle).fontColor(COLORS.ink)
          .fontSize(FONT_SIZE.metaLabel).fontWeight(FONT_WEIGHT.semibold)
          .padding({ left: SPACING.lg, right: SPACING.lg })
          .onClick(() => {
            if (this.selectedRecord) {
              this.openLog(this.selectedCalDate, this.selectedRecord.id);
            }
          })
      } else {
        Text(this.lang === 'zh' ? '本日无记录' : 'No log for this day')
          .fontSize(FONT_SIZE.body).fontColor(COLORS.muted).width('100%')
        Button(this.lang === 'zh' ? '添加记录' : 'Add log')
          .height(40).borderRadius(20)
          .backgroundColor(COLORS.accent).fontColor(COLORS.surface)
          .fontSize(FONT_SIZE.metaLabel).fontWeight(FONT_WEIGHT.semibold)
          .padding({ left: SPACING.lg, right: SPACING.lg })
          .onClick(() => { this.openLog(this.selectedCalDate); })
      }
    }
    .width('100%').padding(SPACING.md).borderRadius(RADII.lg)
    .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
    .alignItems(HorizontalAlign.Start)
  }

  /* ─── Builder: Settings Tab ─── */
  @Builder
  private SettingsTab() {
    Scroll() {
      Column({ space: SPACING.sm }) {
        Column() {
          Text(getCopy(this.lang).settings.title)
            .fontSize(FONT_SIZE.heading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
        }.width('100%').alignItems(HorizontalAlign.Start)

        // Cycle length card
        this.CycleLengthCard()

        // Period length card
        this.PeriodLengthCard()

        // Trends navigation card
        Row() {
          Text(getCopy(this.lang).trends.title)
            .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
            .layoutWeight(1)
          Text('›').fontSize(22).fontColor(COLORS.muted)
        }
        .width('100%').padding(SPACING.md).borderRadius(RADII.lg)
        .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
        .alignItems(VerticalAlign.Center)
        .onClick(() => this.openTrends())

        // Reminders card
        Column() {
          Text(getCopy(this.lang).settings.remindersTitle)
            .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
        }
        .width('100%').padding(SPACING.md).borderRadius(RADII.lg)
        .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
        .alignItems(HorizontalAlign.Start)

        // Privacy card
        Column({ space: SPACING.sm }) {
          Row() {
            Text(getCopy(this.lang).settings.privacyTitle)
              .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
            Blank()
            Text('›').fontSize(22).fontColor(COLORS.muted)
          }.width('100%')
          Row({ space: SPACING.sm }) {
            Button(getCopy(this.lang).settings.exportBtn)
              .layoutWeight(1).height(44).borderRadius(RADII.md)
              .backgroundColor(COLORS.ink).fontColor(COLORS.surface)
              .fontSize(FONT_SIZE.metaLabel).fontWeight(FONT_WEIGHT.bold)
              .onClick(async () => {
                try { await api.exportData(); } catch (_) { /* silent */ }
              })
            Button(getCopy(this.lang).settings.deleteBtn)
              .layoutWeight(1).height(44).borderRadius(RADII.md)
              .backgroundColor(COLORS.pinkMist).fontColor(COLORS.accentDeep)
              .fontSize(FONT_SIZE.metaLabel).fontWeight(FONT_WEIGHT.bold)
              .borderWidth(1).borderColor(COLORS.pinkBorder)
              .onClick(async () => {
                try { await api.deleteAccount(); this.refreshDashboard(); } catch (_) { /* silent */ }
              })
          }.width('100%')
        }
        .width('100%').padding(SPACING.md).borderRadius(RADII.lg)
        .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
        .alignItems(HorizontalAlign.Start)
        .onClick(() => this.openPrivacy())
      }
      .width('100%').padding({ left: SPACING.md, right: SPACING.md, top: SPACING.md, bottom: SPACING.xxl })
    }
  }

  @Builder
  private CycleLengthCard() {
    Column({ space: SPACING.xs }) {
      Row() {
        Text(getCopy(this.lang).settings.cycleLen)
          .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
        Blank()
        Text(`${this.summary().recordCount >= AUTO_COMPUTE_THRESHOLD && this.summary().averageCycleLength > 0 ? this.summary().averageCycleLength : this.cycleLength} ${getCopy(this.lang).settings.daysUnit}`)
          .fontSize(FONT_SIZE.title).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.accent)
      }.width('100%')

      if (this.summary().recordCount >= AUTO_COMPUTE_THRESHOLD && this.summary().averageCycleLength > 0) {
        Row({ space: 6 }) {
          Text('✦').fontSize(FONT_SIZE.footnote).fontColor(COLORS.accent)
          Text(this.lang === 'zh'
            ? `基于你的 ${this.summary().recordCount} 条记录自动计算`
            : `Auto-computed from your ${this.summary().recordCount} records`)
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.accentDeep).fontWeight(FONT_WEIGHT.semibold)
        }
        .padding({ left: SPACING.sm, right: SPACING.sm, top: 6, bottom: 6 })
        .borderRadius(RADII.md).backgroundColor(COLORS.pinkMist)
        .borderWidth(1).borderColor(COLORS.pinkBorder)
        .alignItems(VerticalAlign.Center)
      } else {
        Row({ space: SPACING.sm }) {
          Button('-')
            .type(ButtonType.Circle).width(48).height(48)
            .backgroundColor(COLORS.chipIdle).fontColor(COLORS.ink)
            .fontSize(24).fontWeight(FONT_WEIGHT.bold)
            .onClick(() => {
              if (this.cycleLength > 20) { this.cycleLength -= 1; this.rebuildCalendar(); }
            })

          Stack({ alignContent: Alignment.Start }) {
            Column().width('100%').height(10).borderRadius(5).backgroundColor(COLORS.chipIdle)
            Column()
              .width(`${clampProgress(this.cycleLength, 20, 45)}%`)
              .height(10).borderRadius(5).backgroundColor(COLORS.accent)
            Column().width(24).height(24).borderRadius(12)
              .backgroundColor(COLORS.surface)
              .borderWidth(3).borderColor(COLORS.accent)
              .margin({ left: `${clampProgress(this.cycleLength, 20, 45)}%`, top: -7 })
          }.layoutWeight(1).height(24)

          Button('+')
            .type(ButtonType.Circle).width(48).height(48)
            .backgroundColor(COLORS.chipIdle).fontColor(COLORS.ink)
            .fontSize(24).fontWeight(FONT_WEIGHT.bold)
            .onClick(() => {
              if (this.cycleLength < 45) { this.cycleLength += 1; this.rebuildCalendar(); }
            })
        }.width('100%').alignItems(VerticalAlign.Center)

        Text(this.lang === 'zh'
          ? '初始设置值，有足够记录后将自动计算'
          : 'Starting value — updates automatically once you have enough records')
          .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted).width('100%')
      }
    }
    .width('100%').padding(SPACING.md).borderRadius(RADII.lg)
    .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  private PeriodLengthCard() {
    Column({ space: SPACING.xs }) {
      Row() {
        Text(getCopy(this.lang).settings.periodLen)
          .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
        Blank()
        Text(`${this.summary().recordCount >= AUTO_COMPUTE_THRESHOLD && this.summary().averagePeriodLength > 0 ? this.summary().averagePeriodLength : this.periodLength} ${getCopy(this.lang).settings.daysUnit}`)
          .fontSize(FONT_SIZE.title).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.accent)
      }.width('100%')

      if (this.summary().recordCount >= AUTO_COMPUTE_THRESHOLD && this.summary().averagePeriodLength > 0) {
        Row({ space: 6 }) {
          Text('✦').fontSize(FONT_SIZE.footnote).fontColor(COLORS.accent)
          Text(this.lang === 'zh'
            ? `基于你的 ${this.summary().recordCount} 条记录自动计算`
            : `Auto-computed from your ${this.summary().recordCount} records`)
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.accentDeep).fontWeight(FONT_WEIGHT.semibold)
        }
        .padding({ left: SPACING.sm, right: SPACING.sm, top: 6, bottom: 6 })
        .borderRadius(RADII.md).backgroundColor(COLORS.pinkMist)
        .borderWidth(1).borderColor(COLORS.pinkBorder)
        .alignItems(VerticalAlign.Center)
      } else {
        Row({ space: SPACING.sm }) {
          Button('-')
            .type(ButtonType.Circle).width(48).height(48)
            .backgroundColor(COLORS.chipIdle).fontColor(COLORS.ink)
            .fontSize(24).fontWeight(FONT_WEIGHT.bold)
            .onClick(() => {
              if (this.periodLength > 2) { this.periodLength -= 1; this.rebuildCalendar(); }
            })

          Stack({ alignContent: Alignment.Start }) {
            Column().width('100%').height(10).borderRadius(5).backgroundColor(COLORS.chipIdle)
            Column()
              .width(`${clampProgress(this.periodLength, 2, 10)}%`)
              .height(10).borderRadius(5).backgroundColor(COLORS.accent)
            Column().width(24).height(24).borderRadius(12)
              .backgroundColor(COLORS.surface)
              .borderWidth(3).borderColor(COLORS.accent)
              .margin({ left: `${clampProgress(this.periodLength, 2, 10)}%`, top: -7 })
          }.layoutWeight(1).height(24)

          Button('+')
            .type(ButtonType.Circle).width(48).height(48)
            .backgroundColor(COLORS.chipIdle).fontColor(COLORS.ink)
            .fontSize(24).fontWeight(FONT_WEIGHT.bold)
            .onClick(() => {
              if (this.periodLength < 10) { this.periodLength += 1; this.rebuildCalendar(); }
            })
        }.width('100%').alignItems(VerticalAlign.Center)

        Text(this.lang === 'zh'
          ? '初始设置值，有足够记录后将自动计算'
          : 'Starting value — updates automatically once you have enough records')
          .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted).width('100%')
      }
    }
    .width('100%').padding(SPACING.md).borderRadius(RADII.lg)
    .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
    .alignItems(HorizontalAlign.Start)
  }

  build() {
    Column() {
      this.HomeTab()
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLORS.bg)
  }

  @Builder
  private TabItem(label: string, icon: string, index: number) {
    Column({ space: 4 }) {
      Text(icon).fontSize(20)
      Text(label)
        .fontSize(FONT_SIZE.footnote).fontWeight(FONT_WEIGHT.medium)
        .fontColor(this.currentTab === index ? COLORS.accent : COLORS.muted)
    }
    .width('100%').height(60).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
  }
}

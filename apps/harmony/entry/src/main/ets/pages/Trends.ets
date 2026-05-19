import router from '@ohos.router';
import { api } from '../common/ApiClient';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADII, SPACING } from '../common/DesignTokens';
import { DEFAULT_LANGUAGE, LANGUAGE_KEY, getCopy } from '../common/I18n';
import { EMPTY_DASHBOARD, EMPTY_SUMMARY, sortRecords } from '../common/HomePresenter';
import { CycleRecord, CycleSummary, DashboardResponse } from '../common/Types';

interface FlowBarRow {
  label: string;
  percent: number;
}

function recordDurationDays(r: CycleRecord): number {
  const s = new Date(r.startDate);
  const e = new Date(r.endDate);
  const sd = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const ed = new Date(e.getFullYear(), e.getMonth(), e.getDate());
  return Math.max(1, Math.round((ed.getTime() - sd.getTime()) / 86400000) + 1);
}

function __initLangStorage(): string {
  if (!AppStorage.Has(LANGUAGE_KEY)) {
    AppStorage.SetOrCreate(LANGUAGE_KEY, DEFAULT_LANGUAGE);
  }
  return DEFAULT_LANGUAGE;
}
const __LANG_INIT: string = __initLangStorage();

@Entry
@Component
struct Trends {
  @State private lang: string = 'en';
  @State private dashboard: DashboardResponse = EMPTY_DASHBOARD;
  @State private isLoading: boolean = true;

  aboutToAppear(): void {
    // refreshDashboard disabled for Previewer (http module unavailable)
  }

  private async refreshDashboard(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await api.getDashboard();
      this.dashboard = response;
    } catch (_) {
      // silent
    } finally {
      this.isLoading = false;
    }
  }

  private summary(): CycleSummary { return this.dashboard.summary ?? EMPTY_SUMMARY; }
  private allRecords(): Array<CycleRecord> { return sortRecords(this.dashboard.records); }
  private recentRecords(): Array<CycleRecord> { return this.allRecords().slice(0, 3); }

  private flowOptionLabel(opt: string): string {
    const copy = getCopy(this.lang).trends;
    if (opt === 'light') return copy.flowLight;
    if (opt === 'medium') return copy.flowMedium;
    return copy.flowHeavy;
  }

  private buildFlowDistArkTs(): Array<FlowBarRow> {
    const recs = this.allRecords();
    let light = 0;
    let medium = 0;
    let heavy = 0;
    recs.forEach((r: CycleRecord) => {
      if (r.flowLevel === 'light') light++;
      else if (r.flowLevel === 'medium') medium++;
      else if (r.flowLevel === 'heavy') heavy++;
    });
    const total = recs.length || 1;
    const copy = getCopy(this.lang).trends;
    const result: Array<FlowBarRow> = [
      { label: copy.flowLight, percent: Math.round((light / total) * 100) },
      { label: copy.flowMedium, percent: Math.round((medium / total) * 100) },
      { label: copy.flowHeavy, percent: Math.round((heavy / total) * 100) }
    ];
    return result;
  }

  @Builder private Header() {
    Row() {
      Text('‹')
        .fontSize(22).fontColor(COLORS.ink).fontWeight(FONT_WEIGHT.bold)
        .width(36).height(36).textAlign(TextAlign.Center)
        .borderRadius(18).backgroundColor(COLORS.chipIdle)
        .onClick(() => router.back())
      Column() {
        Text(getCopy(this.lang).trends.title)
          .fontSize(FONT_SIZE.title).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
      }.layoutWeight(1).alignItems(HorizontalAlign.Center)
      Column().width(36).height(36)
    }
    .width('100%').alignItems(VerticalAlign.Center)
    .padding({ left: SPACING.md, right: SPACING.md, top: SPACING.xs, bottom: SPACING.xs })
  }

  build() {
    Column() {
      this.Header()

      Scroll() {
        Column({ space: SPACING.sm }) {
          if (this.allRecords().length === 0) {
            Column({ space: 8 }) {
              Text(getCopy(this.lang).trends.noData)
                .fontSize(FONT_SIZE.title).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
              Text(getCopy(this.lang).trends.startHint)
                .fontSize(FONT_SIZE.body).fontColor(COLORS.muted).textAlign(TextAlign.Center)
            }.width('100%').padding(SPACING.xl).borderRadius(RADII.lg).backgroundColor(COLORS.surface)
              .borderWidth(1).borderColor(COLORS.lineStrong)
              .alignItems(HorizontalAlign.Center)
          } else {
            if (this.allRecords().length < 3) {
              Column({ space: 10 }) {
                Row() {
                  Column().width(`${Math.round((Math.min(this.allRecords().length, 3) / 3) * 100)}%`)
                    .height(6).borderRadius(3).backgroundColor(COLORS.accent)
                }.width('100%').height(6).borderRadius(3).backgroundColor(COLORS.pinkBorder)
                Text(`${3 - this.allRecords().length} ${getCopy(this.lang).trends.needMore}`)
                  .fontSize(FONT_SIZE.metaLabel).fontColor(COLORS.inkSecondary).textAlign(TextAlign.Center)
              }.width('100%').padding(SPACING.md).borderRadius(RADII.lg).backgroundColor(COLORS.pinkMist)
                .borderWidth(1).borderColor(COLORS.pinkBorder)
            }

            if (this.allRecords().length >= 3) {
              Row({ space: SPACING.sm }) {
                Column({ space: 2 }) {
                  Text(String(this.summary().averageCycleLength || 28))
                    .fontSize(28).fontWeight(FONT_WEIGHT.heavy).fontColor(COLORS.accent)
                  Text(getCopy(this.lang).trends.dayUnit).fontSize(FONT_SIZE.caption).fontColor(COLORS.muted)
                  Text(getCopy(this.lang).trends.avgCycle)
                    .fontSize(FONT_SIZE.footnote).fontColor(COLORS.inkSecondary)
                }.layoutWeight(1).padding(SPACING.md).borderRadius(RADII.lg).backgroundColor(COLORS.surface)
                  .borderWidth(1).borderColor(COLORS.lineStrong).alignItems(HorizontalAlign.Center)
                Column({ space: 2 }) {
                  Text(String(this.summary().averagePeriodLength || 5))
                    .fontSize(28).fontWeight(FONT_WEIGHT.heavy).fontColor(COLORS.accent)
                  Text(getCopy(this.lang).trends.dayUnit).fontSize(FONT_SIZE.caption).fontColor(COLORS.muted)
                  Text(getCopy(this.lang).trends.avgPeriod)
                    .fontSize(FONT_SIZE.footnote).fontColor(COLORS.inkSecondary)
                }.layoutWeight(1).padding(SPACING.md).borderRadius(RADII.lg).backgroundColor(COLORS.surface)
                  .borderWidth(1).borderColor(COLORS.lineStrong).alignItems(HorizontalAlign.Center)
              }.width('100%')
            }

            Column({ space: SPACING.sm }) {
              Text(getCopy(this.lang).trends.flowDist)
                .fontSize(FONT_SIZE.title).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
              ForEach(this.buildFlowDistArkTs(), (item: FlowBarRow) => {
                Row({ space: SPACING.sm }) {
                  Text(item.label).width(64).fontSize(FONT_SIZE.metaLabel)
                    .fontWeight(FONT_WEIGHT.medium).fontColor(COLORS.inkSecondary)
                  Stack({ alignContent: Alignment.Start }) {
                    Column().layoutWeight(1).height(12).borderRadius(6).backgroundColor(COLORS.chipIdle)
                    Column().width(`${item.percent}%`).height(12).borderRadius(6).backgroundColor(COLORS.accent)
                  }.layoutWeight(1).height(12)
                  Text(`${item.percent}%`).width(48).fontSize(FONT_SIZE.footnote)
                    .fontWeight(FONT_WEIGHT.medium).fontColor(COLORS.muted).textAlign(TextAlign.End)
                }.width('100%').alignItems(VerticalAlign.Center)
              }, (item: FlowBarRow) => item.label)
            }
            .width('100%').padding(SPACING.md).borderRadius(RADII.lg)
            .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)

            Column({ space: SPACING.sm }) {
              Text(getCopy(this.lang).trends.recent)
                .fontSize(FONT_SIZE.title).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
              ForEach(this.recentRecords(), (r: CycleRecord, idx: number) => {
                Row() {
                  Column({ space: 2 }) {
                    Text(`${r.startDate.slice(0, 10)} → ${r.endDate.slice(0, 10)}`)
                      .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.medium).fontColor(COLORS.ink)
                    Text(`${recordDurationDays(r)} ${getCopy(this.lang).trends.dayUnit}`)
                      .fontSize(FONT_SIZE.caption).fontColor(COLORS.muted)
                  }.layoutWeight(1).alignItems(HorizontalAlign.Start)
                  Text(this.flowOptionLabel(r.flowLevel))
                    .fontSize(FONT_SIZE.footnote).fontWeight(FONT_WEIGHT.medium).fontColor(COLORS.accent)
                    .padding({ left: 10, right: 10, top: 4, bottom: 4 })
                    .borderRadius(8).backgroundColor(COLORS.accentSoft)
                }.width('100%').padding({ top: 10, bottom: 10 })
                  .border({ width: { bottom: idx < this.recentRecords().length - 1 ? 1 : 0 }, color: COLORS.divider })
              }, (r: CycleRecord) => r.id)
            }
            .width('100%').padding(SPACING.md).borderRadius(RADII.lg)
            .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
          }
        }
        .width('100%').padding({ left: SPACING.md, right: SPACING.md, top: SPACING.xs, bottom: SPACING.xxl })
      }.layoutWeight(1).scrollBar(BarState.Off)
    }
    .width('100%').height('100%').backgroundColor(COLORS.bg)
  }
}

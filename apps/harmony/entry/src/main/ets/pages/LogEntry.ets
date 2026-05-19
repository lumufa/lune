import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import { api } from '../common/ApiClient';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADII, SPACING } from '../common/DesignTokens';
import { DEFAULT_LANGUAGE, LANGUAGE_KEY, getCopy } from '../common/I18n';
import { formatMoodLabel } from '../common/Formatters';
import { CycleRecordInput } from '../common/Types';

const FLOW_OPTIONS: string[] = ['light', 'medium', 'heavy'];
const PAIN_OPTIONS: number[] = [0, 1, 2, 3];
const MOOD_OPTIONS: string[] = ['steady', 'low', 'irritable', 'tired', 'energetic'];
const SYMPTOM_OPTIONS: string[] = ['cramps', 'bloating', 'headache', 'fatigue', 'back_pain', 'acne'];

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

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface LogParams {
  date?: string;
  recordId?: string;
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
struct LogEntry {
  @State private lang: string = 'en';
  @State private recStartDate: string = formatDateKey(new Date());
  @State private recEndDate: string = formatDateKey(new Date());
  @State private recFlow: string = 'medium';
  @State private recPain: number = 1;
  @State private recMood: string = 'steady';
  @State private recSymptoms: Array<string> = ['cramps'];
  @State private recNote: string = '';
  @State private recSubmitting: boolean = false;
  @State private recordId: string = '';

  aboutToAppear(): void {
    const params = (router.getParams() ?? {}) as LogParams;
    if (params.date) {
      this.recStartDate = params.date;
      this.recEndDate = params.date;
    }
    if (params.recordId) {
      this.recordId = params.recordId;
    }
  }

  private flowLabel(opt: string): string {
    const copy = getCopy(this.lang).trends;
    if (opt === 'light') return copy.flowLight;
    if (opt === 'medium') return copy.flowMedium;
    return copy.flowHeavy;
  }

  private dismiss(): void {
    router.back();
  }

  private async submit(): Promise<void> {
    if (this.recSubmitting) return;
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
      if (this.recordId) {
        await api.updateRecord(this.recordId, payload);
      } else {
        await api.createRecord(payload);
      }
      promptAction.showToast({ message: this.lang === 'zh' ? '已保存' : 'Saved', duration: 1500 });
      this.dismiss();
    } catch (e) {
      promptAction.showToast({ message: this.lang === 'zh' ? '保存失败，请稍后重试' : 'Save failed', duration: 2000 });
    } finally {
      this.recSubmitting = false;
    }
  }

  @Builder private Header() {
    Row() {
      Text('✕')
        .fontSize(18).fontColor(COLORS.ink)
        .width(36).height(36).textAlign(TextAlign.Center)
        .borderRadius(18).backgroundColor(COLORS.chipIdle)
        .onClick(() => this.dismiss())
      Column() {
        Text(getCopy(this.lang).log.title)
          .fontSize(FONT_SIZE.title).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink)
      }.layoutWeight(1).alignItems(HorizontalAlign.Center)
      Column().width(36).height(36)
    }
    .width('100%').alignItems(VerticalAlign.Center)
    .padding({ left: SPACING.md, right: SPACING.md, top: SPACING.xs, bottom: SPACING.xs })
  }

  @Builder private DateCard() {
    Column({ space: SPACING.xs }) {
      Text(getCopy(this.lang).log.dateRange)
        .fontSize(FONT_SIZE.bodyLarge).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
      Row({ space: SPACING.sm }) {
        Column({ space: 4 }) {
          Text(getCopy(this.lang).log.start)
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted).width('100%')
          Text(this.recStartDate)
            .fontSize(FONT_SIZE.bodyLarge).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.ink)
            .height(40).borderRadius(RADII.md).backgroundColor(COLORS.chipIdle)
            .padding({ left: SPACING.sm, right: SPACING.sm }).width('100%').textAlign(TextAlign.Center)
        }.layoutWeight(1)
        Column({ space: 4 }) {
          Text(getCopy(this.lang).log.end)
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted).width('100%')
          Text(this.recEndDate)
            .fontSize(FONT_SIZE.bodyLarge).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.ink)
            .height(40).borderRadius(RADII.md).backgroundColor(COLORS.chipIdle)
            .padding({ left: SPACING.sm, right: SPACING.sm }).width('100%').textAlign(TextAlign.Center)
        }.layoutWeight(1)
      }.width('100%')
    }
    .width('100%').padding(SPACING.sm).borderRadius(RADII.lg)
    .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
  }

  @Builder private FlowCard() {
    Column({ space: SPACING.xs }) {
      Text(getCopy(this.lang).log.flow)
        .fontSize(FONT_SIZE.bodyLarge).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
      Row({ space: SPACING.xs }) {
        ForEach(FLOW_OPTIONS, (opt: string) => {
          Text(this.flowLabel(opt))
            .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.semibold)
            .fontColor(this.recFlow === opt ? COLORS.accent : COLORS.textBody)
            .height(40).layoutWeight(1).textAlign(TextAlign.Center).borderRadius(RADII.md)
            .borderWidth(1).borderColor(this.recFlow === opt ? COLORS.pinkBorder : COLORS.lineStrong)
            .backgroundColor(this.recFlow === opt ? COLORS.pinkMist : COLORS.surface)
            .onClick(() => { this.recFlow = opt; })
        }, (opt: string) => opt)
      }.width('100%')
    }
    .width('100%').padding(SPACING.sm).borderRadius(RADII.lg)
    .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
  }

  @Builder private PainCard() {
    Column({ space: SPACING.xs }) {
      Text(getCopy(this.lang).log.pain)
        .fontSize(FONT_SIZE.bodyLarge).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
      Row({ space: SPACING.xs }) {
        ForEach(PAIN_OPTIONS, (opt: number) => {
          Text(String(opt))
            .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.semibold)
            .fontColor(this.recPain === opt ? COLORS.accent : COLORS.textBody)
            .height(40).layoutWeight(1).textAlign(TextAlign.Center).borderRadius(RADII.md)
            .borderWidth(1).borderColor(this.recPain === opt ? COLORS.pinkBorder : COLORS.lineStrong)
            .backgroundColor(this.recPain === opt ? COLORS.pinkMist : COLORS.surface)
            .onClick(() => { this.recPain = opt; })
        }, (opt: number) => String(opt))
      }.width('100%')
    }
    .width('100%').padding(SPACING.sm).borderRadius(RADII.lg)
    .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
  }

  @Builder private SymptomsCard() {
    Column({ space: SPACING.xs }) {
      Text(getCopy(this.lang).log.symptoms)
        .fontSize(FONT_SIZE.bodyLarge).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
      Flex({ wrap: FlexWrap.Wrap }) {
        ForEach(SYMPTOM_OPTIONS, (opt: string) => {
          Column() {
            Text(formatSymptomLabel(opt, this.lang === 'zh'))
              .fontSize(FONT_SIZE.footnote)
              .fontColor(this.recSymptoms.indexOf(opt) >= 0 ? COLORS.accent : COLORS.textBody)
              .fontWeight(this.recSymptoms.indexOf(opt) >= 0 ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium)
              .textAlign(TextAlign.Center)
          }
          .width('31%').height(60).borderRadius(RADII.md)
          .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
          .borderWidth(1).borderColor(this.recSymptoms.indexOf(opt) >= 0 ? COLORS.pinkBorder : COLORS.lineStrong)
          .backgroundColor(this.recSymptoms.indexOf(opt) >= 0 ? COLORS.pinkMist : COLORS.surface)
          .margin({ right: '2.5%', bottom: 8 })
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
    }
    .width('100%').padding(SPACING.sm).borderRadius(RADII.lg)
    .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
  }

  @Builder private MoodCard() {
    Column({ space: SPACING.xs }) {
      Text(getCopy(this.lang).log.mood)
        .fontSize(FONT_SIZE.bodyLarge).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
      Flex({ wrap: FlexWrap.Wrap }) {
        ForEach(MOOD_OPTIONS, (opt: string) => {
          Text(formatMoodLabel(opt))
            .fontSize(FONT_SIZE.metaLabel).fontWeight(FONT_WEIGHT.semibold)
            .fontColor(this.recMood === opt ? COLORS.accent : COLORS.textBody)
            .height(32).padding({ left: SPACING.sm, right: SPACING.sm }).borderRadius(16)
            .backgroundColor(this.recMood === opt ? COLORS.pinkMist : COLORS.chipIdle)
            .margin({ right: 8, bottom: 8 })
            .onClick(() => { this.recMood = opt; })
        }, (opt: string) => opt)
      }.width('100%')
    }
    .width('100%').padding(SPACING.sm).borderRadius(RADII.lg)
    .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
  }

  @Builder private NoteCard() {
    Column({ space: SPACING.xs }) {
      Text(getCopy(this.lang).log.note)
        .fontSize(FONT_SIZE.bodyLarge).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
      TextInput({ placeholder: getCopy(this.lang).log.notePlaceholder, text: this.recNote })
        .height(88).borderRadius(RADII.md).backgroundColor(COLORS.chipIdle)
        .fontSize(FONT_SIZE.body).fontColor(COLORS.ink)
        .onChange((value: string) => { this.recNote = value; })
    }
    .width('100%').padding(SPACING.sm).borderRadius(RADII.lg)
    .backgroundColor(COLORS.surface).borderWidth(1).borderColor(COLORS.lineStrong)
  }

  build() {
    Column() {
      this.Header()

      Scroll() {
        Column({ space: SPACING.xs }) {
          this.DateCard()
          this.FlowCard()
          this.PainCard()
          this.SymptomsCard()
          this.MoodCard()
          this.NoteCard()

          Button(this.recSubmitting ? getCopy(this.lang).log.saving : getCopy(this.lang).log.save)
            .width('100%').height(52).borderRadius(RADII.md)
            .backgroundColor(COLORS.ink).fontColor(COLORS.surface)
            .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold)
            .margin({ top: SPACING.xs })
            .enabled(!this.recSubmitting)
            .onClick(() => { this.submit(); })
        }
        .width('100%').padding({ left: SPACING.md, right: SPACING.md, top: SPACING.xs, bottom: SPACING.xxl })
      }.layoutWeight(1).scrollBar(BarState.Off)
    }
    .width('100%').height('100%').backgroundColor(COLORS.bg)
  }
}

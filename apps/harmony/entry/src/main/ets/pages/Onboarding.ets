import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import common from '@ohos.app.ability.common';
import { api } from '../common/ApiClient';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADII, SHADOWS, SPACING } from '../common/DesignTokens';
import { OnboardingStorage } from '../common/OnboardingStorage';
import { AppCopy, DEFAULT_LANGUAGE, LANGUAGE_KEY, getCopy, getLanguageToggleLabel, getNextLanguage } from '../common/I18n';

const CONSENT_VERSION: string = '2026.03';
const FEATURE_ICONS: Array<string> = ['📅', '✅', '🔔'];
const TRUST_ICONS: Array<string> = ['🔒', '📱', '🚫', '🧹'];

interface FeatureItem {
  icon: string;
  title: string;
}

interface TrustItem {
  icon: string;
  label: string;
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
struct Onboarding {
  @State private lang: string = 'en';
  @State private currentPage: number = 0;
  @State private isSubmitting: boolean = false;

  private buildFeatures(copy: AppCopy): Array<FeatureItem> {
    const result: Array<FeatureItem> = [];
    for (let i = 0; i < copy.onboarding.features.length; i++) {
      result.push({ icon: FEATURE_ICONS[i] ?? '•', title: copy.onboarding.features[i] });
    }
    return result;
  }

  private buildTrust(copy: AppCopy): Array<TrustItem> {
    const result: Array<TrustItem> = [];
    for (let i = 0; i < copy.onboarding.trust.length; i++) {
      result.push({ icon: TRUST_ICONS[i] ?? '•', label: copy.onboarding.trust[i] });
    }
    return result;
  }

  private onMainAction(): void {
    if (this.currentPage < 2) {
      this.currentPage = this.currentPage + 1;
    } else {
      this.completeOnboarding();
    }
  }

  private async completeOnboarding(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    try {
      await api.grantConsent({
        type: 'privacy_policy',
        version: CONSENT_VERSION,
        purpose: 'Display privacy policy and user agreement'
      });
      await api.grantConsent({
        type: 'sensitive_health_data',
        version: CONSENT_VERSION,
        purpose: 'Record cycle and symptoms to generate prediction'
      });
      const context = getContext(this) as common.UIAbilityContext;
      await OnboardingStorage.setComplete(context, true);
      api.trackEvent('onboarding_complete').catch(() => undefined);
      router.replaceUrl({ url: 'pages/Index' });
    } catch (e) {
      promptAction.showToast({ message: getCopy(this.lang).onboarding.initFailed, duration: 2000 });
    } finally {
      this.isSubmitting = false;
    }
  }

  @Builder private HeroPage(copy: AppCopy) {
    Column({ space: SPACING.lg }) {
      Stack() {
        Circle({ width: 220, height: 220 }).fill(COLORS.pinkMist).opacity(0.7)
        Circle({ width: 168, height: 168 })
          .fill(COLORS.surface)
          .stroke(COLORS.pinkBorder)
          .strokeWidth(2)
        Circle({ width: 92, height: 92 }).fill(COLORS.accentSoft)
        Text('💧').fontSize(44)
      }
      .width(220).height(220)

      Column({ space: 6 }) {
        Text(copy.onboarding.heroA)
          .fontSize(FONT_SIZE.displaySmall).fontWeight(FONT_WEIGHT.bold)
          .fontColor(COLORS.ink).textAlign(TextAlign.Center)
        Text(copy.onboarding.heroB)
          .fontSize(FONT_SIZE.displaySmall).fontWeight(FONT_WEIGHT.bold)
          .fontColor(COLORS.accent).textAlign(TextAlign.Center)
      }

      Text(copy.onboarding.heroSub)
        .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.medium)
        .fontColor(COLORS.muted).textAlign(TextAlign.Center)
    }
    .width('100%')
    .alignItems(HorizontalAlign.Center)
    .padding({ top: SPACING.xl })
  }

  @Builder private FeaturePage(copy: AppCopy) {
    Column({ space: SPACING.lg }) {
      Text(copy.onboarding.featureTitle)
        .fontSize(FONT_SIZE.displaySmall).fontWeight(FONT_WEIGHT.bold)
        .fontColor(COLORS.ink).textAlign(TextAlign.Center).width('100%')

      Column({ space: SPACING.sm }) {
        ForEach(this.buildFeatures(copy), (item: FeatureItem) => {
          Row({ space: SPACING.md }) {
            Stack() {
              Circle({ width: 48, height: 48 }).fill(COLORS.pinkMist)
              Text(item.icon).fontSize(24)
            }.width(48).height(48)

            Text(item.title)
              .fontSize(FONT_SIZE.bodyLarge).fontWeight(FONT_WEIGHT.semibold)
              .fontColor(COLORS.ink).layoutWeight(1)
          }
          .width('100%')
          .padding(SPACING.md)
          .backgroundColor(COLORS.surface)
          .borderRadius(RADII.lg)
          .border({ width: 1, color: COLORS.lineStrong })
          .shadow({
            radius: SHADOWS.card.radius,
            color: SHADOWS.card.color,
            offsetX: SHADOWS.card.offsetX,
            offsetY: SHADOWS.card.offsetY
          })
        }, (item: FeatureItem) => item.icon)
      }
    }
    .width('100%')
    .padding({ top: SPACING.md })
  }

  @Builder private TrustPage(copy: AppCopy) {
    Column({ space: SPACING.lg }) {
      Text(copy.onboarding.trustTitle)
        .fontSize(FONT_SIZE.displaySmall).fontWeight(FONT_WEIGHT.bold)
        .fontColor(COLORS.ink).textAlign(TextAlign.Center).width('100%')

      Column({ space: SPACING.sm }) {
        Row() {
          this.TrustItemView(this.buildTrust(copy)[0])
          this.TrustItemView(this.buildTrust(copy)[1])
        }.width('100%')
        Row() {
          this.TrustItemView(this.buildTrust(copy)[2])
          this.TrustItemView(this.buildTrust(copy)[3])
        }.width('100%')
      }
      .width('100%')
      .padding(SPACING.md)
      .backgroundColor(COLORS.surface)
      .borderRadius(RADII.lg)
      .border({ width: 1, color: COLORS.lineStrong })
      .shadow({
        radius: SHADOWS.card.radius,
        color: SHADOWS.card.color,
        offsetX: SHADOWS.card.offsetX,
        offsetY: SHADOWS.card.offsetY
      })
    }
    .width('100%')
    .padding({ top: SPACING.md })
  }

  @Builder private TrustItemView(item: TrustItem) {
    Column({ space: 6 }) {
      Text(item.icon).fontSize(26)
      Text(item.label)
        .fontSize(FONT_SIZE.footnote).fontWeight(FONT_WEIGHT.semibold)
        .fontColor(COLORS.inkSecondary).textAlign(TextAlign.Center)
    }
    .layoutWeight(1)
    .padding({ top: SPACING.sm, bottom: SPACING.sm, left: SPACING.xs, right: SPACING.xs })
    .alignItems(HorizontalAlign.Center)
  }

  @Builder private Pip(index: number) {
    Row()
      .width(this.currentPage === index ? 24 : 8)
      .height(8)
      .borderRadius(4)
      .backgroundColor(this.currentPage === index ? COLORS.accent : COLORS.lineStrong)
      .onClick(() => { this.currentPage = index })
  }

  build() {
    Column() {
      Row() {
        Row({ space: 4 }) {
          Circle({ width: 20, height: 20 }).stroke(COLORS.accent).strokeWidth(2).fill(Color.Transparent)
          Circle({ width: 6, height: 6 }).fill(COLORS.accent).margin({ left: -14 })
        }.width(36).height(36).justifyContent(FlexAlign.Center).alignItems(VerticalAlign.Center)

        Blank()

        Text(getLanguageToggleLabel(this.lang))
          .fontSize(FONT_SIZE.metaLabel)
          .fontWeight(FONT_WEIGHT.semibold)
          .fontColor(COLORS.accentDeep)
          .textAlign(TextAlign.Center)
          .width(44)
          .height(32)
          .borderRadius(16)
          .backgroundColor(COLORS.pinkMist)
          .onClick(() => { this.lang = getNextLanguage(this.lang) })
      }
      .width('100%')
      .padding({ left: SPACING.lg, right: SPACING.lg, top: SPACING.sm, bottom: SPACING.xs })

      Scroll() {
        Column() {
          if (this.currentPage === 0) { this.HeroPage(getCopy(this.lang)) }
          if (this.currentPage === 1) { this.FeaturePage(getCopy(this.lang)) }
          if (this.currentPage === 2) { this.TrustPage(getCopy(this.lang)) }
        }
        .width('100%')
        .padding({ left: SPACING.lg, right: SPACING.lg })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)

      Column({ space: SPACING.sm }) {
        Button(this.currentPage === 0
          ? getCopy(this.lang).onboarding.btnLearn
          : this.currentPage === 1
            ? getCopy(this.lang).onboarding.btnContinue
            : getCopy(this.lang).onboarding.btnStart)
          .width('100%')
          .height(52)
          .backgroundColor(COLORS.accent)
          .fontColor('#FFFFFF')
          .fontSize(FONT_SIZE.subheading)
          .fontWeight(FONT_WEIGHT.bold)
          .borderRadius(RADII.md)
          .enabled(!this.isSubmitting)
          .opacity(this.isSubmitting ? 0.6 : 1)
          .onClick(() => this.onMainAction())

        Row() {
          if (this.currentPage < 2) {
            Text(getCopy(this.lang).onboarding.skip)
              .fontSize(FONT_SIZE.body).fontColor(COLORS.muted).fontWeight(FONT_WEIGHT.medium)
              .width(56)
              .onClick(() => { this.currentPage = 2 })
          } else {
            Row().width(56)
          }

          Row({ space: 8 }) {
            this.Pip(0)
            this.Pip(1)
            this.Pip(2)
          }
          .layoutWeight(1)
          .justifyContent(FlexAlign.Center)

          Row().width(56)
        }
        .width('100%')

        if (this.currentPage === 2) {
          Text(getCopy(this.lang).onboarding.footerNote)
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted).textAlign(TextAlign.Center).width('100%')
        }
      }
      .width('100%')
      .padding({ left: SPACING.lg, right: SPACING.lg, top: SPACING.md, bottom: SPACING.lg })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLORS.bg)
  }
}

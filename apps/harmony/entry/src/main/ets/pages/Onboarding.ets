import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import { common } from '@kit.AbilityKit';
import { api } from '../common/ApiClient';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADII, SHADOWS, SPACING } from '../common/DesignTokens';
import { OnboardingStorage } from '../common/OnboardingStorage';

const CONSENT_VERSION: string = '2026.03';

interface FeatureItem {
  icon: string;
  title: string;
}

interface TrustItem {
  icon: string;
  label: string;
}

@Entry
@Component
struct Onboarding {
  @State private currentPage: number = 0;
  @State private isSubmitting: boolean = false;

  private readonly features: Array<FeatureItem> = [
    { icon: '📅', title: 'No account, open and use' },
    { icon: '✅', title: 'Export your data anytime' },
    { icon: '🔔', title: 'Quiet reminders' }
  ];

  private readonly trustItems: Array<TrustItem> = [
    { icon: '🔒', label: 'End-to-end encrypted' },
    { icon: '📱', label: 'Data stays on device' },
    { icon: '🚫', label: 'Never sell user data' },
    { icon: '🧹', label: 'Delete anytime' }
  ];

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
      promptAction.showToast({ message: 'Initialization failed, try again later', duration: 2000 });
    } finally {
      this.isSubmitting = false;
    }
  }

  @Builder private HeroPage() {
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
        Text('Your cycle data')
          .fontSize(FONT_SIZE.displaySmall).fontWeight(FONT_WEIGHT.bold)
          .fontColor(COLORS.ink).textAlign(TextAlign.Center)
        Text('stays in your hands')
          .fontSize(FONT_SIZE.displaySmall).fontWeight(FONT_WEIGHT.bold)
          .fontColor(COLORS.accent).textAlign(TextAlign.Center)
      }

      Text('Precise forecast · Smart reminders · No sign-up')
        .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.medium)
        .fontColor(COLORS.muted).textAlign(TextAlign.Center)
    }
    .width('100%')
    .alignItems(HorizontalAlign.Center)
    .padding({ top: SPACING.xl })
  }

  @Builder private FeaturePage() {
    Column({ space: SPACING.lg }) {
      Text('Core features')
        .fontSize(FONT_SIZE.displaySmall).fontWeight(FONT_WEIGHT.bold)
        .fontColor(COLORS.ink).textAlign(TextAlign.Center).width('100%')

      Column({ space: SPACING.sm }) {
        ForEach(this.features, (item: FeatureItem) => {
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

  @Builder private TrustPage() {
    Column({ space: SPACING.lg }) {
      Text('Privacy promise')
        .fontSize(FONT_SIZE.displaySmall).fontWeight(FONT_WEIGHT.bold)
        .fontColor(COLORS.ink).textAlign(TextAlign.Center).width('100%')

      Column({ space: SPACING.sm }) {
        Row() {
          this.TrustItemView(this.trustItems[0])
          this.TrustItemView(this.trustItems[1])
        }.width('100%')
        Row() {
          this.TrustItemView(this.trustItems[2])
          this.TrustItemView(this.trustItems[3])
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
      }
      .width('100%')
      .padding({ left: SPACING.lg, right: SPACING.lg, top: SPACING.sm, bottom: SPACING.xs })

      Scroll() {
        Column() {
          if (this.currentPage === 0) { this.HeroPage() }
          if (this.currentPage === 1) { this.FeaturePage() }
          if (this.currentPage === 2) { this.TrustPage() }
        }
        .width('100%')
        .padding({ left: SPACING.lg, right: SPACING.lg })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)

      Column({ space: SPACING.sm }) {
        Button(this.currentPage === 0 ? 'Learn more' : this.currentPage === 1 ? 'Continue' : 'Start tracking')
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
            Text('Skip')
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
          Text('No sign-up · Data stays local')
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

import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import { api } from '../common/ApiClient';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADII, SHADOWS, SPACING } from '../common/DesignTokens';
import { ConsentRecord, ExportBundle, PrivacyAction } from '../common/Types';
import { AppCopy, DEFAULT_LANGUAGE, LANGUAGE_KEY, PrivacyCopy, getCopy, getLanguageToggleLabel, getNextLanguage } from '../common/I18n';

const CONSENT_TYPES: Array<string> = ['privacy_policy', 'sensitive_health_data', 'notifications'];

interface ToggleView {
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  latestId: string;
}

function consentTitle(type: string, copy: PrivacyCopy): string {
  if (type === 'privacy_policy') return copy.consentPrivacy;
  if (type === 'sensitive_health_data') return copy.consentSensitive;
  return copy.consentNotifications;
}

function consentPurpose(type: string, copy: PrivacyCopy): string {
  if (type === 'privacy_policy') return copy.purposePrivacy;
  if (type === 'sensitive_health_data') return copy.purposeSensitive;
  return copy.purposeNotifications;
}

function actionTypeLabel(type: string, copy: PrivacyCopy): string {
  if (type === 'export_data') return copy.actionExport;
  if (type === 'delete_account') return copy.actionDelete;
  if (type === 'logout') return copy.actionLogout;
  return copy.actionWithdraw;
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
struct Privacy {
  @State private lang: string = 'en';
  @State private consents: Array<ConsentRecord> = [];
  @State private actions: Array<PrivacyAction> = [];
  @State private toggles: Array<ToggleView> = [];
  @State private exportBundle: ExportBundle | null = null;
  @State private isToggling: boolean = false;
  @State private isDeleting: boolean = false;

  aboutToAppear(): void {
    // loadData disabled for Previewer (http module unavailable)
  }

  private rebuildToggles(): void {
    const copy = getCopy(this.lang).privacy;
    const result: Array<ToggleView> = [];
    for (const type of CONSENT_TYPES) {
      const matched = this.consents.filter((item: ConsentRecord) => item.type === type);
      const latest = matched.length ? matched[matched.length - 1] : null;
      const enabled = latest !== null && latest.status === 'granted';
      let statusStr = copy.statusNone;
      if (latest) {
        statusStr = latest.status === 'granted' ? copy.statusGranted : copy.statusWithdrawn;
      }
      result.push({
        type: type,
        title: consentTitle(type, copy),
        subtitle: `${copy.statusPrefix}: ${statusStr}`,
        enabled: enabled,
        latestId: latest ? latest.id : ''
      });
    }
    this.toggles = result;
  }

  private async loadData(): Promise<void> {
    try {
      const consents = await api.listConsents();
      const actions = await api.listPrivacyActions();
      this.consents = consents;
      this.actions = actions;
      this.rebuildToggles();
    } catch (e) {
      promptAction.showToast({ message: getCopy(this.lang).privacy.loadFailed, duration: 2000 });
    }
  }

  private async toggleConsent(type: string, enabled: boolean, latestId: string): Promise<void> {
    if (this.isToggling) return;
    this.isToggling = true;
    try {
      if (enabled) {
        await api.grantConsent({
          type: type,
          version: 'v1.0.0',
          purpose: consentPurpose(type, getCopy(this.lang).privacy)
        });
      } else if (latestId.length > 0) {
        await api.withdrawConsent(latestId);
      }
      await this.loadData();
    } catch (e) {
      promptAction.showToast({ message: getCopy(this.lang).privacy.actionFailed, duration: 2000 });
    } finally {
      this.isToggling = false;
    }
  }

  private async exportData(): Promise<void> {
    try {
      const bundle = await api.exportData();
      this.exportBundle = bundle;
      api.trackEvent('export_data', { recordCount: bundle.cycles.length }).catch(() => undefined);
    } catch (e) {
      promptAction.showToast({ message: getCopy(this.lang).privacy.exportFailed, duration: 2000 });
    }
  }

  private async withdrawSensitive(): Promise<void> {
    const copy = getCopy(this.lang).privacy;
    const granted = this.consents
      .filter((item: ConsentRecord) => item.type === 'sensitive_health_data' && item.status === 'granted')
      .slice(-1)[0];
    if (!granted) {
      promptAction.showToast({ message: copy.withdrawMissing, duration: 2000 });
      return;
    }
    try {
      await api.withdrawConsent(granted.id);
      await this.loadData();
    } catch (e) {
      promptAction.showToast({ message: copy.withdrawFailed, duration: 2000 });
    }
  }

  private async deleteAccount(): Promise<void> {
    if (this.isDeleting) return;
    this.isDeleting = true;
    const copy = getCopy(this.lang).privacy;
    try {
      await api.deleteAccount();
      this.consents = [];
      this.actions = [];
      this.exportBundle = null;
      this.rebuildToggles();
      promptAction.showToast({ message: copy.deleted, duration: 2000 });
    } catch (e) {
      promptAction.showToast({ message: copy.deleteFailed, duration: 2000 });
    } finally {
      this.isDeleting = false;
    }
  }

  @Builder private Header(copy: AppCopy) {
    Row() {
      Text('◀')
        .fontSize(18).fontColor(COLORS.ink)
        .width(44).height(44).textAlign(TextAlign.Center)
        .onClick(() => router.back())
      Text(copy.privacy.backTitle)
        .fontSize(FONT_SIZE.titleLarge).fontWeight(FONT_WEIGHT.bold)
        .fontColor(COLORS.ink).layoutWeight(1).textAlign(TextAlign.Center)
      Text(getLanguageToggleLabel(this.lang))
        .fontSize(FONT_SIZE.metaLabel)
        .fontWeight(FONT_WEIGHT.semibold)
        .fontColor(COLORS.accentDeep)
        .textAlign(TextAlign.Center)
        .width(44)
        .height(32)
        .borderRadius(16)
        .backgroundColor(COLORS.pinkMist)
        .onClick(() => {
          this.lang = getNextLanguage(this.lang);
          this.rebuildToggles();
        })
    }
    .width('100%')
    .padding({ left: SPACING.md, right: SPACING.md })
  }

  @Builder private HeroCard(copy: AppCopy) {
    Column() {
      Text(copy.privacy.heroTitle)
        .fontSize(FONT_SIZE.titleLarge).fontWeight(FONT_WEIGHT.bold)
        .fontColor(COLORS.ink).width('100%')
    }
    .width('100%')
    .padding(SPACING.md)
    .backgroundColor(COLORS.pinkMist)
    .borderRadius(RADII.lg)
    .border({ width: 1, color: COLORS.pinkBorder })
  }

  @Builder private ToggleSection(copy: AppCopy) {
    Column({ space: SPACING.sm }) {
      Text(copy.privacy.togglesTitle)
        .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')

      Column() {
        ForEach(this.toggles, (item: ToggleView, index: number) => {
          Row({ space: SPACING.md }) {
            Column({ space: 2 }) {
              Text(item.title)
                .fontSize(FONT_SIZE.body).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.ink).width('100%')
              Text(item.subtitle)
                .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted).width('100%')
            }.layoutWeight(1)

            Toggle({ type: ToggleType.Switch, isOn: item.enabled })
              .selectedColor(COLORS.accent)
              .enabled(!this.isToggling)
              .onChange((on: boolean) => this.toggleConsent(item.type, on, item.latestId))
          }
          .width('100%')
          .padding({ top: SPACING.sm, bottom: SPACING.sm })
          .border(index < this.toggles.length - 1
            ? { width: { bottom: 0.5 }, color: COLORS.divider }
            : { width: 0 })
        }, (item: ToggleView) => item.type)
      }
      .width('100%')
    }
    .width('100%')
    .padding(SPACING.md)
    .backgroundColor(COLORS.surface)
    .borderRadius(RADII.lg)
    .border({ width: 1, color: COLORS.lineStrong })
    .shadow({
      radius: SHADOWS.card.radius, color: SHADOWS.card.color,
      offsetX: SHADOWS.card.offsetX, offsetY: SHADOWS.card.offsetY
    })
  }

  @Builder private ExportSection(copy: AppCopy) {
    Column({ space: SPACING.sm }) {
      Text(copy.privacy.exportTitle)
        .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
      Text(copy.privacy.exportBody)
        .fontSize(FONT_SIZE.metaLabel).fontColor(COLORS.textBody).width('100%')

      Button(copy.privacy.exportButton)
        .width('100%')
        .height(48)
        .backgroundColor(COLORS.ink)
        .fontColor('#FFFFFF')
        .fontSize(FONT_SIZE.body)
        .fontWeight(FONT_WEIGHT.bold)
        .borderRadius(RADII.md)
        .onClick(() => this.exportData())

      if (this.exportBundle) {
        Column({ space: 2 }) {
          Text(copy.privacy.previewTitle)
            .fontSize(FONT_SIZE.metaLabel).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
          Text(`${copy.privacy.previewAt}${this.exportBundle.exportedAt.slice(0, 16)}`)
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.inkSecondary).width('100%')
          Text(`${this.exportBundle.cycles.length} ${copy.privacy.previewUnit}`)
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.inkSecondary).width('100%')
        }
        .width('100%')
        .padding(SPACING.sm)
        .backgroundColor(COLORS.pinkMist)
        .borderRadius(RADII.md)
      }
    }
    .width('100%')
    .padding(SPACING.md)
    .backgroundColor(COLORS.surface)
    .borderRadius(RADII.lg)
    .border({ width: 1, color: COLORS.lineStrong })
  }

  @Builder private DangerSection(copy: AppCopy) {
    Column({ space: SPACING.sm }) {
      Text(copy.privacy.sensitiveTitle)
        .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')

      Row({ space: SPACING.sm }) {
        Button(copy.privacy.withdrawLabel)
          .layoutWeight(1)
          .height(44)
          .backgroundColor(COLORS.surface)
          .fontColor(COLORS.ink)
          .fontSize(FONT_SIZE.metaLabel)
          .fontWeight(FONT_WEIGHT.semibold)
          .borderRadius(RADII.md)
          .border({ width: 1, color: COLORS.lineStrong })
          .onClick(() => this.withdrawSensitive())

        Button(copy.privacy.deleteLabel)
          .layoutWeight(1)
          .height(44)
          .backgroundColor(COLORS.pinkMist)
          .fontColor(COLORS.accentDeep)
          .fontSize(FONT_SIZE.metaLabel)
          .fontWeight(FONT_WEIGHT.bold)
          .borderRadius(RADII.md)
          .border({ width: 1, color: COLORS.pinkBorder })
          .enabled(!this.isDeleting)
          .opacity(this.isDeleting ? 0.6 : 1)
          .onClick(() => this.deleteAccount())
      }
      .width('100%')
    }
    .width('100%')
    .padding(SPACING.md)
    .backgroundColor(COLORS.surface)
    .borderRadius(RADII.lg)
    .border({ width: 1, color: COLORS.lineStrong })
  }

  @Builder private ActionSection(copy: AppCopy) {
    Column({ space: SPACING.sm }) {
      Text(copy.privacy.actionsTitle)
        .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')

      if (this.actions.length > 0) {
        Column() {
          ForEach(this.actions, (item: PrivacyAction, index: number) => {
            Row() {
              Text(actionTypeLabel(item.type, copy.privacy))
                .fontSize(FONT_SIZE.metaLabel).fontWeight(FONT_WEIGHT.semibold).fontColor(COLORS.ink)
                .layoutWeight(1)
              Text(item.requestedAt.slice(0, 16))
                .fontSize(FONT_SIZE.footnote).fontColor(COLORS.muted)
            }
            .width('100%')
            .padding({ top: SPACING.sm, bottom: SPACING.sm })
            .border(index < this.actions.length - 1
              ? { width: { bottom: 0.5 }, color: COLORS.divider }
              : { width: 0 })
          }, (item: PrivacyAction) => item.id)
        }
        .width('100%')
      } else {
        Text(copy.privacy.actionsEmpty)
          .fontSize(FONT_SIZE.metaLabel).fontColor(COLORS.textBody).width('100%')
      }
    }
    .width('100%')
    .padding(SPACING.md)
    .backgroundColor(COLORS.surface)
    .borderRadius(RADII.lg)
    .border({ width: 1, color: COLORS.lineStrong })
  }

  build() {
    Column() {
      this.Header(getCopy(this.lang))

      Scroll() {
        Column({ space: SPACING.md }) {
          this.HeroCard(getCopy(this.lang))
          this.ToggleSection(getCopy(this.lang))
          this.ExportSection(getCopy(this.lang))
          this.DangerSection(getCopy(this.lang))
          this.ActionSection(getCopy(this.lang))
        }
        .width('100%')
        .padding({ left: SPACING.md, right: SPACING.md, top: SPACING.sm, bottom: SPACING.xl })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLORS.bg)
  }
}

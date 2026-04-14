import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import { api } from '../common/ApiClient';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADII, SHADOWS, SPACING } from '../common/DesignTokens';
import { ConsentRecord, ExportBundle, PrivacyAction } from '../common/Types';

const CONSENT_TYPES: Array<string> = ['privacy_policy', 'sensitive_health_data', 'notifications'];

interface ToggleView {
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  latestId: string;
}

function consentTitle(type: string): string {
  if (type === 'privacy_policy') return 'Privacy policy';
  if (type === 'sensitive_health_data') return 'Sensitive health data';
  return 'Notifications';
}

function consentPurpose(type: string): string {
  if (type === 'privacy_policy') return 'Accept privacy policy';
  if (type === 'sensitive_health_data') return 'Allow sensitive health data processing';
  return 'Enable reminder notifications';
}

function actionTypeLabel(type: string): string {
  if (type === 'export_data') return 'Export';
  if (type === 'delete_account') return 'Delete';
  if (type === 'logout') return 'Logout';
  return 'Withdraw';
}

@Entry
@Component
struct Privacy {
  @State private consents: Array<ConsentRecord> = [];
  @State private actions: Array<PrivacyAction> = [];
  @State private toggles: Array<ToggleView> = [];
  @State private exportBundle: ExportBundle | null = null;
  @State private isToggling: boolean = false;
  @State private isDeleting: boolean = false;

  aboutToAppear(): void {
    this.loadData();
  }

  private rebuildToggles(): void {
    const result: Array<ToggleView> = [];
    for (const type of CONSENT_TYPES) {
      const matched = this.consents.filter((item: ConsentRecord) => item.type === type);
      const latest = matched.length ? matched[matched.length - 1] : null;
      const enabled = latest !== null && latest.status === 'granted';
      let statusStr = 'Not granted';
      if (latest) {
        statusStr = latest.status === 'granted' ? 'Granted' : 'Withdrawn';
      }
      result.push({
        type: type,
        title: consentTitle(type),
        subtitle: `Current status: ${statusStr}`,
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
      promptAction.showToast({ message: 'Load failed, please retry', duration: 2000 });
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
          purpose: consentPurpose(type)
        });
      } else if (latestId.length > 0) {
        await api.withdrawConsent(latestId);
      }
      await this.loadData();
    } catch (e) {
      promptAction.showToast({ message: 'Action failed', duration: 2000 });
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
      promptAction.showToast({ message: 'Export failed', duration: 2000 });
    }
  }

  private async withdrawSensitive(): Promise<void> {
    const granted = this.consents
      .filter((item: ConsentRecord) => item.type === 'sensitive_health_data' && item.status === 'granted')
      .slice(-1)[0];
    if (!granted) {
      promptAction.showToast({ message: 'No active sensitive consent', duration: 2000 });
      return;
    }
    try {
      await api.withdrawConsent(granted.id);
      await this.loadData();
    } catch (e) {
      promptAction.showToast({ message: 'Withdraw failed', duration: 2000 });
    }
  }

  private async deleteAccount(): Promise<void> {
    if (this.isDeleting) return;
    this.isDeleting = true;
    try {
      await api.deleteAccount();
      this.consents = [];
      this.actions = [];
      this.exportBundle = null;
      this.rebuildToggles();
      promptAction.showToast({ message: 'Account data cleared', duration: 2000 });
    } catch (e) {
      promptAction.showToast({ message: 'Delete failed', duration: 2000 });
    } finally {
      this.isDeleting = false;
    }
  }

  @Builder private Header() {
    Row() {
      Text('◀')
        .fontSize(18).fontColor(COLORS.ink)
        .width(44).height(44).textAlign(TextAlign.Center)
        .onClick(() => router.back())
      Text('Privacy & data')
        .fontSize(FONT_SIZE.titleLarge).fontWeight(FONT_WEIGHT.bold)
        .fontColor(COLORS.ink).layoutWeight(1).textAlign(TextAlign.Center)
      Row().width(44).height(44)
    }
    .width('100%')
    .padding({ left: SPACING.md, right: SPACING.md })
  }

  @Builder private HeroCard() {
    Column({ space: 6 }) {
      Text('Control stays in your hands.')
        .fontSize(FONT_SIZE.titleLarge).fontWeight(FONT_WEIGHT.bold)
        .fontColor(COLORS.ink).width('100%')
      Text('Sensitive data, sync, and exports in one place.')
        .fontSize(FONT_SIZE.metaLabel).fontColor(COLORS.inkSecondary).width('100%')
    }
    .width('100%')
    .padding(SPACING.md)
    .backgroundColor(COLORS.pinkMist)
    .borderRadius(RADII.lg)
    .border({ width: 1, color: COLORS.pinkBorder })
  }

  @Builder private ToggleSection() {
    Column({ space: SPACING.sm }) {
      Text('Authorization switches')
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

  @Builder private ExportSection() {
    Column({ space: SPACING.sm }) {
      Text('Data export')
        .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
      Text('Download your records, reminders, and consent log.')
        .fontSize(FONT_SIZE.metaLabel).fontColor(COLORS.inkBody).width('100%')

      Button('Export / Access Log')
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
          Text('Export preview')
            .fontSize(FONT_SIZE.metaLabel).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')
          Text(`Generated at: ${this.exportBundle.exportedAt.slice(0, 16)}`)
            .fontSize(FONT_SIZE.footnote).fontColor(COLORS.inkSecondary).width('100%')
          Text(`${this.exportBundle.cycles.length} records`)
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

  @Builder private DangerSection() {
    Column({ space: SPACING.sm }) {
      Text('Sensitive actions')
        .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')

      Row({ space: SPACING.sm }) {
        Button('Withdraw sensitive')
          .layoutWeight(1)
          .height(44)
          .backgroundColor(COLORS.surface)
          .fontColor(COLORS.ink)
          .fontSize(FONT_SIZE.metaLabel)
          .fontWeight(FONT_WEIGHT.semibold)
          .borderRadius(RADII.md)
          .border({ width: 1, color: COLORS.lineStrong })
          .onClick(() => this.withdrawSensitive())

        Button('Delete account')
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

  @Builder private ActionSection() {
    Column({ space: SPACING.sm }) {
      Text('Recent actions')
        .fontSize(FONT_SIZE.subheading).fontWeight(FONT_WEIGHT.bold).fontColor(COLORS.ink).width('100%')

      if (this.actions.length > 0) {
        Column() {
          ForEach(this.actions, (item: PrivacyAction, index: number) => {
            Row() {
              Text(actionTypeLabel(item.type))
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
        Text('No action records yet')
          .fontSize(FONT_SIZE.metaLabel).fontColor(COLORS.inkBody).width('100%')
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
      this.Header()

      Scroll() {
        Column({ space: SPACING.md }) {
          this.HeroCard()
          this.ToggleSection()
          this.ExportSection()
          this.DangerSection()
          this.ActionSection()
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

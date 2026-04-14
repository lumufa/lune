import UIAbility from '@ohos.app.ability.UIAbility';
import hilog from '@ohos.hilog';
import window from '@ohos.window';
import { OnboardingStorage } from '../common/OnboardingStorage';

export default class EntryAbility extends UIAbility {
  onCreate(): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onCreate');
  }

  onDestroy(): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onDestroy');
  }

  async onWindowStageCreate(windowStage: window.WindowStage): Promise<void> {
    hilog.info(0x0000, 'women_period', 'EntryAbility onWindowStageCreate');

    const onboarded = await OnboardingStorage.isComplete(this.context);
    const target = onboarded ? 'pages/Index' : 'pages/Onboarding';

    windowStage.loadContent(target, (err) => {
      if (err.code) {
        hilog.error(0x0000, 'women_period', 'Failed to load page: %{public}s', JSON.stringify(err) ?? '');
      }
    });
  }

  onWindowStageDestroy(): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onWindowStageDestroy');
  }

  onForeground(): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onForeground');
  }

  onBackground(): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onBackground');
  }
}

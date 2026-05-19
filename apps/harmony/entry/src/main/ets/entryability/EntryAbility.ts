import UIAbility from '@ohos.app.ability.UIAbility';
import hilog from '@ohos.hilog';
import window from '@ohos.window';
import { OnboardingStorage } from '../common/OnboardingStorage';
import { DEFAULT_LANGUAGE, LANGUAGE_KEY } from '../common/I18n';

export default class EntryAbility extends UIAbility {
  onCreate(): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onCreate');
    PersistentStorage.PersistProp(LANGUAGE_KEY, DEFAULT_LANGUAGE);
  }

  onDestroy(): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onDestroy');
  }

  async onWindowStageCreate(windowStage: window.WindowStage): Promise<void> {
    hilog.info(0x0000, 'women_period', 'EntryAbility onWindowStageCreate');

    try {
      const mainWindow = await windowStage.getMainWindow();
      await mainWindow.setWindowSystemBarProperties({
        statusBarContentColor: '#1E1E2C',
        navigationBarContentColor: '#1E1E2C'
      });
    } catch (e) {
      hilog.error(0x0000, 'women_period', 'Failed to set status bar: %{public}s', JSON.stringify(e) ?? '');
    }

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

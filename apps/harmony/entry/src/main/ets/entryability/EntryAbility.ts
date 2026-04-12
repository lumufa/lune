import UIAbility from '@ohos.app.ability.UIAbility';
import hilog from '@ohos.hilog';
import window from '@ohos.window';

export default class EntryAbility extends UIAbility {
  onCreate(): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onCreate');
  }

  onDestroy(): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    hilog.info(0x0000, 'women_period', 'EntryAbility onWindowStageCreate');

    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(0x0000, 'women_period', 'Failed to load Index page: %{public}s', JSON.stringify(err) ?? '');
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

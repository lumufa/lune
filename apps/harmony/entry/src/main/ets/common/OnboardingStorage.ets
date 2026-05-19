import dataPreferences from '@ohos.data.preferences';
import common from '@ohos.app.ability.common';

const STORE_NAME: string = 'women_period_prefs';
const KEY_ONBOARDED: string = 'onboarding_complete';

export class OnboardingStorage {
  static async isComplete(context: common.UIAbilityContext | common.Context): Promise<boolean> {
    try {
      const store = await dataPreferences.getPreferences(context, STORE_NAME);
      const value = await store.get(KEY_ONBOARDED, false);
      return value === true;
    } catch {
      return false;
    }
  }

  static async setComplete(context: common.UIAbilityContext | common.Context, value: boolean): Promise<void> {
    try {
      const store = await dataPreferences.getPreferences(context, STORE_NAME);
      await store.put(KEY_ONBOARDED, value);
      await store.flush();
    } catch {
      // ignore persistence failure
    }
  }
}

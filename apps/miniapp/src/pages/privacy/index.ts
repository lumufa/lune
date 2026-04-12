import type { ConsentType } from "@women-period/shared";
import type { ConsentRecordResponse, ExportBundle, PrivacyActionResponse } from "../../types";
import { api, isApiNetworkError } from "../../services/api";
import {
  getConsentStatusLabel,
  getConsentTypeLabel,
  getDisplayLanguageToggleLabel,
  getNextDisplayLanguage,
  getPrivacyActionStatusLabel,
  getPrivacyActionTypeLabel,
  getStoredDisplayLanguage,
  setStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";

const DATA_SYNC_STORAGE_KEY = "privacy-data-sync-enabled";
const CONSENT_ITEM_ORDER: ConsentType[] = ["privacy_policy", "sensitive_health_data", "notifications"];

interface PrivacyCopy {
  languageButtonLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  settingsSectionTitle: string;
  statusLabel: string;
  reminderShortcutTitle: string;
  reminderShortcutSubtitle: string;
  reminderShortcutButton: string;
  accessLogLabel: string;
  withdrawLabel: string;
  deleteLabel: string;
  exportPreviewTitle: string;
  exportPreviewPrefix: string;
  exportPreviewUnit: string;
  actionSectionTitle: string;
  actionEmpty: string;
  settingUpdated: string;
  loadFailed: string;
  exportSuccess: string;
  exportFailed: string;
  withdrawSuccess: string;
  withdrawMissing: string;
  withdrawFailed: string;
  deleteFailed: string;
  deleteModalTitle: string;
  deleteModalContent: string;
  networkUnavailable: string;
}

interface SettingToggleView {
  type: ConsentType | "data_sync";
  title: string;
  subtitle: string;
  enabled: boolean;
}

interface ActionView {
  id: string;
  typeLabel: string;
  metaLabel: string;
}

function buildCopy(language: DisplayLanguage): PrivacyCopy {
  return {
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    heroEyebrow: language === "en" ? "Privacy & Settings" : "隐私与设置",
    heroTitle: language === "en" ? "Control stays in your hands." : "你的数据，由你控制。",
    heroSubtitle:
      language === "en" ? "Sensitive data, sync, and exports in one place." : "敏感数据、同步与导出都集中在这里。",
    settingsSectionTitle: language === "en" ? "Authorization switches" : "授权开关",
    statusLabel: language === "en" ? "Current status" : "当前状态",
    reminderShortcutTitle: language === "en" ? "Reminder center" : "提醒中心",
    reminderShortcutSubtitle:
      language === "en" ? "Quiet hours and reminder items are managed here." : "免打扰时间和提醒项目在这里管理。",
    reminderShortcutButton: language === "en" ? "Open reminder settings" : "打开提醒设置",
    accessLogLabel: language === "en" ? "Export / Access Log" : "导出 / 访问日志",
    withdrawLabel: language === "en" ? "Withdraw sensitive consent" : "撤回敏感授权",
    deleteLabel: language === "en" ? "Delete account" : "删除账号",
    exportPreviewTitle: language === "en" ? "Export preview" : "导出预览",
    exportPreviewPrefix: language === "en" ? "Generated at" : "生成时间",
    exportPreviewUnit: language === "en" ? "records" : "条记录",
    actionSectionTitle: language === "en" ? "Recent actions" : "最近动作",
    actionEmpty: language === "en" ? "No action records yet" : "暂无动作记录",
    settingUpdated: language === "en" ? "Setting updated" : "设置已更新",
    loadFailed: language === "en" ? "Failed to load privacy data" : "隐私数据加载失败",
    exportSuccess: language === "en" ? "Export preview generated" : "已生成导出预览",
    exportFailed: language === "en" ? "Export failed" : "导出失败",
    withdrawSuccess: language === "en" ? "Sensitive consent withdrawn" : "已撤回敏感数据授权",
    withdrawMissing: language === "en" ? "No active consent to withdraw" : "当前没有可撤回授权",
    withdrawFailed: language === "en" ? "Withdraw failed" : "撤回失败",
    deleteFailed: language === "en" ? "Delete failed" : "删除失败",
    deleteModalTitle: language === "en" ? "Account deleted" : "账号已删除",
    deleteModalContent:
      language === "en"
        ? "Demo user data was cleared. In production, also clear local cache and logout."
        : "演示账号数据已清空。生产环境请在删除后同时执行退出登录和本地缓存清理。",
    networkUnavailable:
      language === "en" ? "API offline. Run npm.cmd run start:api." : "接口未连接，请先执行 npm.cmd run start:api"
  };
}

function getDataSyncEnabled(): boolean {
  try {
    const value = wx.getStorageSync(DATA_SYNC_STORAGE_KEY);
    return value !== false;
  } catch {
    return true;
  }
}

function setDataSyncEnabled(enabled: boolean): void {
  try {
    wx.setStorageSync(DATA_SYNC_STORAGE_KEY, enabled);
  } catch {
    // ignore
  }
}

function latestConsentByType(
  consents: ConsentRecordResponse[],
  type: ConsentType
): ConsentRecordResponse | undefined {
  const matched = consents.filter((item) => item.type === type);
  if (!matched.length) {
    return undefined;
  }
  return matched[matched.length - 1];
}

function buildSettingViews(
  consents: ConsentRecordResponse[],
  language: DisplayLanguage,
  statusLabel: string,
  dataSyncEnabled: boolean
): SettingToggleView[] {
  const consentItems = CONSENT_ITEM_ORDER.map((type) => {
    const latest = latestConsentByType(consents, type);
    const enabled = latest?.status === "granted";
    const status = latest ? getConsentStatusLabel(latest.status, language) : language === "en" ? "Not granted" : "未授权";

    return {
      type,
      title: getConsentTypeLabel(type, language),
      subtitle: `${statusLabel}: ${status}`,
      enabled
    };
  });

  const dataSyncItem: SettingToggleView = {
    type: "data_sync",
    title: language === "en" ? "Data Sync" : "数据同步",
    subtitle: `${statusLabel}: ${dataSyncEnabled ? (language === "en" ? "Enabled" : "已开启") : language === "en" ? "Disabled" : "已关闭"}`,
    enabled: dataSyncEnabled
  };

  return [...consentItems, dataSyncItem];
}

function buildActionViews(actions: PrivacyActionResponse[], language: DisplayLanguage): ActionView[] {
  return actions.map((item) => ({
    id: item.id,
    typeLabel: getPrivacyActionTypeLabel(item.type, language),
    metaLabel: `${getPrivacyActionStatusLabel(item.status, language)} · ${item.requestedAt.slice(0, 16)}`
  }));
}

function consentPurpose(type: ConsentType, language: DisplayLanguage): string {
  if (language === "en") {
    if (type === "privacy_policy") {
      return "Accept privacy policy";
    }
    if (type === "sensitive_health_data") {
      return "Allow sensitive health data processing";
    }
    return "Enable reminder notifications";
  }

  if (type === "privacy_policy") {
    return "确认隐私政策";
  }
  if (type === "sensitive_health_data") {
    return "授权处理敏感健康数据";
  }
  return "授权提醒通知";
}

Page({
  data: {
    consents: [] as ConsentRecordResponse[],
    actions: [] as PrivacyActionResponse[],
    settingViews: [] as SettingToggleView[],
    actionViews: [] as ActionView[],
    exportBundle: null as ExportBundle | null,
    isDeleting: false,
    isToggling: false,
    language: getStoredDisplayLanguage() as DisplayLanguage,
    copy: buildCopy(getStoredDisplayLanguage())
  },

  onShow() {
    const language = getStoredDisplayLanguage();

    if (language !== this.data.language) {
      this.applyLanguage(language);
    }

    void this.loadData();
  },

  applyLanguage(language: DisplayLanguage) {
    const copy = buildCopy(language);
    const dataSyncEnabled = getDataSyncEnabled();
    this.setData({
      language,
      copy,
      settingViews: buildSettingViews(this.data.consents, language, copy.statusLabel, dataSyncEnabled),
      actionViews: buildActionViews(this.data.actions, language)
    });
  },

  toggleLanguage() {
    const nextLanguage = getNextDisplayLanguage(this.data.language as DisplayLanguage);
    setStoredDisplayLanguage(nextLanguage);
    this.applyLanguage(nextLanguage);
  },

  async loadData() {
    try {
      const [consents, actions] = await Promise.all([api.listConsents(), api.listPrivacyActions()]);
      const language = this.data.language as DisplayLanguage;
      const copy = this.data.copy as PrivacyCopy;

      this.setData({
        consents,
        actions,
        settingViews: buildSettingViews(consents, language, copy.statusLabel, getDataSyncEnabled()),
        actionViews: buildActionViews(actions, language)
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.loadFailed,
        icon: "none"
      });
    }
  },

  async toggleSetting(event: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    const type = event.currentTarget.dataset.type as ConsentType | "data_sync" | undefined;
    const enabled = Boolean(event.detail.value);

    if (!type || this.data.isToggling) {
      return;
    }

    if (type === "data_sync") {
      setDataSyncEnabled(enabled);
      this.setData({
        settingViews: buildSettingViews(
          this.data.consents,
          this.data.language as DisplayLanguage,
          this.data.copy.statusLabel,
          enabled
        )
      });
      wx.showToast({
        title: this.data.copy.settingUpdated,
        icon: "success"
      });
      return;
    }

    this.setData({ isToggling: true });

    try {
      if (enabled) {
        await api.grantConsent({
          type,
          version: "v1.0.0",
          purpose: consentPurpose(type, this.data.language as DisplayLanguage)
        });
      } else {
        const granted = this.data.consents
          .filter((item) => item.type === type && item.status === "granted")
          .slice(-1)[0];

        if (granted) {
          await api.withdrawConsent(granted.id);
        }
      }

      await this.loadData();
      wx.showToast({
        title: this.data.copy.settingUpdated,
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.loadFailed,
        icon: "none"
      });
      await this.loadData();
    } finally {
      this.setData({ isToggling: false });
    }
  },

  openReminderSettings() {
    wx.switchTab({
      url: "/pages/reminders/index"
    });
  },

  async exportData() {
    try {
      const exportBundle = await api.exportData();
      void api
        .trackEvent("export_data", {
          recordCount: exportBundle.cycles.length
        })
        .catch(() => undefined);

      this.setData({ exportBundle });
      wx.showToast({
        title: this.data.copy.exportSuccess,
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.exportFailed,
        icon: "none"
      });
    }
  },

  async withdrawSensitiveConsent() {
    const grantedSensitiveConsent = this.data.consents
      .filter((item) => item.type === "sensitive_health_data" && item.status === "granted")
      .slice(-1)[0];

    if (!grantedSensitiveConsent) {
      wx.showToast({
        title: this.data.copy.withdrawMissing,
        icon: "none"
      });
      return;
    }

    try {
      await api.withdrawConsent(grantedSensitiveConsent.id);
      await this.loadData();
      wx.showToast({
        title: this.data.copy.withdrawSuccess,
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.withdrawFailed,
        icon: "none"
      });
    }
  },

  async deleteAccount() {
    if (this.data.isDeleting) {
      return;
    }

    this.setData({ isDeleting: true });

    try {
      await api.deleteAccount();
      wx.showModal({
        title: this.data.copy.deleteModalTitle,
        content: this.data.copy.deleteModalContent,
        showCancel: false
      });
      this.setData({
        consents: [],
        actions: [],
        settingViews: [],
        actionViews: [],
        exportBundle: null
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.deleteFailed,
        icon: "none"
      });
    } finally {
      this.setData({ isDeleting: false });
    }
  }
});

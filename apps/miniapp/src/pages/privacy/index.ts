import type { ConsentType } from "@women-period/shared";
import type { ConsentRecordResponse, ExportBundle, PrivacyActionResponse } from "../../types";
import { api, isApiNetworkError } from "../../services/api";
import {
  getConsentTypeLabel,
  getDisplayLanguageToggleLabel,
  getNextDisplayLanguage,
  getPrivacyActionTypeLabel,
  getStoredDisplayLanguage,
  setStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";

const CONSENT_ITEM_ORDER: ConsentType[] = ["privacy_policy", "sensitive_health_data", "notifications"];

interface PrivacyCopy {
  languageButtonLabel: string;
  heroEyebrow: string;
  settingsSectionTitle: string;
  exportSectionTitle: string;
  dangerSectionTitle: string;
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
  deleteConfirmTitle: string;
  deleteConfirmContent: string;
  deleteModalTitle: string;
  deleteModalContent: string;
  networkUnavailable: string;
}

interface SettingToggleView {
  type: ConsentType;
  title: string;
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
    heroEyebrow: language === "en" ? "Privacy & data" : "隐私与数据",
    settingsSectionTitle: language === "en" ? "Authorization switches" : "授权开关",
    exportSectionTitle: language === "en" ? "Data export" : "数据导出",
    dangerSectionTitle: language === "en" ? "Sensitive actions" : "危险操作",
    accessLogLabel: language === "en" ? "Export / Access Log" : "导出 / 访问日志",
    withdrawLabel: language === "en" ? "Withdraw sensitive" : "撤回敏感授权",
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
    deleteConfirmTitle: language === "en" ? "Delete account" : "删除账号",
    deleteConfirmContent:
      language === "en" ? "This clears all current user data." : "这会清除当前用户的全部数据。",
    deleteModalTitle: language === "en" ? "Account deleted" : "账号已删除",
    deleteModalContent:
      language === "en"
        ? "Demo user data was cleared. In production, also clear local cache and logout."
        : "演示账号数据已清空。生产环境请在删除后同时执行退出登录和本地缓存清理。",
    networkUnavailable:
      language === "en" ? "API offline. Run npm.cmd run start:api." : "接口未连接，请先执行 npm.cmd run start:api"
  };
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
  language: DisplayLanguage
): SettingToggleView[] {
  return CONSENT_ITEM_ORDER.map((type) => {
    const latest = latestConsentByType(consents, type);
    const enabled = latest?.status === "granted";
    return {
      type,
      title: getConsentTypeLabel(type, language),
      enabled
    };
  });
}

function buildActionViews(actions: PrivacyActionResponse[], language: DisplayLanguage): ActionView[] {
  return actions.map((item) => ({
    id: item.id,
    typeLabel: getPrivacyActionTypeLabel(item.type, language),
    metaLabel: item.requestedAt.slice(0, 16)
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
    this.setData({
      language,
      copy,
      settingViews: buildSettingViews(this.data.consents, language),
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

      this.setData({
        consents,
        actions,
        settingViews: buildSettingViews(consents, language),
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
    const type = event.currentTarget.dataset.type as ConsentType | undefined;
    const enabled = Boolean(event.detail.value);

    if (!type || this.data.isToggling) {
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

    const confirmed = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: this.data.copy.deleteConfirmTitle,
        content: this.data.copy.deleteConfirmContent,
        confirmColor: "#D14060",
        success: (result) => resolve(Boolean(result.confirm)),
        fail: () => resolve(false)
      });
    });

    if (!confirmed) return;

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

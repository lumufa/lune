import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { useLanguage } from "@/components/language-provider";
import { useDashboardOnFocus } from "@/components/dashboard-provider";
import { FadeInView } from "@/components/motion";
import { api } from "@/services/api";
import type { ConsentType } from "@/constants/shared";
import type { ConsentRecordResponse, ExportBundle, PrivacyActionResponse } from "@/types/api";
import { luneColors, luneRadius, luneShadow, luneSpacing } from "@/constants/tokens";
import { CONSENT_VERSION } from "@/constants/runtime";
import { formatDateTime } from "@/utils/format";

const CONSENT_ITEM_ORDER: ConsentType[] = ["privacy_policy", "sensitive_health_data", "notifications"];

type Lang = "zh" | "en";

function consentTitle(type: ConsentType, lang: Lang): string {
  if (type === "privacy_policy") return lang === "en" ? "Privacy policy" : "隐私政策";
  if (type === "sensitive_health_data") return lang === "en" ? "Sensitive health data" : "敏感健康数据";
  return lang === "en" ? "Notifications" : "提醒通知";
}

function consentPurpose(type: ConsentType, lang: Lang): string {
  if (lang === "en") {
    if (type === "privacy_policy") return "Accept privacy policy";
    if (type === "sensitive_health_data") return "Allow sensitive health data processing";
    return "Enable reminder notifications";
  }
  if (type === "privacy_policy") return "确认隐私政策";
  if (type === "sensitive_health_data") return "授权处理敏感健康数据";
  return "授权提醒通知";
}

function actionLabel(type: PrivacyActionResponse["type"], lang: Lang): string {
  if (lang === "en") {
    if (type === "export_data") return "Export";
    if (type === "delete_account") return "Delete";
    if (type === "logout") return "Logout";
    return "Withdraw";
  }
  if (type === "export_data") return "导出";
  if (type === "delete_account") return "删除";
  if (type === "logout") return "退出";
  return "撤回";
}

export default function PrivacyPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { clear: clearDashboard } = useDashboardOnFocus();
  const [consents, setConsents] = useState<ConsentRecordResponse[]>([]);
  const [actions, setActions] = useState<PrivacyActionResponse[]>([]);
  const [exportBundle, setExportBundle] = useState<ExportBundle | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [nextConsents, nextActions] = await Promise.all([api.listConsents(), api.listPrivacyActions()]);
      setConsents(nextConsents);
      setActions(nextActions);
    } catch {
      Alert.alert(
        language === "zh" ? "加载失败" : "Load failed",
        language === "zh" ? "请稍后重试" : "Please retry later"
      );
    }
  }, [language]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const settingViews = useMemo(() => {
    return CONSENT_ITEM_ORDER.map((type) => {
      const matched = consents.filter((item) => item.type === type);
      const latest = matched.length ? matched[matched.length - 1] : undefined;
      const enabled = latest?.status === "granted";
      return {
        type,
        title: consentTitle(type, language),
        enabled,
        latestId: latest?.id
      };
    });
  }, [consents, language]);

  const toggleConsent = async (type: ConsentType, enabled: boolean, latestId?: string) => {
    if (isToggling) return;
    const snapshot = consents;
    const nowIso = new Date().toISOString();
    const optimistic = enabled
      ? [
          ...consents,
          {
            id: `optimistic-${type}-${nowIso}`,
            userId: "",
            type,
            version: CONSENT_VERSION,
            purpose: consentPurpose(type, language),
            status: "granted" as const,
            grantedAt: nowIso
          }
        ]
      : consents.map((record) =>
          record.id === latestId ? { ...record, status: "withdrawn" as const, withdrawnAt: nowIso } : record
        );
    setConsents(optimistic);
    setIsToggling(true);
    try {
      if (enabled) {
        await api.grantConsent({ type, version: CONSENT_VERSION, purpose: consentPurpose(type, language) });
      } else if (latestId) {
        await api.withdrawConsent(latestId);
      }
      await loadData();
    } catch {
      setConsents(snapshot);
      Alert.alert(
        language === "zh" ? "操作失败" : "Action failed",
        language === "zh" ? "请稍后重试" : "Please retry later"
      );
    } finally {
      setIsToggling(false);
    }
  };

  const exportData = async () => {
    try {
      const bundle = await api.exportData();
      setExportBundle(bundle);
      void api.trackEvent("export_data", { recordCount: bundle.cycles.length }).catch(() => undefined);
      await loadData();
    } catch {
      Alert.alert(
        language === "zh" ? "导出失败" : "Export failed",
        language === "zh" ? "请稍后重试" : "Please retry later"
      );
    }
  };

  const withdrawSensitive = async () => {
    const granted = consents
      .filter((item) => item.type === "sensitive_health_data" && item.status === "granted")
      .slice(-1)[0];
    if (!granted) {
      Alert.alert(
        language === "zh" ? "无可撤回" : "No active consent",
        language === "zh" ? "当前没有可撤回的敏感授权" : "No sensitive consent to withdraw"
      );
      return;
    }
    try {
      await api.withdrawConsent(granted.id);
      await loadData();
    } catch {
      Alert.alert(
        language === "zh" ? "撤回失败" : "Withdraw failed",
        language === "zh" ? "请稍后重试" : "Please retry later"
      );
    }
  };

  const deleteAccount = () => {
    Alert.alert(
      language === "zh" ? "删除账号" : "Delete account",
      language === "zh" ? "这会清除当前用户的全部数据。" : "This clears all current user data.",
      [
        { text: language === "zh" ? "取消" : "Cancel", style: "cancel" },
        {
          text: language === "zh" ? "确认删除" : "Delete",
          style: "destructive",
          onPress: async () => {
            if (isDeleting) return;
            setIsDeleting(true);
            try {
              await api.deleteAccount();
              clearDashboard();
              setConsents([]);
              setActions([]);
              setExportBundle(null);
              Alert.alert(
                language === "zh" ? "已删除" : "Deleted",
                language === "zh" ? "账号数据已清理" : "Account data cleared",
                [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
              );
            } catch {
              Alert.alert(
                language === "zh" ? "删除失败" : "Delete failed",
                language === "zh" ? "请稍后重试" : "Please retry later"
              );
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.headerButton, pressed ? styles.pressed : null]}>
            <AppIcon name="back" size={20} color={luneColors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{language === "zh" ? "隐私与数据" : "Privacy & data"}</Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        <FadeInView delay={40}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{language === "zh" ? "授权开关" : "Authorization switches"}</Text>
            <View style={styles.toggleList}>
              {settingViews.map((item, index) => (
                <View
                  key={item.type}
                  style={[styles.toggleRow, index < settingViews.length - 1 ? styles.toggleRowBorder : null]}
                >
                  <View style={styles.toggleCopy}>
                    <Text style={styles.toggleTitle}>{item.title}</Text>
                  </View>
                  <Switch
                    value={item.enabled}
                    disabled={isToggling}
                    onValueChange={(next) => void toggleConsent(item.type, next, item.latestId)}
                    trackColor={{ true: luneColors.accent, false: luneColors.lineStrong }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={80}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{language === "zh" ? "数据导出" : "Data export"}</Text>
            <Pressable onPress={exportData} style={({ pressed }) => [styles.primaryBtn, pressed ? styles.pressed : null]}>
              <AppIcon name="download" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnLabel}>
                {language === "zh" ? "导出 / 访问日志" : "Export / Access Log"}
              </Text>
            </Pressable>
            {exportBundle ? (
              <View style={styles.exportPreview}>
                <Text style={styles.previewTitle}>{language === "zh" ? "导出预览" : "Export preview"}</Text>
                <Text style={styles.previewLine}>
                  {language === "zh" ? "生成时间：" : "Generated at: "}
                  {formatDateTime(exportBundle.exportedAt, language)}
                </Text>
                <Text style={styles.previewLine}>
                  {exportBundle.cycles.length} {language === "zh" ? "条记录" : "records"}
                </Text>
              </View>
            ) : null}
          </View>
        </FadeInView>

        <FadeInView delay={120}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{language === "zh" ? "危险操作" : "Sensitive actions"}</Text>
            <View style={styles.actionRow}>
              <Pressable onPress={withdrawSensitive} style={({ pressed }) => [styles.ghostBtn, pressed ? styles.pressed : null]}>
                <Text style={styles.ghostBtnLabel}>
                  {language === "zh" ? "撤回敏感授权" : "Withdraw sensitive"}
                </Text>
              </Pressable>
              <Pressable
                onPress={deleteAccount}
                disabled={isDeleting}
                style={({ pressed }) => [styles.dangerBtn, pressed ? styles.pressed : null, isDeleting ? styles.btnDisabled : null]}
              >
                <Text style={styles.dangerBtnLabel}>
                  {language === "zh" ? "删除账号" : "Delete account"}
                </Text>
              </Pressable>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={160}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{language === "zh" ? "最近动作" : "Recent actions"}</Text>
            {actions.length ? (
              <View style={styles.actionList}>
                {actions.map((item, index) => (
                  <View
                    key={item.id}
                    style={[styles.actionItem, index < actions.length - 1 ? styles.actionItemBorder : null]}
                  >
                    <Text style={styles.actionTitle}>{actionLabel(item.type, language)}</Text>
                    <Text style={styles.actionMeta}>{item.requestedAt.slice(0, 16)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.cardBody}>
                {language === "zh" ? "暂无动作记录" : "No action records yet"}
              </Text>
            )}
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: luneColors.bg
  },
  content: {
    paddingHorizontal: luneSpacing.lg,
    paddingTop: luneSpacing.md,
    paddingBottom: luneSpacing.xl,
    gap: luneSpacing.md
  },
  header: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center"
  },
  headerCopy: {
    flex: 1,
    alignItems: "center"
  },
  headerTitle: {
    color: luneColors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  card: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    gap: luneSpacing.sm,
    ...luneShadow.card
  },
  sectionTitle: {
    color: luneColors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  cardBody: {
    color: luneColors.inkBody,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500"
  },
  toggleList: {
    marginTop: 2
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: luneSpacing.sm,
    gap: luneSpacing.md
  },
  toggleRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: luneColors.divider
  },
  toggleCopy: {
    flex: 1,
    gap: 2
  },
  toggleTitle: {
    color: luneColors.ink,
    fontSize: 14,
    fontWeight: "600"
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: luneSpacing.xs
  },
  primaryBtnLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  },
  exportPreview: {
    marginTop: 4,
    padding: luneSpacing.sm,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.pinkMist,
    gap: 2
  },
  previewTitle: {
    color: luneColors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  previewLine: {
    color: luneColors.inkSecondary,
    fontSize: 12
  },
  actionRow: {
    flexDirection: "row",
    gap: luneSpacing.sm
  },
  ghostBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: luneRadius.md,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: luneColors.surface
  },
  ghostBtnLabel: {
    color: luneColors.ink,
    fontSize: 13,
    fontWeight: "600"
  },
  dangerBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.pinkMist,
    borderWidth: 1,
    borderColor: luneColors.pinkBorder,
    alignItems: "center",
    justifyContent: "center"
  },
  dangerBtnLabel: {
    color: luneColors.accentDeep,
    fontSize: 13,
    fontWeight: "700"
  },
  btnDisabled: {
    opacity: 0.6
  },
  actionList: {
    marginTop: 2
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: luneSpacing.sm
  },
  actionItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: luneColors.divider
  },
  actionTitle: {
    color: luneColors.ink,
    fontSize: 13,
    fontWeight: "600"
  },
  actionMeta: {
    color: luneColors.muted,
    fontSize: 12
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});

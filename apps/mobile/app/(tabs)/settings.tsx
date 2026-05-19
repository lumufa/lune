import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReminderPreference } from "@/constants/shared";
import { AppIcon } from "@/components/app-icon";
import { useLanguage } from "@/components/language-provider";
import { useCyclePreferences } from "@/components/cycle-preferences-provider";
import { useDashboardOnFocus } from "@/components/dashboard-provider";
import { FadeInView } from "@/components/motion";
import { api } from "@/services/api";
import { luneColors, luneRadius, luneSpacing } from "@/constants/tokens";
import { formatDateTime } from "@/utils/format";

const AUTO_COMPUTE_THRESHOLD = 3;

function clampProgress(value: number, min: number, max: number) {
  return Math.min(Math.max(((value - min) / (max - min)) * 100, 8), 100);
}

function ManualStepper({
  label,
  hint,
  value,
  unit,
  min,
  max,
  onDecrease,
  onIncrease
}: {
  label: string;
  hint: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.stepperCard}>
      <View style={styles.stepperHead}>
        <Text style={styles.stepperLabel}>{label}</Text>
        <Text style={styles.stepperValue}>
          {value} {unit}
        </Text>
      </View>
      <View style={styles.stepperRow}>
        <Pressable onPress={onDecrease} style={({ pressed }) => [styles.stepperButton, pressed ? styles.pressed : null]}>
          <Text style={styles.stepperButtonLabel}>-</Text>
        </Pressable>
        <View style={styles.stepperTrack}>
          <View style={[styles.stepperTrackFill, { width: `${clampProgress(value, min, max)}%` }]} />
          <View style={[styles.stepperThumb, { left: `${clampProgress(value, min, max)}%` }]} />
        </View>
        <Pressable onPress={onIncrease} style={({ pressed }) => [styles.stepperButton, pressed ? styles.pressed : null]}>
          <Text style={styles.stepperButtonLabel}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.stepperHint}>{hint}</Text>
    </View>
  );
}

function AutoValueCard({
  label,
  value,
  unit,
  caption
}: {
  label: string;
  value: number;
  unit: string;
  caption: string;
}) {
  return (
    <View style={styles.autoCard}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.autoRow}>
        <Text style={styles.autoValue}>{value}</Text>
        <Text style={styles.autoUnit}>{unit}</Text>
      </View>
      <View style={styles.autoBadge}>
        <AppIcon name="sparkles" size={12} color={luneColors.accentDeep} />
        <Text style={styles.autoCaption}>{caption}</Text>
      </View>
    </View>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { cycleLength, periodLength, setCycleLength, setPeriodLength, syncFromSummary } = useCyclePreferences();
  const { dashboard, clear: clearDashboard } = useDashboardOnFocus();
  const [preference, setPreference] = useState<ReminderPreference | null>(null);

  const loadPreference = useCallback(async () => {
    try {
      const response = await api.getReminderPreferences();
      setPreference(response);
    } catch {
      Alert.alert(
        language === "zh" ? "\u540c\u6b65\u5931\u8d25" : "Sync failed",
        language === "zh" ? "\u8bf7\u7a0d\u540e\u91cd\u8bd5" : "Please retry later"
      );
    }
  }, [language]);

  useFocusEffect(
    useCallback(() => {
      void loadPreference();
    }, [loadPreference])
  );

  useEffect(() => {
    if (!dashboard?.summary) {
      return;
    }

    syncFromSummary(dashboard.summary.averageCycleLength, dashboard.summary.averagePeriodLength);
  }, [dashboard?.summary, syncFromSummary]);

  const recordCount = dashboard?.summary?.recordCount ?? dashboard?.records.length ?? 0;
  const isAutoComputed = recordCount >= AUTO_COMPUTE_THRESHOLD;
  const computedCycle = dashboard?.summary.averageCycleLength ?? cycleLength;
  const computedPeriod = dashboard?.summary.averagePeriodLength ?? periodLength;

  const reminderSummary = useMemo(() => {
    const enabledCount = preference?.items.filter((item) => item.enabled).length ?? 0;

    return {
      count: enabledCount,
      quietHours: preference ? `${preference.quietHours.start} - ${preference.quietHours.end}` : "22:00 - 08:00"
    };
  }, [preference]);

  const exportData = async () => {
    try {
      const bundle = await api.exportData();
      Alert.alert(
        language === "zh" ? "\u5bfc\u51fa\u6570\u636e" : "Export data",
        formatDateTime(bundle.exportedAt, language)
      );
    } catch {
      Alert.alert(
        language === "zh" ? "\u5bfc\u51fa\u5931\u8d25" : "Export failed",
        language === "zh" ? "\u8bf7\u7a0d\u540e\u91cd\u8bd5" : "Please retry later"
      );
    }
  };

  const deleteAccount = async () => {
    Alert.alert(
      language === "zh" ? "\u5220\u9664\u8d26\u53f7" : "Delete account",
      language === "zh" ? "\u8fd9\u4f1a\u6e05\u9664\u5f53\u524d\u7528\u6237\u7684\u5168\u90e8\u6570\u636e\u3002" : "This clears all current user data.",
      [
        { text: language === "zh" ? "\u53d6\u6d88" : "Cancel", style: "cancel" },
        {
          text: language === "zh" ? "\u786e\u8ba4\u5220\u9664" : "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteAccount();
              clearDashboard();
              setPreference(null);
              Alert.alert(
                language === "zh" ? "\u5df2\u5220\u9664" : "Deleted",
                language === "zh" ? "\u8d26\u53f7\u6570\u636e\u5df2\u6e05\u7406" : "Account data cleared.",
                [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
              );
            } catch {
              Alert.alert(
                language === "zh" ? "\u5220\u9664\u5931\u8d25" : "Delete failed",
                language === "zh" ? "\u8bf7\u7a0d\u540e\u91cd\u8bd5" : "Please retry later"
              );
            }
          }
        }
      ]
    );
  };

  const cycleHint = language === "zh"
    ? "\u521d\u59cb\u8bbe\u7f6e\u503c\uff0c\u6709\u8db3\u591f\u8bb0\u5f55\u540e\u5c06\u81ea\u52a8\u8ba1\u7b97"
    : "Starting value — updates automatically once you have enough records";
  const cycleAutoCaption = language === "zh"
    ? `\u57fa\u4e8e\u4f60\u7684 ${recordCount} \u6761\u8bb0\u5f55\u81ea\u52a8\u8ba1\u7b97`
    : `Auto-computed from your ${recordCount} records`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{language === "zh" ? "\u8bbe\u7f6e" : "Settings"}</Text>
        </View>

        <FadeInView>
          {isAutoComputed ? (
            <AutoValueCard
              label={language === "zh" ? "\u5e73\u5747\u5468\u671f\u957f\u5ea6" : "Average cycle length"}
              value={computedCycle}
              unit={language === "zh" ? "\u5929" : "days"}
              caption={cycleAutoCaption}
            />
          ) : (
            <ManualStepper
              label={language === "zh" ? "\u5e73\u5747\u5468\u671f\u957f\u5ea6" : "Average cycle length"}
              hint={cycleHint}
              value={cycleLength}
              unit={language === "zh" ? "\u5929" : "days"}
              min={20}
              max={45}
              onDecrease={() => setCycleLength(cycleLength - 1)}
              onIncrease={() => setCycleLength(cycleLength + 1)}
            />
          )}
        </FadeInView>

        <FadeInView delay={40}>
          {isAutoComputed ? (
            <AutoValueCard
              label={language === "zh" ? "\u5e73\u5747\u7ecf\u671f\u957f\u5ea6" : "Average period length"}
              value={computedPeriod}
              unit={language === "zh" ? "\u5929" : "days"}
              caption={cycleAutoCaption}
            />
          ) : (
            <ManualStepper
              label={language === "zh" ? "\u5e73\u5747\u7ecf\u671f\u957f\u5ea6" : "Average period length"}
              hint={cycleHint}
              value={periodLength}
              unit={language === "zh" ? "\u5929" : "days"}
              min={2}
              max={10}
              onDecrease={() => setPeriodLength(periodLength - 1)}
              onIncrease={() => setPeriodLength(periodLength + 1)}
            />
          )}
        </FadeInView>

        <FadeInView delay={80}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{language === "zh" ? "\u63d0\u9192\u548c\u514d\u6253\u6270" : "Reminders & quiet hours"}</Text>
              <Pressable onPress={() => router.push("/reminder-settings")} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
                <AppIcon name="arrowRight" size={18} color={luneColors.muted} />
              </Pressable>
            </View>
            <Text style={styles.cardBody}>
              {language === "zh"
                ? `\u5df2\u5f00\u542f ${reminderSummary.count} \u9879\u63d0\u9192\uff0c\u514d\u6253\u6270\u65f6\u6bb5 ${reminderSummary.quietHours}`
                : `${reminderSummary.count} reminders enabled, quiet hours ${reminderSummary.quietHours}`}
            </Text>
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <Pressable onPress={() => router.push("/trends")} style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{language === "zh" ? "\u8d8b\u52bf\u5206\u6790" : "Trends"}</Text>
              <AppIcon name="arrowRight" size={18} color={luneColors.muted} />
            </View>
          </Pressable>
        </FadeInView>

        <FadeInView delay={120}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{language === "zh" ? "\u9690\u79c1\u4e0e\u6570\u636e" : "Privacy & data"}</Text>
              <Pressable onPress={() => router.push("/privacy")} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
                <AppIcon name="arrowRight" size={18} color={luneColors.muted} />
              </Pressable>
            </View>
            <View style={styles.actionRow}>
              <Pressable onPress={exportData} style={({ pressed }) => [styles.actionButton, pressed ? styles.pressed : null]}>
                <AppIcon name="download" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonLabel}>{language === "zh" ? "\u5bfc\u51fa\u6570\u636e" : "Export data"}</Text>
              </Pressable>
              <Pressable
                onPress={deleteAccount}
                style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed ? styles.pressed : null]}
              >
                <AppIcon name="trash" size={16} color={luneColors.accentDeep} />
                <Text style={[styles.actionButtonLabel, styles.deleteButtonLabel]}>
                  {language === "zh" ? "\u5220\u9664\u8d26\u53f7" : "Delete account"}
                </Text>
              </Pressable>
            </View>
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
    gap: luneSpacing.xxs
  },
  headerTitle: {
    color: luneColors.ink,
    fontSize: 24,
    fontWeight: "700"
  },
  stepperCard: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    gap: luneSpacing.sm
  },
  stepperHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  stepperLabel: {
    color: luneColors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  stepperValue: {
    color: luneColors.accent,
    fontSize: 20,
    fontWeight: "700"
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: luneSpacing.sm
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: luneColors.chipIdle,
    alignItems: "center",
    justifyContent: "center"
  },
  stepperButtonLabel: {
    color: luneColors.ink,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "700"
  },
  stepperTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: luneColors.chipIdle,
    overflow: "visible",
    position: "relative"
  },
  stepperTrackFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: luneColors.accent
  },
  stepperThumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: luneColors.accent,
    top: -7,
    marginLeft: -12,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  stepperHint: {
    color: luneColors.muted,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16
  },
  autoCard: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    gap: luneSpacing.xs
  },
  autoRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6
  },
  autoValue: {
    color: luneColors.accent,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800"
  },
  autoUnit: {
    color: luneColors.inkBody,
    fontSize: 14,
    fontWeight: "500"
  },
  autoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: luneSpacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: luneColors.pinkMist,
    borderWidth: 1,
    borderColor: luneColors.pinkBorder
  },
  autoCaption: {
    color: luneColors.accentDeep,
    fontSize: 11,
    fontWeight: "600"
  },
  card: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    gap: luneSpacing.sm
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cardTitle: {
    color: luneColors.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  cardBody: {
    color: luneColors.inkBody,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500"
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  actionRow: {
    flexDirection: "row",
    gap: luneSpacing.sm
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: luneSpacing.xs
  },
  actionButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },
  deleteButton: {
    backgroundColor: luneColors.pinkMist,
    borderWidth: 1,
    borderColor: luneColors.pinkBorder
  },
  deleteButtonLabel: {
    color: luneColors.accentDeep
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});

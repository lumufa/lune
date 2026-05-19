import { useEffect, useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { BrandAvatar } from "@/components/brand-avatar";
import { useLanguage } from "@/components/language-provider";
import { FadeInView } from "@/components/motion";
import { useCyclePreferences } from "@/components/cycle-preferences-provider";
import { useDashboardOnFocus } from "@/components/dashboard-provider";
import { figmaColors, luneColors, lunePalette, luneRadius, luneShadow, luneSpacing } from "@/constants/tokens";
import { getFlowLabel, getMoodLabel } from "@/constants/copy";
import { buildCycleInfo, findRecordForDate, formatDateKey, sortRecordsByStartDate } from "@/utils/cycle";

function formatDisplayDate(value: Date, language: "zh" | "en") {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    month: language === "zh" ? "long" : "short",
    day: "numeric"
  }).format(value);
}

function formatPredictionDate(value: Date | null, language: "zh" | "en") {
  if (!value) {
    return language === "zh" ? "\u6682\u65e0" : "Not available";
  }

  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

function formatRecentDate(value: Date | string, language: "zh" | "en") {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export default function HomePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { cycleLength, periodLength, syncFromSummary } = useCyclePreferences();
  const { dashboard, loading } = useDashboardOnFocus();

  useEffect(() => {
    if (!dashboard?.summary) {
      return;
    }

    syncFromSummary(dashboard.summary.averageCycleLength, dashboard.summary.averagePeriodLength);
  }, [dashboard?.summary, syncFromSummary]);

  const records = dashboard?.records ?? [];
  const cycleInfo = useMemo(() => buildCycleInfo(records, cycleLength), [cycleLength, records]);
  const todayKey = formatDateKey(new Date());
  const todayRecord = useMemo(() => findRecordForDate(records, todayKey), [records, todayKey]);
  const todayLabel = useMemo(() => formatDisplayDate(new Date(), language), [language]);
  const mostRecent = useMemo(() => sortRecordsByStartDate(records)[0], [records]);

  const summaryRows = useMemo(
    () => [
      {
        id: "cycle",
        label: language === "zh" ? "\u5e73\u5747\u5468\u671f" : "Average cycle",
        value: dashboard?.summary.averageCycleLength ?? cycleLength,
        unit: language === "zh" ? "\u5929" : "days"
      },
      {
        id: "period",
        label: language === "zh" ? "\u5e73\u5747\u7ecf\u671f" : "Average period",
        value: dashboard?.summary.averagePeriodLength ?? periodLength,
        unit: language === "zh" ? "\u5929" : "days"
      },
      {
        id: "records",
        label: language === "zh" ? "\u8bb0\u5f55\u6b21\u6570" : "Logs",
        value: dashboard?.summary.recordCount ?? 0,
        unit: language === "zh" ? "\u6761" : "items"
      }
    ],
    [cycleLength, dashboard?.summary, language, periodLength]
  );

  const handleOpenLog = () => {
    router.push({
      pathname: "/log-entry",
      params: todayRecord ? { date: todayKey, recordId: todayRecord.id } : { date: todayKey }
    });
  };

  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={figmaColors.floPink} />
          <Text style={styles.loadingText}>
            {language === "zh" ? "\u6b63\u5728\u52a0\u8f7d..." : "Loading..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasCycleInfo = cycleInfo.currentCycleDay !== null;
  const recentSymptoms = mostRecent?.symptoms.filter((s) => s !== "none") ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <View style={styles.topBar}>
            <View style={styles.avatarBadge}>
              <BrandAvatar size={36} />
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateText}>{todayLabel}</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/insights")}
              style={({ pressed }) => [styles.calendarButton, pressed ? styles.pressed : null]}
            >
              <AppIcon name="calendar" size={20} color={figmaColors.floInk} />
            </Pressable>
          </View>
        </FadeInView>

        <FadeInView delay={40}>
          <View style={styles.heroPanel}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.ringOuter}>
              <View style={styles.ringAccent} />
              <View style={styles.ringInner}>
                {hasCycleInfo ? (
                  <>
                    <Text style={styles.ringTopCaption}>
                      {language === "zh" ? "\u5468\u671f\u7b2c" : "Cycle day"}
                    </Text>
                    <Text style={styles.ringValue}>{cycleInfo.currentCycleDay}</Text>
                    {cycleInfo.daysUntilNext !== null ? (
                      <Text style={[styles.ringSub, cycleInfo.isLate ? styles.ringSubWarn : null]} numberOfLines={1}>
                        {cycleInfo.isLate
                          ? language === "zh"
                            ? `\u8fdf\u5230 ${cycleInfo.daysUntilNext} \u5929`
                            : `${cycleInfo.daysUntilNext}d late`
                          : language === "zh"
                            ? `\u8ddd\u4e0b\u6b21 ${cycleInfo.daysUntilNext} \u5929`
                            : `${cycleInfo.daysUntilNext}d to next`}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.emptyCopy}>
                    {language === "zh" ? "\u5c1a\u65e0\u8bb0\u5f55\n\u4eca\u5929\u5f00\u59cb" : "No records\nStart today"}
                  </Text>
                )}
              </View>
            </View>

            {cycleInfo.nextPeriodDate ? (
              <Text style={styles.heroSubtle}>
                {language === "zh" ? "\u9884\u8ba1 " : "Est. "}
                {formatPredictionDate(cycleInfo.nextPeriodDate, language)}
              </Text>
            ) : null}

            <Pressable
              onPress={handleOpenLog}
              style={({ pressed }) => [
                styles.primaryButton,
                todayRecord ? styles.secondaryButton : null,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={[styles.primaryButtonLabel, todayRecord ? styles.secondaryButtonLabel : null]}>
                {todayRecord
                  ? language === "zh" ? "\u7f16\u8f91\u4eca\u65e5\u8bb0\u5f55" : "Edit today"
                  : language === "zh" ? "\u8bb0\u5f55\u4eca\u5929" : "Log today"}
              </Text>
            </Pressable>
          </View>
        </FadeInView>

        <FadeInView delay={80}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <Text style={styles.summaryTitle}>
                {language === "zh" ? "\u5468\u671f\u6982\u89c8" : "Cycle summary"}
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/insights")}
                style={({ pressed }) => [styles.summaryAction, pressed ? styles.pressed : null]}
              >
                <AppIcon name="arrowRight" size={16} color={figmaColors.floMuted} />
              </Pressable>
            </View>
            <View style={styles.summaryGrid}>
              {summaryRows.map((item) => (
                <View key={item.id} style={styles.summaryCell}>
                  <Text style={styles.summaryCellValue}>{item.value}</Text>
                  <Text style={styles.summaryCellUnit}>{item.unit}</Text>
                  <Text style={styles.summaryCellLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {mostRecent ? (
          <FadeInView delay={120}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/log-entry",
                  params: { date: formatDateKey(mostRecent.startDate), recordId: mostRecent.id }
                })
              }
              style={({ pressed }) => [styles.recentCard, pressed ? styles.pressed : null]}
            >
              <View style={styles.recentHead}>
                <Text style={styles.recentTitle}>
                  {language === "zh" ? "\u4e0a\u6b21\u8bb0\u5f55" : "Last entry"}
                </Text>
                <Text style={styles.recentDate}>{formatRecentDate(mostRecent.startDate, language)}</Text>
              </View>
              <View style={styles.recentMeta}>
                <View style={styles.chip}>
                  <Text style={styles.chipLabel}>{getFlowLabel(mostRecent.flowLevel, language)}</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipLabel}>{getMoodLabel(mostRecent.mood, language)}</Text>
                </View>
                {recentSymptoms.length > 0 ? (
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>
                      {recentSymptoms.length} {language === "zh" ? "\u9879\u75c7\u72b6" : "symptom"}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          </FadeInView>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const RING_SIZE = 150;
const RING_BORDER = 5;
const RING_INNER = RING_SIZE - RING_BORDER * 2 - 14;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: luneColors.bg
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: luneSpacing.sm
  },
  loadingText: {
    color: luneColors.muted,
    fontSize: 14,
    fontWeight: "500"
  },
  content: {
    paddingHorizontal: luneSpacing.lg,
    paddingTop: luneSpacing.xs,
    paddingBottom: luneSpacing.xl,
    gap: luneSpacing.md
  },
  topBar: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  avatarBadge: {
    width: 36,
    height: 36
  },
  dateBlock: {
    alignItems: "center"
  },
  dateText: {
    color: luneColors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  heroPanel: {
    borderRadius: luneRadius.hero,
    overflow: "hidden",
    backgroundColor: luneColors.pinkMist,
    paddingHorizontal: luneSpacing.lg,
    paddingVertical: luneSpacing.lg,
    alignItems: "center",
    gap: luneSpacing.sm
  },
  heroGlowLarge: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: lunePalette.alpha.white30,
    top: 24,
    left: -80
  },
  heroGlowSmall: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: lunePalette.alpha.white42,
    top: -30,
    right: -40
  },
  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
    borderColor: luneColors.pinkPale,
    backgroundColor: luneColors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  ringAccent: {
    position: "absolute",
    top: -RING_BORDER,
    left: -RING_BORDER,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER + 2,
    borderColor: "transparent",
    borderTopColor: lunePalette.alpha.accent32,
    borderRightColor: lunePalette.alpha.accent32,
    transform: [{ rotate: "16deg" }],
    opacity: 0.65
  },
  ringInner: {
    width: RING_INNER,
    height: RING_INNER,
    borderRadius: RING_INNER / 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    paddingHorizontal: 6
  },
  ringTopCaption: {
    color: luneColors.muted,
    fontSize: 11,
    fontWeight: "500"
  },
  ringValue: {
    color: luneColors.accent,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "800"
  },
  ringSub: {
    color: luneColors.inkBody,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center"
  },
  ringSubWarn: {
    color: luneColors.warning
  },
  emptyCopy: {
    color: luneColors.muted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "500"
  },
  heroSubtle: {
    color: luneColors.inkBody,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center"
  },
  primaryButton: {
    minWidth: 160,
    paddingHorizontal: luneSpacing.lg,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: luneColors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: luneShadow.cta.color,
    shadowOpacity: 1,
    shadowRadius: luneShadow.cta.blur,
    shadowOffset: { width: luneShadow.cta.x, height: luneShadow.cta.y },
    elevation: 4
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    backgroundColor: luneColors.surface,
    shadowOpacity: 0,
    elevation: 0
  },
  secondaryButtonLabel: {
    color: luneColors.accentDeep
  },
  summaryCard: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    overflow: "hidden"
  },
  summaryHead: {
    minHeight: 42,
    paddingHorizontal: luneSpacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: luneColors.lineStrong
  },
  summaryTitle: {
    color: luneColors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  summaryAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  summaryGrid: {
    flexDirection: "row",
    paddingVertical: luneSpacing.sm
  },
  summaryCell: {
    flex: 1,
    alignItems: "center",
    gap: 2
  },
  summaryCellValue: {
    color: luneColors.ink,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26
  },
  summaryCellUnit: {
    color: luneColors.muted,
    fontSize: 11,
    fontWeight: "500"
  },
  summaryCellLabel: {
    color: luneColors.inkBody,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2
  },
  recentCard: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    gap: luneSpacing.xs
  },
  recentHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  recentTitle: {
    color: luneColors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  recentDate: {
    color: luneColors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  recentMeta: {
    flexDirection: "row",
    gap: luneSpacing.xs,
    flexWrap: "wrap"
  },
  chip: {
    paddingHorizontal: luneSpacing.sm,
    minHeight: 26,
    borderRadius: 13,
    backgroundColor: luneColors.pinkMist,
    alignItems: "center",
    justifyContent: "center"
  },
  chipLabel: {
    color: luneColors.accentDeep,
    fontSize: 12,
    fontWeight: "600"
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});

import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { useLanguage } from "@/components/language-provider";
import { FadeInView } from "@/components/motion";
import { useDashboardOnFocus } from "@/components/dashboard-provider";
import { getFlowLabel } from "@/constants/copy";
import type { CycleRecord, FlowLevel } from "@/constants/shared";
import { luneColors, lunePalette, luneRadius, luneShadow, luneSpacing } from "@/constants/tokens";

const SUFFICIENT_RECORDS = 3;
const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;

type Lang = "zh" | "en";

type FlowDistItem = {
  label: string;
  count: number;
  percent: number;
};

type RecentItem = {
  id: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  flowLabel: string;
};

function buildFlowDist(records: CycleRecord[], language: Lang): FlowDistItem[] {
  const counts: Record<FlowLevel, number> = { light: 0, medium: 0, heavy: 0 };
  for (const r of records) {
    if (counts[r.flowLevel] !== undefined) counts[r.flowLevel]++;
  }
  const total = records.length || 1;
  return (["light", "medium", "heavy"] as FlowLevel[]).map((level) => ({
    label: getFlowLabel(level, language),
    count: counts[level],
    percent: Math.round((counts[level] / total) * 100)
  }));
}

function buildRecentList(records: CycleRecord[], language: Lang): RecentItem[] {
  const sorted = records.slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
  return sorted.map((r) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const duration = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      id: r.id,
      startDate: r.startDate.slice(0, 10),
      endDate: r.endDate.slice(0, 10),
      durationDays: Math.max(1, duration),
      flowLabel: getFlowLabel(r.flowLevel, language)
    };
  });
}

export default function TrendsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { dashboard } = useDashboardOnFocus();
  const [expanded, setExpanded] = useState(false);

  const records = dashboard?.records ?? [];
  const summary = dashboard?.summary;
  const recordCount = summary?.recordCount ?? 0;
  const hasData = records.length > 0;
  const hasSufficientData = recordCount >= SUFFICIENT_RECORDS;
  const remaining = Math.max(0, SUFFICIENT_RECORDS - recordCount);
  const guidancePercent = Math.round((Math.min(recordCount, SUFFICIENT_RECORDS) / SUFFICIENT_RECORDS) * 100);

  const allRecent = useMemo(() => buildRecentList(records, language), [records, language]);
  const recentList = expanded ? allRecent : allRecent.slice(0, 3);
  const totalRecords = allRecent.length;
  const showViewAll = !expanded && allRecent.length > 3;
  const flowDist = useMemo(() => buildFlowDist(records, language), [records, language]);

  const avgCycle = summary?.averageCycleLength || DEFAULT_CYCLE;
  const avgPeriod = summary?.averagePeriodLength || DEFAULT_PERIOD;

  const copy = {
    title: language === "zh" ? "趋势" : "Trends",
    avgCycleLabel: language === "zh" ? "平均周期" : "Avg cycle",
    avgPeriodLabel: language === "zh" ? "平均经期" : "Avg period",
    dayUnit: language === "zh" ? "天" : "days",
    itemUnit: language === "zh" ? "条" : "entries",
    flowDistTitle: language === "zh" ? "流量分布" : "Flow distribution",
    recentTitle: language === "zh" ? "最近记录" : "Recent records",
    noData: language === "zh" ? "暂无数据" : "No data yet",
    noDataHint:
      language === "zh"
        ? "开始记录后，趋势数据会出现在这里。"
        : "Start logging to see your trends here.",
    guidanceText:
      language === "zh"
        ? `再记录 ${remaining} 次即可查看趋势分析`
        : `${remaining} more record${remaining > 1 ? "s" : ""} needed for trend analysis`,
    encourageText:
      language === "zh"
        ? "坚持记录，趋势会越来越准确。"
        : "Keep logging — trends get more accurate over time.",
    viewAll:
      language === "zh"
        ? `查看全部 ${totalRecords} 条记录`
        : `View all ${totalRecords} records`
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.headerButton, pressed ? styles.pressed : null]}>
            <AppIcon name="back" size={20} color={luneColors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>
              {copy.title}
              {hasData ? (
                <Text style={styles.recordCount}> · {totalRecords} {copy.itemUnit}</Text>
              ) : null}
            </Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        {!hasData ? (
          <FadeInView>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{copy.noData}</Text>
              <Text style={styles.emptyHint}>{copy.noDataHint}</Text>
            </View>
          </FadeInView>
        ) : null}

        {hasData && !hasSufficientData ? (
          <FadeInView delay={40}>
            <View style={styles.guidanceCard}>
              <View style={styles.guidanceProgress}>
                <View style={[styles.guidanceFill, { width: `${guidancePercent}%` }]} />
              </View>
              <Text style={styles.guidanceText}>{copy.guidanceText}</Text>
            </View>
          </FadeInView>
        ) : null}

        {hasSufficientData ? (
          <FadeInView delay={60}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{avgCycle}</Text>
                <Text style={styles.statUnit}>{copy.dayUnit}</Text>
                <Text style={styles.statLabel}>{copy.avgCycleLabel}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{avgPeriod}</Text>
                <Text style={styles.statUnit}>{copy.dayUnit}</Text>
                <Text style={styles.statLabel}>{copy.avgPeriodLabel}</Text>
              </View>
            </View>
          </FadeInView>
        ) : null}

        {hasData ? (
          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.flowDistTitle}</Text>
              <View style={styles.flowBars}>
                {flowDist.map((item) => (
                  <View key={item.label} style={styles.flowBarRow}>
                    <Text style={styles.flowBarLabel}>{item.label}</Text>
                    <View style={styles.flowBarTrack}>
                      {item.percent > 0 ? (
                        <View style={[styles.flowBarFill, { width: `${item.percent}%` }]} />
                      ) : null}
                    </View>
                    <Text style={styles.flowBarPct}>{item.percent}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>
        ) : null}

        {hasData && recentList.length > 0 ? (
          <FadeInView delay={120}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.recentTitle}</Text>
              <View style={styles.recentList}>
                {recentList.map((item, index) => (
                  <View key={item.id} style={[styles.recentItem, index < recentList.length - 1 ? styles.recentItemBorder : null]}>
                    <View style={styles.recentDates}>
                      <Text style={styles.recentRange}>{item.startDate} → {item.endDate}</Text>
                      <Text style={styles.recentDuration}>{item.durationDays} {copy.dayUnit}</Text>
                    </View>
                    <Text style={styles.recentFlow}>{item.flowLabel}</Text>
                  </View>
                ))}
              </View>
              {showViewAll ? (
                <Pressable onPress={() => setExpanded(true)} style={({ pressed }) => [styles.viewAllWrap, pressed ? styles.pressed : null]}>
                  <Text style={styles.viewAllLink}>{copy.viewAll}</Text>
                </Pressable>
              ) : null}
              {!hasSufficientData ? (
                <Text style={styles.encourageText}>{copy.encourageText}</Text>
              ) : null}
            </View>
          </FadeInView>
        ) : null}
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
    fontSize: 24,
    fontWeight: "700"
  },
  recordCount: {
    color: luneColors.muted,
    fontSize: 14,
    fontWeight: "500"
  },
  emptyCard: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.xl,
    alignItems: "center",
    gap: luneSpacing.xs
  },
  emptyTitle: {
    color: luneColors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  emptyHint: {
    color: luneColors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center"
  },
  guidanceCard: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.pinkMist,
    borderWidth: 1,
    borderColor: luneColors.pinkBorder,
    padding: luneSpacing.md,
    gap: luneSpacing.xs
  },
  guidanceProgress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: luneColors.pinkBorder,
    overflow: "hidden"
  },
  guidanceFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: luneColors.accent
  },
  guidanceText: {
    color: luneColors.inkSecondary,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center"
  },
  statsRow: {
    flexDirection: "row",
    gap: luneSpacing.sm
  },
  statCard: {
    flex: 1,
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    alignItems: "center",
    gap: 2,
    ...luneShadow.card
  },
  statValue: {
    color: luneColors.accent,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 32
  },
  statUnit: {
    color: luneColors.muted,
    fontSize: 11,
    fontWeight: "500"
  },
  statLabel: {
    color: luneColors.inkSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  card: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    gap: luneSpacing.sm
  },
  sectionTitle: {
    color: luneColors.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  flowBars: {
    gap: luneSpacing.sm,
    marginTop: 4
  },
  flowBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: luneSpacing.sm
  },
  flowBarLabel: {
    width: 52,
    color: luneColors.inkSecondary,
    fontSize: 13,
    fontWeight: "600"
  },
  flowBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: lunePalette.neutral["200"],
    overflow: "hidden"
  },
  flowBarFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: luneColors.accent
  },
  flowBarPct: {
    width: 44,
    textAlign: "right",
    color: luneColors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  recentList: {
    marginTop: 4
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: luneSpacing.sm
  },
  recentItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: luneColors.divider
  },
  recentDates: {
    gap: 2
  },
  recentRange: {
    color: luneColors.ink,
    fontSize: 14,
    fontWeight: "600"
  },
  recentDuration: {
    color: luneColors.muted,
    fontSize: 11
  },
  recentFlow: {
    color: luneColors.accent,
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 3,
    paddingHorizontal: luneSpacing.xs,
    borderRadius: 8,
    backgroundColor: luneColors.accentSoft
  },
  viewAllWrap: {
    alignItems: "center",
    paddingTop: luneSpacing.sm,
    paddingBottom: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: luneColors.divider,
    marginTop: 2
  },
  viewAllLink: {
    color: luneColors.accent,
    fontSize: 13,
    fontWeight: "600"
  },
  encourageText: {
    color: luneColors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: luneSpacing.xs,
    paddingTop: luneSpacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: luneColors.divider
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});

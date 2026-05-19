import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { useLanguage } from "@/components/language-provider";
import { FadeInView } from "@/components/motion";
import { useCyclePreferences } from "@/components/cycle-preferences-provider";
import { useDashboardOnFocus } from "@/components/dashboard-provider";
import { getFlowLabel, getMoodLabel, getPainLabel, getSymptomLabel } from "@/constants/copy";
import { luneColors, luneComponent, luneRadius, luneShadow, luneSpacing } from "@/constants/tokens";
import {
  buildCalendarDays,
  buildCycleInfo,
  buildPeriodDayMap,
  findRecordForDate,
  formatDateKey,
  isPredictedPeriodDay
} from "@/utils/cycle";

const WEEK_DAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const WEEK_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatFullDate(value: Date, language: "zh" | "en") {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(value);
}

export default function CalendarPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { cycleLength, periodLength, syncFromSummary } = useCyclePreferences();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));
  const { dashboard, loading } = useDashboardOnFocus();

  useEffect(() => {
    if (!dashboard?.summary) {
      return;
    }
    syncFromSummary(dashboard.summary.averageCycleLength, dashboard.summary.averagePeriodLength);
  }, [dashboard?.summary, syncFromSummary]);

  const records = dashboard?.records ?? [];
  const cycleInfo = useMemo(() => buildCycleInfo(records, cycleLength), [cycleLength, records]);
  const periodDayMap = useMemo(() => buildPeriodDayMap(records), [records]);
  const days = useMemo(() => buildCalendarDays(currentDate), [currentDate]);
  const todayKey = formatDateKey(new Date());
  const weekDays = language === "zh" ? WEEK_DAYS_ZH : WEEK_DAYS_EN;

  const selectedRecord = useMemo(
    () => findRecordForDate(records, selectedDateKey),
    [records, selectedDateKey]
  );
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDateKey.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }, [selectedDateKey]);

  const todayRecord = useMemo(() => findRecordForDate(records, todayKey), [records, todayKey]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long"
      }).format(currentDate),
    [currentDate, language]
  );

  const selectDate = (dateKey: string) => {
    setSelectedDateKey(dateKey);
  };

  const openLogForSelected = () => {
    router.push({
      pathname: "/log-entry",
      params: selectedRecord
        ? { date: selectedDateKey, recordId: selectedRecord.id }
        : { date: selectedDateKey }
    });
  };

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
          <ActivityIndicator size="large" color={luneColors.accent} />
          <Text style={styles.loadingText}>
            {language === "zh" ? "正在加载..." : "Loading..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedSymptoms = selectedRecord?.symptoms.filter((s) => s !== "none") ?? [];
  const isSelectedPredicted = isPredictedPeriodDay(
    selectedDateObj,
    cycleInfo.lastPeriodStart,
    cycleLength,
    periodLength
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <View style={styles.monthBar}>
            <Pressable
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              style={({ pressed }) => [styles.monthNav, pressed ? styles.pressed : null]}
            >
              <AppIcon name="back" size={18} color={luneColors.ink} />
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              style={({ pressed }) => [styles.monthNav, pressed ? styles.pressed : null]}
            >
              <AppIcon name="arrowRight" size={18} color={luneColors.ink} />
            </Pressable>
          </View>
        </FadeInView>

        <FadeInView delay={40}>
          <View style={styles.calCard}>
            <View style={styles.weekRow}>
              {weekDays.map((item) => (
                <Text key={item} style={styles.weekDay}>
                  {item}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.emptyCell} />;
                }
                const dateKey = formatDateKey(date);
                const record = periodDayMap.get(dateKey);
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDateKey;
                const isPeriod = Boolean(record);
                const isPredicted =
                  !isPeriod &&
                  isPredictedPeriodDay(date, cycleInfo.lastPeriodStart, cycleLength, periodLength);
                const hasSymptoms = Boolean(record?.symptoms?.length && record.symptoms[0] !== "none");

                return (
                  <View key={dateKey} style={styles.dayWrap}>
                    <Pressable
                      onPress={() => selectDate(dateKey)}
                      style={({ pressed }) => [
                        styles.dayButton,
                        isToday ? styles.todayButton : null,
                        isPeriod ? styles.periodButton : null,
                        isPredicted ? styles.predictedButton : null,
                        isSelected ? styles.selectedButton : null,
                        pressed ? styles.pressed : null
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayLabel,
                          isToday ? styles.todayLabel : null,
                          isPeriod ? styles.periodLabel : null,
                          isPredicted ? styles.predictedLabel : null,
                          isSelected && !isPeriod ? styles.selectedLabel : null
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </Pressable>
                    <View style={styles.dotArea}>
                      {hasSymptoms && !isPeriod ? <View style={styles.symptomDot} /> : null}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.legendInline}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotPeriod]} />
                <Text style={styles.legendText}>{language === "zh" ? "经期" : "Period"}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotPredicted]} />
                <Text style={styles.legendText}>{language === "zh" ? "预测期" : "Predicted"}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotSymptom]} />
                <Text style={styles.legendText}>{language === "zh" ? "症状" : "Symptoms"}</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={80}>
          <View style={styles.detailCard}>
            <View style={styles.detailHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailDate}>{formatFullDate(selectedDateObj, language)}</Text>
                <Text style={styles.detailHint}>
                  {selectedDateKey === todayKey
                    ? language === "zh" ? "今天" : "Today"
                    : isSelectedPredicted
                      ? language === "zh" ? "预测经期" : "Predicted period"
                      : ""}
                </Text>
              </View>
              <Pressable
                onPress={openLogForSelected}
                hitSlop={8}
                style={({ pressed }) => [styles.detailEdit, pressed ? styles.pressed : null]}
              >
                <Text style={styles.detailEditLabel}>
                  {selectedRecord
                    ? language === "zh" ? "编辑" : "Edit"
                    : language === "zh" ? "新增" : "Add"}
                </Text>
              </Pressable>
            </View>

            {selectedRecord ? (
              <View style={styles.detailBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>{language === "zh" ? "血量" : "Flow"}</Text>
                  <Text style={styles.detailRowValue}>
                    {getFlowLabel(selectedRecord.flowLevel, language)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>{language === "zh" ? "疼痛" : "Pain"}</Text>
                  <Text style={styles.detailRowValue}>
                    {getPainLabel(selectedRecord.painLevel, language)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>{language === "zh" ? "心情" : "Mood"}</Text>
                  <Text style={styles.detailRowValue}>
                    {getMoodLabel(selectedRecord.mood, language)}
                  </Text>
                </View>
                {selectedSymptoms.length > 0 ? (
                  <View style={styles.detailSymptomRow}>
                    <Text style={styles.detailRowLabel}>{language === "zh" ? "症状" : "Symptoms"}</Text>
                    <View style={styles.detailChips}>
                      {selectedSymptoms.map((s) => (
                        <View key={s} style={styles.detailChip}>
                          <Text style={styles.detailChipLabel}>{getSymptomLabel(s, language)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                {selectedRecord.note ? (
                  <Text style={styles.detailNote}>{selectedRecord.note}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.detailEmpty}>
                {language === "zh" ? "这一天暂无记录" : "No record for this day"}
              </Text>
            )}
          </View>
        </FadeInView>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Pressable
        onPress={handleOpenLog}
        style={({ pressed }) => [styles.fab, pressed ? styles.pressed : null]}
      >
        <AppIcon name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const CELL_SIZE = luneComponent.calendar.cellSize;
const CELL_RADIUS = luneComponent.calendar.cellRadius;

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
    paddingHorizontal: luneSpacing.screenGutter,
    paddingTop: luneSpacing.sm,
    paddingBottom: luneSpacing.xl,
    gap: luneSpacing.md
  },
  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: luneSpacing.xxs
  },
  monthNav: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.line,
    alignItems: "center",
    justifyContent: "center"
  },
  monthLabel: {
    color: luneColors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  calCard: {
    borderRadius: luneRadius.xl,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.line,
    paddingTop: luneSpacing.md,
    paddingHorizontal: luneSpacing.xs,
    paddingBottom: luneSpacing.xs,
    shadowColor: luneShadow.card.color,
    shadowOpacity: 1,
    shadowRadius: luneShadow.card.blur,
    shadowOffset: { width: luneShadow.card.x, height: luneShadow.card.y },
    elevation: 1
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: luneSpacing.xs
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: luneColors.mutedSoft,
    fontSize: 11,
    fontWeight: "600"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: luneSpacing.xs
  },
  emptyCell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE
  },
  dayWrap: {
    width: `${100 / 7}%`,
    alignItems: "center"
  },
  dayButton: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_RADIUS,
    alignItems: "center",
    justifyContent: "center"
  },
  dayLabel: {
    color: luneColors.inkSecondary,
    fontSize: 14,
    fontWeight: "500"
  },
  todayButton: {
    backgroundColor: luneColors.pinkMist
  },
  todayLabel: {
    color: luneColors.ink,
    fontWeight: "700"
  },
  periodButton: {
    backgroundColor: luneColors.accent
  },
  periodLabel: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  predictedButton: {
    borderWidth: luneComponent.calendar.predictedBorder,
    borderColor: luneColors.pinkBorder,
    borderStyle: "dashed"
  },
  predictedLabel: {
    color: luneColors.accent
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: luneColors.accent
  },
  selectedLabel: {
    color: luneColors.accent,
    fontWeight: "700"
  },
  dotArea: {
    marginTop: 2,
    height: 6,
    alignItems: "center",
    justifyContent: "center"
  },
  symptomDot: {
    width: luneComponent.calendar.dotSize,
    height: luneComponent.calendar.dotSize,
    borderRadius: luneComponent.calendar.dotSize / 2,
    backgroundColor: luneColors.symptomDot
  },
  legendInline: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: luneSpacing.md,
    paddingTop: luneSpacing.xs,
    marginTop: luneSpacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: luneColors.divider
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: luneSpacing.xxs
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendDotPeriod: {
    backgroundColor: luneColors.accent
  },
  legendDotPredicted: {
    borderWidth: 1,
    borderColor: luneColors.pinkBorder,
    borderStyle: "dashed"
  },
  legendDotSymptom: {
    backgroundColor: luneColors.symptomDot
  },
  legendText: {
    color: luneColors.muted,
    fontSize: 10,
    fontWeight: "500"
  },
  detailCard: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    gap: luneSpacing.sm
  },
  detailHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  detailDate: {
    color: luneColors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  detailHint: {
    color: luneColors.accent,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2
  },
  detailEdit: {
    paddingHorizontal: luneSpacing.sm,
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: luneColors.pinkMist,
    borderWidth: 1,
    borderColor: luneColors.pinkBorder,
    alignItems: "center",
    justifyContent: "center"
  },
  detailEditLabel: {
    color: luneColors.accentDeep,
    fontSize: 12,
    fontWeight: "700"
  },
  detailBody: {
    gap: luneSpacing.xs
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28
  },
  detailRowLabel: {
    color: luneColors.muted,
    fontSize: 13,
    fontWeight: "500"
  },
  detailRowValue: {
    color: luneColors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  detailSymptomRow: {
    gap: 6
  },
  detailChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  detailChip: {
    paddingHorizontal: 10,
    minHeight: 24,
    borderRadius: 12,
    backgroundColor: luneColors.chipIdle,
    alignItems: "center",
    justifyContent: "center"
  },
  detailChipLabel: {
    color: luneColors.inkBody,
    fontSize: 11,
    fontWeight: "600"
  },
  detailNote: {
    color: luneColors.inkBody,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 4
  },
  detailEmpty: {
    color: luneColors.muted,
    fontSize: 13,
    fontWeight: "500"
  },
  bottomSpacer: {
    height: luneSpacing.xl
  },
  fab: {
    position: "absolute",
    right: luneSpacing.lg,
    bottom: luneSpacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: luneColors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: luneShadow.ctaFloat.color,
    shadowOpacity: 1,
    shadowRadius: luneShadow.ctaFloat.blur,
    shadowOffset: { width: luneShadow.ctaFloat.x, height: luneShadow.ctaFloat.y },
    elevation: 8
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92
  }
});

import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CycleRecordInput, FlowLevel, MoodTag, PainLevel, SymptomTag } from "@/constants/shared";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { useLanguage } from "@/components/language-provider";
import { useDashboardOnFocus } from "@/components/dashboard-provider";
import { FadeInView } from "@/components/motion";
import { DatePickerModal } from "@/components/date-picker-modal";
import { luneColors, luneRadius, luneSpacing } from "@/constants/tokens";
import { getFlowLabel, getMoodLabel, getPainLabel, getSymptomLabel } from "@/constants/copy";
import { api } from "@/services/api";
import { combineDateTimeToIso } from "@/utils/format";
import { formatDateKey } from "@/utils/cycle";

const FLOW_VALUES: FlowLevel[] = ["light", "medium", "heavy"];
const PAIN_VALUES: PainLevel[] = [0, 1, 2, 3];
const MOOD_VALUES: MoodTag[] = ["steady", "low", "irritable", "tired", "energetic"];
const SYMPTOM_ITEMS: Array<{ value: SymptomTag; icon: AppIconName }> = [
  { value: "cramps", icon: "alert" },
  { value: "headache", icon: "wind" },
  { value: "bloating", icon: "coffee" },
  { value: "fatigue", icon: "droplet" },
  { value: "back_pain", icon: "alert" },
  { value: "acne", icon: "sparkles" }
];

export default function LogEntryModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; recordId?: string }>();
  const { language } = useLanguage();
  const { dashboard, refresh: refreshDashboard } = useDashboardOnFocus();
  const [recordId, setRecordId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState(formatDateKey(new Date()));
  const [endDate, setEndDate] = useState(formatDateKey(new Date()));
  const [flowLevel, setFlowLevel] = useState<FlowLevel>("medium");
  const [symptoms, setSymptoms] = useState<SymptomTag[]>(["cramps"]);
  const [mood, setMood] = useState<MoodTag>("steady");
  const [painLevel, setPainLevel] = useState<PainLevel>(1);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerField, setDatePickerField] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    const preferredDate = typeof params.date === "string" ? params.date : formatDateKey(new Date());
    const records = dashboard?.records ?? [];
    const matchedRecord =
      typeof params.recordId === "string"
        ? records.find((item) => item.id === params.recordId)
        : undefined;

    if (matchedRecord) {
      setRecordId(matchedRecord.id);
      setStartDate(formatDateKey(matchedRecord.startDate));
      setEndDate(formatDateKey(matchedRecord.endDate));
      setFlowLevel(matchedRecord.flowLevel);
      setSymptoms(matchedRecord.symptoms.length && matchedRecord.symptoms[0] !== "none" ? matchedRecord.symptoms : ["cramps"]);
      setPainLevel(matchedRecord.painLevel);
      setMood(matchedRecord.mood);
      setNote(matchedRecord.note ?? "");
      return;
    }

    setRecordId(undefined);
    setStartDate(preferredDate);
    setEndDate(preferredDate);
    setFlowLevel("medium");
    setSymptoms(["cramps"]);
    setMood("steady");
    setNote("");
  }, [dashboard?.records, params.date, params.recordId]);

  const selectedSymptomCount = useMemo(() => symptoms.filter((item) => item !== "none").length, [symptoms]);

  const toggleSymptom = (value: SymptomTag) => {
    setSymptoms((current) => {
      if (current.includes(value)) {
        const next = current.filter((item) => item !== value);
        return next.length ? next : ["none"];
      }

      return [...current.filter((item) => item !== "none"), value];
    });
  };

  const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const save = async () => {
    if (!startDate || !endDate || !isValidDate(startDate) || !isValidDate(endDate)) {
      Alert.alert(
        language === "zh" ? "信息不完整" : "Missing fields",
        language === "zh" ? "请填写正确的日期格式 (YYYY-MM-DD)" : "Please enter valid dates (YYYY-MM-DD)"
      );
      return;
    }

    if (startDate > endDate) {
      Alert.alert(
        language === "zh" ? "日期错误" : "Date error",
        language === "zh" ? "开始日期不能晚于结束日期" : "Start date must be before end date"
      );
      return;
    }

    const payload: CycleRecordInput = {
      startDate: combineDateTimeToIso(startDate, "09:00"),
      endDate: combineDateTimeToIso(endDate, "18:00"),
      flowLevel,
      painLevel,
      symptoms,
      mood,
      note: note.trim() ? note.trim() : undefined
    };

    setIsSubmitting(true);
    try {
      if (recordId) {
        await api.updateRecord(recordId, payload);
      } else {
        await api.createRecord(payload);
      }

      await refreshDashboard();
      Alert.alert(
        language === "zh" ? "已保存" : "Saved",
        language === "zh" ? "记录已更新" : "Record updated",
        [{ text: "OK", onPress: dismiss }]
      );
    } catch (error) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : undefined;
      if (statusCode === 409) {
        Alert.alert(
          language === "zh" ? "日期冲突" : "Date conflict",
          language === "zh"
            ? "该日期与已有周期记录重叠，请调整日期或编辑已有记录。"
            : "This date overlaps an existing cycle record. Adjust the date or edit the existing record."
        );
      } else {
        Alert.alert(
          language === "zh" ? "保存失败" : "Save failed",
          language === "zh" ? "请稍后重试" : "Please retry later"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = () => {
    if (!recordId || isSubmitting) return;

    Alert.alert(
      language === "zh" ? "删除记录" : "Delete record",
      language === "zh" ? "删除后将永久移除，确定继续吗？" : "This record will be permanently removed.",
      [
        { text: language === "zh" ? "取消" : "Cancel", style: "cancel" },
        {
          text: language === "zh" ? "删除" : "Delete",
          style: "destructive",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await api.deleteRecord(recordId);
              await refreshDashboard();
              Alert.alert(
                language === "zh" ? "已删除" : "Deleted",
                "",
                [{ text: "OK", onPress: dismiss }]
              );
            } catch {
              Alert.alert(
                language === "zh" ? "删除失败" : "Delete failed",
                language === "zh" ? "请稍后重试" : "Please retry later"
              );
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          onPress={dismiss}
          hitSlop={10}
          style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
        >
          <AppIcon name="close" size={20} color={luneColors.ink} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{language === "zh" ? "记录" : "Log"}</Text>
        </View>
        <View style={styles.closeButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{language === "zh" ? "日期" : "Date range"}</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>{language === "zh" ? "开始" : "Start"}</Text>
                <Pressable
                  onPress={() => setDatePickerField("start")}
                  style={({ pressed }) => [styles.dateButton, pressed ? styles.pressed : null]}
                >
                  <Text style={styles.dateButtonText}>{startDate || "YYYY-MM-DD"}</Text>
                  <AppIcon name="calendar" size={16} color={luneColors.muted} />
                </Pressable>
              </View>
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>{language === "zh" ? "结束" : "End"}</Text>
                <Pressable
                  onPress={() => setDatePickerField("end")}
                  style={({ pressed }) => [styles.dateButton, pressed ? styles.pressed : null]}
                >
                  <Text style={styles.dateButtonText}>{endDate || "YYYY-MM-DD"}</Text>
                  <AppIcon name="calendar" size={16} color={luneColors.muted} />
                </Pressable>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={40}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{language === "zh" ? "血量" : "Flow"}</Text>
            <View style={styles.segmentRow}>
              {FLOW_VALUES.map((item) => {
                const active = flowLevel === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setFlowLevel(item)}
                    style={({ pressed }) => [
                      styles.segment,
                      active ? styles.segmentActive : null,
                      pressed ? styles.pressed : null
                    ]}
                  >
                    <Text style={[styles.segmentLabel, active ? styles.segmentLabelActive : null]}>
                      {getFlowLabel(item, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={60}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{language === "zh" ? "疼痛程度" : "Pain level"}</Text>
            <View style={styles.segmentRow}>
              {PAIN_VALUES.map((item) => {
                const active = painLevel === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setPainLevel(item)}
                    style={({ pressed }) => [
                      styles.segment,
                      active ? styles.segmentActive : null,
                      pressed ? styles.pressed : null
                    ]}
                  >
                    <Text style={[styles.segmentLabel, active ? styles.segmentLabelActive : null]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.painHint}>{getPainLabel(painLevel, language)}</Text>
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{language === "zh" ? "症状" : "Symptoms"}</Text>
              <Text style={styles.cardMeta}>
                {selectedSymptomCount} {language === "zh" ? "项" : "selected"}
              </Text>
            </View>
            <View style={styles.symptomGrid}>
              {SYMPTOM_ITEMS.map((item) => {
                const active = symptoms.includes(item.value);

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => toggleSymptom(item.value)}
                    style={({ pressed }) => [
                      styles.symptomItem,
                      active ? styles.symptomItemActive : null,
                      pressed ? styles.pressed : null
                    ]}
                  >
                    <AppIcon name={item.icon} size={20} color={active ? luneColors.accent : luneColors.muted} />
                    <Text style={[styles.symptomLabel, active ? styles.symptomLabelActive : null]}>
                      {getSymptomLabel(item.value, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={140}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{language === "zh" ? "心情" : "Mood"}</Text>
            <View style={styles.moodWrap}>
              {MOOD_VALUES.map((item) => {
                const active = mood === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setMood(item)}
                    style={({ pressed }) => [
                      styles.moodChip,
                      active ? styles.moodChipActive : null,
                      pressed ? styles.pressed : null
                    ]}
                  >
                    <Text style={[styles.moodLabel, active ? styles.moodLabelActive : null]}>
                      {getMoodLabel(item, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={180}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{language === "zh" ? "备注" : "Note"}</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={language === "zh" ? "可以留下今天的感受" : "Optional note for today"}
              placeholderTextColor={luneColors.mutedSoft}
              style={[styles.input, styles.noteInput]}
              multiline
              textAlignVertical="top"
              maxLength={200}
            />
          </View>
        </FadeInView>

        <Pressable onPress={save} disabled={isSubmitting} style={({ pressed }) => [styles.saveButton, (pressed || isSubmitting) ? styles.pressed : null]}>
          <Text style={styles.saveLabel}>
            {recordId
              ? language === "zh"
                ? "保存修改"
                : "Save changes"
              : language === "zh"
                ? "保存记录"
                : "Save log"}
          </Text>
        </Pressable>

        {recordId ? (
          <Pressable
            onPress={remove}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.deleteButton, (pressed || isSubmitting) ? styles.pressed : null]}
          >
            <Text style={styles.deleteLabel}>
              {language === "zh" ? "删除这条记录" : "Delete this record"}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <DatePickerModal
        visible={datePickerField !== null}
        value={datePickerField === "end" ? endDate : startDate}
        title={language === "zh" ? "选择日期" : "Select date"}
        cancelLabel={language === "zh" ? "取消" : "Cancel"}
        confirmLabel={language === "zh" ? "确定" : "Done"}
        unitYear={language === "zh" ? "年" : ""}
        unitMonth={language === "zh" ? "月" : ""}
        unitDay={language === "zh" ? "日" : ""}
        onClose={() => setDatePickerField(null)}
        onConfirm={(next) => {
          if (datePickerField === "end") {
            setEndDate(next);
          } else {
            setStartDate(next);
            if (!endDate || next > endDate) {
              setEndDate(next);
            }
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: luneColors.bg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: luneSpacing.md,
    paddingTop: luneSpacing.xs,
    paddingBottom: luneSpacing.xs,
    gap: luneSpacing.sm
  },
  headerTextWrap: {
    flex: 1,
    alignItems: "center"
  },
  headerTitle: {
    color: luneColors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: luneColors.chipIdle,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    paddingHorizontal: luneSpacing.lg,
    paddingTop: luneSpacing.sm,
    paddingBottom: luneSpacing.xl,
    gap: luneSpacing.sm
  },
  card: {
    borderRadius: luneRadius.lg,
    backgroundColor: luneColors.surface,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.sm,
    gap: luneSpacing.xs
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cardMeta: {
    color: luneColors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  cardTitle: {
    color: luneColors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  dateRow: {
    flexDirection: "row",
    gap: luneSpacing.sm
  },
  dateField: {
    flex: 1,
    gap: 4
  },
  fieldLabel: {
    color: luneColors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  input: {
    minHeight: 44,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.chipIdle,
    paddingHorizontal: luneSpacing.sm,
    color: luneColors.ink,
    fontSize: 15,
    fontWeight: "600"
  },
  dateButton: {
    minHeight: 44,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.chipIdle,
    paddingHorizontal: luneSpacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  dateButtonText: {
    color: luneColors.ink,
    fontSize: 15,
    fontWeight: "600"
  },
  noteInput: {
    minHeight: 88,
    paddingTop: luneSpacing.xs,
    fontWeight: "500"
  },
  painHint: {
    color: luneColors.muted,
    fontSize: 12,
    fontWeight: "500"
  },
  segmentRow: {
    flexDirection: "row",
    gap: luneSpacing.xs
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: luneRadius.md,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    backgroundColor: luneColors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentActive: {
    borderColor: luneColors.pinkBorder,
    backgroundColor: luneColors.pinkMist
  },
  segmentLabel: {
    color: luneColors.inkBody,
    fontSize: 14,
    fontWeight: "600"
  },
  segmentLabelActive: {
    color: luneColors.accent
  },
  symptomGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: luneSpacing.xs
  },
  symptomItem: {
    width: "31.5%",
    minHeight: 66,
    borderRadius: luneRadius.md,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    backgroundColor: luneColors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  symptomItemActive: {
    borderColor: luneColors.pinkBorder,
    backgroundColor: luneColors.pinkMist
  },
  symptomLabel: {
    color: luneColors.inkBody,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center"
  },
  symptomLabelActive: {
    color: luneColors.accent,
    fontWeight: "600"
  },
  moodWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: luneSpacing.xs
  },
  moodChip: {
    minHeight: 34,
    paddingHorizontal: luneSpacing.sm,
    borderRadius: 17,
    backgroundColor: luneColors.chipIdle,
    alignItems: "center",
    justifyContent: "center"
  },
  moodChipActive: {
    backgroundColor: luneColors.pinkPale
  },
  moodLabel: {
    color: luneColors.inkBody,
    fontSize: 13,
    fontWeight: "600"
  },
  moodLabelActive: {
    color: luneColors.accent
  },
  saveButton: {
    minHeight: 52,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: luneSpacing.xs
  },
  saveLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  deleteButton: {
    minHeight: 48,
    borderRadius: luneRadius.md,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center"
  },
  deleteLabel: {
    color: luneColors.dangerLink,
    fontSize: 14,
    fontWeight: "600"
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});

import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReminderPreference, ReminderPreferenceItem, ReminderType } from "@/constants/shared";
import { AppIcon } from "@/components/app-icon";
import { useLanguage } from "@/components/language-provider";
import { FadeInView } from "@/components/motion";
import { getReminderLabel } from "@/constants/copy";
import { luneColors, luneRadius, luneSpacing } from "@/constants/tokens";
import { api } from "@/services/api";

function toHHmm(value: string, fallback: string) {
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function toLeadDays(value: string, fallback: number) {
  const next = Number.parseInt(value, 10);

  if (Number.isNaN(next)) {
    return fallback;
  }

  return Math.min(Math.max(next, 0), 14);
}

function updateItem(
  items: ReminderPreferenceItem[],
  type: ReminderType,
  patch: Partial<ReminderPreferenceItem>
): ReminderPreferenceItem[] {
  return items.map((item) => (item.type === type ? { ...item, ...patch } : item));
}

export default function ReminderSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [preference, setPreference] = useState<ReminderPreference | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftQuietStart, setDraftQuietStart] = useState("22:00");
  const [draftQuietEnd, setDraftQuietEnd] = useState("08:00");
  const [draftLeadDays, setDraftLeadDays] = useState<Record<string, string>>({});
  const [draftTimes, setDraftTimes] = useState<Record<string, string>>({});

  const loadPreference = useCallback(async () => {
    try {
      const response = await api.getReminderPreferences();
      setPreference(response);
      setDraftQuietStart(response.quietHours.start);
      setDraftQuietEnd(response.quietHours.end);
      const leadMap: Record<string, string> = {};
      const timeMap: Record<string, string> = {};
      for (const item of response.items) {
        leadMap[item.type] = `${item.leadDays}`;
        timeMap[item.type] = item.time;
      }
      setDraftLeadDays(leadMap);
      setDraftTimes(timeMap);
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

  const reminderItems = useMemo(() => preference?.items ?? [], [preference?.items]);

  const save = async () => {
    if (!preference || saving) {
      return;
    }

    setSaving(true);
    try {
      await api.updateReminderPreferences(preference);
      Alert.alert(
        language === "zh" ? "\u5df2\u4fdd\u5b58" : "Saved",
        language === "zh" ? "\u63d0\u9192\u8bbe\u7f6e\u5df2\u66f4\u65b0" : "Reminder settings updated"
      );
    } catch {
      Alert.alert(
        language === "zh" ? "\u4fdd\u5b58\u5931\u8d25" : "Save failed",
        language === "zh" ? "\u8bf7\u7a0d\u540e\u91cd\u8bd5" : "Please retry later"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.headerButton, pressed ? styles.pressed : null]}>
            <AppIcon name="back" size={20} color={luneColors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{language === "zh" ? "\u63d0\u9192\u8bbe\u7f6e" : "Reminder settings"}</Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        <FadeInView>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{language === "zh" ? "\u514d\u6253\u6270\u65f6\u6bb5" : "Quiet hours"}</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.fieldLabel}>{language === "zh" ? "\u5f00\u59cb" : "Start"}</Text>
                <TextInput
                  value={draftQuietStart}
                  onChangeText={setDraftQuietStart}
                  onEndEditing={() =>
                    preference &&
                    setPreference({
                      ...preference,
                      quietHours: {
                        ...preference.quietHours,
                        start: toHHmm(draftQuietStart, preference.quietHours.start)
                      }
                    })
                  }
                  style={styles.input}
                  maxLength={5}
                  placeholder="HH:mm"
                  placeholderTextColor={luneColors.mutedSoft}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.fieldLabel}>{language === "zh" ? "\u7ed3\u675f" : "End"}</Text>
                <TextInput
                  value={draftQuietEnd}
                  onChangeText={setDraftQuietEnd}
                  onEndEditing={() =>
                    preference &&
                    setPreference({
                      ...preference,
                      quietHours: {
                        ...preference.quietHours,
                        end: toHHmm(draftQuietEnd, preference.quietHours.end)
                      }
                    })
                  }
                  style={styles.input}
                  maxLength={5}
                  placeholder="HH:mm"
                  placeholderTextColor={luneColors.mutedSoft}
                />
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={60}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{language === "zh" ? "\u63d0\u9192\u9879\u76ee" : "Reminder items"}</Text>
            <View style={styles.list}>
              {reminderItems.map((item, index) => (
                <View key={item.type} style={[styles.itemCard, index < reminderItems.length - 1 ? styles.itemBorder : null]}>
                  <View style={styles.itemHead}>
                    <View style={styles.itemCopy}>
                      <Text style={styles.itemTitle}>{getReminderLabel(item.type, language)}</Text>
                      <Text style={styles.itemSubtle}>
                        {language === "zh" ? "\u5f53\u524d\u65f6\u95f4" : "Current time"} {item.time}
                      </Text>
                    </View>
                    <Switch
                      trackColor={{ true: luneColors.pinkBorder, false: luneColors.lineStrong }}
                      thumbColor={item.enabled ? luneColors.accent : "#FFFFFF"}
                      value={item.enabled}
                      onValueChange={(enabled) => {
                        if (!preference) {
                          return;
                        }

                        setPreference({
                          ...preference,
                          items: updateItem(preference.items, item.type, { enabled })
                        });
                      }}
                    />
                  </View>

                  <View style={styles.inlineFields}>
                    <View style={styles.inlineField}>
                      <Text style={styles.fieldLabel}>{language === "zh" ? "\u63d0\u524d\u5929\u6570" : "Lead days"}</Text>
                      <TextInput
                        value={draftLeadDays[item.type] ?? `${item.leadDays}`}
                        onChangeText={(value) => setDraftLeadDays((prev) => ({ ...prev, [item.type]: value }))}
                        onEndEditing={() => {
                          if (!preference) {
                            return;
                          }

                          const parsed = toLeadDays(draftLeadDays[item.type] ?? `${item.leadDays}`, item.leadDays);
                          setPreference({
                            ...preference,
                            items: updateItem(preference.items, item.type, { leadDays: parsed })
                          });
                          setDraftLeadDays((prev) => ({ ...prev, [item.type]: `${parsed}` }));
                        }}
                        style={styles.input}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.inlineField}>
                      <Text style={styles.fieldLabel}>{language === "zh" ? "\u63d0\u9192\u65f6\u95f4" : "Time"}</Text>
                      <TextInput
                        value={draftTimes[item.type] ?? item.time}
                        onChangeText={(value) => setDraftTimes((prev) => ({ ...prev, [item.type]: value }))}
                        onEndEditing={() => {
                          if (!preference) {
                            return;
                          }

                          const validated = toHHmm(draftTimes[item.type] ?? item.time, item.time);
                          setPreference({
                            ...preference,
                            items: updateItem(preference.items, item.type, { time: validated })
                          });
                          setDraftTimes((prev) => ({ ...prev, [item.type]: validated }));
                        }}
                        style={styles.input}
                        maxLength={5}
                        placeholder="HH:mm"
                        placeholderTextColor={luneColors.mutedSoft}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        <Pressable onPress={save} disabled={saving} style={({ pressed }) => [styles.saveButton, (pressed || saving) ? styles.pressed : null]}>
          <Text style={styles.saveLabel}>{language === "zh" ? "\u4fdd\u5b58\u8bbe\u7f6e" : "Save settings"}</Text>
        </Pressable>
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
    alignItems: "center",
    gap: 2
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
    gap: luneSpacing.sm
  },
  cardTitle: {
    color: luneColors.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  timeRow: {
    flexDirection: "row",
    gap: luneSpacing.sm
  },
  timeField: {
    flex: 1,
    gap: 6
  },
  fieldLabel: {
    color: luneColors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  input: {
    minHeight: 48,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.chipIdle,
    paddingHorizontal: luneSpacing.sm,
    color: luneColors.ink,
    fontSize: 15,
    fontWeight: "600"
  },
  list: {
    gap: 0
  },
  itemCard: {
    paddingVertical: luneSpacing.sm,
    gap: luneSpacing.sm
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: luneColors.lineStrong
  },
  itemHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: luneSpacing.sm
  },
  itemCopy: {
    flex: 1,
    gap: 3
  },
  itemTitle: {
    color: luneColors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  itemSubtle: {
    color: luneColors.muted,
    fontSize: 12,
    fontWeight: "500"
  },
  inlineFields: {
    flexDirection: "row",
    gap: luneSpacing.sm
  },
  inlineField: {
    flex: 1,
    gap: 6
  },
  saveButton: {
    minHeight: 54,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  saveLabel: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700"
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});

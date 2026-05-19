import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "@/components/language-provider";
import { FadeInView, ScaleInView } from "@/components/motion";
import { api } from "@/services/api";
import { luneColors, luneRadius, luneShadow, luneSpacing } from "@/constants/tokens";
import { saveOnboardingComplete } from "@/utils/storage";
import { CONSENT_VERSION } from "@/constants/runtime";
import type { ConsentType } from "@/constants/shared";
const TOTAL_PAGES = 3;

type Lang = "zh" | "en";

interface FeatureItem {
  icon: string;
  title: string;
}

interface TrustItem {
  icon: string;
  label: string;
}

function buildCopy(language: Lang) {
  const isEn = language === "en";
  return {
    heroA: isEn ? "Your cycle data" : "你的经期数据",
    heroB: isEn ? "stays in your hands" : "只留在你手里",
    heroSub: isEn ? "Precise forecast · Smart reminders · No sign-up" : "精准预测 · 智能提醒 · 无需注册",
    featureTitle: isEn ? "Core features" : "核心功能",
    trustTitle: isEn ? "Privacy promise" : "隐私承诺",
    btnLearn: isEn ? "Learn more" : "了解更多",
    btnContinue: isEn ? "Continue" : "继 续",
    btnStart: isEn ? "Start tracking" : "开始记录",
    skip: isEn ? "Skip" : "跳过",
    footerNote: isEn ? "No sign-up · Data stays local" : "无需注册 · 数据仅存本地",
    initFailedTitle: isEn ? "Initialization failed" : "初始化失败",
    initFailedMessage: isEn ? "Please retry later" : "请稍后重试",
    privacyPurpose: isEn ? "Display privacy policy and user agreement" : "展示隐私政策与用户协议",
    sensitivePurpose: isEn
      ? "Record cycle and symptoms to generate prediction"
      : "记录经期与症状数据，用于生成周期预测"
  };
}

function buildFeatures(language: Lang): FeatureItem[] {
  const isEn = language === "en";
  return [
    { icon: "📅", title: isEn ? "No account, open and use" : "零账号，打开就用" },
    { icon: "✅", title: isEn ? "Export your data anytime" : "数据随时带走" },
    { icon: "🔔", title: isEn ? "Quiet reminders" : "安静提醒" }
  ];
}

function buildTrust(language: Lang): TrustItem[] {
  const isEn = language === "en";
  return [
    { icon: "🔒", label: isEn ? "End-to-end encrypted" : "端到端加密存储" },
    { icon: "📱", label: isEn ? "Data stays on device" : "数据仅存设备本地" },
    { icon: "🚫", label: isEn ? "Never sell user data" : "绝不出售用户数据" },
    { icon: "🧹", label: isEn ? "Delete anytime" : "随时一键彻底删除" }
  ];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const [page, setPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const copy = useMemo(() => buildCopy(language), [language]);
  const features = useMemo(() => buildFeatures(language), [language]);
  const trustItems = useMemo(() => buildTrust(language), [language]);

  const finish = useCallback(async () => {
    setSubmitting(true);
    try {
      const existing = await api.listConsents().catch(() => []);
      const isAlreadyGranted = (type: ConsentType) =>
        existing.some(
          (record) => record.type === type && record.status === "granted" && record.version === CONSENT_VERSION
        );
      const tasks: Array<Promise<unknown>> = [];
      if (!isAlreadyGranted("privacy_policy")) {
        tasks.push(
          api.grantConsent({ type: "privacy_policy", version: CONSENT_VERSION, purpose: copy.privacyPurpose })
        );
      }
      if (!isAlreadyGranted("sensitive_health_data")) {
        tasks.push(
          api.grantConsent({ type: "sensitive_health_data", version: CONSENT_VERSION, purpose: copy.sensitivePurpose })
        );
      }
      await Promise.all(tasks);
      await saveOnboardingComplete(true);
      void api.trackEvent("onboarding_complete").catch(() => undefined);
      router.replace("/(tabs)");
    } catch {
      Alert.alert(copy.initFailedTitle, copy.initFailedMessage);
    } finally {
      setSubmitting(false);
    }
  }, [copy, router]);

  const onMain = () => {
    if (page < TOTAL_PAGES - 1) {
      setPage(page + 1);
    } else {
      void finish();
    }
  };

  const mainLabel = page === 0 ? copy.btnLearn : page === 1 ? copy.btnContinue : copy.btnStart;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.logoMark}>
          <View style={styles.logoRing} />
          <View style={styles.logoDot} />
        </View>
        <Pressable onPress={toggleLanguage} style={({ pressed }) => [styles.langBtn, pressed ? styles.pressed : null]}>
          <Text style={styles.langBtnLabel}>{language === "zh" ? "EN" : "中"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {page === 0 ? (
          <View style={styles.heroPage}>
            <ScaleInView style={styles.heroCircle}>
              <View style={styles.circleGlow} />
              <View style={styles.circleWhite} />
              <View style={styles.circleCenter}>
                <Text style={styles.circleIcon}>💧</Text>
              </View>
            </ScaleInView>
            <FadeInView delay={120} style={styles.heroText}>
              <Text style={styles.heroLine}>{copy.heroA}</Text>
              <Text style={[styles.heroLine, styles.heroPink]}>{copy.heroB}</Text>
            </FadeInView>
            <FadeInView delay={200}>
              <Text style={styles.heroSub}>{copy.heroSub}</Text>
            </FadeInView>
          </View>
        ) : null}

        {page === 1 ? (
          <View style={styles.featurePage}>
            <FadeInView>
              <Text style={styles.sectionTitle}>{copy.featureTitle}</Text>
            </FadeInView>
            <View style={styles.featureList}>
              {features.map((item, index) => (
                <FadeInView key={item.icon} delay={80 + index * 60} style={styles.featureCard}>
                  <View style={styles.featureIconWrap}>
                    <Text style={styles.featureIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.featureLabel}>{item.title}</Text>
                </FadeInView>
              ))}
            </View>
          </View>
        ) : null}

        {page === 2 ? (
          <View style={styles.trustPage}>
            <FadeInView>
              <Text style={styles.sectionTitle}>{copy.trustTitle}</Text>
            </FadeInView>
            <FadeInView delay={80} style={styles.trustCard}>
              <View style={styles.trustGrid}>
                {trustItems.map((item, index) => (
                  <View key={item.icon} style={styles.trustItem}>
                    <Text style={styles.trustEmoji}>{item.icon}</Text>
                    <Text style={styles.trustLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </FadeInView>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          disabled={submitting}
          onPress={onMain}
          style={({ pressed }) => [styles.primaryBtn, pressed ? styles.pressed : null, submitting ? styles.btnDisabled : null]}
        >
          <Text style={styles.primaryBtnLabel}>{mainLabel}</Text>
        </Pressable>
        <View style={styles.bottomRow}>
          {page < 2 ? (
            <Pressable onPress={() => setPage(2)}>
              <Text style={styles.skipBtn}>{copy.skip}</Text>
            </Pressable>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
          <View style={styles.pipRow}>
            {[0, 1, 2].map((p) => (
              <Pressable key={p} onPress={() => setPage(p)} style={[styles.pip, page === p ? styles.pipOn : null]} />
            ))}
          </View>
          <View style={styles.skipPlaceholder} />
        </View>
        {page === 2 ? <Text style={styles.footerNote}>{copy.footerNote}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: luneColors.bg
  },
  topBar: {
    paddingHorizontal: luneSpacing.lg,
    paddingTop: luneSpacing.sm,
    paddingBottom: luneSpacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  logoMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  logoRing: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: luneColors.accent
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: luneColors.accent
  },
  langBtn: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    backgroundColor: luneColors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  langBtnLabel: {
    color: luneColors.ink,
    fontSize: 13,
    fontWeight: "600"
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: luneSpacing.lg,
    paddingTop: luneSpacing.lg,
    paddingBottom: luneSpacing.md,
    justifyContent: "center"
  },
  heroPage: {
    alignItems: "center",
    gap: luneSpacing.lg
  },
  heroCircle: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center"
  },
  circleGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: luneColors.pinkMist,
    opacity: 0.7
  },
  circleWhite: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: luneColors.surface,
    borderWidth: 2,
    borderColor: luneColors.pinkBorder
  },
  circleCenter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: luneColors.accentSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  circleIcon: {
    fontSize: 44
  },
  heroText: {
    alignItems: "center",
    gap: 6
  },
  heroLine: {
    color: luneColors.ink,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center"
  },
  heroPink: {
    color: luneColors.accent
  },
  heroSub: {
    color: luneColors.muted,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center"
  },
  featurePage: {
    gap: luneSpacing.lg
  },
  sectionTitle: {
    color: luneColors.ink,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  featureList: {
    gap: luneSpacing.sm
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: luneSpacing.md,
    backgroundColor: luneColors.surface,
    borderRadius: luneRadius.lg,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    ...luneShadow.card
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: luneColors.pinkMist,
    alignItems: "center",
    justifyContent: "center"
  },
  featureIcon: {
    fontSize: 24
  },
  featureLabel: {
    flex: 1,
    color: luneColors.ink,
    fontSize: 15,
    fontWeight: "600"
  },
  trustPage: {
    gap: luneSpacing.lg
  },
  trustCard: {
    backgroundColor: luneColors.surface,
    borderRadius: luneRadius.lg,
    borderWidth: 1,
    borderColor: luneColors.lineStrong,
    padding: luneSpacing.md,
    ...luneShadow.card
  },
  trustGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  trustItem: {
    width: "50%",
    paddingVertical: luneSpacing.sm,
    paddingHorizontal: luneSpacing.xs,
    alignItems: "center",
    gap: 6
  },
  trustEmoji: {
    fontSize: 26
  },
  trustLabel: {
    color: luneColors.inkSecondary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  },
  bottomBar: {
    paddingHorizontal: luneSpacing.lg,
    paddingTop: luneSpacing.md,
    paddingBottom: luneSpacing.lg,
    gap: luneSpacing.sm
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: luneRadius.md,
    backgroundColor: luneColors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  btnDisabled: {
    opacity: 0.6
  },
  primaryBtnLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4
  },
  skipBtn: {
    color: luneColors.muted,
    fontSize: 14,
    fontWeight: "500",
    minWidth: 56
  },
  skipPlaceholder: {
    minWidth: 56
  },
  pipRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: luneColors.lineStrong
  },
  pipOn: {
    backgroundColor: luneColors.accent,
    width: 24
  },
  footerNote: {
    color: luneColors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});

import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  figmaColors,
  figmaLayout,
  figmaRadii,
  figmaShadows,
  figmaSpacing,
  figmaTypography
} from "../constants/tokens";
import { useLanguage } from "./language-provider";
import { LanguageToggle } from "./language-toggle";
import { AppIcon } from "./app-icon";
import { BrandAvatar } from "./brand-avatar";
import { FadeInView } from "./motion";

type PageShellProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  showBack?: boolean;
  children: ReactNode;
};

export function PageShell({ title, subtitle, eyebrow, showBack = false, children }: PageShellProps) {
  const router = useRouter();
  const { copy } = useLanguage();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const styles = createStyles(isCompact);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLead}>
            {showBack ? (
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <AppIcon name="back" size={16} color={figmaColors.textPrimary} />
                <Text style={styles.backLabel}>{copy.shared.back}</Text>
              </Pressable>
            ) : (
              <BrandAvatar size={40} />
            )}
          </View>
          <View style={styles.headerCopy}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.headerAction}>
            <LanguageToggle />
          </View>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SurfaceCard({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const styles = createStyles(isCompact);

  return (
    <FadeInView>
      <View style={[styles.card, accent ? styles.accentCard : null]}>{children}</View>
    </FadeInView>
  );
}

function createStyles(isCompact: boolean) {
  const titleSize = isCompact ? 18 : 20;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: figmaColors.surfaceMuted
    },
    content: {
      paddingHorizontal: figmaLayout.pagePaddingHorizontal,
      paddingTop: figmaSpacing.xs,
      paddingBottom: figmaLayout.pagePaddingBottom,
      gap: figmaLayout.sectionGap
    },
    header: {
      minHeight: figmaLayout.topNavHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: figmaSpacing.sm
    },
    headerLead: {
      width: 48,
      alignItems: "flex-start"
    },
    headerCopy: {
      flex: 1,
      gap: 2
    },
    headerAction: {
      alignItems: "flex-end"
    },
    eyebrow: {
      color: figmaColors.textSecondary,
      fontSize: figmaTypography.caption.fontSize,
      lineHeight: figmaTypography.caption.lineHeight,
      fontWeight: "500"
    },
    backButton: {
      minHeight: figmaLayout.minTouchTarget,
      minWidth: figmaLayout.minTouchTarget,
      paddingHorizontal: 10,
      borderRadius: figmaRadii.md,
      borderWidth: 1,
      borderColor: figmaColors.divider,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
      backgroundColor: figmaColors.surface
    },
    backLabel: {
      color: figmaColors.textPrimary,
      fontWeight: "600",
      fontSize: 12
    },
    title: {
      color: figmaColors.textPrimary,
      fontSize: titleSize,
      lineHeight: titleSize + 4,
      fontWeight: figmaTypography.heading.fontWeight
    },
    subtitle: {
      color: figmaColors.textSecondary,
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 17 : 18
    },
    card: {
      borderRadius: figmaRadii.md,
      backgroundColor: figmaColors.surface,
      padding: isCompact ? 14 : figmaSpacing.md,
      gap: figmaSpacing.sm,
      borderWidth: 1,
      borderColor: "#EEF1F4",
      ...figmaShadows.card
    },
    accentCard: {
      backgroundColor: "#F3FCFB",
      borderColor: "#DDF4F1"
    }
  });
}

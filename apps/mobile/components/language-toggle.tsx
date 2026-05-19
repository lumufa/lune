import { Pressable, StyleSheet, Text } from "react-native";
import { figmaColors, figmaRadii } from "../constants/tokens";
import { useLanguage } from "./language-provider";

export function LanguageToggle() {
  const { copy, toggleLanguage } = useLanguage();

  return (
    <Pressable onPress={toggleLanguage} style={styles.button}>
      <Text style={styles.label}>{copy.languageToggle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    minWidth: 48,
    paddingHorizontal: 10,
    borderRadius: figmaRadii.sm,
    borderWidth: 1,
    borderColor: figmaColors.divider,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: figmaColors.surface
  },
  label: {
    color: figmaColors.textPrimary,
    fontSize: 12,
    fontWeight: "600"
  }
});

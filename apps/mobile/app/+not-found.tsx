import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "@/components/language-provider";
import { luneColors } from "@/constants/tokens";

export default function NotFoundScreen() {
  const router = useRouter();
  const { language } = useLanguage();

  return (
    <>
      <Stack.Screen options={{ title: language === "zh" ? "页面未找到" : "Not found" }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {language === "zh" ? "页面不存在" : "This screen doesn't exist."}
          </Text>
          <Pressable
            onPress={() => router.replace("/")}
            style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
          >
            <Text style={styles.buttonLabel}>
              {language === "zh" ? "返回首页" : "Go to home screen"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: luneColors.bg
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 20
  },
  title: {
    color: luneColors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: luneColors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});

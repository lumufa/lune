import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useLanguage } from "@/components/language-provider";
import { luneColors } from "@/constants/tokens";

export default function TabLayout() {
  const { language } = useLanguage();

  const labels =
    language === "zh"
      ? {
          index: "\u9996\u9875",
          insights: "\u65e5\u5386",
          settings: "\u8bbe\u7f6e"
        }
      : {
          index: "Home",
          insights: "Calendar",
          settings: "Settings"
        };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: luneColors.accent,
        tabBarInactiveTintColor: luneColors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarShowLabel: true,
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === "index"
              ? "home"
              : route.name === "insights"
                ? "today"
                : "settings";

          return <AppIcon name={iconName} color={color} size={size} />;
        }
      })}
    >
      <Tabs.Screen name="index" options={{ title: labels.index }} />
      <Tabs.Screen name="insights" options={{ title: labels.insights }} />
      <Tabs.Screen name="settings" options={{ title: labels.settings }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: luneColors.bg
  },
  tabBar: {
    backgroundColor: luneColors.surface,
    borderTopColor: luneColors.lineStrong,
    borderTopWidth: 1,
    height: 72,
    paddingTop: 4,
    paddingBottom: 10,
    shadowOpacity: 0,
    elevation: 0
  },
  tabItem: {
    paddingTop: 2,
    minHeight: 44
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.1,
    marginTop: -2
  }
});

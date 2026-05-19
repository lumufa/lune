import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from "react-native";
import 'react-native-reanimated';
import { CyclePreferencesProvider } from '@/components/cycle-preferences-provider';
import { DashboardProvider } from '@/components/dashboard-provider';
import { LanguageProvider } from '@/components/language-provider';
import { colors } from '@/constants/tokens';
import { loadOnboardingComplete } from '@/utils/storage';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const textDefaults = Text as typeof Text & {
  defaultProps?: {
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
  };
};

const textInputDefaults = TextInput as typeof TextInput & {
  defaultProps?: {
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
  };
};

textDefaults.defaultProps = {
  ...(textDefaults.defaultProps ?? {}),
  allowFontScaling: false,
  maxFontSizeMultiplier: 1
};

textInputDefaults.defaultProps = {
  ...(textInputDefaults.defaultProps ?? {}),
  allowFontScaling: false,
  maxFontSizeMultiplier: 1
};

export default function RootLayout() {
  return <RootLayoutNav />;
}

function OnboardingGate() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void loadOnboardingComplete().then((done) => {
      if (!done && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
    });
  }, [router, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <LanguageProvider>
      <CyclePreferencesProvider>
        <DashboardProvider>
        <OnboardingGate />
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="log-entry"
            options={{
              headerShown: false,
              presentation: "modal",
              animation: "slide_from_bottom",
              contentStyle: { backgroundColor: colors.background }
            }}
          />
          <Stack.Screen
            name="record/new"
            options={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background }
            }}
          />
          <Stack.Screen
            name="record/[id]"
            options={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background }
            }}
          />
          <Stack.Screen
            name="partner-settings"
            options={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background }
            }}
          />
          <Stack.Screen
            name="reminder-settings"
            options={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background }
            }}
          />
          <Stack.Screen
            name="trends"
            options={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background }
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background }
            }}
          />
          <Stack.Screen
            name="privacy"
            options={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background }
            }}
          />
        </Stack>
        </DashboardProvider>
      </CyclePreferencesProvider>
    </LanguageProvider>
  );
}

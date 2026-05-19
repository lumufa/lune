import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import { figmaMotion } from "@/constants/tokens";

type FadeInViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  distance?: number;
};

export function FadeInView({
  children,
  style,
  delay = 0,
  distance = 12
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: figmaMotion.pageTransitionMs,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: figmaMotion.pageTransitionMs,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  }, [delay, opacity, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

type ScaleInViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  fromScale?: number;
};

export function ScaleInView({
  children,
  style,
  delay = 0,
  fromScale = 0.8
}: ScaleInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(fromScale)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: figmaMotion.modalTransitionMs,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: figmaMotion.modalTransitionMs,
        delay,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true
      })
    ]).start();
  }, [delay, fromScale, opacity, scale]);

  return <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>;
}

type AnimatedHeightBarProps = {
  style?: StyleProp<ViewStyle>;
  targetHeight: number;
  delay?: number;
};

export function AnimatedHeightBar({
  style,
  targetHeight,
  delay = 0
}: AnimatedHeightBarProps) {
  const height = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    height.setValue(0);
    Animated.timing(height, {
      toValue: targetHeight,
      duration: figmaMotion.chartEnterMs,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [delay, height, targetHeight]);

  return <Animated.View style={[style, { height }]} />;
}

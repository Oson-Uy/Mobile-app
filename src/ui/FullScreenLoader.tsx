import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppTheme } from "../theme/AppThemeProvider";
import { brandLogoBackdrop } from "../theme/tokens";
import { BrandLogo } from "./BrandLogo";

type Props = {
  message?: string;
  /** Для пустых списков и второстепенных экранов — компактная колонка. */
  compact?: boolean;
};

export function FullScreenLoader({ message, compact }: Props) {
  const { palette: p } = useAppTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.07,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  if (compact) {
    return (
      <View style={styles.compact} accessibilityRole="progressbar">
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <BrandLogo size={40} />
        </Animated.View>
        <ActivityIndicator color={p.primary} style={styles.compactSpinner} />
        {message ? (
          <Text style={[styles.msgText, { color: p.textMuted }]}>{message}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[styles.full, { backgroundColor: brandLogoBackdrop }]}
      accessibilityRole="progressbar"
    >
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <BrandLogo size={88} />
      </Animated.View>
      <ActivityIndicator color={p.primary} size="large" style={styles.spinner} />
      {message ? (
        <Text style={[styles.msg, styles.msgText, { color: p.textMuted }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: { marginTop: 20 },
  msg: { marginTop: 16, textAlign: "center" },
  msgText: { fontSize: 16, lineHeight: 22 },
  compact: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 6,
  },
  compactSpinner: { marginTop: 4 },
});

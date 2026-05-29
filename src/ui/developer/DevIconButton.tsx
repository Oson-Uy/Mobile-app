import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { devIconButtonSize } from "./devPlatform";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type Props = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  /** filled = primary tint, tonal = muted bg, plain = transparent */
  variant?: "filled" | "tonal" | "plain";
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function DevIconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = "tonal",
  color,
  disabled,
  loading,
  style,
}: Props) {
  const { palette: p } = useAppTheme();
  const iconColor =
    color ?? (variant === "filled" ? "#FFFFFF" : variant === "tonal" ? p.primary : p.text);

  const bg =
    variant === "filled"
      ? p.primary
      : variant === "tonal"
        ? p.surfaceMuted
        : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={Platform.OS === "android" ? 6 : 4}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: pressed ? 0.72 : disabled ? 0.45 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      )}
    </Pressable>
  );
}

/** Иконка + короткая подпись (как быстрые действия iOS). */
export function DevIconAction({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { palette: p } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.actionCol, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.base, { backgroundColor: p.surfaceMuted }]}>
        <MaterialCommunityIcons name={icon} size={22} color={p.primary} />
      </View>
      <Text variant="labelSmall" style={[styles.actionLabel, { color: p.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const size = devIconButtonSize;

const styles = StyleSheet.create({
  base: {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCol: {
    alignItems: "center",
    gap: Platform.select({ ios: 4, android: 6, default: 4 }),
    minWidth: size + 8,
  },
  actionLabel: {
    fontWeight: "600",
    fontSize: Platform.select({ ios: 11, android: 12, default: 11 }),
  },
});

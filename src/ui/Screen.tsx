import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "react-native-paper";

export function Screen({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  const { color: _ignoreColor, ...safeRest } = rest as ViewProps & {
    color?: unknown;
  };
  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.background }, style]}
      {...safeRest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

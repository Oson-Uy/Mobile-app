import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "react-native-paper";

export function Screen({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.background }, style]}
      {...rest}
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

import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useAppTheme } from "../theme/AppThemeProvider";

export function Screen({ style, children, ...rest }: ViewProps) {
  const { colors: c } = useAppTheme();
  const { color: _ignoreColor, ...safeRest } = rest as ViewProps & {
    color?: unknown;
  };
  return (
    <View style={[styles.root, { backgroundColor: c.bg }, style]} {...safeRest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { cardSurface } from "../../theme/surfaces";
import { spacing } from "../../theme/tokens";

type Props = ViewProps & {
  children: React.ReactNode;
  padded?: boolean;
};

export function DevCard({ style, children, padded = true, ...rest }: Props) {
  const { colors: c, resolvedMode } = useAppTheme();
  return (
    <View
      style={[
        cardSurface(resolvedMode),
        { backgroundColor: c.bgElevated, borderColor: c.separator },
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    padding: spacing.lg,
  },
});

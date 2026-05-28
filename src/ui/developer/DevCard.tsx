import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { spacing } from "../../theme/tokens";
import { devCardSurface } from "./devPlatform";

type Props = ViewProps & {
  children: React.ReactNode;
  padded?: boolean;
};

export function DevCard({ style, children, padded = true, ...rest }: Props) {
  const { palette: p } = useAppTheme();
  return (
    <View
      style={[
        devCardSurface(),
        { backgroundColor: p.surface, borderColor: p.outline },
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

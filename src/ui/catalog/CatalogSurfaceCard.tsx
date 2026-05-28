import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { catalogCardSurface } from "./catalogPlatform";

type Props = ViewProps & {
  children: React.ReactNode;
};

export function CatalogSurfaceCard({ style, children, ...rest }: Props) {
  const { palette: p } = useAppTheme();
  return (
    <View
      style={[catalogCardSurface(), { backgroundColor: p.surface, borderColor: p.outline }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

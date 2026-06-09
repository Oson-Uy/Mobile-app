import React from "react";
import { View, type ViewProps } from "react-native";

import { useAppTheme } from "../theme/AppThemeProvider";
import { cardSurface } from "../theme/surfaces";

type Props = ViewProps & {
  children: React.ReactNode;
};

export function SurfaceCard({ style, children, ...rest }: Props) {
  const { colors: c, resolvedMode } = useAppTheme();
  return (
    <View
      style={[
        cardSurface(resolvedMode),
        { backgroundColor: c.bgElevated, borderColor: c.separator },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

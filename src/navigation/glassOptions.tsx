import { DynamicColorIOS, Platform } from "react-native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import type { AppColors, ResolvedThemeMode } from "../theme/tokens";

type StackHeaderOptions = Pick<
  NativeStackNavigationOptions,
  | "headerTransparent"
  | "headerBlurEffect"
  | "headerStyle"
  | "headerShadowVisible"
  | "headerLargeTitle"
  | "headerTintColor"
>;

export function stackHeaderOptions(colors: AppColors, mode: ResolvedThemeMode): StackHeaderOptions {
  if (Platform.OS === "ios") {
    return {
      headerTransparent: true,
      headerBlurEffect: mode === "dark" ? "systemChromeMaterialDark" : "regular",
      headerLargeTitle: false,
      headerShadowVisible: true,
      headerTintColor: DynamicColorIOS({
        dark: colors.brand,
        light: colors.brand,
      }) as unknown as string,
    };
  }

  return {
    headerTransparent: false,
    headerShadowVisible: true,
    headerLargeTitle: false,
    headerStyle: { backgroundColor: colors.bgElevated },
    headerTintColor: colors.brand,
  };
}

export function nativeStackGlassScreenOptions(
  colors: AppColors,
  mode: ResolvedThemeMode,
): NativeStackNavigationOptions {
  return {
    ...stackHeaderOptions(colors, mode),
    headerTitleStyle: { fontWeight: "800" as const, color: colors.label },
    contentStyle: { backgroundColor: colors.bg },
  };
}

export const iosScrollInset = Platform.select({
  ios: { contentInsetAdjustmentBehavior: "automatic" as const },
  default: {},
});

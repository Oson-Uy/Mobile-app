import { DynamicColorIOS, Platform, type ColorValue } from "react-native";

import { darkColors, lightColors } from "./tokens";

type ColorKey = keyof typeof lightColors;

/** DynamicColorIOS с парами light/dark из семантических токенов. */
export function iosSemanticColor(key: ColorKey): ColorValue {
  if (Platform.OS !== "ios") {
    return lightColors[key];
  }
  return DynamicColorIOS({
    light: lightColors[key],
    dark: darkColors[key],
  });
}

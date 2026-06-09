import { useAppTheme } from "./AppThemeProvider";

export function useThemeColors() {
  return useAppTheme().colors;
}

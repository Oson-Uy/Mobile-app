import type { AppColors } from "./tokens";
import type { ResolvedThemeMode } from "./tokens";

export type StatusChipVariant = "new" | "done" | "warning";

export function statusChip(
  variant: StatusChipVariant,
  mode: ResolvedThemeMode,
): { bg: string; fg: string } {
  if (variant === "new") {
    return mode === "dark"
      ? { bg: "rgba(255,214,10,0.2)", fg: "#FFD60A" }
      : { bg: "#FEF3C7", fg: "#92400E" };
  }
  if (variant === "done") {
    return mode === "dark"
      ? { bg: "rgba(48,209,88,0.18)", fg: "#30D158" }
      : { bg: "#DCFCE7", fg: "#166534" };
  }
  return mode === "dark"
    ? { bg: "rgba(255,69,58,0.18)", fg: "#FF453A" }
    : { bg: "#FEE2E2", fg: "#991B1B" };
}

export function chipOnBrand(_colors: AppColors): string {
  return _colors.brandOn;
}

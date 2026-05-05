export function minPricePerM2FromApiProject(project: {
  floors?: { pricePerM2: number }[];
}): number {
  const vals =
    project.floors
      ?.map((f) => f.pricePerM2)
      .filter((n) => typeof n === "number" && n > 0) ?? [];
  if (!vals.length) return 0;
  return Math.min(...vals);
}

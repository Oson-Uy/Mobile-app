export type CatalogFilterState = {
  pricePerM2Min: string;
  pricePerM2Max: string;
  areaMin: string;
  areaMax: string;
  verified: boolean;
  popular: boolean;
  location: string;
  district: string;
  hasInstallment: boolean;
};

export const defaultCatalogFilters: CatalogFilterState = {
  pricePerM2Min: "",
  pricePerM2Max: "",
  areaMin: "",
  areaMax: "",
  verified: false,
  popular: false,
  location: "",
  district: "",
  hasInstallment: false,
};

import type { ApiProjectListItem } from "../types/project";

type ApiFloor = {
  pricePerM2?: number;
  areaOptions?: { areaSqm?: number }[];
};

import { parseMoneyInput } from "../lib/currency";

const toNumber = (value: string): number | undefined => {
  const parsed = Number(value.replace(/\s/g, ""));
  return Number.isNaN(parsed) ? undefined : parsed;
};

/** Normalize filter numbers before filtering (strip thousands spaces). */
export function normalizeFiltersForQuery(f: CatalogFilterState): CatalogFilterState {
  return {
    ...f,
    pricePerM2Min: f.pricePerM2Min.trim()
      ? String(parseMoneyInput(f.pricePerM2Min))
      : "",
    pricePerM2Max: f.pricePerM2Max.trim()
      ? String(parseMoneyInput(f.pricePerM2Max))
      : "",
  };
}

/** Client-side filtering aligned with web catalog ([frontend/app/catalog/page.tsx](frontend/app/catalog/page.tsx)). */
export function filterCatalogProjects(
  projects: ApiProjectListItem[],
  filters: CatalogFilterState,
): ApiProjectListItem[] {
  const priceMin = toNumber(filters.pricePerM2Min);
  const priceMax = toNumber(filters.pricePerM2Max);
  const areaMin = toNumber(filters.areaMin);
  const areaMax = toNumber(filters.areaMax);
  const location = filters.location.trim();
  const district = filters.district.trim();

  const filtered = projects.filter((project) => {
    if (filters.verified && !project.badgeVerified) return false;
    if (filters.popular && !project.isPopular) return false;
    if (filters.hasInstallment && !project.hasInstallment) return false;

    if (location) {
      const pLoc = (project.location ?? "").toLowerCase();
      const sLoc = location.toLowerCase().replace(" region", "").trim();
      if (!pLoc.includes(sLoc)) return false;
    }

    if (district) {
      const pDist = (project.district ?? "").toLowerCase();
      const sDist = district.toLowerCase().trim();
      if (!pDist.includes(sDist)) return false;
    }

    if (priceMin || priceMax || areaMin || areaMax) {
      const hasFloors = (project.floors?.length ?? 0) > 0;
      if (!hasFloors) return false;

      return (project.floors ?? []).some((fl) => {
        const perM2 = fl.pricePerM2 || 0;
        if (priceMin && perM2 < priceMin) return false;
        if (priceMax && perM2 > priceMax) return false;

        const areas: number[] = (fl.areaOptions?.length ? fl.areaOptions : []).map(
          (o) => Number(o.areaSqm) || 0,
        );

        if (areaMin || areaMax) {
          const areaMatch = areas.some((area) => {
            if (!area) return false;
            if (areaMin && area < areaMin) return false;
            if (areaMax && area > areaMax) return false;
            return true;
          });
          if (!areaMatch) return false;
        }

        return true;
      });
    }

    return true;
  });

  return filtered.sort(
    (a, b) => (b.topInCatalog ? 1 : 0) - (a.topInCatalog ? 1 : 0),
  );
}

export type ApiDeveloper = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  legalAddress?: string | null;
  officeAddress?: string | null;
  website?: string | null;
  description?: string | null;
  logoUrl?: string | null;
};

export type ApiLayout = {
  id?: number;
  imageUrl: string;
  title?: string | null;
  sortOrder?: number;
};

export type ApiAreaOption = {
  areaSqm: number;
};

export type ApiFloor = {
  id: number;
  floor: number;
  pricePerM2: number;
  layouts: ApiLayout[];
  areaOptions: ApiAreaOption[];
};

export type ApiMedia = { imageUrl: string; sortOrder?: number };

export type ApiProjectPreview = {
  id: number;
  name: string;
  location: string;
  district?: string | null;
  imageUrl?: string | null;
  deliveryDate?: string;
  hasInstallment?: boolean;
  priceFrom?: number | null;
};

export type ApiProjectListItem = ApiProjectPreview & {
  developerId?: number;
  developer?: ApiDeveloper;
  media?: ApiMedia[];
  floors?: ApiFloor[];
  badgeVerified?: boolean;
  isPopular?: boolean;
  topInCatalog?: boolean;
  topInHome?: boolean;
  imageUrls?: string[];
};

export type ApiProjectFull = ApiProjectListItem & {
  description?: string | null;
  advantages?: string[];
  deliveryDate: string;
  totalFloors?: number | null;
  totalUnits?: number | null;
  plan?: string | null;
  qrCodeUrl?: string | null;
  mapEmbedUrl?: string | null;
  avgRating?: number | null;
  reviewsCount?: number;
  materials?: string[];
  buildingCount?: number | null;
  corpusCount?: number | null;
  ceilingHeightM?: number | null;
  hasSurfaceParking?: boolean;
  hasUndergroundParking?: boolean;
  surfaceParkingSpaces?: number | null;
  undergroundParkingSpaces?: number | null;
  elevatorsCount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  siblingProjects?: ApiProjectPreview[];
  nearbyProjects?: ApiProjectPreview[];
};

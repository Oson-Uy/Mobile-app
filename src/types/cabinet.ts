export type CabinetMe = {
  customer: {
    name: string;
    phone: string;
    verificationToken?: string | null;
  };
  project: {
    name: string;
    location: string;
    developerName?: string | null;
  };
  apartment: {
    number: string;
    floor: number;
    rooms: number;
    areaSqm: number;
    layoutImageUrl?: string | null;
  } | null;
  finances: {
    totalPriceUzs: number;
    paidUzs: number;
    remainingUzs: number;
    debtUzs: number;
    monthlyDueUzs?: number | null;
  };
  payments: Array<{
    id: number;
    amountUzs: number;
    paidAt: string;
    comment: string | null;
    type: string;
  }>;
  documents: Array<{ id: number; title: string; fileUrl: string }>;
  progress: {
    milestones: Array<{
      id: number;
      title: string;
      done: boolean;
      photoUrls: string[];
    }>;
  };
};

export type CabinetLoginResponse = {
  token: string;
};

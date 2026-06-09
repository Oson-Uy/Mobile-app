export type CatalogStackParamList = {
  CatalogList: undefined;
  ProjectDetails: { id: number };
  LeadForm: { projectId: number; floorId?: number; projectName?: string };
};

export type CabinetStackParamList = {
  CabinetGate: undefined;
  CabinetLogin: undefined;
  CabinetDashboard: undefined;
};

export type DeveloperStackParamList = {
  DeveloperGate: undefined;
  DeveloperLogin: { finishMode?: "replaceHome" | "goBackMain" };
  DeveloperHome: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  DeveloperWorkspace: undefined;
  DeveloperLogin: { finishMode?: "replaceHome" | "goBackMain" };
};

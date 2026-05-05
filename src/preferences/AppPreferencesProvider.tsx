import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";

import { STORAGE_KEYS, type UserRole } from "./storageKeys";

type AppPreferencesContextValue = {
  hydrated: boolean;
  onboardingDone: boolean;
  role: UserRole;
  completeOnboarding: (next: UserRole) => Promise<void>;
  setRole: (next: UserRole) => Promise<void>;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(
  null,
);

export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [role, setRoleState] = useState<UserRole>("buyer");

  useEffect(() => {
    void (async () => {
      try {
        const [ob, r] = await Promise.all([
          SecureStore.getItemAsync(STORAGE_KEYS.onboarding),
          SecureStore.getItemAsync(STORAGE_KEYS.role),
        ]);
        setOnboardingDone(ob === "1");
        setRoleState(r === "developer" ? "developer" : "buyer");
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const persistRole = useCallback(async (next: UserRole) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.role, next);
    setRoleState(next);
  }, []);

  const completeOnboarding = useCallback(async (next: UserRole) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.onboarding, "1");
    await SecureStore.setItemAsync(STORAGE_KEYS.role, next);
    setOnboardingDone(true);
    setRoleState(next);
  }, []);

  const setRole = useCallback(async (next: UserRole) => {
    await persistRole(next);
  }, [persistRole]);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      hydrated,
      onboardingDone,
      role,
      completeOnboarding,
      setRole,
    }),
    [hydrated, onboardingDone, role, completeOnboarding, setRole],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }
  return ctx;
}

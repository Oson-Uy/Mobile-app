import { useEffect } from "react";
import { router } from "expo-router";

import { consumePendingDeveloperWorkspace } from "../onboarding/pendingDeveloperLogin";

/** После онбординга «Я застройщик» — открыть кабинет один раз. */
export function PendingDeveloperWorkspace() {
  useEffect(() => {
    if (!consumePendingDeveloperWorkspace()) return;
    requestAnimationFrame(() => {
      setTimeout(() => router.push("/developer"), 50);
    });
  }, []);

  return null;
}

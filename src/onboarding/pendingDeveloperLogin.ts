let pendingOpenWorkspace = false;

export function setPendingDeveloperWorkspace() {
  pendingOpenWorkspace = true;
}

/** Сбрасывает флаг и возвращает, нужно ли открыть кабинет (один раз после онбординга). */
export function consumePendingDeveloperWorkspace(): boolean {
  const v = pendingOpenWorkspace;
  pendingOpenWorkspace = false;
  return v;
}

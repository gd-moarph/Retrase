const runningImports = new Map<string, AbortController>();

export function getRunningImportSources(): string[] {
  return Array.from(runningImports.keys()).filter(
    (key) => !runningImports.get(key)?.signal.aborted
  );
}

export function registerImport(source: string): AbortSignal {
  const existing = runningImports.get(source);
  if (existing && !existing.signal.aborted) {
    existing.abort();
  }
  const controller = new AbortController();
  runningImports.set(source, controller);
  return controller.signal;
}

export function cancelImport(source: string): boolean {
  const controller = runningImports.get(source);
  if (controller && !controller.signal.aborted) {
    controller.abort();
    return true;
  }
  return false;
}

export function unregisterImport(source: string): void {
  runningImports.delete(source);
}

export function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Import anulat");
  }
}

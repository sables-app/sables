export function isDevEnv(): boolean {
  try {
    if (
      typeof process === "object" &&
      process?.env?.NODE_ENV === "development"
    ) {
      return true;
    }
    // Not using optional chaining, because Vite performs string replacement
    if ((import.meta as any).env.DEV) {
      return true;
    }
  } catch (_error) {
    // Do nothing
  }

  return false;
}

export function isTestEnv(): boolean {
  try {
    if (typeof process === "object" && process?.env?.NODE_ENV === "test") {
      return true;
    }
  } catch (_error) {
    // Do nothing
  }

  return false;
}

export function isSSREnv(): boolean {
  try {
    if (typeof process === "object" && Boolean(process?.env?.SSR)) {
      return true;
    }
    // Not using optional chaining, because Vite performs string replacement
    // the `Boolean` is necessary, because `import.meta.env.SSR` is set to `"1"`.
    return Boolean((import.meta as any).env.SSR);
  } catch (_error) {
    // Do nothing
  }

  return false;
}

export function isDebugEnv(workerEnv?: Record<string, unknown>): boolean {
  const stringToBoolean = (value: string) => Boolean(JSON.parse(value));

  try {
    if (workerEnv?.DEBUG) {
      return stringToBoolean(String(workerEnv?.DEBUG));
    }
    if (workerEnv?.VITE_DEBUG) {
      return stringToBoolean(String(workerEnv?.VITE_DEBUG));
    }
    if (typeof process === "object") {
      if (typeof process?.env?.DEBUG === "string") {
        return stringToBoolean(process.env.DEBUG);
      }
      if (typeof process?.env?.VITE_DEBUG === "string") {
        return stringToBoolean(process.env.VITE_DEBUG);
      }
    }
    // Not using optional chaining, because Vite performs string replacement
    if (typeof (import.meta as any).env.VITE_DEBUG === "string") {
      return stringToBoolean((import.meta as any).env.VITE_DEBUG);
    }
  } catch (_error) {
    // Do nothing
  }

  return false;
}

export function getBaseURL(): string {
  try {
    const baseUrl = (import.meta as any).env.BASE_URL;

    return typeof baseUrl == "string" ? baseUrl : "/";
  } catch (_error) {
    return "/";
  }
}

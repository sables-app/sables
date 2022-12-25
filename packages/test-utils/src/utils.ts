import { VITest } from "./types.js";

type LogKey = "info" | "log" | "warn" | "error";

export function silenceLogs(vitest: VITest, key: LogKey) {
  const { afterAll, beforeAll, vi } = vitest;
  let originalMethod: typeof console[LogKey];

  beforeAll(() => {
    originalMethod = console[key];
    console[key] = vi.fn();
  });

  afterAll(() => {
    console[key] = originalMethod;
  });
}

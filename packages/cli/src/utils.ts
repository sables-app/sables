import type { SablesBuildOptions } from "./types.js";

/** @public */
export const serverTargets = {
  /**
   * Server build target for the Node.js runtime
   *
   * @public
   */
  NODE: "node",
  /**
   * Server build target for the Cloudflare Workers runtime
   *
   * @public
   */
  WORKER: "worker",
} as const;

/**
 * A utility to retrieve boolean values from the Node.js env.
 * Intended to be used within Sables configuration files.
 *
 * @public
 */
export function envFlag(name: string) {
  return !!JSON.parse(process.env[name] || "false");
}

/**
 * A utility to assist in writing configuration for Sables.
 *
 * @public
 */
export function defineConfig(config: SablesBuildOptions): SablesBuildOptions {
  return config;
}

defineConfig.serverTargets = serverTargets;

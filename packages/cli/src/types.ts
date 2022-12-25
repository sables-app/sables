import type { serverTargets } from "./utils.js";

/**
 * It's recommend to use the constants available on the `defineConfig` utility.
 *
 * - `defineConfig.NODE`
 * - `defineConfig.WORKER`
 *
 * @public
 */
export type ServerTarget = typeof serverTargets[keyof typeof serverTargets];

/**
 * Configuration to build a Sables client application
 *
 * @public
 */
export interface ClientBundleOptions {
  /**
   * Determines whether the client bundle is minified.
   *
   * @defaultValue `true`
   *
   * @public
   */
  minify?: boolean;
  /**
   * The directory path to output client bundle artifacts.
   *
   * Client bundling is skipped if no output directory is provided.
   *
   * @public
   */
  output?: string;
  /**
   * A utility option to skip the bundling of the client.
   *
   * @public
   */
  skipBundle?: boolean;
}

/**
 * Configuration to build a Sables server
 *
 * @public
 */
export interface ServerBundleOptions {
  /**
   * The file path to a module serving as the server's entry point.
   *
   * @public
   */
  entry: string;
  /**
   * Determines whether the server bundle is minified.
   *
   * @defaultValue `true`
   *
   * @public
   */
  minify?: boolean;
  /**
   * The directory path to output server bundle artifacts.
   *
   * @public
   */
  output: string;
  /**
   * The server's runtime target.
   *
   * It's recommend to use the constants available on the `defineConfig` utility.
   *
   * - `defineConfig.NODE`
   * - `defineConfig.WORKER`
   *
   * @defaultValue `"node"`
   *
   * @public
   */
  target?: ServerTarget;
}

/**
 * Build configuration used by the `sables` CLI tool.
 * Should be the default export of a `sables.config.js`.
 *
 * @example
 *
 * import { defineConfig } from "sables";
 *
 * export default defineConfig({
 *   client: { output: "dist/client" },
 *   server: {
 *     entry: "src/entry-server.tsx",
 *     output: "dist/server",
 *     target: defineConfig.NODE,
 *   },
 * });
 *
 * @public
 */
export interface SablesBuildOptions {
  client?: ClientBundleOptions;
  server:
    | ServerBundleOptions
    | (ServerBundleOptions | false | null | undefined)[];
}

import { importTags } from "@sables/vite-plugin-import-tags";

import react from "@vitejs/plugin-react-swc";
import { ConfigEnv, PluginOption, UserConfig } from "vite";

/**
 * Includes the Import Tags and React plugins.
 *
 * @public
 */
export function viteSablesPlugin(options?: {
  importTagging?: boolean;
}): PluginOption[] {
  const enableTags = options?.importTagging !== false;

  return [enableTags && importTags(), react()];
}

/**
 * @public
 */
export function viteSablesDefaultConfig(_env: ConfigEnv): UserConfig {
  return {
    root: "src",
    build: {
      minify: false,
      manifest: true,
      modulePreload: {
        polyfill: true,
      },
    },
    plugins: [viteSablesPlugin()],
  };
}

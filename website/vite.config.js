import { viteSablesDefaultConfig, viteSablesPlugin } from "sables";

import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vite";

export default defineConfig((env) => ({
  ...viteSablesDefaultConfig(env),
  plugins: [
    mdx({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [remarkGfm],
    }),
    viteSablesPlugin(),
  ],
}));

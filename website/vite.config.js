import { viteSablesPlugin, viteSablesDefaultConfig } from "sables";
import { defineConfig } from "vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";

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

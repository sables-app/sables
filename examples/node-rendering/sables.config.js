import { defineConfig } from "sables";

export default defineConfig({
  client: {
    output: "dist/client",
  },
  server: {
    entry: "src/entry-server.tsx",
    output: "dist/server",
    target: defineConfig.NODE,
  },
});

import { defineConfig } from "sables";

export default defineConfig({
  client: {
    output: "dist/client",
  },
  server: {
    entry: "src/entry-worker.tsx",
    output: "dist/worker",
    target: defineConfig.WORKER,
  },
});

import { defineConfig, envFlag } from "sables";

export default defineConfig({
  client: {
    output: "dist/client",
    skipBundle: envFlag("SKIP_CLIENT"),
  },
  server: [
    !envFlag("SKIP_SERVER") && {
      entry: "src/entry-worker.ts",
      output: "dist/worker",
      target: defineConfig.WORKER,
    },
  ],
});

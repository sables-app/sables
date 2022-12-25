import { defineConfig, envFlag } from "sables";

export default defineConfig({
  client: {
    output: "dist/client",
    skipBundle: envFlag("SKIP_CLIENT"),
  },
  server: [
    // !envFlag("SKIP_SERVER") && {
    //   entry: "src/entry-server.ts",
    //   output: "dist/server",
    //   target: defineConfig.NODE,
    // },
    // !envFlag("SKIP_WORKER_RENDER") && {
    //   entry: "src/entry-worker-render.ts",
    //   output: "dist/worker-render",
    //   target: defineConfig.WORKER,
    // },
    !envFlag("SKIP_WORKER_TRANSITION") && {
      entry: "src/entry-worker-transition.ts",
      output: "dist/worker-transition",
      target: defineConfig.WORKER,
    },
  ],
});

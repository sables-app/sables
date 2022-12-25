/// <reference types="@cloudflare/workers-types" />

import { createRenderingHandler } from "@sables/server/worker/render";

export default {
  fetch: createRenderingHandler(() => import("./App.js")),
};

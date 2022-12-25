/// <reference types="@cloudflare/workers-types" />

import { createRenderingHandler } from "@sables/server/worker/render";

import App from "./App.js";

export default {
  fetch: createRenderingHandler(<App />),
};

/// <reference types="@cloudflare/workers-types" />

import { createTransitionHandler } from "@sables/server/worker/transition";

import { configureManager } from "./configureManager.js";

export default {
  fetch: createTransitionHandler(configureManager),
};

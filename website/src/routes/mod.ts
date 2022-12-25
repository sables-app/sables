import {
  createRouteEffects,
  createRoutes,
  delayTransition,
} from "@sables/framework/router";

import { SCREEN_ANIMATION_DURATION } from "../constants.js";
import type { AppEffectAPI } from "../types.js";

const routes = createRoutes<AppEffectAPI>()
  .set("home", "/")
  // Documentation
  .set("api", "/docs/api")
  .set("gettingStarted", "/docs/getting-started")
  .setForwarding("/docs", () => "/docs/getting-started")
  // Easy access to the loading screen for development
  .set("devLoading", "/__dev__/loading")
  .setEffects(() =>
    createRouteEffects().appendAll(delayTransition(SCREEN_ANIMATION_DURATION))
  );

export default routes;

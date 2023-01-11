import { assertType, describe, expect, it, test } from "vitest";

import { delayTransition } from "../effects.js";
import { createRouteEffects } from "../RouteEffects.js";
import { createRoutes } from "../Routes.js";

describe("RoutesEffects", () => {
  describe("createRoutesEffects", () => {
    test.only("appending route middleware", () => {
      const routes = createRoutes()
        .set("root", "/")
        .set("profile", "/profiles/:handle")
        .set("what", "/what");

      const routeEffects = createRouteEffects()
        // Append a route effect using a route reference
        .append(routes.Root, delayTransition(0))
        // Append a route effect using a route ID
        .append(routes.Profile.id, delayTransition(0))
        // Append a second route effect to the same route using a route reference
        .append(routes.Profile, delayTransition(0))
        // Add a transition complete listener using a route reference
        .onComplete(routes.Profile, () => undefined);

      expect(routeEffects).toMatchSnapshot();

      assertType<"root">(routeEffects.handlers.RootMiddleware.id);
      expect(routeEffects.handlers.RootMiddleware.id).toEqual("root");

      assertType<"profile">(routeEffects.handlers.ProfileMiddleware.id);
      expect(routeEffects.handlers.ProfileMiddleware.id).toEqual("profile");
    });
  });
});

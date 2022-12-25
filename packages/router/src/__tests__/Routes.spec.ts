import { describe, expect, it } from "vitest";

import { createRoutes } from "../Routes.js";

describe("Routes", () => {
  describe("find", () => {
    it("retrieves a set route by matching the given href", () => {
      const routes = createRoutes()
        .set("root", "/")
        .set("profile", "/profiles/:handle");

      const profileRoute = routes.find("/profiles/@ash.ketchum");

      expect(profileRoute).toEqual({
        id: "profile",
        path: "/profiles/:handle",
        params: { handle: "@ash.ketchum" },
      });
    });
  });
});

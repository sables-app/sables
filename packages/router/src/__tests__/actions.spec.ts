import { hasLazyMeta } from "@sables/core";

import { describe, expect, it, test } from "vitest";

import {
  advanceLocation,
  chooseLocation,
  ensureLocation,
  pushLocation,
  replaceLocation,
  retreatLocation,
} from "../actions.js";
import { definePath } from "../Path.js";
import { createRoutes } from "../Routes.js";

describe("actions", () => {
  describe("chooseLocation", () => {
    it("creates a `go` action from redux-first-history", () => {
      expect(chooseLocation(1)).toMatchSnapshot();
    });

    it("support action dependencies", () => {
      expect(hasLazyMeta(chooseLocation)).toBe(true);
    });
  });

  describe("retreatLocation", () => {
    it("creates a `goBack` action from redux-first-history", () => {
      expect(retreatLocation()).toMatchSnapshot();
    });

    it("support action dependencies", () => {
      expect(hasLazyMeta(retreatLocation)).toBe(true);
    });
  });

  describe("advanceLocation", () => {
    it("creates a `goForward` action from redux-first-history", () => {
      expect(advanceLocation()).toMatchSnapshot();
    });

    it("support action dependencies", () => {
      expect(hasLazyMeta(advanceLocation)).toBe(true);
    });
  });

  describe("pushLocation", () => {
    it("creates a `push` action from redux-first-history", () => {
      expect(pushLocation("/")).toMatchSnapshot();
    });

    it("support action dependencies", () => {
      expect(hasLazyMeta(pushLocation)).toBe(true);
    });
  });

  describe("replaceLocation", () => {
    it("creates a `replace` action from redux-first-history", () => {
      expect(replaceLocation("/")).toMatchSnapshot();
    });

    it("support action dependencies", () => {
      expect(hasLazyMeta(replaceLocation)).toBe(true);
    });
  });

  describe("ensureLocation", () => {
    it("support action dependencies", () => {
      expect(hasLazyMeta(ensureLocation)).toBe(true);
    });

    function createTestRoutes() {
      return createRoutes()
        .set("appRoot", "/app")
        .set("dogs", "/app/dogs/:name")
        .set("cats", definePath`/app/cats/${":name"}`)
        .setWildcard("birds", definePath`/app/birds/${"*"}`);
    }

    test("types", () => {
      const routes = createTestRoutes();

      // @ts-expect-error Requires a payload
      ensureLocation();

      // @ts Undefined paths aren't checked
      {
        ensureLocation([routes.AppRoot]);
        ensureLocation([routes.AppRoot, {}]);
        ensureLocation([routes.AppRoot, { foo: "bar" }]);

        ensureLocation([routes.Dogs]);
        ensureLocation([routes.Dogs, {}]);
        ensureLocation([routes.Dogs, { foo: "bar" }]);
      }

      // @ts-expect-error Params are required
      ensureLocation([routes.Cats]);
      // @ts-expect-error Params are required
      ensureLocation([routes.Cats, {}]);
      // @ts-expect-error Invalid params
      ensureLocation([routes.Cats, { foo: "bar" }]);
      ensureLocation([routes.Cats, { name: "Max" }]);

      // @ts-expect-error Params are required
      ensureLocation([routes.Birds]);
      // @ts-expect-error Params are required
      ensureLocation([routes.Birds, {}]);
      // @ts-expect-error Invalid params
      ensureLocation([routes.Birds, { foo: "bar" }]);
      ensureLocation([routes.Birds, { wildcard: "way/too/much" }]);
    });
  });
});

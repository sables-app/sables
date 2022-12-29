/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  ActionSubject,
  SYMBOL_EFFECT_API_LIFECYCLE,
  SYMBOL_EFFECT_API_ROUTES,
  SYMBOL_STORE_ROUTES,
} from "@sables/core";
import { createTestStore } from "@sables/core/__internal__test";

import { Observable } from "rxjs";
import * as vitest from "vitest";
import { describe, expect, it } from "vitest";

import { createRouter } from "../Router.js";
import { createRoutes } from "../Routes.js";
import { isRoutesCollection } from "../RoutesCollection.js";
import { getRoutesCollectionOnStore } from "../StoreEnhancer.js";
import { initializeTestRouter, waitForRouteTransition } from "./utils.js";

describe("Router", () => {
  describe("createRouter", () => {
    it("creates a router context", () => {
      const router = createRouter();

      expect(router.actions$).toBeInstanceOf(Observable);
      expect(router).toHaveProperty("initialize", expect.any(Function));
      expect(router).toHaveProperty("middleware", expect.any(Function));
      expect(router).toHaveProperty(
        "reducersMap",
        expect.objectContaining({
          sablesRouter: expect.any(Function),
          sablesRouteTransition: expect.any(Function),
        })
      );
      expect(router).toHaveProperty("routerSlice", expect.any(Object));
      expect(router.routerSlice).toHaveProperty(
        "reducer",
        router.reducersMap.sablesRouter
      );
    });

    it("sets default routes, if no initial routes are provided", () => {
      const router = createRouter();
      const { store } = createTestStore(vitest);
      router.initialize(store);
      const routesCollection = getRoutesCollectionOnStore(store);

      expect(routesCollection).not.toBeUndefined();

      const { routes, nextRoute } = routesCollection!.findByHref("/");

      expect(nextRoute).toHaveProperty("id", "defaultRoot");
      expect(nextRoute).toHaveProperty("params", {});
      expect(nextRoute).toHaveProperty("path", "/");
      expect(routes).toHaveProperty("DefaultRoot.path", "/");
    });

    it("set given initial routes", () => {
      const initialRoutes = createRoutes().set("appRoot", "/app/:abc");
      const router = createRouter({ initialRoutes });
      const { store } = createTestStore(vitest);
      router.initialize(store);
      const routesCollection = getRoutesCollectionOnStore(store);

      expect(routesCollection).not.toBeUndefined();

      const defaultRootResult = routesCollection!.findByHref("/");

      expect(defaultRootResult).toEqual({
        routes: undefined,
        nextRoute: undefined,
      });

      const { routes, nextRoute } = routesCollection!.findByHref("/app/123");

      expect(nextRoute).toHaveProperty("id", "appRoot");
      expect(nextRoute).toHaveProperty("params", { abc: "123" });
      expect(nextRoute).toHaveProperty("path", "/app/:abc");
      expect(routes).toHaveProperty("AppRoot.path", "/app/:abc");
    });

    it("allows the effect API to be customized", async () => {
      function customHelper() {
        return;
      }

      const { routeEffectFn } = initializeTestRouter(vitest, {
        effectAPI: (defaults) => ({ ...defaults, customHelper }),
      });

      await waitForRouteTransition();

      expect(routeEffectFn).toHaveBeenCalledOnce();
      expect(routeEffectFn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "sables/transitionRoute/start",
        }),
        expect.objectContaining({ customHelper }),
        expect.objectContaining({ aborted: false })
      );
    });

    describe("initialize", () => {
      it("returns a history instance", () => {
        const { history } = initializeTestRouter(vitest);

        expect(history).toHaveProperty("createHref", expect.any(Function));
      });

      it("set a route collection instance", () => {
        const { store } = initializeTestRouter(vitest);
        const routesCollection = getRoutesCollectionOnStore(store);

        expect(Object.hasOwn(store, SYMBOL_STORE_ROUTES)).toBe(true);
        expect(routesCollection).toEqual(expect.any(Object));
        expect(isRoutesCollection(routesCollection)).toBe(true);
      });

      it("creates an effect API with defaults", () => {
        let defaultEffectAPI: any;

        initializeTestRouter(vitest, {
          effectAPI(defaults) {
            defaultEffectAPI = defaults;
            return defaults;
          },
        });

        expect(defaultEffectAPI).toHaveProperty(
          "actions$",
          expect.any(ActionSubject)
        );
        expect(defaultEffectAPI).toHaveProperty(
          "dispatch",
          expect.any(Function)
        );
        expect(defaultEffectAPI).toHaveProperty(
          "getState",
          expect.any(Function)
        );
        expect(defaultEffectAPI[SYMBOL_EFFECT_API_LIFECYCLE]).toEqual(
          expect.objectContaining({
            current: undefined,
          })
        );
        expect(defaultEffectAPI[SYMBOL_EFFECT_API_ROUTES]).toEqual(
          expect.objectContaining({
            current: expect.any(Object),
          })
        );
      });
    });

    describe("middleware", () => {
      it("adds action observer middleware", async () => {
        const { routeEffectFn } = initializeTestRouter(vitest);

        await waitForRouteTransition();

        expect(routeEffectFn).toHaveBeenCalledOnce();

        const [, effectAPI] = routeEffectFn.mock.calls[0];

        expect(effectAPI.actions$).toBeInstanceOf(Observable);
      });
    });

    describe("reducersMap", () => {
      it("has the router reducer", () => {
        const router = createRouter();

        expect(router.reducersMap).toHaveProperty(
          "sablesRouter",
          expect.any(Function)
        );
      });

      it("has the route transition reducer", () => {
        const router = createRouter();

        expect(router.reducersMap).toHaveProperty(
          "sablesRouteTransition",
          expect.any(Function)
        );
      });
    });
  });
});

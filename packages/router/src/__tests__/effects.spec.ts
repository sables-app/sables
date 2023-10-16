import * as vitest from "vitest";
import { describe, expect, it, test, vi } from "vitest";

import {
  addRoutes,
  AddRoutesSignal,
  chainMiddleware,
  combineListeners,
  delayTransition,
  exitTransition,
  ExitTransitionSignal,
  ForwardRouteSignal,
  forwardTo,
  RouteMiddlewareSignal,
} from "../effects.js";
import { definePath } from "../Path.js";
import { createRoutes } from "../Routes.js";
import { mockRouteEffectParams } from "./utils.js";

vi.stubEnv("SSR", "true");

describe("effects", () => {
  describe("RouteMiddlewareSignal", () => {
    it("doesn't extend Error", () => {
      expect(new RouteMiddlewareSignal()).not.toBeInstanceOf(Error);
    });

    it("requires a message to be set", () => {
      expect(new RouteMiddlewareSignal()).toHaveProperty(
        "message",
        expect.any(String),
      );
    });
  });

  describe("AddRoutesSignal", () => {
    it("extends RouteMiddlewareSignal", () => {
      expect(new AddRoutesSignal(createRoutes())).toBeInstanceOf(
        RouteMiddlewareSignal,
      );
    });
  });

  describe("ForwardRouteSignal", () => {
    it("extends RouteMiddlewareSignal", () => {
      expect(new ForwardRouteSignal({ pathname: "/" })).toBeInstanceOf(
        RouteMiddlewareSignal,
      );
    });
  });

  describe("ExitTransitionSignal", () => {
    it("extends RouteMiddlewareSignal", () => {
      expect(new ExitTransitionSignal()).toBeInstanceOf(RouteMiddlewareSignal);
    });
  });

  describe("exitTransition", () => {
    it("throws a ExitTransitionSignal", async () => {
      const { params } = mockRouteEffectParams(vitest);

      await expect(exitTransition(...params)).rejects.toBeInstanceOf(
        ExitTransitionSignal,
      );
    });

    it("doesn't throw if the transition was aborted", async () => {
      const { params, abortController } = mockRouteEffectParams(vitest);

      abortController.abort();

      await expect(exitTransition(...params)).resolves.toBeUndefined();
    });
  });

  describe("delayTransition", () => {
    describe("returned route effect", () => {
      it("resolves", async () => {
        const { params } = mockRouteEffectParams(vitest);
        await expect(delayTransition(0)(...params)).resolves.toBeUndefined();
      });

      it("resolves if the transition was aborted", async () => {
        const { params, abortController } = mockRouteEffectParams(vitest);

        abortController.abort();

        await expect(delayTransition(0)(...params)).resolves.toBeUndefined();
      });
    });
  });

  describe("forwardTo", () => {
    describe("returned route effect", () => {
      it("throws a ForwardRouteSignal", async () => {
        const { params } = mockRouteEffectParams(vitest);
        const routes = createRoutes().set("defaultRoot", "/");

        await expect(
          forwardTo(() => routes.DefaultRoot)(...params),
        ).rejects.toBeInstanceOf(ForwardRouteSignal);
      });

      it("still throws a ForwardRouteSignal when given an location that doesn't match a route", async () => {
        const { params } = mockRouteEffectParams(vitest);

        await expect(
          forwardTo(() => "/location-does-not-match")(...params),
        ).rejects.toBeInstanceOf(ForwardRouteSignal);
      });

      it("resolves if the transition was aborted", async () => {
        const { params, abortController } = mockRouteEffectParams(vitest);
        const routes = createRoutes().set("defaultRoot", "/");

        abortController.abort();

        await expect(
          forwardTo(() => routes.DefaultRoot)(...params),
        ).resolves.toBeUndefined();
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

        // @ts Undefined paths aren't checked
        {
          forwardTo(() => [routes.AppRoot]);
          forwardTo(() => [routes.AppRoot, {}]);
          forwardTo(() => [routes.AppRoot, { foo: "bar" }]);

          forwardTo(() => [routes.Dogs]);
          forwardTo(() => [routes.Dogs, {}]);
          forwardTo(() => [routes.Dogs, { foo: "bar" }]);
        }

        // @ts-expect-error Params are required
        forwardTo(() => [routes.Cats]);
        // @ts-expect-error Params are required
        forwardTo(() => [routes.Cats, {}]);
        // @ts-expect-error Invalid params
        forwardTo(() => [routes.Cats, { foo: "bar" }]);
        forwardTo(() => [routes.Cats, { name: "Max" }]);

        // @ts-expect-error Params are required
        forwardTo(() => [routes.Birds]);
        // @ts-expect-error Params are required
        forwardTo(() => [routes.Birds, {}]);
        // @ts-expect-error Invalid params
        forwardTo(() => [routes.Birds, { foo: "bar" }]);
        forwardTo(() => [routes.Birds, { wildcard: "way/too/much" }]);
      });
    });
  });

  describe("addRoutes", () => {
    describe("returned route effect", () => {
      it("throws a AddRoutesSignal with the provided routes", async () => {
        const routes = createRoutes();
        const { params } = mockRouteEffectParams(vitest);
        const promise = addRoutes(() => routes)(...params);

        await expect(promise).rejects.toBeInstanceOf(AddRoutesSignal);
        await expect(promise).rejects.toHaveProperty("routes", routes);
      });

      it("throws a AddRoutesSignal with routes from a dynamic imported", async () => {
        const routes = createRoutes();
        const { params } = mockRouteEffectParams(vitest);
        const promise = addRoutes(async () => ({ default: routes }))(...params);

        await expect(promise).rejects.toBeInstanceOf(AddRoutesSignal);
        await expect(promise).rejects.toHaveProperty("routes", routes);
      });

      it("doesn't attempt to add the same routes twice", async () => {
        const routes = createRoutes();
        const { params } = mockRouteEffectParams(vitest);
        const routeEffect = addRoutes(() => routes);
        const promise = routeEffect(...params);

        await expect(promise).rejects.toBeInstanceOf(AddRoutesSignal);
        await expect(promise).rejects.toHaveProperty("routes", routes);

        const promise2 = routeEffect(...params);

        await expect(promise2).resolves.toBeUndefined();
      });

      it("registers dynamic imports", async () => {
        const routes = createRoutes();
        const { params, invokedImporters } = mockRouteEffectParams(vitest);
        const mockDynamicImport = async () => ({ default: routes });

        expect(invokedImporters).toHaveProperty("size", 0);

        await expect(
          addRoutes(mockDynamicImport)(...params),
        ).rejects.toBeInstanceOf(AddRoutesSignal);

        expect(invokedImporters).toHaveProperty("size", 1);
        expect(invokedImporters.has(String(mockDynamicImport))).toBe(true);
      });

      it("resolves if the transition was aborted", async () => {
        const { params, abortController } = mockRouteEffectParams(vitest);

        abortController.abort();

        await expect(
          addRoutes(() => createRoutes())(...params),
        ).resolves.toBeUndefined();
      });
    });
  });

  describe("chainMiddleware", () => {
    function createTestEffects() {
      const firstEffect = vi.fn(async () => undefined);
      const secondEffect = vi.fn(async () => undefined);
      const nextRouteEffect = chainMiddleware(firstEffect, secondEffect);

      return {
        firstEffect,
        secondEffect,
        nextRouteEffect,
      };
    }

    describe("returned route effect", () => {
      it("calls the given route effects asynchronously in series", async () => {
        const { firstEffect, secondEffect, nextRouteEffect } =
          createTestEffects();
        const { params } = mockRouteEffectParams(vitest);

        expect(firstEffect).toHaveBeenCalledTimes(0);

        const assertionResult = expect(
          nextRouteEffect(...params),
        ).resolves.toBeUndefined();

        expect(firstEffect).toHaveBeenCalledOnce();
        expect(firstEffect).toHaveBeenCalledWith(...params);

        expect(secondEffect).toHaveBeenCalledTimes(0);

        // Wait three microtasks for the second effect to be called
        // TODO - Describe each `await`
        {
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        }

        expect(secondEffect).toHaveBeenCalledOnce();
        expect(secondEffect).toHaveBeenCalledWith(...params);

        await assertionResult;
      });

      it("resolves early if the transition is aborted", async () => {
        const { firstEffect, secondEffect, nextRouteEffect } =
          createTestEffects();
        const { abortController, params } = mockRouteEffectParams(vitest);

        expect(firstEffect).toHaveBeenCalledTimes(0);

        const assertionResult = expect(
          nextRouteEffect(...params),
        ).resolves.toBeUndefined();

        expect(firstEffect).toHaveBeenCalledOnce();

        abortController.abort();

        await assertionResult;

        expect(secondEffect).not.toHaveBeenCalled();
      });
    });
  });

  describe("combineListeners", () => {
    it("calls the given listeners synchronously in series", async () => {
      const callOrder: string[] = [];
      const firstListener = vi.fn(() => callOrder.push("firstListener"));
      const secondListener = vi.fn(() => callOrder.push("secondListener"));
      const { action, effectAPI } = mockRouteEffectParams(vitest);

      const nextListener = combineListeners(firstListener, secondListener);

      expect(firstListener).toHaveBeenCalledTimes(0);
      expect(secondListener).toHaveBeenCalledTimes(0);

      expect(nextListener(action, effectAPI)).toBeUndefined();

      expect(firstListener).toHaveBeenCalledOnce();
      expect(secondListener).toHaveBeenCalledOnce();
      expect(firstListener).toHaveBeenCalledWith(action, effectAPI);
      expect(secondListener).toHaveBeenCalledWith(action, effectAPI);
      expect(callOrder).toEqual(["firstListener", "secondListener"]);
    });
  });
});

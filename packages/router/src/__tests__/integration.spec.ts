import * as Redux from "redux";
import { interval, lastValueFrom, map, take } from "rxjs";
import * as vitest from "vitest";
import { describe, expect, it, test, vi } from "vitest";

import {
  advanceLocation,
  ensureLocation,
  locationChange,
  retreatLocation,
} from "../actions.js";
import { endRouteTransitionReasons } from "../constants.js";
import { createRouteEffects } from "../RouteEffects.js";
import { createRoutes } from "../Routes.js";
import { selectCurrentRoute } from "../selectors.js";
import { buildHref } from "../utils.js";
import {
  addInvokedImportersToEffectAPI,
  initializeTestRouter,
  mockImporter,
  waitForEnsuredRouteTransition,
  waitForRouteTransition,
} from "./utils.js";

vi.stubEnv("SSR", "true");

describe("integration", () => {
  test("setRoutes", async () => {
    let invokedImporters: Set<string> | undefined = undefined;
    const aboutDogsRouteEffect = vi.fn();
    const aboutRouteEffectsAddListener = vi.fn();
    const aboutRouteEffects = createRouteEffects()
      .append("aboutDogs", aboutDogsRouteEffect)
      .onAdd(aboutRouteEffectsAddListener);

    const aboutRouteEffectsImporter = mockImporter(
      vitest,
      "aboutRouteEffectsImporter",
      aboutRouteEffects,
    );
    const aboutRoutes = createRoutes()
      .set("aboutUs", "/app/about/company")
      .set("aboutDogs", "/app/about/dogs")
      .setEffects(aboutRouteEffectsImporter);
    const aboutRoutesImporter = mockImporter(
      vitest,
      "aboutRoutesImporter",
      aboutRoutes,
    );
    const interruptListener = vi.fn();
    const initialRouteEffects =
      createRouteEffects().onInterruptAll(interruptListener);
    const initialRoutes = createRoutes()
      .set("appRoot", "/app")
      .set("dogs", "/app/dogs")
      .setRoutes("/app/about/*", aboutRoutesImporter)
      .setEffects(() => initialRouteEffects);
    const { actions$, assertCurrentRouteID, store } = initializeTestRouter(
      vitest,
      {
        initialLocation: "/app",
        initialRoutes,
        effectAPI(defaults) {
          invokedImporters = addInvokedImportersToEffectAPI(defaults);
          return defaults;
        },
      },
    );

    expect(selectCurrentRoute(store.getState())).toBeNull();
    {
      // Wait for the initial route transition to complete
      await waitForRouteTransition();
      // Wait for `initialRouteEffects` to be resolved
      await Promise.resolve();
      // Wait for `initialRouteEffects.onAdd` to be resolved
      await Promise.resolve();
    }
    assertCurrentRouteID(initialRoutes.AppRoot.id);

    const aboutDogsHref = buildHref(aboutRoutes.AboutDogs);

    expect(aboutDogsHref).toBe("/app/about/dogs");
    {
      store.dispatch(ensureLocation(aboutDogsHref));
    }
    expect(aboutRoutesImporter).not.toHaveBeenCalled();
    {
      // Wait for the about routes to be imported
      await waitForEnsuredRouteTransition();
    }
    expect(aboutRoutesImporter).toHaveBeenCalledOnce();
    expect(invokedImporters).toHaveProperty("size", 1);
    {
      // Wait for history replacement transition to start
      await waitForRouteTransition();
    }
    expect(aboutRouteEffectsImporter).toHaveBeenCalledOnce();
    {
      // Wait for the importer to resolve
      await Promise.resolve();
    }
    expect(invokedImporters).toHaveProperty("size", 2);
    expect(invokedImporters).toMatchSnapshot();
    expect(aboutDogsRouteEffect).not.toHaveBeenCalled();
    expect(aboutRouteEffectsAddListener).not.toHaveBeenCalled();
    {
      // Wait for route effects add handler to resolve
      await Promise.resolve();
      // Wait for route effects add handler to be invoked
      await Promise.resolve();
    }
    expect(aboutRouteEffectsAddListener).toHaveBeenCalledOnce();
    {
      // Wait for history replacement transition to end
      await waitForRouteTransition();
    }
    expect(interruptListener).toHaveBeenCalledOnce();
    expect(interruptListener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "sables/transitionRoute/end",
        payload: {
          locationChange: expect.any(Object),
          reason: endRouteTransitionReasons.INTERRUPTED,
          transitionID: expect.any(String),
        },
      }),
      expect.objectContaining({
        actions$,
      }),
    );
    expect(aboutDogsRouteEffect).toHaveBeenCalledOnce();
    {
      // Wait two microtasks for `aboutDogsRouteEffect` to resolve
      await Promise.resolve().then(() => Promise.resolve());
    }
    assertCurrentRouteID(aboutRoutes.AboutDogs.id);
  });

  test("retreatLocation and advanceLocation", async () => {
    const initialRoutes = createRoutes()
      .set("appRoot", "/app")
      .set("dogs", "/app/dogs")
      .set("cats", "/app/cats");
    const { assertCurrentRouteID, store } = initializeTestRouter(vitest, {
      initialLocation: "/app",
      initialRoutes,
    });

    expect(selectCurrentRoute(store.getState())).toBeNull();
    {
      await waitForRouteTransition();
    }
    assertCurrentRouteID(initialRoutes.AppRoot.id);
    {
      store.dispatch(ensureLocation(initialRoutes.Cats));
      await waitForEnsuredRouteTransition();
    }
    assertCurrentRouteID(initialRoutes.Cats.id);
    {
      store.dispatch(ensureLocation(initialRoutes.Dogs));
      await waitForEnsuredRouteTransition();
    }
    assertCurrentRouteID(initialRoutes.Dogs.id);
    {
      store.dispatch(retreatLocation());
      await waitForRouteTransition();
    }
    assertCurrentRouteID(initialRoutes.Cats.id);
    {
      store.dispatch(advanceLocation());
      await waitForRouteTransition();
    }
    assertCurrentRouteID(initialRoutes.Dogs.id);
  });

  describe("when multiple equivalent `ensureLocation` actions are dispatched", () => {
    function prepareTest() {
      const initialRoutes = createRoutes()
        .set("appRoot", "/app")
        .set("dogs", "/app/dogs")
        .set("cats", "/app/cats");
      const { actions$, assertCurrentRouteID, store } = initializeTestRouter(
        vitest,
        {
          initialLocation: "/app",
          initialRoutes,
        },
      );

      const dispatchedActions: Redux.AnyAction[] = [];

      actions$.subscribe((action) => dispatchedActions.push(action));

      return { assertCurrentRouteID, dispatchedActions, initialRoutes, store };
    }

    function testOneLocationPush(
      testTransition: (
        testBag: ReturnType<typeof prepareTest>,
      ) => Promise<void>,
    ) {
      it("dispatches only one location push action", async () => {
        const testBag = prepareTest();
        const {
          assertCurrentRouteID,
          dispatchedActions,
          initialRoutes,
          store,
        } = testBag;

        expect(selectCurrentRoute(store.getState())).toBeNull();
        {
          await waitForRouteTransition();
        }
        assertCurrentRouteID(initialRoutes.AppRoot.id);
        {
          await testTransition(testBag);
        }
        assertCurrentRouteID(initialRoutes.Cats.id);

        expect(dispatchedActions.filter(ensureLocation.match)).toHaveLength(4);
        expect(
          dispatchedActions.filter(locationChange.isPushAction),
        ).toHaveLength(1);
      });
    }

    describe("synchronously", () => {
      testOneLocationPush(async ({ store, initialRoutes }) => {
        store.dispatch(ensureLocation(initialRoutes.Cats));
        store.dispatch(ensureLocation(initialRoutes.Cats));
        store.dispatch(ensureLocation(initialRoutes.Cats));
        store.dispatch(ensureLocation(initialRoutes.Cats));
        await waitForEnsuredRouteTransition();
      });
    });

    describe("asynchronously", () => {
      testOneLocationPush(async ({ store, initialRoutes }) => {
        const dispatches = lastValueFrom(
          // Using 50ms to simulate an end-user clicking a link really fast
          interval(50).pipe(
            take(4),
            map(() => {
              store.dispatch(ensureLocation(initialRoutes.Cats));
            }),
          ),
        );

        await Promise.all([dispatches, waitForEnsuredRouteTransition()]);
      });
    });
  });
});

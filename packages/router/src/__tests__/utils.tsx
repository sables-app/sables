import {
  DefaultEffectAPI,
  SYMBOL_EFFECT_API_LIFECYCLE,
  SYMBOL_EFFECT_API_ROUTES,
} from "@sables/core";
import { createTestStore, mockEffectAPI } from "@sables/core/__internal__test";
import { createMutableRef, demandValue } from "@sables/utils";

import { Action } from "history";
import { Provider } from "react-redux";
import { create } from "react-test-renderer";
import type * as Redux from "redux";
import { combineReducers } from "redux";

import { createRouteEffects } from "../RouteEffects.js";
import { createRouter, CreateRouterOptions } from "../Router.js";
import { createRoutes } from "../Routes.js";
import { createRoutesCollection } from "../RoutesCollection.js";
import { transitionRoute } from "../routeTransitionSlice.js";
import { selectCurrentRoute } from "../selectors.js";
import { getRoutesCollectionOnStore } from "../StoreEnhancer.js";
import { RouteID, RouteMiddleware } from "../types.js";

export function initializeTestRouter(
  vitest: typeof import("vitest"),
  options: CreateRouterOptions = {}
) {
  const routeEffectFn = vitest.vi.fn();
  const routeEffects = createRouteEffects().append("appRoot", routeEffectFn);
  const defaultInitialRoutes = createRoutes()
    .set("appRoot", "/app")
    .setEffects(() => routeEffects);
  const router = createRouter({
    initialRoutes: options.initialRoutes || defaultInitialRoutes,
    initialLocation: "/app",
    ...options,
  });
  const { actions$ } = router;
  const { store } = createTestStore(vitest, {
    middleware: [router.middleware],
    reducer: combineReducers(router.reducersMap),
  });
  const history = router.initialize(store);
  const routesCollection = demandValue(getRoutesCollectionOnStore(store));

  function assertCurrentRouteID(routeID: RouteID) {
    vitest
      .expect(selectCurrentRoute(store.getState()))
      .toHaveProperty("id", routeID);
  }

  return {
    actions$,
    assertCurrentRouteID,
    defaultInitialRoutes,
    history,
    routeEffectFn,
    routeEffects,
    router,
    routesCollection,
    store,
  };
}

export async function waitForRouteTransition() {
  // Wait for location change to be observed
  await Promise.resolve();
  // Wait for `internalEffects.hasRouteEffectsExactlyForRouteID`
  await Promise.resolve();
  // Wait for `resolveExternalEffects`
  await Promise.resolve();
  // Wait for `externalRouteEffects._getHandlersByRouteID`
  await Promise.resolve();
  // Wait for route transition to start
  await Promise.resolve();
  // Wait for route transition to end
  await Promise.resolve();
}

export async function waitForEnsuredRouteTransition() {
  // Wait for `ensureLocation` action to be observed
  await Promise.resolve();
  await waitForRouteTransition();
}

export function createHookTester(store: Redux.Store, useHook: () => void) {
  const resultRef = createMutableRef();

  function TestComponent() {
    resultRef.current = useHook();

    return null;
  }

  function render() {
    create(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );
  }

  return {
    resultRef,
    render,
    store,
  };
}

export function createRouterHookTester(
  vitest: typeof import("vitest"),
  useHook: () => void
) {
  const context = initializeTestRouter(vitest);

  return {
    ...context,
    ...createHookTester(context.store, useHook),
  };
}

/**
 * Allows `registerDynamicImport` to function
 */
export function addInvokedImportersToEffectAPI(effectAPI: DefaultEffectAPI) {
  const invokedImporters = new Set<string>();

  effectAPI[SYMBOL_EFFECT_API_LIFECYCLE].current = {
    serverRequestStateRef: createMutableRef(
      "serverRequestStateRef test error message",
      { invokedImporters }
    ),
  };

  return invokedImporters;
}

export function mockRouteEffectParams(vitest: typeof import("vitest")) {
  const abortController = new AbortController();
  const routesCollection = createRoutesCollection();

  routesCollection.addInitial();

  const action = transitionRoute.start({
    locationChange: {
      location: {
        hash: "#",
        key: "123abc",
        pathname: "/",
        search: "?",
        state: undefined,
      },
      action: Action.Pop,
    },
    nextRoute: {
      id: "defaultRoot",
      path: "/",
      params: {},
    },
    transitionID: "abc123",
  });

  const effectAPI = mockEffectAPI(vitest);

  const invokedImporters = addInvokedImportersToEffectAPI(effectAPI);

  effectAPI[SYMBOL_EFFECT_API_ROUTES].current = routesCollection;

  const params: Parameters<RouteMiddleware> = [
    action,
    effectAPI,
    abortController.signal,
  ];

  return {
    abortController,
    action,
    effectAPI,
    invokedImporters,
    params,
    routesCollection,
  };
}

export function mockImporter<T>(
  vitest: typeof import("vitest"),
  uniqueName: string,
  defaultExport: T
) {
  const mockImporter = vitest.vi.fn(async () => ({
    default: defaultExport,
  }));

  mockImporter.toString = () => uniqueName;

  return mockImporter;
}

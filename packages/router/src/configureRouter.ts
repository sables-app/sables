import {
  DefaultEffectAPI,
  EFFECT_API_REF_MESSAGE,
  enhanceSlice,
} from "@sables/core";
import {
  composeMiddleware,
  createMutableRef,
  createReducersMapObject,
  isSSREnv,
  MutableReferenceObject,
} from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import type * as History from "history";
import { createBrowserHistory, createMemoryHistory } from "history";
import type * as Redux from "redux";
import { createReduxHistoryContext, RouterState } from "redux-first-history";

import { initRouter } from "./actions.js";
import { ROUTER_REDUCER_KEY } from "./constants.js";
import { createRouteTransitionMiddleware } from "./RouteTransitionMiddleware.js";
import { routeTransitionSlice } from "./routeTransitionSlice.js";
import { attachRoutesCollectionToStore } from "./StoreEnhancer.js";
import { CombinedRouterState, InitialLocation } from "./types.js";

function createRouterSlice(routerReducer: Redux.Reducer<RouterState>) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const slice: ReduxToolkit.Slice<RouterState, {}, typeof ROUTER_REDUCER_KEY> =
    {
      name: ROUTER_REDUCER_KEY,
      reducer: routerReducer,
      actions: {},
      caseReducers: {},
      getInitialState() {
        return routerReducer(undefined, { type: "@@init" });
      },
    };

  return enhanceSlice(slice);
}

function assertInitialRouterState(
  storeState: unknown,
): asserts storeState is CombinedRouterState {
  const isValid =
    storeState &&
    typeof storeState == "object" &&
    Object.hasOwn(storeState, ROUTER_REDUCER_KEY) &&
    Object.hasOwn(storeState, routeTransitionSlice.name);

  if (!isValid) {
    throw new Error(
      "Router reducer have not been configured correctly in the store.",
    );
  }
}

type ConfigureRouterOptions<EffectAPI extends DefaultEffectAPI> = {
  effectAPIRef?: MutableReferenceObject<EffectAPI>;
  history?: History.BrowserHistory | History.MemoryHistory;
  initialLocation?: InitialLocation;
  onError?: (error: unknown) => void;
};

function getRouterHistory<EffectAPI extends DefaultEffectAPI>({
  history,
  initialLocation,
}: ConfigureRouterOptions<EffectAPI>):
  | History.BrowserHistory
  | History.MemoryHistory {
  if (history) {
    return history;
  }

  if (isSSREnv() || typeof document == "undefined") {
    const initialEntries = initialLocation ? [initialLocation] : undefined;

    return createMemoryHistory({ initialEntries });
  }

  return createBrowserHistory();
}

/**
 * @internal
 */
export function configureRouter<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
>(options: ConfigureRouterOptions<EffectAPI>) {
  const {
    effectAPIRef = createMutableRef<EffectAPI>(EFFECT_API_REF_MESSAGE),
    onError,
  } = options;
  const historyContext = createReduxHistoryContext({
    history: getRouterHistory(options),
    routerReducerKey: ROUTER_REDUCER_KEY,
  });
  const routerSlice = createRouterSlice(historyContext.routerReducer);
  const routerReducersMap = createReducersMapObject(
    routerSlice,
    routeTransitionSlice,
  );
  const { routesCollection, routeTransitionMiddleware } =
    createRouteTransitionMiddleware({ effectAPIRef, onError });
  const routerMiddleware = composeMiddleware(
    routeTransitionMiddleware,
    historyContext.routerMiddleware,
  );

  initRouter.dependsUpon(routerSlice);

  /**
   * Initializes router state, begins listening to history changes,
   * transitions to a route based on the initial location.
   *
   * @public
   */
  function initializeRouter(store: Redux.Store) {
    store.dispatch(initRouter());
    assertInitialRouterState(store.getState());
    attachRoutesCollectionToStore(store, routesCollection);

    // This method is called `createReduxHistory`, but it actually initializes
    // the router. It attaches a listener to the `history` instance, and begins
    // dispatching location change actions.
    // @see https://github.com/salvoravida/redux-first-history/blob/master/src/create.ts
    return historyContext.createReduxHistory(store);
  }

  return {
    initializeRouter,
    routerMiddleware,
    routerReducersMap,
    routerSlice,
    routesCollection,
  };
}

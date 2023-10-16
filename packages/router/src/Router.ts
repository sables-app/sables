import {
  createActionObservableMiddleware,
  createEffectAPIDefaults,
  DefaultEffectAPI,
  EFFECT_API_REF_MESSAGE,
  ROUTES_COLLECTION_REF_MESSAGE,
} from "@sables/core";
import { composeMiddleware, createMutableRef } from "@sables/utils";

import type * as Redux from "redux";

import { configureRouter } from "./configureRouter.js";
import { Routes } from "./Routes.js";
import type { InitialLocation } from "./types.js";

type EffectApiCreator<EffectAPI extends DefaultEffectAPI = DefaultEffectAPI> = (
  defaults: DefaultEffectAPI,
) => EffectAPI;

export interface CreateRouterOptions<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
> {
  effectAPI?: EffectApiCreator<EffectAPI>;
  initialLocation?: InitialLocation;
  initialRoutes?: Routes<EffectAPI>;
}

/**
 * Creates a standalone router for use with any Redux-based framework.
 *
 * > `createManager` automatically integrates Sables Router with a Redux store.
 * > This function should only be used there's a desire to use Sables Router
 * > without using the rest of Sables.
 *
 * @example
 *
 * const initialRoutes = createRoutes().set(
 *   "appRoot",
 *   "/app/:abc"
 * );
 * const router = createRouter({ initialRoutes });
 * const store = Redux.createStore();
 *
 * router.initialize(store);
 *
 * @public
 */
// Shouldn't be used internally, use `configureRouter` instead.
export function createRouter<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
>(options: CreateRouterOptions<EffectAPI> = {}) {
  function defaultGetEffectAPI(defaults: DefaultEffectAPI) {
    return defaults as EffectAPI;
  }

  const {
    effectAPI: getEffectAPI = defaultGetEffectAPI,
    initialLocation,
    initialRoutes,
  } = options;

  const effectAPIRef = createMutableRef<EffectAPI>(EFFECT_API_REF_MESSAGE);

  const {
    initializeRouter,
    routerMiddleware,
    routerReducersMap,
    routerSlice,
    routesCollection,
  } = configureRouter({ effectAPIRef, initialLocation });
  const { actions$, actionObservableMiddleware } =
    createActionObservableMiddleware();

  routesCollection.addInitial(initialRoutes);

  function initialize(store: Redux.Store) {
    const { dispatch, getState } = store;

    const routesCollectionRef = createMutableRef(
      ROUTES_COLLECTION_REF_MESSAGE,
      routesCollection,
    );

    effectAPIRef.current = getEffectAPI(
      createEffectAPIDefaults({
        actions$,
        dispatch,
        getState,
        routesCollectionRef,
      }),
    );

    return initializeRouter(store);
  }

  return {
    actions$,
    initialize,
    middleware: composeMiddleware(actionObservableMiddleware, routerMiddleware),
    reducersMap: routerReducersMap,
    routerSlice,
  };
}

import {
  configureStore,
  createActionDependencyEnhancer,
  createActionObservableMiddleware,
  createEffectAPIDefaults,
  DefaultEffectAPI,
  EFFECT_API_REF_MESSAGE,
  LazySlicesEnhancerExt,
  LIFECYCLE_REF_MESSAGE,
  ROUTES_COLLECTION_REF_MESSAGE,
  SSR_ATTRIBUTE,
  ssrAttrValues,
} from "@sables/core";
import { configureRouter, InitialLocation, Routes } from "@sables/router";
import { createMutableRef, isDebugEnv, isDevEnv } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import type { CurriedGetDefaultMiddleware } from "@reduxjs/toolkit/dist/getDefaultMiddleware.d.js";
import type * as History from "history";
import type * as Redux from "redux";
import { combineReducers } from "redux";
import * as reduxLogger from "redux-logger";

import type { LifecycleState } from "../LifecycleContext.js";
import type {
  DefaultStoreState,
  Manager,
  ManagerMethodsOnly,
  ManagerStore,
} from "../types.js";
import { createManagerInstance } from "./ManagerInstance.js";

const { createLogger: createReduxLogger } = reduxLogger;

type GetReducersMap<StoreState extends DefaultStoreState> = (
  defaultReducers: ReduxToolkit.ReducersMapObject<DefaultStoreState>
) => ReduxToolkit.ReducersMapObject<StoreState>;

type EffectApiCreator<
  StoreState extends DefaultStoreState,
  EffectAPI extends DefaultEffectAPI
> = (
  defaults: ManagerMethodsOnly &
    LazySlicesEnhancerExt<EffectAPI> &
    DefaultEffectAPI<StoreState>
) => EffectAPI;

/** @internal */
export interface CreateManagerOptions<
  StoreState extends DefaultStoreState = DefaultStoreState,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
> extends Pick<
    ReduxToolkit.ConfigureStoreOptions<StoreState>,
    "devTools" | "enhancers" | "middleware" | "preloadedState"
  > {
  /**
   * Extends the Manager's Effect API object.
   *
   * @example
   *
   * function configureManager({ initialLocation }) {
   *   const myLogger = console.log;
   *
   *   return createManager({
   *     effectAPI: (manager, defaults) => ({ ...manager, myLogger }),
   *   });
   * }
   *
   * @public
   */
  effectAPI?: EffectApiCreator<StoreState, EffectAPI>;
  /**
   * A pre-configured `History` instance.
   *
   * This option is typically only used when there's a need to
   * override history in tests, or to use `MemoryHistory` inside
   * a browser environment.
   *
   * @see {@link https://github.com/remix-run/history/tree/main/docs/api-reference.md History API reference}
   *
   * @remarks
   *
   * If this option is set, the `initialLocation` option is not used.
   *
   * @example
   *
   * import { createMemoryHistory } from "history";
   *
   * function configureManager({ initialLocation }) {
   *   return createManager({
   *     history: createMemoryHistory({
   *       initialEntries: [initialLocation],
   *     }),
   *   });
   * }
   *
   * @public
   */
  history?: History.BrowserHistory | History.MemoryHistory;
  /**
   * The initial location used in location history.
   *
   * This value should either be passed from the parameters of a `configureManager`
   * function, or be set to the desired default location.
   *
   * @remarks
   *
   * The option is not used if the `history` option is set.
   *
   * @defaultValue `"/"`
   *
   * @example
   *
   * function configureManager({ initialLocation }) {
   *   return createManager({
   *     initialLocation: initialLocation || "/app"
   *   });
   * }
   *
   * @public
   */
  initialLocation?: InitialLocation;
  /**
   * Sets the initial routes used for route transitions.
   *
   * @defaultValue `createRoutes().set("defaultRoot", "/");`
   *
   * @example
   *
   * const initialRoutes = createRoutes()
   *   .set("root", "/")
   *   .set("about", "/about-us");
   *
   * function configureManager() {
   *   return createManager({ initialRoutes });
   * }
   *
   * @public
   */
  initialRoutes?: Routes<EffectAPI>;
  /**
   * Sets the initial reducer map for the Redux store reducer.
   *
   * > Instead of manually constructing the reducer map, it's recommended
   * > to make use of action dependencies to have slices automatically inserted
   * > instead. Please refer to the `actionCreator.dependsUpon` method for details.
   *
   * @defaultValue `createReducersMapObject(routerSlice, routeTransitionSlice);`
   *
   * @example
   *
   * const dogsSlice = ReduxToolkit.createSlice(
   *   "dogs",
   *   {}
   * ).setReducer((builder) => builder);
   *
   * function configureManager() {
   *   return createManager({
   *     reducers: (defaultReducers) => ({
   *       ...defaultReducers,
   *       ...createReducersMapObject(dogsSlice),
   *     }),
   *   });
   * }
   *
   * @public
   */
  reducers?: GetReducersMap<StoreState>;
}

/** @internal */
function getPreloadedState() {
  if (typeof document == "undefined") return;

  const json = document.querySelector(
    `[${SSR_ATTRIBUTE}="${ssrAttrValues.APP_STATE}"]`
  )?.textContent;

  if (!json) return;

  return JSON.parse(json);
}

/**
 * Creates a new Manager object.
 *
 * This function should be used within a `configureManager` function.
 *
 * @public
 */
export function createManager<
  StoreState extends DefaultStoreState,
  EffectAPI extends DefaultEffectAPI<StoreState> = DefaultEffectAPI<StoreState>
>(
  options: CreateManagerOptions<StoreState, EffectAPI> = {}
): Manager<StoreState, EffectAPI> {
  const isDev = isDevEnv();
  const isDebugging = isDebugEnv();

  const defaultGetEffectAPI: EffectApiCreator<StoreState, EffectAPI> = (
    defaults
  ) => {
    return { ...defaults } as unknown as EffectAPI;
  };

  const {
    // DevTools is disabled when debugging by default, because it
    // will automatically time travel when the reducer is updated,
    // which can cause a mess in logs.
    // Side note: Yes, reducers are supposed to not have side effects,
    // that includes logs, but this is about debugging.
    devTools = isDev && !isDebugging,
    effectAPI: getEffectAPI = defaultGetEffectAPI,
    enhancers,
    history: historyOption,
    initialLocation,
    initialRoutes,
    middleware,
    reducers,
    ...storeOptions
  } = options;

  const lifecycleRef = createMutableRef<LifecycleState>(LIFECYCLE_REF_MESSAGE);
  const effectAPIRef = createMutableRef<EffectAPI>(EFFECT_API_REF_MESSAGE);

  const {
    initializeRouter,
    routerMiddleware,
    routerReducersMap,
    routesCollection,
  } = configureRouter({
    effectAPIRef,
    history: historyOption,
    initialLocation,
  });

  routesCollection.addInitial(initialRoutes);

  const getReducersMap =
    reducers || ((() => routerReducersMap) as GetReducersMap<StoreState>);
  const reducersMap = getReducersMap(routerReducersMap);
  const reducer = combineReducers<StoreState>(reducersMap);

  function resolveEnhancers(
    defaultEnhancers: readonly ReduxToolkit.StoreEnhancer[]
  ): readonly ReduxToolkit.StoreEnhancer[] {
    if (typeof enhancers == "function") {
      return enhancers(defaultEnhancers);
    }
    if (Array.isArray(enhancers)) {
      return enhancers;
    }
    return defaultEnhancers;
  }

  function resolveMiddleware(
    getDefaultMiddleware: CurriedGetDefaultMiddleware<StoreState>
  ): readonly Redux.Middleware[] {
    if (typeof middleware == "function") {
      return middleware(getDefaultMiddleware);
    }
    if (Array.isArray(middleware)) {
      return middleware;
    }
    return getDefaultMiddleware();
  }

  const storeRef = createMutableRef<ReduxToolkit.Store<StoreState>>();

  const { actionDependencyEnhancer } = createActionDependencyEnhancer({
    effectAPIRef,
    reducersMap,
  });
  const { actions$, actionObservableMiddleware } =
    createActionObservableMiddleware();
  const store = configureStore({
    ...storeOptions,
    devTools,
    enhancers: (defaultEnhancers) => [
      ...resolveEnhancers(defaultEnhancers),
      actionDependencyEnhancer,
    ],
    middleware: (getDefaultMiddleware) => [
      ...(isDebugging ? [createReduxLogger()] : []),
      ...resolveMiddleware(getDefaultMiddleware),
      routerMiddleware,
      actionObservableMiddleware,
    ],
    preloadedState: getPreloadedState(),
    reducer,
  }) as ManagerStore<StoreState, EffectAPI>;

  storeRef.current = store;

  const history = initializeRouter(store);
  const routesCollectionRef = createMutableRef(
    ROUTES_COLLECTION_REF_MESSAGE,
    routesCollection
  );
  const manager = createManagerInstance({
    actions$,
    effectAPIRef,
    history,
    lifecycleRef,
    routesCollectionRef,
    store,
  });
  const { dispatch, getState, insertSlices, subscribeTo } = store;
  const effectAPIDefaults = createEffectAPIDefaults({
    actions$,
    dispatch,
    getState,
    lifecycleRef,
    routesCollectionRef,
  });

  const { buildLink } = manager;

  effectAPIRef.current = getEffectAPI({
    ...effectAPIDefaults,
    buildLink,
    history,
    insertSlices,
    subscribeTo,
  });

  return manager;
}

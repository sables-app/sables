import type {
  DefaultEffectAPI,
  LazySlicesEnhancerExt,
  SubscribeToFn,
  SYMBOL_EFFECT_API_LIFECYCLE,
  SYMBOL_EFFECT_API_ROUTES,
  SYMBOL_MANAGER_EFFECT_API,
} from "@sables/core";
import type {
  BuildHrefOptions,
  CombinedRouterState,
  InitialLocation,
  RouteHref,
  RouteLink,
  RouterEnhancerExt,
  RoutesCollection,
  SSRTransitionResult,
} from "@sables/router";
import type { MutableReferenceObject } from "@sables/utils";

import type * as History from "history";
import type * as Redux from "redux";

import type { LifecycleRef } from "./LifecycleContext.js";

/* --- Manager --- */

export type DefaultStoreState = CombinedRouterState;

/**
 * @public
 */
export type ManagerStore<
  StoreState extends DefaultStoreState = DefaultStoreState,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
> = Redux.Store<StoreState> &
  LazySlicesEnhancerExt<EffectAPI> &
  RouterEnhancerExt<EffectAPI>;

/** @internal */
export interface ManagerMethodsOnly {
  buildLink: (...buildHrefArgs: BuildHrefOptions) => RouteLink;
  history: History.History;
}

/**
 * A manager object acts as the main reference point for an application.
 * All application state and side effects ultimately belong to a manager object.
 * During server-side rendering or routing, a new Manager object is created for each
 * incoming request.
 *
 * @public
 */
export type Manager<
  StoreState extends DefaultStoreState = DefaultStoreState,
  EffectAPI extends DefaultEffectAPI<StoreState> = DefaultEffectAPI<StoreState>
> = DefaultEffectAPI<StoreState> &
  ManagerMethodsOnly & {
    [SYMBOL_EFFECT_API_LIFECYCLE]: LifecycleRef;
    [SYMBOL_EFFECT_API_ROUTES]: MutableReferenceObject<
      RoutesCollection<EffectAPI>
    >;
    [SYMBOL_MANAGER_EFFECT_API]: MutableReferenceObject<EffectAPI>;
    /**
     * An enhanced Redux store.
     *
     * @public
     */
    store: ManagerStore<StoreState, EffectAPI>;
    /**
     * Subscribes to observables created from the given observable creators.
     *
     * Only one observable per observable creator, can be subscribed to
     * using this method.
     *
     * const locationChangeLogger = createObservable(
     *   ({ actions$ }) =>
     *     actions$.pipe(
     *       filter(locationChange.match),
     *       tap(() => console.log("The location changed!"))
     *     )
     * );
     *
     * manager.subscribeTo(locationChangeLogger);
     *
     * @public
     */
    subscribeTo: SubscribeToFn<EffectAPI>;
  };

/** @internal */
export type ManagerRef<
  StoreState extends DefaultStoreState = DefaultStoreState
> = MutableReferenceObject<Manager<StoreState>>;

/* --- External Helpers --- */

/**
 * A utility type for extending the Effect API.
 *
 * @public
 */
export type ExtendEffectAPI<
  EffectAPIMixin,
  StoreState extends DefaultStoreState = DefaultStoreState,
  EffectAPI extends DefaultEffectAPI = any
> = DefaultEffectAPI<StoreState> &
  ManagerMethodsOnly &
  LazySlicesEnhancerExt<EffectAPI> &
  EffectAPIMixin;

/**
 * A utility type for extending the `Manager` instance.
 *
 * @public
 */
// prettier-ignore
export type ExtendManager<EffectAPIMixin, AppState extends DefaultStoreState>
  = Manager<AppState, ExtendEffectAPI<EffectAPIMixin, AppState>>;
/**
 * A utility type for extending the store state.
 *
 * @public
 */
export type ExtendStoreState<
  InitialReducers extends Redux.ReducersMapObject,
  LazyReducers extends Redux.ReducersMapObject
> = Redux.StateFromReducersMapObject<InitialReducers> &
  Partial<Redux.StateFromReducersMapObject<LazyReducers>> &
  DefaultStoreState;

/**
 * A utility type for extending the framework.
 *
 * @example
 *
 * type EffectAPIMixin = { myLogger: typeof console.log; };
 * type MyFramework = ExtendFramework<EffectAPIMixin>;
 * type MyState = MyFramework["State"];
 * type MyManager = MyFramework["Manager"];
 * type MyEffectAPI = MyFramework["EffectAPI"];
 *
 * const myLogger = createObservable<MyEffectAPI>(({ actions$, myLogger }) => {
 *   return actions$.pipe(tap(myLogger));
 * });
 *
 * @public
 */
export type ExtendFramework<
  EffectAPIMixin = Record<string, unknown>,
  InitialReducers extends Redux.ReducersMapObject = Redux.ReducersMapObject,
  LazyReducers extends Redux.ReducersMapObject = Redux.ReducersMapObject
> = {
  // prettier-ignore
  State: ExtendStoreState<InitialReducers, LazyReducers>;
  // prettier-ignore
  Manager: ExtendManager<EffectAPIMixin, ExtendStoreState<InitialReducers, LazyReducers>>;
  // prettier-ignore
  EffectAPI: ExtendEffectAPI<EffectAPIMixin,ExtendStoreState<InitialReducers, LazyReducers> >;
  // prettier-ignore
};

/* --- Configuration --- */

/**
 * An object of parameters provided to a `configureManager` function.
 *
 * @see {ConfigureManagerFn}
 *
 * @public
 */
export type ConfigureManagerParams = {
  /**
   * The initial location as determined during server-side rendering/routing.
   *
   * This property is only set when the application is initialized client-side after
   * the application has been rendered/routed server-side.
   *
   * The value should be passed to `createManager` to initialize location history
   * with the same initial location.
   *
   * @example
   *
   * function configureManager({ initialLocation }) {
   *   return createManager({ initialLocation });
   * }
   *
   * @public
   */
  initialLocation?: InitialLocation;
};

/**
 * Configures a new `Manager` instance for use in an application.
 *
 * @public
 */
export type ConfigureManagerFn<
  M extends Manager<any, any> = Manager<any, any>
> = (params: ConfigureManagerParams) => M;

/* --- Server Request Context --- */

/** @internal */
export interface ServerRequestState {
  appState?: Record<string, unknown>;
  beforeStreamError?: unknown;
  readonly href: RouteHref;
  readonly invokedImporters: Set<string>;
  routeTransitionStarted: boolean;
  transitionResult?: SSRTransitionResult;
}

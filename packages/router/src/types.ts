import type {
  AnyPayloadAction,
  DefaultEffectAPI,
  EnhancedSlice,
  PayloadAction,
} from "@sables/core";
import type { SlicesToReducersMapObject } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import type * as History from "history";
import type * as Redux from "redux";
import type * as ReduxFirstHistory from "redux-first-history";

import type { initRouteEffects } from "./actions.js";
import type {
  END_TRANSITION_ACTION_TYPE,
  endRouteTransitionReasons,
  hookNames,
  ROUTER_REDUCER_KEY,
  START_TRANSITION_ACTION_TYPE,
  transitionStatuses,
} from "./constants.js";
import type { AnyRouteReference, RouteReferenceParams } from "./Routes.js";
import type { routeTransitionSlice } from "./routeTransitionSlice.js";

/**
 * A route path pattern.
 *
 * The string must begin with a forward slash ("/").
 *
 * @example "/user/:userId"
 *
 * @public
 */
export type RoutePathType = `/${string}`;

/**
 * A wildcard route path pattern.
 *
 * The string must begin with a forward slash ("/"),
 * and end with a forward slash and an asterisk ("*").
 *
 * @example "/users/*"
 *
 * @public
 */
export type WildCardPathType = `/${string}/*`;

/** @internal */
export type AnyRoutePath = RoutePathType | WildCardPathType;

/**
 * A hyperlink for a route.
 * The string must begin with a forward slash ("/").
 *
 * @example "/user/123"
 *
 * @public
 */
export type RouteHref = `/${string}`;

/**
 * A route ID.
 * Any string is valid, but a camelCase value is recommended.
 *
 * @remarks
 *
 * The given ID will be capitalized, and used as the property name
 * for its respective route reference on the routes object.
 *
 * @example "userProfile"
 *
 * @public
 */
export type RouteID = string;

/**
 * @public
 */
export type MatchingHref = PartialHistoryPath | RouteHref | null | undefined;

/**
 * @public
 */
export type InitialLocation = RouteHref | PartialHistoryPathStrict;

/** @internal */
export type DynamicImportFn<T = unknown> = () => Promise<T>;

/**
 * Used during SSR.
 * @internal
 */
export type RegisterDynamicImportFn = (dynamicImport: DynamicImportFn) => void;

type TransitionStatus =
  (typeof transitionStatuses)[keyof typeof transitionStatuses];

/** @internal */
export type SSRTransitionResult = {
  /** @internal */
  error?: unknown;
  /** @internal */
  route: RouteWithParams | null;
  /** @internal */
  status: TransitionStatus;
};

/** @internal */
type LocationChangeActionPayload<
  HistoryAction extends History.Action = History.Action,
> = {
  /**
   * @public
   */
  location: History.Location;
  /**
   * @public
   */
  action: HistoryAction;
};

/**
 * An action dispatched by Redux First History in
 * response to changes in location history.
 *
 * @public
 */
export type LocationChangeAction<A extends History.Action = History.Action> =
  PayloadAction<
    LocationChangeActionPayload<A>,
    typeof ReduxFirstHistory.LOCATION_CHANGE
  >;

/**
 * Middleware effects are called asynchronously in a series within a route transition.
 * A middleware effect must resolve before the next middleware effect is invoked.
 *
 * @public
 */
export interface RouteMiddleware<
  Action extends AnyPayloadAction = AnyPayloadAction,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
> {
  (
    action: Action,
    effectAPI: EffectAPI,
    abortSignal: AbortSignal,
  ): Promise<unknown>;
}

/**
 * Listener effects are called synchronously in a series outside of the route transition.
 * A listener effect may be asynchronous, but they're not awaited.
 *
 * @public
 */
export interface RouteListener<
  Action extends AnyPayloadAction = AnyPayloadAction,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
> {
  (action: Action, effectAPI: EffectAPI): unknown;
}

/**
 * Describes why a route transition ended.
 *
 * @public
 */
export type EndRouteTransitionReason =
  (typeof endRouteTransitionReasons)[keyof typeof endRouteTransitionReasons];

/** @internal */
export type StartRouteTransitionActionPayload = {
  /**
   * The location change that triggered the route transition.
   *
   * @public
   */
  locationChange: LocationChangeAction["payload"];
  /**
   * A route matching the location change.
   *
   * @public
   */
  nextRoute: RouteWithParams | undefined;
  /**
   * An ID unique to each route transition.
   *
   * @public
   */
  transitionID: string;
};

/** @internal */
export type EndRouteTransitionActionPayload = {
  /**
   * The location change that triggered the route transition.
   *
   * @public
   */
  locationChange: LocationChangeAction["payload"];
  /**
   * A route matching the location change.
   *
   * @public
   */
  nextRoute?: RouteWithParams | null;
  /**
   * Describe why a route transition ended.
   *
   * @public
   */
  reason: EndRouteTransitionReason;
  /**
   * An ID unique to each route transition.
   *
   * @public
   */
  transitionID: string;
};

/** @internal */
export type InitRouteEffectsAction = ReturnType<typeof initRouteEffects>;

/** @internal */
export type StartTransitionAction = PayloadAction<
  StartRouteTransitionActionPayload,
  typeof START_TRANSITION_ACTION_TYPE
>;

/** @internal */
export type EndTransitionAction = PayloadAction<
  EndRouteTransitionActionPayload,
  typeof END_TRANSITION_ACTION_TYPE
>;

/**
 * Route Transition slice state
 *
 * @public
 */
export interface RouteTransitionState {
  /**
   * A route that matches the current location.
   *
   * @public
   */
  currentRoute: RouteWithParams | null;
  /**
   * Represents whether a route transition is currently being performed.
   *
   * @public
   */
  isTransitioning: boolean;
  /**
   * Describes the route that was last transitioned from.
   *
   * @public
   */
  prevRoute: RouteWithParams | null;
  /**
   * Represents the final route determined during server-side rending/routing.
   * Used during application resume to determine the initial location.
   *
   * @internal
   */
  _ssrTransitionResult?: SSRTransitionResult;
}

type RouteSliceType = EnhancedSlice<
  ReduxToolkit.Slice<
    ReduxFirstHistory.RouterState,
    any,
    typeof ROUTER_REDUCER_KEY
  >
>;

/** @internal */
export type CombinedRouterState = Redux.StateFromReducersMapObject<
  SlicesToReducersMapObject<[RouteSliceType, typeof routeTransitionSlice]>
>;

/**
 * A literal object of route parameter values.
 *
 * @privateRemarks
 *
 * @see PathParser.TestMatch
 *
 * @public
 */
export type RouteParams = Record<string, unknown>;

/**
 * A stricter `Partial<History.Path>` using template literal types
 *
 * @see {History.Path}
 *
 * @public
 */
export type PartialHistoryPathStrict = {
  pathname?: `/${string}`;
  search?: `?${string}`;
  hash?: `#${string}`;
};

/**
 * @see {History.Path}
 *
 * @public
 */
export type PartialHistoryPath = Partial<History.Path>;

/** @internal */
export type BuildHrefInput = AnyRouteReference | PartialHistoryPathStrict;

/**
 * Parameters used to build a hyperlink for a route.
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("profile", "/profiles/:handle");
 *
 * const myParams: BuildHrefParams = [routes.Profile, { handle: "@ash.ketchum" }];
 *
 * @public
 */
export type BuildHrefOptions<Route extends BuildHrefInput> =
  Route extends AnyRouteReference
    ? RouteReferenceParams<Route> extends Record<string, unknown>
      ? [route: Route, params: RouteReferenceParams<Route>]
      : [route: Route, params?: Record<string, unknown>]
    : [route?: Route];

/**
 * A representation of a location to be navigated to.
 *
 * Accepted by the `ensureLocation` action creator,
 * and the `forwardTo` route effect creator.
 *
 * @public
 */
export type NavigationDestination<Route extends BuildHrefInput> =
  | AnyRouteReference
  | BuildHrefOptions<Route>
  | PartialHistoryPathStrict
  | RouteHref;

/**
 * Parameters required to build a `RouteLink`
 *
 * @see {RouteLink}
 *
 * @public
 */
export type BuildLinkParams<Route extends BuildHrefInput> = [
  dispatch: Redux.Dispatch,
  buildHrefOptions: BuildHrefOptions<Route>,
];

/** @internal */
export type Route = {
  id: RouteID;
  path: RoutePathType;
};

/**
 * The result when a parsed location matches a route.
 *
 * @public
 */
export type RouteWithParams = Route & {
  params: RouteParams;
};

/**
 * A payload used to interact with a route.
 *
 * @public
 */
export type RouteLink = {
  /**
   * A hyperlink for a route.
   *
   * @public
   */
  href: RouteHref;
  /**
   * Dispatches a `ensureLocation` action for the route.
   * A route transition will begin if the route to navigate to
   * isn't the current route.
   *
   * @public
   */
  ensureLocation: () => void;
  /**
   * Dispatches a history push action. A route transition will begin if
   * the locations aren't equivalent.
   *
   * @public
   */
  pushLocation: () => void;
  /**
   * Dispatches a history replace action to begin a route transition.
   *
   * @public
   */
  replaceLocation: () => void;
};

/** @internal */
export type RouteEffectHookName = (typeof hookNames)[keyof typeof hookNames];

/** @internal */
export type RouteEffectHandlers<EffectAPI extends DefaultEffectAPI> = {
  middleware: RouteMiddleware<StartTransitionAction, EffectAPI>;
  onComplete: RouteListener<EndTransitionAction, EffectAPI>;
  onEnd: RouteListener<EndTransitionAction, EffectAPI>;
  onExit: RouteListener<EndTransitionAction, EffectAPI>;
  onFailure: RouteListener<EndTransitionAction, EffectAPI>;
  onInterrupt: RouteListener<EndTransitionAction, EffectAPI>;
  onStart: RouteListener<StartTransitionAction, EffectAPI>;
};

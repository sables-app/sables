import { createSelector } from "@sables/core";

import { ROUTER_REDUCER_KEY } from "./constants.js";
import { AnyRouteReference } from "./Routes.js";
import { selectRouteTransitionState } from "./routeTransitionSlice.js";
import { CombinedRouterState, PartialHistoryPathStrict } from "./types.js";
import { buildHref } from "./utils.js";

/**
 * A selector that retrieves the router state from the given store state.
 *
 * @example
 *
 * const routerState = selectRouterState(store.getState());
 *
 * @see {@link https://github.com/reduxjs/reselect}
 *
 * @public
 */
export const selectRouterState = (state: CombinedRouterState) =>
  state[ROUTER_REDUCER_KEY];

/**
 * A selector that retrieves the current location from the given store state.
 *
 * @example
 *
 * const currentLocation = selectCurrentLocation(store.getState());
 *
 * @see {@link https://github.com/reduxjs/reselect}
 *
 * @public
 */
export const selectCurrentLocation = createSelector(
  selectRouterState,
  ({ location }) => location ?? undefined,
);

/**
 * A selector that retrieves the current href value from the given store state.
 *
 * @example
 *
 * const currentHref = selectCurrentHref(store.getState());
 *
 * @see {@link https://github.com/reduxjs/reselect}
 *
 * @public
 */
export const selectCurrentHref = createSelector(
  selectCurrentLocation,
  (location) =>
    location ? buildHref(location as PartialHistoryPathStrict) : undefined,
);

/**
 * A selector that retrieves the current route from the given store state.
 *
 * @example
 *
 * const currentRoute = selectCurrentRoute(store.getState());
 *
 * @see {@link https://github.com/reduxjs/reselect}
 *
 * @public
 */
export const selectCurrentRoute = createSelector(
  selectRouteTransitionState,
  ({ currentRoute }) => currentRoute,
);

/**
 * A selector that retrieves the previous route from the given store state.
 *
 * @example
 *
 * const prevRoute = selectPrevRoute(store.getState());
 *
 * @see {@link https://github.com/reduxjs/reselect}
 *
 * @public
 */
export const selectPrevRoute = createSelector(
  selectRouteTransitionState,
  ({ prevRoute }) => prevRoute,
);

/**
 * A selector that determines whether a route is currently
 * transitioning from the given store state.
 *
 * @example
 *
 * const isRouteTransitioning = selectIsRouteTransitioning(
 *   store.getState()
 * );
 *
 * @see {@link https://github.com/reduxjs/reselect}
 *
 * @public
 */
export const selectIsRouteTransitioning = createSelector(
  selectRouteTransitionState,
  ({ isTransitioning }) => isTransitioning,
);

/** @internal */
export const selectHasTransitionResult = createSelector(
  selectRouteTransitionState,
  ({ _ssrTransitionResult: transitionResult }) => !!transitionResult,
);

/**
 * Creates a selector that determines whether the current route has
 * the same ID as given route.
 *
 * @example
 *
 * const routes = createRoutes().set("root", "/");
 * const selectRouteMatchesRoot = createRouteMatchSelector(routes.Root);
 * const routeMatchesRoot = selectRouteMatchesRoot(store.getState());
 *
 * @see {@link https://github.com/reduxjs/reselect}
 *
 * @public
 */
export function createRouteMatchSelector(route: AnyRouteReference) {
  return createSelector(
    selectCurrentRoute,
    (currentRoute) => !!currentRoute && currentRoute.id === route.id,
  );
}

/**
 * Creates a selector that determines whether the current location matches
 * the given route.
 *
 * @example
 *
 * const routes = createRoutes().set("root", "/");
 * const selectLocationMatchesRoot = createLocationMatchSelector(routes.Root);
 * const locationMatchesRoot = selectLocationMatchesRoot(store.getState());
 *
 * @see {@link https://github.com/reduxjs/reselect}
 *
 * @public
 */
export function createLocationMatchSelector(route: AnyRouteReference) {
  return createSelector(selectCurrentLocation, (location) =>
    route.match(location),
  );
}

import {
  createAction,
  DecoratedBasicActionCreator,
  enhanceAction,
  EnhancedStandardActionCreator,
  PayloadAction,
} from "@sables/core";

import type { History } from "history";
import { Action as HistoryAction } from "history";
import type * as Redux from "redux";
import {
  CALL_HISTORY_METHOD,
  go,
  goBack,
  goForward,
  LOCATION_CHANGE,
  push,
  replace,
} from "redux-first-history";
import type { CallHistoryMethodAction } from "redux-first-history/build/es6/actions";

import { routeTransitionSlice } from "./routeTransitionSlice.js";
import {
  BuildHrefInput,
  LocationChangeAction,
  NavigationDestination,
} from "./types.js";

/**
 * Utilities for the location change action.
 *
 * @public
 */
export const locationChange = Object.freeze({
  /**
   * The location change action type.
   */
  type: LOCATION_CHANGE,
  /**
   * Determines whether the given action is a `LocationChangeAction`.
   */
  match(action: Redux.AnyAction): action is LocationChangeAction {
    return action.type === LOCATION_CHANGE;
  },
  /**
   * Determines whether the given action is a `LocationChangeAction`,
   * and the change was a `HistoryAction.Pop`.
   */
  isPopAction(
    action: Redux.AnyAction
  ): action is LocationChangeAction<HistoryAction.Pop> {
    return (
      locationChange.match(action) &&
      action.payload.action === HistoryAction.Pop
    );
  },
  /**
   * Determines whether the given action is a `LocationChangeAction`,
   * and the change was a `HistoryAction.Push`.
   */
  isPushAction(
    action: Redux.AnyAction
  ): action is LocationChangeAction<HistoryAction.Push> {
    return (
      locationChange.match(action) &&
      action.payload.action === HistoryAction.Push
    );
  },
  /**
   * Determines whether the given action is a `LocationChangeAction`,
   * and the change was a `HistoryAction.Replace`.
   */
  isReplaceAction(
    action: Redux.AnyAction
  ): action is LocationChangeAction<HistoryAction.Replace> {
    return (
      locationChange.match(action) &&
      action.payload.action === HistoryAction.Replace
    );
  },
});

/**
 * An action creator. When its actions are dispatched, middleware will
 * navigates `n` entries backward/forward in the history stack relative to the
 * current index. For example, a "back" navigation would use `chooseLocation(-1)`.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#history.go
 *
 * @public
 */
export const chooseLocation = enhanceAction(go, CALL_HISTORY_METHOD);

/**
 * An action creator. When its actions are dispatched, middleware will
 * navigate to the previous location in history.
 *
 * @public
 */
export const retreatLocation = enhanceAction(
  // The type for the `goBack` action is incorrect.
  goBack as () => CallHistoryMethodAction<Parameters<History["back"]>>,
  CALL_HISTORY_METHOD
);

/**
 * An action creator. When its actions are dispatched, middleware will
 * navigate to the next location in history.
 *
 * @public
 */
export const advanceLocation = enhanceAction(
  // The type for the `goForward` action is incorrect.
  goForward as () => CallHistoryMethodAction<Parameters<History["forward"]>>,
  CALL_HISTORY_METHOD
);

/**
 * An action creator. When its actions are dispatched, middleware will
 * push a new location onto the history stack, increasing its length by one.
 * If there were any entries in the stack after the current one, they are lost.
 *
 * @remarks It's recommended to use the `ensureLocation` action instead, to avoid accidentally
 * pushing duplicate location entries.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#history.push
 * @see {@link ensureLocation}
 *
 * @public
 */
export const pushLocation = enhanceAction(push, CALL_HISTORY_METHOD);

/**
 * An action creator. When its actions are dispatched, middleware will
 * replace the current location in the history stack with a new one. The
 * location that was replaced will no longer be available.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#history.replace
 *
 * @public
 */
export const replaceLocation = enhanceAction(replace, CALL_HISTORY_METHOD);

type EnsureLocationType = "sablesRouter/ensureLocation";

type EnsureLocation = EnhancedStandardActionCreator<
  DecoratedBasicActionCreator<
    EnsureLocationType,
    <Route extends BuildHrefInput>(
      payload: NavigationDestination<Route>
    ) => PayloadAction<NavigationDestination<Route>, EnsureLocationType>
  >
>;

/**
 * An action creator. When its actions are dispatched, middleware will
 * checks if the current location matches the given destination.
 * If the current location doesn't match, then a location push action
 * is dispatched to update the location to match.
 *
 * @see {@link pushLocation}
 *
 * @public
 */
export const ensureLocation = createAction<
  NavigationDestination<BuildHrefInput>,
  EnsureLocationType
>("sablesRouter/ensureLocation") as EnsureLocation;

/**
 * Provided to Route Effects "onAdd" listeners.
 *
 * @internal
 */
export const initRouteEffects = createAction<
  void,
  "sablesRouter/initRouteEffects"
>("sablesRouter/initRouteEffects");

/**
 * Used to add router slices during router initialization.
 *
 * @internal
 */
export const initRouter = createAction("sablesRouter/initRouter");

initRouter.dependsUpon(routeTransitionSlice);

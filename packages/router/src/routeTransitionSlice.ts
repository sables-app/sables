import {
  createSideEffectActions,
  createSlice,
  PayloadAction,
} from "@sables/core";

import { endRouteTransitionReasons } from "./constants.js";
import type {
  EndRouteTransitionActionPayload,
  LocationChangeAction,
  RouteTransitionState,
  RouteWithParams,
  SSRTransitionResult,
  StartRouteTransitionActionPayload,
} from "./types.js";

function createInitialState(): RouteTransitionState {
  return {
    currentRoute: null,
    isTransitioning: false,
    prevRoute: null,
  };
}

/** @internal */
export const transitionRoute = createSideEffectActions<
  StartRouteTransitionActionPayload,
  EndRouteTransitionActionPayload,
  "sables/transitionRoute"
>("sables/transitionRoute");

/** @internal */
export const routeTransitionSlice = createSlice({
  name: "sablesRouteTransition",
  initialState: createInitialState(),
  reducers: {
    reportTransitionResult(state, action: PayloadAction<SSRTransitionResult>) {
      state._ssrTransitionResult = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(transitionRoute.start, (state) => {
        state.isTransitioning = true;
      })
      .addCase(transitionRoute.end, (state, action) => {
        state.isTransitioning = false;

        const { nextRoute } = action.payload;

        if (nextRoute !== undefined && nextRoute !== state.currentRoute) {
          state.prevRoute = state.currentRoute;
          state.currentRoute = nextRoute;
        }
      });
  },
});

transitionRoute.dependsUpon(routeTransitionSlice);

/** @internal */
export const selectRouteTransitionState = routeTransitionSlice.selector;
/** @internal */
export const reportTransitionResult =
  routeTransitionSlice.actions.reportTransitionResult;

/** @internal */
export function exitRouteTransition(
  locationChange: LocationChangeAction["payload"],
  transitionID: string
) {
  return transitionRoute.end({
    locationChange,
    reason: endRouteTransitionReasons.EXITED,
    transitionID,
  });
}

/** @internal */
export function completeRouteTransition(
  locationChange: LocationChangeAction["payload"],
  transitionID: string,
  nextRoute: RouteWithParams | null
) {
  return transitionRoute.end({
    locationChange,
    nextRoute,
    reason: endRouteTransitionReasons.COMPLETED,
    transitionID,
  });
}

/**
 * Describes an error that occurred during a route transition.
 *
 * @remarks
 *
 * This is essentially `EndRouteTransitionActionPayload` that
 * extends `Error` to have the action creator set `action.error`
 * property to `true`.
 *
 * @internal
 */
class RouteTransitionError
  extends Error
  implements EndRouteTransitionActionPayload
{
  public nextRoute = undefined;
  public reason = endRouteTransitionReasons.FAILED;

  constructor(
    public locationChange: LocationChangeAction["payload"],
    public transitionID: string,
    public originalError: unknown
  ) {
    super("Route transition failed.");
  }
}

/** @internal */
export function failRouteTransition(
  locationChange: LocationChangeAction["payload"],
  transitionID: string,
  originalError: unknown
) {
  return transitionRoute.end(
    new RouteTransitionError(locationChange, transitionID, originalError)
  );
}

/** @internal */
export function interruptRouteTransition(
  locationChange: LocationChangeAction["payload"],
  transitionID: string
) {
  return transitionRoute.end({
    locationChange,
    reason: endRouteTransitionReasons.INTERRUPTED,
    transitionID,
  });
}

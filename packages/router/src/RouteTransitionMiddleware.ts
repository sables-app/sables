import { ActionSubject, DefaultEffectAPI } from "@sables/core";
import { createMutableRef, MutableReferenceObject } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import { Action as HistoryAction } from "history";
import { nanoid } from "nanoid";
import { filter, firstValueFrom, map, merge } from "rxjs";

import {
  ensureLocation,
  locationChange,
  pushLocation,
  replaceLocation,
} from "./actions.js";
import { endRouteTransitionReasons } from "./constants.js";
import {
  AddRoutesSignal,
  ExitTransitionSignal,
  ForwardRouteSignal,
} from "./effects.js";
import {
  createRoutesCollection,
  RoutesCollection,
} from "./RoutesCollection.js";
import {
  completeRouteTransition,
  exitRouteTransition,
  failRouteTransition,
  interruptRouteTransition,
  transitionRoute as transitionRouteActions,
} from "./routeTransitionSlice.js";
import {
  selectCurrentHref,
  selectCurrentLocation,
  selectHasTransitionResult,
  selectIsRouteTransitioning,
} from "./selectors.js";
import type {
  BuildHrefInput,
  EndRouteTransitionReason,
  EndTransitionAction,
  LocationChangeAction,
  NavigationDestination,
  PartialHistoryPathStrict,
  RouteEffectHandlers,
  RouteHref,
  RouteListener,
} from "./types.js";
import {
  areLocationChangesRouterEquivalent,
  buildHref,
  createDynamicImportRegistrar,
  isPartialHistoryPath,
} from "./utils.js";

/** @internal */
export function createRouteTransitionMiddleware<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>({
  effectAPIRef,
  onError = console.error,
}: {
  effectAPIRef: MutableReferenceObject<EffectAPI>;
  onError?: (error: unknown) => void;
}): {
  routesCollection: RoutesCollection<EffectAPI>;
  routeTransitionMiddleware: ReduxToolkit.Middleware;
} {
  const routesCollection = createRoutesCollection<EffectAPI>();
  const actions$ = new ActionSubject();

  function destinationToLocation<Route extends BuildHrefInput>(
    dest: NavigationDestination<Route>
  ): RouteHref | PartialHistoryPathStrict {
    if (typeof dest == "string") {
      return dest;
    }
    if (Array.isArray(dest)) {
      return buildHref(...dest);
    }
    if (isPartialHistoryPath(dest)) {
      return dest;
    }

    return buildHref(dest);
  }

  function destinationToHref<Route extends BuildHrefInput>(
    dest: NavigationDestination<Route>
  ): RouteHref {
    const location = destinationToLocation(dest);

    return typeof location == "string" ? location : buildHref(location);
  }

  function setupListeners({
    effectHandlers,
    transitionID,
  }: {
    effectHandlers: RouteEffectHandlers<EffectAPI> | undefined;
    transitionID: string;
  }) {
    const effectAPI = effectAPIRef.demand();

    function isCurrentTransition<
      T extends { payload: { transitionID: string } }
    >({ payload }: T) {
      return payload.transitionID === transitionID;
    }

    const transitionEndActions$ = actions$.pipe(
      filter(transitionRouteActions.end.match),
      filter(isCurrentTransition)
    );

    const transitionStartActions$ = actions$.pipe(
      filter(transitionRouteActions.start.match),
      filter(isCurrentTransition)
    );

    const handlerByTransitionEndReason: Record<
      EndRouteTransitionReason,
      RouteListener<EndTransitionAction, EffectAPI> | undefined
    > = {
      [endRouteTransitionReasons.EXITED]: effectHandlers?.onExit,
      [endRouteTransitionReasons.COMPLETED]: effectHandlers?.onComplete,
      [endRouteTransitionReasons.FAILED]: effectHandlers?.onFailure,
      [endRouteTransitionReasons.INTERRUPTED]: effectHandlers?.onInterrupt,
    };

    async function endHandler(
      action: ReturnType<typeof transitionRouteActions.end>
    ) {
      effectHandlers?.onEnd?.(action, effectAPI);
      handlerByTransitionEndReason[action.payload.reason]?.(action, effectAPI);
    }

    async function startHandler(
      action: ReturnType<typeof transitionRouteActions.start>
    ) {
      effectHandlers?.onStart?.(action, effectAPI);
    }

    firstValueFrom(transitionStartActions$).then(startHandler).catch(onError);
    firstValueFrom(transitionEndActions$).then(endHandler).catch(onError);
  }

  function createTransitionHandler(store: ReduxToolkit.MiddlewareAPI) {
    const { dispatch, getState } = store;
    const prevTransition = createMutableRef<{
      abortController: AbortController;
      locationChange: LocationChangeAction["payload"];
      transitionID: string;
    }>();

    return async function transitionRoute(action: LocationChangeAction) {
      const effectAPI = effectAPIRef.demand();

      if (selectIsRouteTransitioning(getState()) && prevTransition.current) {
        const { abortController, locationChange, transitionID } =
          prevTransition.current;

        abortController.abort();
        dispatch(interruptRouteTransition(locationChange, transitionID));
      }

      const locationChange = action.payload;
      const abortController = new AbortController();
      const transitionID = nanoid();

      prevTransition.current = {
        abortController,
        locationChange,
        transitionID,
      };

      const { nextRoute, routes } = routesCollection.findByHref(
        action.payload.location
      );

      const effectHandlers = await routes?._getHandlersByRouteID(
        nextRoute?.id,
        createDynamicImportRegistrar(effectAPI)
      );

      setupListeners({
        effectHandlers,
        transitionID,
      });

      const startAction = transitionRouteActions.start({
        locationChange,
        nextRoute,
        transitionID,
      });

      dispatch(startAction);

      try {
        await effectHandlers?.middleware?.(
          startAction,
          effectAPI,
          abortController.signal
        );

        // When a transition is interrupted, an exception isn't thrown,
        // but the abort controller is still invoked.
        // If the transition's abort controller was invoked,
        // then an `transitionRouteActions.end` action should already have been dispatched.
        if (!abortController.signal.aborted) {
          dispatch(
            completeRouteTransition(
              locationChange,
              transitionID,
              nextRoute || null
            )
          );
        }
      } catch (signalOrError) {
        abortController.abort();

        if (signalOrError instanceof AddRoutesSignal) {
          if (routesCollection.has(signalOrError.routes)) {
            const error = new Error(
              [
                "Infinite loop detected.",
                "A route effect has attempted to add routes that have already been added.",
                "This means that the added routes don't have a higher specificity to prevent an infinite loop.",
              ].join(" ")
            );

            dispatch(failRouteTransition(locationChange, transitionID, error));
            onError(error);
          } else {
            routesCollection.add(signalOrError.routes);

            const currentLocation = selectCurrentLocation(getState());

            if (currentLocation) {
              // Dispatching a History action will subsequently dispatch an
              // `transitionRouteActions.end` action, when the current transition is interrupted.
              dispatch(replaceLocation(currentLocation));
            }
          }
        } else if (signalOrError instanceof ForwardRouteSignal) {
          // Dispatching a History action will subsequently dispatch an
          // `transitionRouteActions.end` action, when the current transition is interrupted.
          dispatch(
            replaceLocation(destinationToLocation(signalOrError.destination))
          );
        } else if (signalOrError instanceof ExitTransitionSignal) {
          dispatch(exitRouteTransition(locationChange, transitionID));
        } else {
          dispatch(
            failRouteTransition(locationChange, transitionID, signalOrError)
          );
          onError(signalOrError);
        }
      }
    };
  }

  function createTransitionStartFilter({
    getState,
  }: ReduxToolkit.MiddlewareAPI) {
    let encounteredPopAction = false;
    /** The most recent location change. */
    const latestLocationChange =
      createMutableRef<LocationChangeAction["payload"]>();

    return function shouldTransitionRoute(
      action: ReduxToolkit.AnyAction
    ): action is LocationChangeAction {
      if (!locationChange.match(action)) {
        return false;
      }

      const prevLocationChange = latestLocationChange.current;
      latestLocationChange.current = action.payload;
      const currentLocationChange = latestLocationChange.current;

      if (
        currentLocationChange.action === HistoryAction.Pop &&
        !encounteredPopAction
      ) {
        encounteredPopAction = true;

        // Skip route transitions when a transition result exists
        // before the first location change pop action.
        //
        // The first location change pop action is dispatched for the
        // initial location after the `history` instance is created.
        //
        // If a transition result exists at this point, that means that
        // the initial route has already been transitioned to, and we
        // shouldn't start another transition. This typically occurs
        // during SSR.
        if (selectHasTransitionResult(getState())) {
          return false;
        }
      }
      if (
        currentLocationChange.action !== HistoryAction.Replace &&
        areLocationChangesRouterEquivalent(
          currentLocationChange,
          prevLocationChange
        )
      ) {
        // Don't start a route transition if the route hasn't changed.
        // A browser may change the location to the same route
        // for various reasons, but a route transition should only be started,
        // if the route changes, not when the location changes to an
        // equivalent state.
        // i.e. web address hashes can change freely without triggering a
        // route transition.
        return false;
      }

      return true;
    };
  }

  function createPushLocationFilter({ getState }: ReduxToolkit.MiddlewareAPI) {
    return function shouldPushLocation(
      action: ReduxToolkit.AnyAction
    ): action is ReturnType<typeof ensureLocation> {
      if (!ensureLocation.match(action)) return false;

      const destHref = destinationToHref(action.payload);
      const currentHref = selectCurrentHref(getState());

      return destHref !== currentHref;
    };
  }

  const routeTransitionMiddleware: ReduxToolkit.Middleware =
    function routeTransitionMiddleware(store) {
      const shouldTransitionRoute = createTransitionStartFilter(store);
      const shouldPushLocation = createPushLocationFilter(store);
      const transitionRoute = createTransitionHandler(store);

      const transitionStarts$ = actions$.pipe(
        filter(shouldTransitionRoute),
        map((action) => {
          transitionRoute(action).catch(onError);
        })
      );
      const locationChanges$ = actions$.pipe(
        filter(shouldPushLocation),
        map((action) => {
          store.dispatch(pushLocation(destinationToLocation(action.payload)));
        })
      );
      const routerObserver$ = merge(transitionStarts$, locationChanges$);

      routerObserver$.subscribe();

      return (next) => (action: ReduxToolkit.AnyAction) => {
        // Handle the action, not the result from the middleware stack.
        // This helps prevent other middleware (i.e. from Redux DevTools)
        // from interfering with actions dispatched for this middleware.
        //
        // The reasoning for this, is that the route transition middleware provides
        // an interface to affect its behavior through route effects.
        // There should be no need to add more middleware to override behavior.
        actions$.next(action);

        return next(action);
      };
    };

  return {
    routesCollection,
    routeTransitionMiddleware,
  };
}

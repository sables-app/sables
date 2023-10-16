import { Manager, ServerRequestStateRef } from "@sables/framework";
import {
  EndRouteTransitionReason,
  endRouteTransitionReasons,
  reportTransitionResult,
  selectCurrentRoute,
  SSRTransitionResult,
  transitionRoute,
} from "@sables/framework/router";

import { filter, firstValueFrom, map, merge, timer } from "rxjs";

import { transitionStatuses } from "./constants.js";

function endRouteTransitionToTransitionResult(
  manager: Manager<any, any>,
  { payload }: ReturnType<typeof transitionRoute.end>,
): SSRTransitionResult {
  switch (payload.reason) {
    case endRouteTransitionReasons.COMPLETED: {
      return {
        route: selectCurrentRoute(manager.store.getState()),
        status: transitionStatuses.COMPLETE,
      };
    }
    case endRouteTransitionReasons.EXITED: {
      return {
        route: null,
        status: transitionStatuses.INCOMPLETE,
      };
    }
    case endRouteTransitionReasons.FAILED:
    default: {
      return {
        error: payload,
        route: null,
        status: transitionStatuses.ERROR,
      };
    }
  }
}

const reasonsToFinish: EndRouteTransitionReason[] = [
  endRouteTransitionReasons.COMPLETED,
  endRouteTransitionReasons.EXITED,
  endRouteTransitionReasons.FAILED,
];

function isTransitionFinished({
  payload,
}: ReturnType<typeof transitionRoute.end>) {
  return reasonsToFinish.includes(payload.reason);
}

interface TransitionToRouteConfig {
  timeout: number;
}

const DEFAULT_OPTIONS: TransitionToRouteConfig = { timeout: 20000 };

/** @internal */
export async function transitionToRoute(
  serverRequestStateRef: ServerRequestStateRef,
  manager: Manager<any, any>,
  options: Partial<TransitionToRouteConfig> = DEFAULT_OPTIONS,
) {
  console.log("transitionToRoute");
  const config = { ...DEFAULT_OPTIONS, ...options };

  const transitionResultsFromAction = manager.actions$.pipe(
    filter(transitionRoute.end.match),
    filter(isTransitionFinished),
    map((action) => endRouteTransitionToTransitionResult(manager, action)),
  );

  const transitionResultsFromTimeout = timer(config.timeout).pipe(
    map(() => ({
      route: null,
      status: transitionStatuses.TIMEOUT,
    })),
  );

  const transitionResult = await firstValueFrom(
    merge(transitionResultsFromAction, transitionResultsFromTimeout),
  );

  const serverRequestState = serverRequestStateRef.demand();

  serverRequestState.transitionResult = transitionResult;
  manager.store.dispatch(reportTransitionResult(transitionResult));

  serverRequestState.appState = manager.store.getState();
  console.log("transitionToRoute finished");
}

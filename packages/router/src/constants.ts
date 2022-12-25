/**
 * Used for SSR
 * @internal
 */
export const transitionStatuses = {
  COMPLETE: "COMPLETE",
  ERROR: "ERROR",
  INCOMPLETE: "INCOMPLETE",
  TIMEOUT: "TIMEOUT",
} as const;

/** @internal */
export const ROUTER_REDUCER_KEY = "sablesRouter";

/** @public */
export const endRouteTransitionReasons = {
  COMPLETED: "COMPLETED",
  EXITED: "EXITED",
  FAILED: "FAILED",
  INTERRUPTED: "INTERRUPTED",
} as const;

/** @internal */
export const ALL_ROUTES_KEY = "@@sablesAllRoutes";

/** @internal */
export const hookNames = {
  COMPLETE: "complete",
  END: "end",
  EXIT: "exit",
  FAILURE: "failure",
  INTERRUPT: "interrupt",
  MIDDLEWARE: "middleware",
  START: "start",
} as const;

import { AnyPayloadAction, DefaultEffectAPI, SideEffect } from "@sables/core";
import { SYMBOL_EFFECT_API_EFFECT_STATE } from "@sables/core";
import { isSSREnv } from "@sables/utils";

import type { Routes } from "./Routes.js";
import type {
  BuildHrefInput,
  DynamicImportFn,
  NavigationDestination,
  RouteEffectHandlers,
  RouteListener,
  RouteMiddleware,
  RouteParams,
  StartTransitionAction,
} from "./types.js";
import {
  createDynamicImportRegistrar,
  demandRoutesCollectionFromEffectAPI,
} from "./utils.js";

function getEffectStateMap<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(effectAPI: EffectAPI, id: symbol) {
  if (!effectAPI[SYMBOL_EFFECT_API_EFFECT_STATE]) {
    effectAPI[SYMBOL_EFFECT_API_EFFECT_STATE] = new Map();
  }

  return effectAPI[SYMBOL_EFFECT_API_EFFECT_STATE];
}

const effectState = {
  has<EffectAPI extends DefaultEffectAPI = DefaultEffectAPI>(
    effectAPI: EffectAPI,
    id: symbol
  ) {
    return getEffectStateMap(effectAPI, id).has(id);
  },
  get<EffectAPI extends DefaultEffectAPI = DefaultEffectAPI>(
    effectAPI: EffectAPI,
    id: symbol
  ) {
    return getEffectStateMap(effectAPI, id).get(id);
  },
  set<EffectAPI extends DefaultEffectAPI = DefaultEffectAPI>(
    effectAPI: EffectAPI,
    id: symbol,
    value: unknown
  ) {
    getEffectStateMap(effectAPI, id).set(id, value);
  },
};

function createEffectState<T>(defaultValue?: T) {
  const effectID = Symbol();

  return {
    using: <EffectAPI extends DefaultEffectAPI = DefaultEffectAPI>(
      effectAPI: EffectAPI
    ) => {
      function get() {
        if (!effectState.has(effectAPI, effectID)) {
          return defaultValue;
        }
        return effectState.get(effectAPI, effectID) as T | undefined;
      }
      function set(value: T) {
        effectState.set(effectAPI, effectID, value);
      }
      return Object.assign([get(), set] as const, { get, set });
    },
  };
}

/**
 * The base class for all route middleware signals.
 *
 * A route middleware signal is an object thrown within a
 * route middleware function to halt a route transition.
 *
 * @remarks
 *
 * `RouteMiddlewareSignal` doesn't cause any effects by default.
 * It should only be used for type checking.
 *
 * @example
 *
 * value instanceof RouteMiddlewareSignal;
 *
 * @public
 */
export class RouteMiddlewareSignal {
  constructor(public message = "A route middleware function was halted.") {}
}

/**
 * A route middleware signal thrown to add routes to the application.
 *
 * @remarks
 *
 * It's recommended to use the `addRoutes` middleware creator when applicable.
 *
 * @see {RouteMiddlewareSignal}
 * @see {addRoutes}
 *
 * @public
 */
export class AddRoutesSignal<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
> extends RouteMiddlewareSignal {
  constructor(
    public routes: Routes<EffectAPI>,
    message = "Attempting to add routes."
  ) {
    super(message);
  }
}

/**
 * A route middleware signal thrown to forward a route transition to another location.
 *
 * @remarks
 *
 * It's recommended to use the `forwardTo` route middleware creator when applicable.
 *
 * @see {RouteMiddlewareSignal}
 * @see {forwardTo}
 *
 * @public
 */
export class ForwardRouteSignal<
  Route extends BuildHrefInput
> extends RouteMiddlewareSignal {
  constructor(
    public destination: NavigationDestination<Route>,
    message = "Forwarding route."
  ) {
    super(message);
  }
}

/**
 * A route middleware signal thrown to preemptively end a route transition.
 *
 * @remarks
 *
 * It's recommended to use the `exitTransition` route middleware when applicable.
 *
 * @see {RouteMiddlewareSignal}
 * @see {exitTransition}
 *
 * @public
 */
export class ExitTransitionSignal extends RouteMiddlewareSignal {
  constructor(message = "Ending the route transition.") {
    super(message);
  }
}

/**
 * Route middleware that preemptively ends a route transition.
 * The middleware resolves early if the route transition was aborted.
 *
 * @example
 *
 * const routeEffects = createRouteEffects()
 *   // Prevent all route transitions
 *   .prependAll(exitTransition);
 *
 * @public
 */
export async function exitTransition<
  Action extends StartTransitionAction = StartTransitionAction,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(_action: Action, _effectAPI: EffectAPI, abortSignal: AbortSignal) {
  if (abortSignal.aborted) return;
  // This is caught by `routeTransitionMiddleware` to exit the transition
  throw new ExitTransitionSignal();
}

/**
 * Creates middleware that delays a route transition for a duration.
 * The middleware resolves early if the route transition was aborted.
 * The middleware immediately resolves during SSR.
 *
 * @param ms Duration in milliseconds
 *
 * @example
 *
 * const routeEffects = createRouteEffects()
 *   // Delay all routes by five seconds.
 *   .appendAll(delayTransition(5000));
 *
 * @public
 */
export function delayTransition<
  Action extends StartTransitionAction = StartTransitionAction,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(ms: number): RouteMiddleware<Action, EffectAPI> {
  return async (_action, _effectAPI, abortSignal) => {
    if (isSSREnv() || abortSignal.aborted) return;

    await Promise.race([
      new Promise((resolve) => abortSignal.addEventListener("abort", resolve)),
      new Promise((resolve) => setTimeout(resolve, ms)),
    ]);
  };
}

/**
 * Creates middleware that logs values.
 * The middleware resolves early if the route transition was aborted.
 *
 * @example
 *
 * const routeEffects = createRouteEffects()
 *   // Log a message during every route transition
 *   .appendAll(logTransition("A route transition is occurring."));
 *
 * @public
 */
export function logTransition<
  Action extends StartTransitionAction = StartTransitionAction,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(...values: unknown[]): RouteMiddleware<Action, EffectAPI> {
  return async (_action, _effectAPI, abortSignal) => {
    if (abortSignal.aborted) return;
    console.log(...values);
  };
}

/**
 * Creates middleware that forwards a route transition to another location.
 * The middleware resolves early if the route transition was aborted.
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("appRoot", "/app");
 *
 * const routeEffects = createRouteEffects()
 *   // Forwards "/" to "/app"
 *   .append(routes.Root.id, forwardTo(() => routes.AppRoot));
 *
 * @public
 */
export function forwardTo<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
  Route extends BuildHrefInput = BuildHrefInput
>(
  getDestination: (params: RouteParams) => NavigationDestination<Route>
): RouteMiddleware<StartTransitionAction, EffectAPI> {
  return async (action, effectAPI, abortSignal) => {
    if (abortSignal.aborted) return;

    const routesCollection = demandRoutesCollectionFromEffectAPI(effectAPI);
    const { nextRoute } = routesCollection.findByHref(
      action.payload.locationChange.location
    );
    const nextRouteParams = nextRoute?.params || {};
    const destination = getDestination(nextRouteParams);

    // This is caught by `routeTransitionMiddleware` to redirect the transition
    throw new ForwardRouteSignal(destination);
  };
}

/**
 * @public
 */
export type AddRoutesParams<EffectAPI extends DefaultEffectAPI> = [
  routes:
    | (() => Routes<EffectAPI>)
    | DynamicImportFn<{ default: Routes<EffectAPI> }>,
  message?: string
];

/**
 * Creates middleware that adds the given routes to the application.
 * The middleware resolves early if the route transition was aborted.
 *
 * @remarks
 *
 * Routes can only be added during a route transition.
 * Whenever routes are added, the current route transition is interrupted,
 * and a new route transition is started.
 *
 * @example
 *
 * const initialRoutes = createRoutes()
 *   .set("root", "/")
 *   .setWildcard("profile", "/profile/*");
 *
 * const profileRoutes = createRoutes()
 *   .set("profile", "/profile/:handle")
 *   .set("profileSettings", "/profile/settings");
 *
 * const routeEffects = createRouteEffects()
 *   // Add `profileRoutes` when the location matches `initialRoutes.Profile`
 *   .append(
 *     initialRoutes.Profile.id,
 *     addRoutes(() => profileRoutes)
 *   );
 *
 * initialRoutes.setEffects(() => routeEffects);
 *
 * @public
 */
export function addRoutes<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(
  ...params: AddRoutesParams<EffectAPI>
): RouteMiddleware<StartTransitionAction, EffectAPI> {
  const [routesFn, message] = params;
  const routesWereAddedState = createEffectState(false);

  return async function addRoutesEffect(...params) {
    const [, effectAPI, abortSignal] = params;
    const [routesWereAdded, setRoutesWereAdded] =
      routesWereAddedState.using(effectAPI);

    if (routesWereAdded) return;

    setRoutesWereAdded(true);

    if (abortSignal.aborted) return;

    const result = routesFn();
    const routes = result instanceof Promise ? (await result).default : result;

    function isDynamicImportFn(
      _value: typeof routesFn
    ): _value is DynamicImportFn<{ default: Routes<EffectAPI> }> {
      return result instanceof Promise;
    }

    if (isDynamicImportFn(routesFn)) {
      createDynamicImportRegistrar(effectAPI)(routesFn);
    }

    throw new AddRoutesSignal(routes, message);
  };
}

/**
 * Creates a new route middleware function, that calls the given
 * middleware in an asynchronous series.
 * The series execution is halted if the transition is aborted.
 *
 * @example
 *
 * const myRouteEffect = chainMiddleware(
 *   delayTransition(3000),
 *   logTransition("A route transition occurred."),
 * );
 *
 * @public
 */
export function chainMiddleware<
  Action extends StartTransitionAction = StartTransitionAction,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(
  ...effects: RouteMiddleware<Action, EffectAPI>[]
): RouteMiddleware<Action, EffectAPI> {
  return async (action, effectAPI, abortSignal) => {
    for (const effect of effects) {
      if (abortSignal.aborted) return;

      await effect(action, effectAPI, abortSignal);
    }
  };
}

/**
 * Creates a new route listener that calls the given
 * route listeners in series synchronously.
 *
 * @example
 *
 * const myRouteListener = combineListeners(
 *   () => console.log("First log."),
 *   () => console.log("Second log."),
 * );
 *
 * @public
 */
export function combineListeners<
  Action extends AnyPayloadAction = AnyPayloadAction,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(
  ...listeners: RouteListener<Action, EffectAPI>[]
): RouteListener<Action, EffectAPI> {
  return (action, effectAPI) => {
    for (const listener of listeners) {
      listener(action, effectAPI);
    }
  };
}

/** @internal */
export function combineHandlers<EffectAPI extends DefaultEffectAPI>(
  ...handlersCollection: RouteEffectHandlers<EffectAPI>[]
): RouteEffectHandlers<EffectAPI> {
  // prettier-ignore
  return {
    middleware:  chainMiddleware(...handlersCollection.map(({ middleware })   => middleware)),
    onComplete:  combineListeners(...handlersCollection.map(({ onComplete })  => onComplete)),
    onEnd:       combineListeners(...handlersCollection.map(({ onEnd })       => onEnd)),
    onExit:      combineListeners(...handlersCollection.map(({ onExit })      => onExit)),
    onFailure:   combineListeners(...handlersCollection.map(({ onFailure })   => onFailure)),
    onInterrupt: combineListeners(...handlersCollection.map(({ onInterrupt }) => onInterrupt)),
    onStart:     combineListeners(...handlersCollection.map(({ onStart })     => onStart)),
  };
}

/**
 * Creates a new route middleware using the given side effect.
 *
 * @example
 *
 * const getBooks = createSideEffect(
 *   createAction<{ id: string }>("getBooks/start"),
 *   createAction<Response>("getBooks/end"),
 *   async (action) =>
 *     fetch(`https://example.com/books/${action.payload.id}`)
 * );
 * const loadBooks = sideEffectToRouteMiddleware(getBooks, (params) =>
 *   yup.object({ id: yup.string().required() }).validate(params)
 * );
 *
 * // Loads books for every route transition
 * createRoutes().setEffects(() => createRouteEffects().appendAll(loadBooks));
 *
 * @public
 */
export function sideEffectToRouteMiddleware<
  EffectAPI extends DefaultEffectAPI,
  S extends SideEffect<any, any, EffectAPI>
>(
  sideEffect: S,
  assertRouteParams?: (
    params: RouteParams
  ) => asserts params is ReturnType<S["actions"]["start"]>["payload"]
): RouteMiddleware<StartTransitionAction, EffectAPI> {
  return async (action, effectAPI, abortSignal) => {
    if (abortSignal.aborted) return;

    const params = action.payload.nextRoute?.params || {};

    await assertRouteParams?.(params);

    return sideEffect(effectAPI, params);
  };
}

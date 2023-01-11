import {
  AnyPayloadAction,
  DefaultEffectAPI,
  PayloadAction,
  SYMBOL_ROUTE_EFFECTS_META,
} from "@sables/core";
import { capitalize } from "@sables/utils";

import { ALL_ROUTES_KEY, hookNames } from "./constants.js";
import { chainMiddleware, combineListeners } from "./effects.js";
import {
  EndTransitionAction,
  RouteEffectHandlers,
  RouteEffectHookName,
  RouteID,
  RouteListener,
  RouteMiddleware,
  StartTransitionAction,
} from "./types.js";

/** Actions provided to route effect handlers. */
type RouteEffectAction = StartTransitionAction | EndTransitionAction;

type RouteEffectsMeta<EffectAPI extends DefaultEffectAPI> = {
  effects: Set<{
    referenceKey: HandlerName<RouteEffectHookName, RouteID>;
    effectReference: RouteEffectReference<RouteID, EffectAPI, any>;
  }>;
  listeners: Set<{
    listenerReference: RouteListenerReference<RouteID, EffectAPI, any>;
  }>;
};

type HandlerName<
  H extends RouteEffectHookName,
  RID extends RouteID
> = `${Capitalize<RID>}${Capitalize<H>}`;

/** @internal */
export type HandlerMeta<
  H extends RouteEffectHookName,
  RID extends RouteID,
  Action extends AnyPayloadAction
> = [RID, H, Action];

/** @internal */
export interface RouteEffectsMethods<
  EffectAPI extends DefaultEffectAPI,
  Handlers extends HandlerMeta<
    RouteEffectHookName,
    RouteID,
    AnyPayloadAction
  > = HandlerMeta<RouteEffectHookName, never, AnyPayloadAction>
> {
  /**
   * Adds a route middleware for the given route to the end of the stack.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .append(routes.Root.id, delayTransition(5000));
   *
   * @public
   */
  append<RID extends RouteID>(
    routeID: RID,
    effect: RouteMiddleware<StartTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<
    EffectAPI,
    | HandlerMeta<typeof hookNames.MIDDLEWARE, RID, StartTransitionAction>
    | Handlers
  >;

  /**
   * Adds a route middleware for all routes to the end of the stack.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .appendAll(delayTransition(5000));
   *
   * @public
   */
  appendAll(
    effect: RouteMiddleware<StartTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<
    EffectAPI,
    | HandlerMeta<
        typeof hookNames.MIDDLEWARE,
        typeof ALL_ROUTES_KEY,
        StartTransitionAction
      >
    | Handlers
  >;

  /**
   * Adds a route middleware for the given route to the beginning of the stack.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .prepend(routes.Root.id, delayTransition(5000));
   *
   * @public
   */
  prepend<RID extends RouteID>(
    id: RID,
    effect: RouteMiddleware<StartTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<
    EffectAPI,
    | HandlerMeta<typeof hookNames.MIDDLEWARE, RID, StartTransitionAction>
    | Handlers
  >;

  /**
   * Adds a route middleware for all routes to the beginning of the stack.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .prependAll(delayTransition(5000));
   *
   * @public
   */
  prependAll(
    effect: RouteMiddleware<StartTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<
    EffectAPI,
    | HandlerMeta<
        typeof hookNames.MIDDLEWARE,
        typeof ALL_ROUTES_KEY,
        StartTransitionAction
      >
    | Handlers
  >;

  /**
   * Adds a route listener that's called when a route transition
   * for the given route completes.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onComplete(routes.Root.id, () => {
   *     console.log("The root route transition completed.");
   *   });
   *
   * @public
   */
  onComplete<RID extends RouteID>(
    id: RID,
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for any route completes.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onCompleteAll(() => {
   *     console.log("A route transition completed.");
   *   });
   *
   * @public
   */
  onCompleteAll(
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for the given route ends.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onEnd(routes.Root.id, () => {
   *     console.log("The root route transition ended.");
   *   });
   *
   * @public
   */
  onEnd<RID extends RouteID>(
    id: RID,
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for any route ends.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onEndAll(() => {
   *     console.log("A route transition ended.");
   *   });
   *
   * @public
   */
  onEndAll(
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for the given route exits.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onExit(routes.Root.id, () => {
   *     console.log("The root route transition exited.");
   *   });
   *
   * @public
   */
  onExit<RID extends RouteID>(
    id: RID,
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for any route exits.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onExitAll(() => {
   *     console.log("A route transition exited.");
   *   });
   *
   * @public
   */
  onExitAll(
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for the given route fails.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onFailure(routes.Root.id, () => {
   *     console.log("The root route transition failed.");
   *   });
   *
   * @public
   */
  onFailure<RID extends RouteID>(
    id: RID,
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for any route fails.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onFailureAll(() => {
   *     console.log("A route transition failed.");
   *   });
   *
   * @public
   */
  onFailureAll(
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for the given route interrupts.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onInterrupt(routes.Root.id, () => {
   *     console.log("The root route transition was interrupted.");
   *   });
   *
   * @public
   */
  onInterrupt<RID extends RouteID>(
    id: RID,
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for any route interrupts.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onInterruptAll(() => {
   *     console.log("A route transition was interrupted.");
   *   });
   *
   * @public
   */
  onInterruptAll(
    effect: RouteListener<EndTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for the given route starts.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onStart(routes.Root.id, () => {
   *     console.log("The root route transition started.");
   *   });
   *
   * @public
   */
  onStart<RID extends RouteID>(
    id: RID,
    effect: RouteListener<StartTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  /**
   * Adds a route listener that's called when a route transition
   * for any route starts.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/");
   *
   * createRouteEffects()
   *   .onStartAll(() => {
   *     console.log("A route transition started.");
   *   });
   *
   * @public
   */
  onStartAll(
    effect: RouteListener<StartTransitionAction, EffectAPI>
  ): UntouchedRouteEffects<EffectAPI, Handlers>;

  [SYMBOL_ROUTE_EFFECTS_META]: RouteEffectsMeta<EffectAPI>;
}

type HandlerMetaRID<H> = H extends HandlerMeta<
  RouteEffectHookName,
  infer RID,
  AnyPayloadAction
>
  ? RID
  : never;
type HandlerMetaHookName<H> = H extends HandlerMeta<
  infer HN,
  RouteID,
  AnyPayloadAction
>
  ? HN
  : never;
type HandlerMetaAction<H> = H extends HandlerMeta<
  RouteEffectHookName,
  RouteID,
  infer Action
>
  ? Action
  : never;

type RouteEffectReference<
  RID extends RouteID,
  EffectAPI extends DefaultEffectAPI,
  Action extends AnyPayloadAction
> = RouteMiddleware<Action, EffectAPI> & {
  readonly id: RID;
  readonly type: RouteEffectHookName;
};

type RouteListenerReference<
  RID extends RouteID,
  EffectAPI extends DefaultEffectAPI,
  Action extends AnyPayloadAction
> = RouteListener<Action, EffectAPI> & {
  readonly id: RID;
  readonly eventName: RouteEffectHookName;
};

type RouteEffectReferenceRecord<
  EffectAPI extends DefaultEffectAPI,
  Handlers extends HandlerMeta<
    RouteEffectHookName,
    RouteID,
    AnyPayloadAction
  > = HandlerMeta<RouteEffectHookName, never, PayloadAction<never>>
> = {
  readonly [K in Handlers as HandlerName<
    HandlerMetaHookName<K>,
    HandlerMetaRID<K>
  >]: RouteEffectReference<HandlerMetaRID<K>, EffectAPI, HandlerMetaAction<K>>;
};

type ReadonlyRouteEffectsMethods<EffectAPI extends DefaultEffectAPI> = {
  /**
   * Retrieves a map of handlers to invoke effects matching
   * the given route ID.
   *
   * @privateRemarks To ensure no parameters are accidentally left out,
   * a union type with `undefined` is used instead of making the parameters optional.
   *
   * @internal
   */
  _getHandlersByRouteID(
    id: RouteID | undefined
  ): Promise<RouteEffectHandlers<EffectAPI>>;
};

/** @internal */
export type UntouchedRouteEffects<
  EffectAPI extends DefaultEffectAPI,
  Handlers extends HandlerMeta<
    RouteEffectHookName,
    RouteID,
    AnyPayloadAction
  > = HandlerMeta<RouteEffectHookName, never, PayloadAction<never>>
> = RouteEffectsMethods<EffectAPI, Handlers> &
  ReadonlyRouteEffectsMethods<EffectAPI> &
  RouteEffectReferenceRecord<EffectAPI, Handlers>;

/**
 * @see {createRouteEffects}
 *
 * @public
 */
export type RouteEffects<EffectAPI extends DefaultEffectAPI> = {
  [SYMBOL_ROUTE_EFFECTS_META]: RouteEffectsMeta<EffectAPI>;
} & ReadonlyRouteEffectsMethods<EffectAPI>;

function getHandlerName<RID extends RouteID, H extends RouteEffectHookName>(
  id: RID,
  hookName: H
): HandlerName<H, RID> {
  return `${capitalize(id)}${capitalize(hookName)}`;
}

function cloneRouteEffectMeta<EffectAPI extends DefaultEffectAPI>(
  routesMeta: RouteEffectsMeta<EffectAPI>
): RouteEffectsMeta<EffectAPI> {
  return {
    effects: new Set(routesMeta.effects),
    listeners: new Set(routesMeta.listeners),
  };
}

/** @internal */
export function cloneRouteEffects<
  EffectAPI extends DefaultEffectAPI,
  Handlers extends HandlerMeta<
    RouteEffectHookName,
    RouteID,
    RouteEffectAction
  > = HandlerMeta<RouteEffectHookName, never, RouteEffectAction>
>(
  routeEffects: UntouchedRouteEffects<EffectAPI, Handlers>
): UntouchedRouteEffects<EffectAPI, Handlers> {
  const nextRouteEffects = createRouteEffects<EffectAPI, Handlers>();

  nextRouteEffects[SYMBOL_ROUTE_EFFECTS_META] = cloneRouteEffectMeta(
    routeEffects[SYMBOL_ROUTE_EFFECTS_META]
  );

  const effectReferences = Object.fromEntries(
    nextRouteEffects[SYMBOL_ROUTE_EFFECTS_META].effects.entries()
  );

  return Object.assign(nextRouteEffects, effectReferences);
}

/**
 * Creates an object with a fluent interface for adding effects to route transitions.
 * A Route Effects object is essentially a list of effects assigned to one or all routes.
 *
 * Route Effects objects methods can be chained, and return a new object when called.
 *
 * Two types of effects can be added, middleware and listeners.
 *
 * Middleware effects are called asynchronously in a series within a route transition.
 * A middleware effect must resolve before the next middleware effect is invoked.
 *
 * Listener effects are called synchronously in a series outside of the route transition.
 * A listener effect may be asynchronous, but they're not awaited.
 *
 * @example
 *
 * const initialRoutes = createRoutes()
 *   .set("root", "/")
 *   .setWildcard("profiles", "/profiles/*")
 *   .set("legacyRoot", "/app");
 *
 * createRouteEffects()
 *   // Delay all route transitions by 500ms
 *   .appendAll(delayTransition(500))
 *   // Forward "legacyRoot" to the "root".
 *   // This effect will called before the transition delay.
 *   .prepend("legacyRoot", forwardTo("/"))
 *   // Lazy-load routes when a location matches the Profiles wildcard route
 *   .append(
 *     initialRoutes.Profiles.id,
 *     addRoutes(() => import("./profileRoutes.js"))
 *   );
 *
 * @public
 */
export function createRouteEffects<
  EffectAPI extends DefaultEffectAPI,
  Handlers extends HandlerMeta<
    RouteEffectHookName,
    RouteID,
    RouteEffectAction
  > = HandlerMeta<RouteEffectHookName, never, RouteEffectAction>
>() {
  function getRouteMiddlewareHandler(
    routeHookName: RouteEffectHookName,
    routeID?: RouteID
  ) {
    const handlerEffects: RouteEffectReference<string, EffectAPI, any>[] = [];
    const currentEffects = [...routeEffects[SYMBOL_ROUTE_EFFECTS_META].effects];

    for (const { effectReference } of currentEffects) {
      const { id, type: hookName } = effectReference;

      if (
        hookName === routeHookName &&
        (id === ALL_ROUTES_KEY || id === routeID)
      ) {
        handlerEffects.push(effectReference);
      }
    }

    return chainMiddleware(...handlerEffects);
  }

  function getRouteListenerHandler(
    routeHookName: RouteEffectHookName,
    routeID?: RouteID
  ) {
    const handlerListeners: RouteListenerReference<string, EffectAPI, any>[] =
      [];
    const currentListeners = [
      ...routeEffects[SYMBOL_ROUTE_EFFECTS_META].listeners,
    ];

    for (const { listenerReference } of currentListeners) {
      const { id, eventName: hookName } = listenerReference;

      if (
        hookName === routeHookName &&
        (id === ALL_ROUTES_KEY || id === routeID)
      ) {
        handlerListeners.push(listenerReference);
      }
    }

    return combineListeners(...handlerListeners);
  }

  const addEffectModes = {
    APPEND: "append",
    PREPEND: "prepend",
  } as const;

  type AddEffectMode = typeof addEffectModes[keyof typeof addEffectModes];

  const routeEffects = {
    append(id, effect) {
      return addEffect(addEffectModes.APPEND, id, hookNames.MIDDLEWARE, effect);
    },
    appendAll(effect) {
      return addEffect(
        addEffectModes.APPEND,
        ALL_ROUTES_KEY,
        hookNames.MIDDLEWARE,
        effect
      );
    },
    prepend(id, effect) {
      return addEffect(
        addEffectModes.PREPEND,
        id,
        hookNames.MIDDLEWARE,
        effect
      );
    },
    prependAll(effect) {
      return addEffect(
        addEffectModes.PREPEND,
        ALL_ROUTES_KEY,
        hookNames.MIDDLEWARE,
        effect
      );
    },
    onComplete(id, listener) {
      return addListener(id, hookNames.COMPLETE, listener);
    },
    onCompleteAll(listener) {
      return addListener(ALL_ROUTES_KEY, hookNames.COMPLETE, listener);
    },
    onEnd(id, listener) {
      return addListener(id, hookNames.END, listener);
    },
    onEndAll(listener) {
      return addListener(ALL_ROUTES_KEY, hookNames.END, listener);
    },
    onExit(id, listener) {
      return addListener(id, hookNames.EXIT, listener);
    },
    onExitAll(listener) {
      return addListener(ALL_ROUTES_KEY, hookNames.EXIT, listener);
    },
    onFailure(id, listener) {
      return addListener(id, hookNames.FAILURE, listener);
    },
    onFailureAll(listener) {
      return addListener(ALL_ROUTES_KEY, hookNames.FAILURE, listener);
    },
    onInterrupt(id, listener) {
      return addListener(id, hookNames.INTERRUPT, listener);
    },
    onInterruptAll(listener) {
      return addListener(ALL_ROUTES_KEY, hookNames.INTERRUPT, listener);
    },
    onStart(id, listener) {
      return addListener(id, hookNames.START, listener);
    },
    onStartAll(listener) {
      return addListener(ALL_ROUTES_KEY, hookNames.START, listener);
    },
    async _getHandlersByRouteID(id) {
      return {
        middleware: getRouteMiddlewareHandler(hookNames.MIDDLEWARE, id),
        onComplete: getRouteListenerHandler(hookNames.COMPLETE, id),
        onEnd: getRouteListenerHandler(hookNames.END, id),
        onExit: getRouteListenerHandler(hookNames.EXIT, id),
        onFailure: getRouteListenerHandler(hookNames.FAILURE, id),
        onInterrupt: getRouteListenerHandler(hookNames.INTERRUPT, id),
        onStart: getRouteListenerHandler(hookNames.START, id),
      };
    },
    [SYMBOL_ROUTE_EFFECTS_META]: {
      effects: new Set(),
      listeners: new Set(),
    },
  } as UntouchedRouteEffects<EffectAPI, Handlers>;

  function addEffect<RID extends RouteID, Action extends RouteEffectAction>(
    mode: AddEffectMode,
    id: RID,
    hookName: RouteEffectHookName,
    effect: RouteMiddleware<Action, EffectAPI>
  ) {
    const referenceKey = getHandlerName(id, hookName);
    const wrappedEffect = (...args: Parameters<typeof effect>) =>
      effect(...args);
    const effectReference: RouteEffectReference<RID, EffectAPI, Action> =
      Object.assign(wrappedEffect, { id, type: hookName });
    const nextRouteEffects = cloneRouteEffects(routeEffects);

    {
      const routeEffectsMeta = nextRouteEffects[SYMBOL_ROUTE_EFFECTS_META];
      const effectToAdd = { referenceKey, effectReference };

      if (mode === addEffectModes.APPEND) {
        routeEffectsMeta.effects.add(effectToAdd);
      } else if (mode === addEffectModes.PREPEND) {
        routeEffectsMeta.effects = new Set([
          effectToAdd,
          ...routeEffectsMeta.effects,
        ]);
      }
    }

    const routeEffectFacade: typeof effect = async (...args) => {
      await getRouteMiddlewareHandler(hookName, id)(...args);
    };

    Object.assign(nextRouteEffects, {
      [referenceKey]: routeEffectFacade,
    });

    return nextRouteEffects;
  }

  function addListener<RID extends RouteID, Action extends RouteEffectAction>(
    id: RID,
    hookName: RouteEffectHookName,
    listener: RouteListener<Action, EffectAPI>
  ) {
    const wrappedListener = (...args: Parameters<typeof listener>) =>
      listener(...args);
    const listenerReference: RouteListenerReference<RID, EffectAPI, Action> =
      Object.assign(wrappedListener, { id, eventName: hookName });
    const nextRouteEffects = cloneRouteEffects(routeEffects);

    nextRouteEffects[SYMBOL_ROUTE_EFFECTS_META].listeners.add({
      listenerReference,
    });

    return nextRouteEffects;
  }

  return routeEffects as UntouchedRouteEffects<EffectAPI, Handlers>;
}

/**
 * Determines whether the given value is a Route Effects object
 *
 * @public
 */
export function isRouteEffects<R extends RouteEffects<DefaultEffectAPI>>(
  value: unknown
): value is R {
  return (
    typeof value == "object" &&
    value !== null &&
    Object.hasOwn(value, SYMBOL_ROUTE_EFFECTS_META)
  );
}

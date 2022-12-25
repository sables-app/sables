import {
  DefaultEffectAPI,
  PayloadAction,
  SYMBOL_ROUTES_META,
} from "@sables/core";
import { capitalize } from "@sables/utils";

import type * as History from "history";
import { createPath } from "history";
import type * as PathParser from "path-parser";
import { Path as ParserPath } from "path-parser";

import {
  addRoutes as addRoutesEffect,
  AddRoutesParams,
  combineHandlers,
  forwardTo,
} from "./effects.js";
import {
  cloneRouteEffects,
  createRouteEffects,
  RouteEffects,
  UntouchedRouteEffects,
} from "./RouteEffects.js";
import type {
  AnyRoutePath,
  BuildHrefParams,
  BuildLinkParams,
  DynamicImportFn,
  MatchingHref,
  RegisterDynamicImportFn,
  RouteEffectHandlers,
  RouteHref,
  RouteID,
  RouteMiddleware,
  RouteParams,
  RoutePathType,
  RouteWithParams,
  SharedRoutesMethods,
  WildCardPathType,
} from "./types.js";
import { buildHref, buildLink } from "./utils.js";

/** @internal */
type ExternalEffectsFn<EffectAPI extends DefaultEffectAPI> =
  | DynamicImportFn<{ default: RouteEffects<EffectAPI> }>
  | (() => RouteEffects<EffectAPI>);

/** @internal */
type RoutesMeta<EffectAPI extends DefaultEffectAPI> = {
  externalEffectsFn?: ExternalEffectsFn<EffectAPI>;
  internalEffects: UntouchedRouteEffects<EffectAPI, any>;
  routesById: Map<string, RouteReference<RouteID>>;
};

/** @internal */
function cloneRoutesMeta<EffectAPI extends DefaultEffectAPI>(
  routesMeta: RoutesMeta<EffectAPI>
): RoutesMeta<EffectAPI> {
  return {
    externalEffectsFn: routesMeta.externalEffectsFn,
    internalEffects: cloneRouteEffects(routesMeta.internalEffects),
    routesById: new Map(routesMeta.routesById.entries()),
  };
}

/** @internal */
function cloneRoutes<
  EffectAPI extends DefaultEffectAPI,
  RoutesRID extends string = never
>(
  routes: UntouchedRoutes<EffectAPI, RoutesRID>
): UntouchedRoutes<EffectAPI, RoutesRID> {
  const nextRoutes = createRoutes<EffectAPI, RoutesRID>();

  nextRoutes[SYMBOL_ROUTES_META] = cloneRoutesMeta(routes[SYMBOL_ROUTES_META]);

  const routeReferences = Object.fromEntries(
    [...nextRoutes[SYMBOL_ROUTES_META].routesById.entries()].map(
      ([id, routeReference]) => [capitalize(id), routeReference]
    )
  );

  return Object.assign(nextRoutes, routeReferences);
}

/** @internal declaration requirement */
export interface RoutesMethods<
  EffectAPI extends DefaultEffectAPI,
  RoutesRID extends string = never
> extends SharedRoutesMethods {
  /**
   * Retrieves a map of handlers to invoke effects matching
   * the given route ID.
   *
   * @privateRemarks
   *
   * To ensure no parameters are accidentally left out,
   * a union type with `undefined` is used instead of making the parameters optional.
   *
   * @internal
   */
  _getHandlersByRouteID(
    id: RouteID | undefined,
    registerDynamicImport: RegisterDynamicImportFn
  ): Promise<RouteEffectHandlers<EffectAPI>>;

  /**
   * Retrieves a set route by matching the given hyperlink.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/")
   *   .set("profile", "/profiles/:handle");
   *
   * const profileRouteWithParams = routes.find("/profiles/@ash.ketchum");
   *
   * @public
   */
  find(href: MatchingHref): RouteWithParams | undefined;

  /**
   * Sets a route to be matched for route transitions.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/")
   *   .set("profile", "/profiles/:handle");
   *
   * @public
   */
  set<RID extends RouteID>(
    id: RID,
    path: RoutePathType
  ): UntouchedRoutes<EffectAPI, RID | RoutesRID>;

  /**
   * Sets route to forward to another location.
   *
   * @remarks
   *
   * The resulting route is considered unidentified, and a `forwardTo`
   * route effect is appended to the internal Route Effects object.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/")
   *   // Forwards "/home.html" to "/"
   *   .setForwarding("/home.html", () => "/");
   *
   * @privateRemarks
   *
   * `NavigationDestination` isn't accepted, because typings break
   * when the `Routes` object references itself.
   * If that pattern is desired, the effect should be added using
   * `forwardTo` on a Route Effects object.
   *
   * @public
   */
  setForwarding(
    path: RoutePathType,
    getDestination: (params: RouteParams) => Partial<History.Path> | RouteHref
  ): UntouchedRoutes<EffectAPI, RoutesRID>;

  /**
   * Sets a wildcard route to be matched for route transitions.
   *
   * Wildcard routes _must_ be set after non-wildcard routes.
   * TypeScript definitions enforce this pattern.
   *
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/")
   *   .setWildcard("search", "/search/*");
   *
   * @public
   */
  setWildcard<RID extends RouteID>(
    id: RID,
    path: WildCardPathType
  ): Omit<UntouchedRoutes<EffectAPI, RID | RoutesRID>, WildcardLockedMethods>;

  /**
   * Sets wildcard route to add the given routes when matched.
   *
   * The given callback function should return a `Routes` object,
   * or a promise that resolves to an object with a `Routes` object
   * assigned to the `default` property. The latter can be used to lazy-load
   * routes using dynamic imports.
   *
   * @remarks
   *
   * The resulting route is considered unidentified, and an `addRoutes`
   * route effect is appended to the internal Route Effects object.
   *
   * Wildcard routes _must_ be set after non-wildcard routes.
   * TypeScript definitions enforce this pattern.
   *
   * @example
   *
   * const settingsRoutes = createRoutes()
   *   .set("notifications", "/settings/notifications")
   *   .set("resetPassword", "/settings/reset-password");
   *
   * const routes = createRoutes()
   *   .set("root", "/")
   *   .setRoutes("/settings/*", () => settingsRoutes)
   *   .setRoutes("/company/*", () => import("./companyRoutes.js"));
   *
   * @public
   */
  setRoutes(
    path: WildCardPathType,
    ...params: AddRoutesParams<EffectAPI>
  ): Omit<UntouchedRoutes<EffectAPI, RoutesRID>, WildcardLockedMethods>;

  /**
   * Sets a Route Effects object to be used during route transitions.
   * The given value may be a Route Effects object, or a callback with
   * a dynamic import to lazy-load the effects.
   *
   * @remarks
   *
   * Route Effects _must_ be set after all other method calls; the last
   * in the chain.
   * TypeScript definitions enforce this pattern.
   *
   * @example
   *
   * const routes = createRoutes()
   *   .set("root", "/")
   *   .set("profile", "/profiles/:handle")
   *   .setEffects(() => import("./routeEffects.js"));
   *
   * @public
   */
  setEffects(
    externalEffectsFn: ExternalEffectsFn<EffectAPI>
  ): Routes<EffectAPI, RoutesRID>;

  /** @internal */
  [SYMBOL_ROUTES_META]: RoutesMeta<EffectAPI>;
}

/** @public */
export type RouteReference<
  RID extends RouteID,
  PathParams extends Record<string, unknown> = Record<string, unknown>
> = Readonly<{
  build(
    params?: PathParams | null,
    opts?: PathParser.PathBuildOptions
  ): RouteHref;
  id: RID;
  path: RoutePathType;
  test(href: MatchingHref): PathParams | null;
  match(href: MatchingHref): boolean;
  toString(): RID;
}>;

/** @public */
export type AnyRouteReference = RouteReference<RouteID>;

type RouteReferenceRecord<RIDs extends string = never> = {
  readonly [K in RIDs as Capitalize<K>]: RouteReference<K>;
};

/** @internal */
type UntouchedRoutes<
  EffectAPI extends DefaultEffectAPI,
  RoutesRID extends string = never
> = RoutesMethods<EffectAPI, RoutesRID> & RouteReferenceRecord<RoutesRID>;

type LockedMethods = "set" | "setForwarding" | "setWildcard" | "setRoutes";
type WildcardLockedMethods = "set" | "setForwarding";

/** @public */
export type Routes<
  EffectAPI extends DefaultEffectAPI,
  RoutesRID extends string = never
> = Omit<UntouchedRoutes<EffectAPI, RoutesRID>, LockedMethods>;

function isWildCardPath(path: AnyRoutePath): path is WildCardPathType {
  return path.endsWith("/*");
}

function assertWildCardRoutePath(
  path: AnyRoutePath
): asserts path is WildCardPathType {
  if (!isWildCardPath(path)) {
    throw new Error(`The provided route path must be a wildcard path.`);
  }
}

function assertNotWildCardRoutePath(
  path: AnyRoutePath
): asserts path is RoutePathType {
  if (isWildCardPath(path)) {
    throw new Error(`The provided route path must not be a wildcard path.`);
  }
}

const EMPTY_ROUTE_EFFECT_HANDLERS: RouteEffectHandlers<any> = {
  middleware: async () => undefined,
  onComplete: async () => undefined,
  onEnd: async () => undefined,
  onExit: async () => undefined,
  onFailure: async () => undefined,
  onInterrupt: async () => undefined,
  onStart: async () => undefined,
};

const WILDCARD_ROUTES_ID_PREFIX = "__wildcardRoutes:";

/**
 * Creates a map of routes to enable route transitions.
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("about", "/about-us")
 *   // Lazy-load additional routes
 *   .setRoutes("/users/*", () => import("./routes/users.js"));
 *
 * @public
 */
export function createRoutes<
  EffectAPI extends DefaultEffectAPI,
  RIDs extends string = never
>(): UntouchedRoutes<EffectAPI, RIDs> {
  const routes = {
    set(id, path) {
      assertNotWildCardRoutePath(path);

      return addRoute(id, path);
    },
    setForwarding(path, getDestination) {
      assertNotWildCardRoutePath(path);

      return addRouteWithEffect(path, forwardTo<EffectAPI>(getDestination));
    },
    setWildcard(id, path) {
      assertWildCardRoutePath(path);

      return addRoute(id, `${path}wildcard`);
    },
    setRoutes(path, ...addRoutesParams) {
      assertWildCardRoutePath(path);

      return addRouteWithEffect(
        path,
        addRoutesEffect<EffectAPI>(...addRoutesParams)
      );
    },
    setEffects(externalEffectsFn) {
      const nextRoutes = cloneRoutes(routes);

      nextRoutes[SYMBOL_ROUTES_META].externalEffectsFn = externalEffectsFn;

      return nextRoutes;
    },
    buildHref(...params: BuildHrefParams) {
      return buildHref(...params);
    },
    buildLink(...params: BuildLinkParams) {
      return buildLink(...params);
    },
    find(href: MatchingHref) {
      if (!href) return undefined;

      const routesList = routes[SYMBOL_ROUTES_META].routesById.values();

      for (const route of routesList) {
        const { id, path } = route;
        const params = route.test(href);

        if (params !== null) {
          return { id, params, path };
        }
      }
    },
    async _getHandlersByRouteID(id, registerDynamicImport) {
      if (!id) {
        return EMPTY_ROUTE_EFFECT_HANDLERS;
      }

      const { internalEffects, externalEffectsFn } = routes[SYMBOL_ROUTES_META];
      const internalHandlers = await internalEffects._getHandlersByRouteID(id);
      const externalEffects = await resolveExternalEffects(
        externalEffectsFn,
        registerDynamicImport
      );
      const externalHandlers = await externalEffects?._getHandlersByRouteID(id);

      if (!externalHandlers) {
        return internalHandlers;
      }

      return combineHandlers(internalHandlers, externalHandlers);
    },
    getRouteByID(id) {
      if (!id) return;

      return routes[SYMBOL_ROUTES_META].routesById.get(id);
    },
    [SYMBOL_ROUTES_META]: {
      routesById: new Map(),
      internalEffects: createRouteEffects<EffectAPI>(),
    },
  } as UntouchedRoutes<EffectAPI, RIDs>;

  function addRoute<RID extends RouteID>(id: RID, path: RoutePathType) {
    const referenceKey = capitalize(id);
    const parser = new ParserPath(path);

    type Params = Record<string, unknown>;

    function build(params?: Params | null, opts?: PathParser.PathBuildOptions) {
      return parser.build(params || {}, opts) as RouteHref;
    }

    function resolveHref(value: NonNullable<MatchingHref>): string {
      return typeof value === "string" ? value : createPath(value);
    }

    function test(href: MatchingHref): Params | null {
      if (!href) return null;

      const [hrefWithoutHash] = resolveHref(href).split("#");

      return parser.test(hrefWithoutHash);
    }

    function match(href: MatchingHref): boolean {
      return !!test(href);
    }

    const routeReference: RouteReference<RID> = {
      build,
      id,
      match,
      path,
      test,
      toString: () => id,
    };

    const nextRoutes = cloneRoutes(routes);

    Object.assign(nextRoutes, { [referenceKey]: routeReference });
    nextRoutes[SYMBOL_ROUTES_META].routesById.set(id, routeReference);

    return nextRoutes;
  }

  function addRouteWithEffect<
    M extends RouteMiddleware<PayloadAction<any>, EffectAPI>
  >(
    path: RoutePathType | WildCardPathType,
    effect: M
  ): UntouchedRoutes<EffectAPI, RIDs>;
  function addRouteWithEffect<
    M extends RouteMiddleware<PayloadAction<any>, EffectAPI>
  >(
    path: WildCardPathType,
    effect: M
  ): Omit<UntouchedRoutes<EffectAPI, RIDs>, WildcardLockedMethods>;
  function addRouteWithEffect<
    M extends RouteMiddleware<PayloadAction<any>, EffectAPI>
  >(path: RoutePathType | WildCardPathType, effect: M) {
    // Routes are typically created upon execution,
    // so this ID must be a deterministic to be used
    // in Cloudflare Workers.
    const routeID = `${WILDCARD_ROUTES_ID_PREFIX}${path}`;

    const nextRoutes:
      | UntouchedRoutes<EffectAPI, RIDs>
      | Omit<UntouchedRoutes<EffectAPI, RIDs>, WildcardLockedMethods> =
      isWildCardPath(path)
        ? routes.setWildcard(routeID, path)
        : routes.set(routeID, path);

    const nextRouteMeta = nextRoutes[SYMBOL_ROUTES_META];
    const nextInternalEffects = nextRouteMeta.internalEffects;

    nextRouteMeta.internalEffects = nextInternalEffects.append(routeID, effect);

    return nextRoutes;
  }

  async function resolveExternalEffects(
    externalEffectsFn: ExternalEffectsFn<EffectAPI> | undefined,
    registerDynamicImport: RegisterDynamicImportFn
  ): Promise<RouteEffects<EffectAPI> | undefined> {
    if (!externalEffectsFn) return undefined;

    const result = externalEffectsFn();
    const routeEffects =
      result instanceof Promise ? (await result).default : result;

    function isDynamicImportFn(
      _value: typeof externalEffectsFn
    ): _value is DynamicImportFn<{ default: RouteEffects<EffectAPI> }> {
      return result instanceof Promise;
    }

    if (isDynamicImportFn(externalEffectsFn)) {
      registerDynamicImport(externalEffectsFn);
    }

    return routeEffects;
  }

  return routes;
}

/**
 * Determines whether the given object is a Routes instance.
 *
 * @see {createRoutes}
 *
 * @public
 */
export function isRoutes<
  EffectAPI extends DefaultEffectAPI,
  RIDs extends string
>(value: unknown): value is Routes<EffectAPI, RIDs> {
  return (
    typeof value == "object" &&
    value !== null &&
    Object.hasOwn(value, SYMBOL_ROUTES_META)
  );
}

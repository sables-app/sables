import {
  DefaultEffectAPI,
  PayloadAction,
  SYMBOL_ROUTES_META,
} from "@sables/core";
import { capitalize } from "@sables/utils";

import { createPath } from "history";

import {
  addRoutes as addRoutesEffect,
  AddRoutesParams,
  combineHandlers,
  forwardTo,
} from "./effects.js";
import {
  assertNotWildCardRoutePath,
  assertNotWildCardRouteTemplatePath,
  assertWildCardRoutePath,
  assertWildCardRouteTemplatePath,
  createPathParser,
  ExtractParamName,
  isWildCardPath,
  normalizeRoutePath,
  PathFromParamName,
  TemplatePath,
} from "./Path.js";
import {
  cloneRouteEffects,
  createRouteEffects,
  RouteEffects,
  UntouchedRouteEffects,
} from "./RouteEffects.js";
import type {
  AnyRoutePath,
  DynamicImportFn,
  MatchingHref,
  PartialHistoryPathStrict,
  RegisterDynamicImportFn,
  RouteEffectHandlers,
  RouteHref,
  RouteID,
  RouteMiddleware,
  RouteParams,
  RoutePathType,
  RouteWithParams,
  WildCardPathType,
} from "./types.js";

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
  Info extends RouteReferenceInfo<string, string> = never
>(routes: UntouchedRoutes<EffectAPI, Info>): UntouchedRoutes<EffectAPI, Info> {
  const nextRoutes = createRoutes<EffectAPI, Info>();

  nextRoutes[SYMBOL_ROUTES_META] = cloneRoutesMeta(routes[SYMBOL_ROUTES_META]);

  const routeReferences = Object.fromEntries(
    [...nextRoutes[SYMBOL_ROUTES_META].routesById.entries()].map(
      ([id, routeReference]) => [capitalize(id), routeReference]
    )
  );

  return Object.assign(nextRoutes, routeReferences);
}

/** @internal */
export type RouteReferenceInfo<
  RID extends string,
  RawParamName extends string
> = [RID, RawParamName];

/** @internal declaration requirement */
export interface RoutesMethods<
  EffectAPI extends DefaultEffectAPI,
  Info extends RouteReferenceInfo<string, string> = never
> {
  /**
   * @public
   */
  getRouteByID<RID extends RouteID>(id?: RID): RouteReference<RID> | undefined;

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
  set<RID extends RouteID, RawParamName extends string>(
    id: RID,
    path: RoutePathType | TemplatePath<RoutePathType, RawParamName>
  ): UntouchedRoutes<EffectAPI, RouteReferenceInfo<RID, RawParamName> | Info>;

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
    getDestination: (
      params: RouteParams
    ) => PartialHistoryPathStrict | RouteHref
  ): UntouchedRoutes<EffectAPI, Info>;

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
  setWildcard<RID extends RouteID, RawParamName extends string>(
    id: RID,
    path: WildCardPathType | TemplatePath<WildCardPathType, RawParamName>
  ): Omit<
    UntouchedRoutes<EffectAPI, RouteReferenceInfo<RID, RawParamName> | Info>,
    WildcardLockedMethods
  >;

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
  ): Omit<UntouchedRoutes<EffectAPI, Info>, WildcardLockedMethods>;

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
  ): Routes<EffectAPI, Info>;

  /** @internal */
  [SYMBOL_ROUTES_META]: RoutesMeta<EffectAPI>;
}

/** @internal */
export type RouteParamsFromParamName<ParamName extends string> = Record<
  ParamName,
  unknown
>;

/** @public */
export type RouteReference<
  RID extends RouteID,
  ParamName extends string = string,
  Path extends AnyRoutePath = PathFromParamName<ParamName>,
  PathParams extends RouteParamsFromParamName<ParamName> = RouteParamsFromParamName<ParamName>
> = Readonly<{
  build(params?: PathParams | null): RouteHref;
  id: RID;
  path: Path;
  test(href: MatchingHref): PathParams | null;
  match(href: MatchingHref): boolean;
  toString(): RID;
}>;

/** @public */
export type AnyRouteReference = RouteReference<RouteID>;

type RouteIDFromInfo<Info> = Info extends RouteReferenceInfo<infer RID, string>
  ? RID
  : never;
type RawParamNameFromInfo<Info> = Info extends RouteReferenceInfo<
  string,
  infer RawParamName
>
  ? RawParamName
  : never;

type RouteReferenceRecord<
  Info extends RouteReferenceInfo<string, string> = never
> = {
  readonly [K in Info as Capitalize<RouteIDFromInfo<K>>]: RouteReference<
    RouteIDFromInfo<K>,
    ExtractParamName<RawParamNameFromInfo<K>>
  >;
};

/** @internal */
type UntouchedRoutes<
  EffectAPI extends DefaultEffectAPI,
  Info extends RouteReferenceInfo<string, string> = never
> = RoutesMethods<EffectAPI, Info> & RouteReferenceRecord<Info>;

type LockedMethods = "set" | "setForwarding" | "setWildcard" | "setRoutes";
type WildcardLockedMethods = "set" | "setForwarding";

/** @public */
export type Routes<
  EffectAPI extends DefaultEffectAPI,
  Info extends RouteReferenceInfo<string, string> = never
> = Omit<UntouchedRoutes<EffectAPI, Info>, LockedMethods>;

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
  Info extends RouteReferenceInfo<string, string> = never
>(): UntouchedRoutes<EffectAPI, Info> {
  const routes = {
    set(id, pathInput) {
      const templatePath = normalizeRoutePath(pathInput);

      assertNotWildCardRouteTemplatePath(templatePath);

      return addRoute(id, templatePath);
    },
    setForwarding(path, getDestination) {
      assertNotWildCardRoutePath(path);

      return addRouteWithEffect(path, forwardTo<EffectAPI>(getDestination));
    },
    setWildcard(id, pathInput) {
      const templatePath = normalizeRoutePath(pathInput);

      assertWildCardRouteTemplatePath(templatePath);

      return addRoute(id, templatePath);
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
  } as UntouchedRoutes<EffectAPI, Info>;

  function addRoute<
    RID extends RouteID,
    Path extends AnyRoutePath,
    ParamName extends string
  >(id: RID, templatePath: TemplatePath<Path, ParamName>) {
    const referenceKey = capitalize(id);
    const parser = createPathParser(templatePath);

    type PathParams = RouteParamsFromParamName<ParamName>;

    function build(params?: PathParams | null) {
      return parser.build(params || {}) as RouteHref;
    }

    function resolveHref(value: NonNullable<MatchingHref>): string {
      return typeof value === "string" ? value : createPath(value);
    }

    function test(href: MatchingHref): PathParams | null {
      if (!href) return null;

      const [hrefWithoutHash] = resolveHref(href).split("#");

      return parser.test(hrefWithoutHash) as PathParams | null;
    }

    function match(href: MatchingHref): boolean {
      return !!test(href);
    }

    const routeReference: RouteReference<RID> = {
      build,
      id,
      match,
      path: templatePath.path,
      test,
      toString: () => id,
    };

    const nextRoutes = cloneRoutes(routes);

    Object.assign(nextRoutes, { [referenceKey]: routeReference });
    nextRoutes[SYMBOL_ROUTES_META].routesById.set(id, routeReference);

    return nextRoutes;
  }

  function addRouteWithEffect<
    MW extends RouteMiddleware<PayloadAction<any>, EffectAPI>
  >(
    path: RoutePathType | WildCardPathType,
    middleware: MW
  ): UntouchedRoutes<EffectAPI, Info>;
  function addRouteWithEffect<
    MW extends RouteMiddleware<PayloadAction<any>, EffectAPI>
  >(
    path: WildCardPathType,
    middleware: MW
  ): Omit<UntouchedRoutes<EffectAPI, Info>, WildcardLockedMethods>;
  function addRouteWithEffect<
    MW extends RouteMiddleware<PayloadAction<any>, EffectAPI>
  >(path: RoutePathType | WildCardPathType, middleware: MW) {
    // Routes are typically created upon execution,
    // so this ID must be a deterministic to be used
    // in Cloudflare Workers.
    const routeID = `${WILDCARD_ROUTES_ID_PREFIX}${path}`;

    const nextRoutes:
      | UntouchedRoutes<EffectAPI, Info>
      | Omit<UntouchedRoutes<EffectAPI, Info>, WildcardLockedMethods> =
      isWildCardPath(path)
        ? routes.setWildcard(routeID, path)
        : routes.set(routeID, path);

    const nextRouteMeta = nextRoutes[SYMBOL_ROUTES_META];
    const nextInternalEffects = nextRouteMeta.internalEffects;

    nextRouteMeta.internalEffects = nextInternalEffects.append(
      routeID,
      middleware
    );

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
  Info extends RouteReferenceInfo<string, string>
>(value: unknown): value is Routes<EffectAPI, Info> {
  return (
    typeof value == "object" &&
    value !== null &&
    Object.hasOwn(value, SYMBOL_ROUTES_META)
  );
}

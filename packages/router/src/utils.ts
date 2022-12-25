import {
  DefaultEffectAPI,
  SYMBOL_EFFECT_API_LIFECYCLE,
  SYMBOL_EFFECT_API_ROUTES,
} from "@sables/core";
import { isSSREnv } from "@sables/utils";

import type * as History from "history";
import { createPath } from "history";

import { ensureLocation, pushLocation, replaceLocation } from "./actions.js";
import { AnyRouteReference } from "./Routes.js";
import { isRoutesCollection, RoutesCollection } from "./RoutesCollection.js";
import type {
  BuildHrefParams,
  BuildLinkParams,
  LocationChangeAction,
  RegisterDynamicImportFn,
  RouteHref,
  RouteLink,
} from "./types.js";

/**
 * Used to compare location changes to determine whether
 * a route transition should start.
 * Only the pathname and search are compared. Hashes are not
 * considered to be a part of a route path.
 * @internal
 */
export function areLocationChangesRouterEquivalent(
  changeA?: LocationChangeAction["payload"],
  changeB?: LocationChangeAction["payload"]
): boolean {
  return !!(
    changeA &&
    changeB &&
    changeA.location.pathname === changeB.location.pathname &&
    changeA.location.search === changeB.location.search
  );
}

/** @internal */
export function isPartialHistoryPath(
  value?: AnyRouteReference | Partial<History.Path> | BuildHrefParams
): value is Partial<History.Path> {
  return (
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as any).id === "undefined"
  );
}

/**
 * `import('history').createPath()` also returns the root
 * path when the given values are undefined.
 */
const FALLBACK_HREF = "/";

/**
 * Builds a hyperlink for a given route.
 *
 * @public
 */
export function buildHref(...args: BuildHrefParams): RouteHref {
  const [route, params, opts] = args;

  if (isPartialHistoryPath(route)) {
    return createPath(route) as RouteHref;
  }

  if (!route) return FALLBACK_HREF;

  return route.build(params, opts);
}

/**
 * Builds an object to interact with a route.
 *
 * @see {RouteLink}
 *
 * @public
 */
export function buildLink(...args: BuildLinkParams): RouteLink {
  const [dispatch, buildHrefArgs] = args;
  const href = buildHref(...buildHrefArgs);

  return {
    href,
    ensureLocation() {
      dispatch(ensureLocation(href));
    },
    pushLocation() {
      dispatch(pushLocation(href));
    },
    replaceLocation() {
      dispatch(replaceLocation(href));
    },
  };
}

/** @internal */
export function demandRoutesCollectionFromEffectAPI<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(effectAPI: EffectAPI): RoutesCollection<EffectAPI> {
  const routesCollectionRef = effectAPI[SYMBOL_EFFECT_API_ROUTES];

  if (!isRoutesCollection<EffectAPI>(routesCollectionRef.current)) {
    throw new Error("Routes must be made available to use this effect.");
  }

  return routesCollectionRef.current;
}

/** @internal */
export function createDynamicImportRegistrar<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(effectAPI: EffectAPI): RegisterDynamicImportFn {
  return function registerDynamicImport(dynamicImport) {
    if (!isSSREnv()) return;

    effectAPI[SYMBOL_EFFECT_API_LIFECYCLE].demand()
      .serverRequestStateRef.demand()
      .invokedImporters.add(String(dynamicImport));
  };
}

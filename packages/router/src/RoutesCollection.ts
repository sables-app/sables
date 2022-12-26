import {
  DefaultEffectAPI,
  SYMBOL_ROUTES_COLLECTION_INSTANCE,
} from "@sables/core";

import { createRoutes, RouteReference, Routes } from "./Routes.js";
import type { MatchingHref, RouteID, RouteWithParams } from "./types.js";

/** @internal */
export interface RoutesCollection<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
> {
  getRouteByID<RID extends RouteID>(id?: RID): RouteReference<RID> | undefined;
  add(routes: Routes<EffectAPI>): void;
  addInitial(initialRoutes?: Routes<EffectAPI>): void;
  findByHref(href: MatchingHref): {
    nextRoute: RouteWithParams | undefined;
    routes: Routes<EffectAPI> | undefined;
  };
  has(routes: Routes<EffectAPI>): boolean;
  [SYMBOL_ROUTES_COLLECTION_INSTANCE]: undefined;
}

const DEFAULT_ROOT_ID = "defaultRoot";

/** @internal */
export function createRoutesCollection<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(): RoutesCollection<EffectAPI> {
  let collection = new Set<Routes<EffectAPI>>();
  let defaultInitialRoutes:
    | Routes<EffectAPI, typeof DEFAULT_ROOT_ID>
    | undefined;

  const routesCollection: RoutesCollection<EffectAPI> = {
    add(routes) {
      if (collection.has(routes)) return;

      // New routes are always prepended to the collection so they can be matched first.
      // Newly added routes should always have a higher specificity than prior routes.
      collection = new Set([routes, ...collection]);
    },
    addInitial(initialRoutes) {
      if (defaultInitialRoutes) return;

      defaultInitialRoutes = createRoutes<EffectAPI>().set(
        DEFAULT_ROOT_ID,
        "/"
      );

      routesCollection.add(initialRoutes || defaultInitialRoutes);
    },
    findByHref(...params) {
      for (const routes of collection) {
        const nextRoute = routes.find(...params);

        if (nextRoute) {
          return {
            nextRoute,
            routes,
          };
        }
      }

      return {
        nextRoute: undefined,
        routes: undefined,
      };
    },
    getRouteByID(id) {
      for (const routes of collection) {
        const route = routes.getRouteByID(id);

        if (route) return route;
      }
    },
    has(routes) {
      return collection.has(routes);
    },
    [SYMBOL_ROUTES_COLLECTION_INSTANCE]: undefined,
  };

  return routesCollection;
}

/** @internal */
export function isRoutesCollection<EffectAPI extends DefaultEffectAPI>(
  value: unknown
): value is RoutesCollection<EffectAPI> {
  return (
    typeof value == "object" &&
    value !== null &&
    Object.hasOwn(value, SYMBOL_ROUTES_COLLECTION_INSTANCE)
  );
}

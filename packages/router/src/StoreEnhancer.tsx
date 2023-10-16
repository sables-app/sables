import { DefaultEffectAPI, SYMBOL_STORE_ROUTES } from "@sables/core";
import { demandValue } from "@sables/utils";

import { useStore } from "react-redux";
import type * as Redux from "redux";

import type { RoutesCollection } from "./RoutesCollection.js";

/** @internal */
export type RouterEnhancerExt<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
> = {
  [SYMBOL_STORE_ROUTES]: RoutesCollection<EffectAPI>;
};

/** @internal */
export type RouterEnhancedStore<
  StoreState extends Record<string, unknown> = Record<string, unknown>,
  EffectAPI extends DefaultEffectAPI<StoreState> = DefaultEffectAPI<StoreState>,
> = Redux.Store<StoreState> & RouterEnhancerExt<EffectAPI>;

/** @internal */
export function isRouterEnhancedStore<
  StoreState extends Record<string, unknown> = Record<string, unknown>,
  EffectAPI extends DefaultEffectAPI<StoreState> = DefaultEffectAPI<StoreState>,
>(
  store: Redux.Store<StoreState> | RouterEnhancedStore<StoreState, EffectAPI>,
): store is RouterEnhancedStore<StoreState, EffectAPI> {
  return Object.hasOwn(store, SYMBOL_STORE_ROUTES);
}

/** @internal */
export function getRoutesCollectionOnStore<
  StoreState extends Record<string, unknown> = Record<string, unknown>,
  EffectAPI extends DefaultEffectAPI<StoreState> = DefaultEffectAPI<StoreState>,
>(
  store: Redux.Store<StoreState> | RouterEnhancedStore<StoreState, EffectAPI>,
): RoutesCollection<EffectAPI> | undefined {
  if (isRouterEnhancedStore<StoreState, EffectAPI>(store)) {
    return store[SYMBOL_STORE_ROUTES];
  }
}

/**
 * This is an easy way to attach properties to the store,
 * without needing to resort to using an store enhancer.
 *
 * @internal
 */
export function attachRoutesCollectionToStore<
  StoreState extends Record<string, unknown> = Record<string, unknown>,
  EffectAPI extends DefaultEffectAPI<StoreState> = DefaultEffectAPI<StoreState>,
>(
  store: Redux.Store<StoreState>,
  routesCollection: RoutesCollection<EffectAPI>,
): asserts store is RouterEnhancedStore<StoreState, EffectAPI> {
  Object.assign(store, { [SYMBOL_STORE_ROUTES]: routesCollection });
}

/** @internal */
export function useRoutesCollection<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
>(): RoutesCollection<EffectAPI> {
  return demandValue(
    getRoutesCollectionOnStore(useStore<Record<string, unknown>>()),
  );
}

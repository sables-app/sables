import {
  DefaultEffectAPI,
  SYMBOL_EFFECT_API_LIFECYCLE,
  SYMBOL_EFFECT_API_ROUTES,
  SYMBOL_MANAGER_EFFECT_API,
} from "@sables/core";
import { isSSREnv } from "@sables/utils";

import { LifecycleState, ServerRequestStateRef } from "../LifecycleContext.js";
import { ConfigureManagerFn, ConfigureManagerParams, Manager } from "../types.js";
import { createManager } from "./Manager.js";

export * from "@sables/utils";

function assertManagerConsistency<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(manager: Manager<any, EffectAPI>) {
  const effectAPIRefOnManager = manager[SYMBOL_MANAGER_EFFECT_API];
  const lifecycleRefOnManager = manager[SYMBOL_EFFECT_API_LIFECYCLE];
  const routeCollectionRefOnManager = manager[SYMBOL_EFFECT_API_ROUTES];

  const effectAPI = effectAPIRefOnManager.demand();

  const lifecycleRefOnEffectAPI = effectAPI[SYMBOL_EFFECT_API_LIFECYCLE];
  const routeCollectionRefOnEffectAPI = effectAPI[SYMBOL_EFFECT_API_ROUTES];

  routeCollectionRefOnManager.demand();
  lifecycleRefOnManager.demand();
  lifecycleRefOnEffectAPI.demand();

  if (lifecycleRefOnManager.current !== lifecycleRefOnEffectAPI.current) {
    throw new Error("Inconsistent lifecycle state detected.");
  }

  if (
    routeCollectionRefOnEffectAPI.current &&
    routeCollectionRefOnEffectAPI.current !==
      routeCollectionRefOnManager.current
  ) {
    throw new Error(
      [
        "Multiple route collections detected.",
        "When a route collection object is defined on the effect API, it must match the one defined on the manager.",
      ].join("\n")
    );
  }
}

const DEFAULT_PARAMS: ConfigureManagerParams = {};

function getConfigureManagerParams(
  serverRequestStateRef: ServerRequestStateRef
): ConfigureManagerParams {
  if (!isSSREnv()) {
    return DEFAULT_PARAMS;
  }

  const { href } = serverRequestStateRef.demand();

  return {
    initialLocation: href,
  };
}

/** @internal */
export function resolveConfigureManager<M extends Manager<any, any>>(
  lifecycleState: LifecycleState,
  configureManager: ConfigureManagerFn<M> | undefined
): M {
  const { managerRef, serverRequestStateRef } = lifecycleState;

  if (!managerRef.current) {
    const managerCreator = configureManager || createManager;
    managerRef.current = managerCreator(
      getConfigureManagerParams(serverRequestStateRef)
    );
    managerRef.current[SYMBOL_EFFECT_API_LIFECYCLE].current = lifecycleState;
    assertManagerConsistency(managerRef.current);
  }

  return managerRef.current as M;
}

/**
 * A utility function to assist in defining `configureManager` functions.
 *
 * @example
 *
 * export const configureManager = defineConfigureManager(
 *   ({ initialLocation }) => {
 *     return createManager({ initialLocation });
 *   }
 * );
 *
 * @public
 */
export function defineConfigureManager<M extends Manager<any, any>>(
  configureManager: ConfigureManagerFn<M>
) {
  return configureManager;
}

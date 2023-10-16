import { DefaultEffectAPI, useEffectAPI } from "@sables/core";

import { useLifecycleState } from "../LifecycleContext.js";
import { resolveConfigureManager } from "../manager/mod.js";
import { ConfigureManagerFn, Manager } from "../types.js";

/** @internal */
export function useConfigureManager<M extends Manager<any, any>>(
  configureManager: ConfigureManagerFn<M> | undefined,
) {
  return resolveConfigureManager<M>(useLifecycleState(), configureManager);
}

/**
 * A utility function to assist in defining hooks for customized Effect API objects.
 *
 * @example
 *
 * import { ExtendEffectAPI } from "@sables/framework";
 *
 * const customLogFn = console.log;
 *
 * export const useApp = defineEffectAPIHook<
 *   ExtendEffectAPI<{
 *     customLogFn: typeof customLogFn;
 *   }>
 * >();
 *
 * function MyComponent() {
 *   const { customLogFn } = useApp();
 *
 *   return null;
 * }
 *
 * @public
 */
export function defineEffectAPIHook<EffectAPI extends DefaultEffectAPI>(
  configureManager: ConfigureManagerFn<Manager<any, EffectAPI>>,
): () => EffectAPI;
export function defineEffectAPIHook<
  EffectAPI extends DefaultEffectAPI,
>(): () => EffectAPI;
export function defineEffectAPIHook<EffectAPI extends DefaultEffectAPI>() {
  return useEffectAPI as () => EffectAPI;
}

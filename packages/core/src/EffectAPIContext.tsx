import { createMutableRef } from "@sables/utils";

import { createContext, PropsWithChildren, useContext, useMemo } from "react";

import { EFFECT_API_REF_MESSAGE } from "./constants.js";
import { DefaultEffectAPI } from "./types.js";

const EffectAPIContext = createContext(
  createMutableRef<DefaultEffectAPI>(EFFECT_API_REF_MESSAGE)
);

/** @internal */
export function EffectAPIProvider<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>({
  children,
  effectAPI,
}: PropsWithChildren<{
  effectAPI?: EffectAPI;
}>) {
  return (
    <EffectAPIContext.Provider
      value={useMemo(
        () => createMutableRef(EFFECT_API_REF_MESSAGE, effectAPI),
        [effectAPI]
      )}
    >
      {children}
    </EffectAPIContext.Provider>
  );
}

/**
 * A React hook that retrieves the Effect API from the React context.
 *
 * @example
 *
 *
 * function MyComponent() {
 *   const effectAPI = useEffectAPI();
 *
 *   useEffect(() => {
 *     const subscription = effectAPI.actions$.subscribe(console.log);
 *
 *     return () => subscription.unsubscribe();
 *   }, [effectAPI]);
 *
 *   return null;
 * }
 *
 * @public
 */
export function useEffectAPI<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>() {
  return useContext(EffectAPIContext).demand() as EffectAPI;
}

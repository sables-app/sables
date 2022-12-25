import { useEffect } from "react";

import { useEffectAPI } from "../EffectAPIContext.js";
import { DefaultEffectAPI, ObservableCreator } from "../types.js";

/**
 * A React hook that creates and subscribes to an observable using the given observable creator.
 *
 * @remarks
 *
 * The hook subscribes to the observable when the component mounts,
 * and unsubscribes from the observable when the component is unmounted.
 *
 * @example
 *
 *
 * const actionLogger = createObservable(({ actions$ }) => {
 *   return actions$.pipe(tap(console.log));
 * });
 *
 * function MyComponent() {
 *   useObservable(actionLogger);
 *
 *   return null;
 * }
 *
 * @public
 */
export function useObservable<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(observableCreator: ObservableCreator<EffectAPI>) {
  const effectAPI = useEffectAPI<EffectAPI>();

  useEffect(() => {
    const subscription = observableCreator(effectAPI).subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [observableCreator, effectAPI]);
}

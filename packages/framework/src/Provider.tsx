import {
  DefaultEffectAPI,
  EffectAPIProvider,
  SYMBOL_MANAGER_EFFECT_API,
} from "@sables/core";
import { Routes } from "@sables/router";

import { ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";

import { useConfigureManager } from "./hooks/mod.js";
import {
  createManager,
  CreateManagerOptions,
  defineConfigureManager,
} from "./main.js";
import type { ConfigureManagerFn } from "./types.js";

type PropsWithConfigureManager = {
  children: ReactNode;
  /**
   * A function that configures a new `Manager` instance for use in the application.
   *
   * @see {ConfigureManagerFn}
   */
  configureManager?: ConfigureManagerFn;
};

type PropsWithInitialRoutes = Required<
  Pick<CreateManagerOptions, "initialRoutes">
> & {
  children: ReactNode;
};

type ProviderProps = PropsWithConfigureManager | PropsWithInitialRoutes;

function isPropsWithConfigureManager(
  props: ProviderProps
): props is PropsWithConfigureManager {
  return "configureManager" in props;
}

function initialRoutesToConfigureManager<R extends Routes<DefaultEffectAPI>>(
  initialRoutes: R
): ConfigureManagerFn {
  return defineConfigureManager(({ initialLocation }) => {
    return createManager({ initialLocation, initialRoutes });
  });
}

/**
 * The top-level context provider for Sables.
 *
 * @remarks
 *
 * This provider also includes `react-redux`'s `Provider` to provide the
 * Redux store to the application.
 *
 * @example
 *
 * function MyComponent() {
 *   useObservable(({ actions$ }) =>
 *     // Log every dispatched action
 *     actions$.pipe(tap(console.log))
 *   );
 *
 *   return <h1>Welcome to Sables!</h1>;
 * }
 *
 * function App() {
 *   return (
 *     <Provider>
 *       <MyComponent />
 *     </Provider>
 *   );
 * }
 *
 * @public
 */
export function Provider(props: ProviderProps) {
  const configureManager = isPropsWithConfigureManager(props)
    ? props.configureManager
    : initialRoutesToConfigureManager(props.initialRoutes);
  const manager = useConfigureManager(configureManager);

  return (
    <EffectAPIProvider effectAPI={manager[SYMBOL_MANAGER_EFFECT_API].current}>
      <ReduxProvider store={manager.store}>{props.children}</ReduxProvider>
    </EffectAPIProvider>
  );
}

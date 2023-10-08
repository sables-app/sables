import {
  ConfigureManagerFn,
  Provider as FrameworkProvider,
  Manager,
  useConfigureManager,
  useServerRequestStateRef,
} from "@sables/framework";
import { isSSREnv } from "@sables/framework/utils";

import { ReactNode, Suspense, useCallback } from "react";

import { transitionToRoute } from "./transitionToRoute.js";

interface ProviderProps {
  children: ReactNode;
  configureManager?: ConfigureManagerFn<Manager<any, any>>;
}

function ProviderInner({ children, configureManager }: ProviderProps) {
  const serverRequestStateRef = useServerRequestStateRef();
  const manager = useConfigureManager(configureManager);
  const getManager = useCallback(() => manager, [manager]);

  if (
    isSSREnv() &&
    // We're explicitly checking whether the SSR context exists,
    // because it may not available in some environments,
    // even if the SSR flag is true; e.g. during automated testing.
    serverRequestStateRef.current &&
    serverRequestStateRef.current.routeTransitionStarted === false
  ) {
    serverRequestStateRef.current.routeTransitionStarted = true;
    // Throw promise to trigger `React.Suspense`.
    throw transitionToRoute(serverRequestStateRef, manager);
  }

  return (
    <FrameworkProvider configureManager={getManager}>
      {children}
    </FrameworkProvider>
  );
}

/**
 *
 * @param props
 * @returns
 */
export function Provider(props: ProviderProps) {
  return (
    <Suspense>
      <ProviderInner {...props} />
    </Suspense>
  );
}

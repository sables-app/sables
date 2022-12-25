import {
  DynamicImportFn,
  useRegisterDynamicImport,
} from "@sables/framework/router";

import { ComponentProps, ComponentType, lazy as reactLazy } from "react";

type ComponentDynamicImportFn<T extends React.ComponentType<any>> =
  DynamicImportFn<{ default: T }>;

/**
 * An enhanced version of `React.lazy()` that enables
 * module preloading during server-side rendering.
 *
 * @see {@link https://reactjs.org/docs/code-splitting.html#reactlazy `React.lazy()` documentation.}
 *
 * @public
 */
export function lazy<T extends ComponentType<any>>(
  importer: ComponentDynamicImportFn<T>
): T {
  const LazyComponent = reactLazy(importer);

  const SSRComponent = function SSRComponent(props: ComponentProps<T>) {
    useRegisterDynamicImport(importer);

    return <LazyComponent {...props} />;
  } as T;

  SSRComponent.displayName = `LazySSRComponent`;

  return SSRComponent;
}

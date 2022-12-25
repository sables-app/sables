import { useEffectAPI } from "@sables/core";

import { MouseEventHandler, useCallback, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";

import { useRoutesCollection } from "./StoreEnhancer.js";
import type { BuildHrefParams, DynamicImportFn, RouteLink } from "./types.js";
import { createDynamicImportRegistrar } from "./utils.js";

/**
 * A React hook that returns an object for integrating a route with components.
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("profile", "/profile/:handle");
 *
 * function MyComponent() {
 *   const { ensureLocation } = useLink(routes.Profile, {
 *     handle: "@ash.ketchum",
 *   });
 *
 *   return (
 *     <button type="button" onClick={ensureLocation}>
 *       This link will cause the page to reload.
 *     </button>
 *   );
 * }
 *
 * @see {RouteLink}
 *
 * @public
 */
export function useLink(...buildHrefArgs: BuildHrefParams): RouteLink {
  const [id, params, opts] = buildHrefArgs;
  const dispatch = useDispatch();
  const routesCollection = useRoutesCollection();

  return useMemo(
    () => routesCollection.buildLink(dispatch, [id, params, opts]),
    [id, params, opts, dispatch, routesCollection]
  );
}

/**
 * A React hook that returns props for integrating a route with components
 * that render an anchor element.
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("profile", "/profile/:handle");
 *
 * function MyComponent(props: { onClick?: MouseEventHandler }) {
 *   const { props } = useLinkProps(props.onClick, routes.Profile, {
 *     handle: "@ash.ketchum"
 *   });
 *
 *   return <a {...props}>This link will cause a route transition.</a>;
 * }
 *
 * @see {RouteLink}
 *
 * @public
 */
export function useLinkProps(
  onClick?: MouseEventHandler<HTMLAnchorElement>,
  ...args: BuildHrefParams
) {
  const { href, ensureLocation } = useLink(...args);
  const handleClick = useCallback<MouseEventHandler<HTMLAnchorElement>>(
    (event) => {
      onClick?.(event);

      if (
        // It this behavior was prevented
        event.defaultPrevented ||
        // If the end-user is opening a new tab
        event.ctrlKey ||
        // If the end-user is opening a new window
        event.shiftKey ||
        // If a mouse button other than the
        // main left mouse button was clicked.
        event.button !== 0
      ) {
        // Do nothing, and let the default browser behavior do its thing
        return;
      }

      // Prevent browser from refreshing the window
      event.preventDefault();
      ensureLocation();
    },
    [ensureLocation, onClick]
  );

  return useMemo(
    () => ({
      handleClick,
      href,
      props: {
        href: href,
        onClick: handleClick,
      },
    }),
    [href, handleClick]
  );
}

/** @internal */
export function useRegisterDynamicImport(importer: DynamicImportFn) {
  const effectAPI = useEffectAPI();
  const isRegisteredRef = useRef(false);

  if (!isRegisteredRef.current) {
    isRegisteredRef.current = true;
    createDynamicImportRegistrar(effectAPI)(importer);
  }
}

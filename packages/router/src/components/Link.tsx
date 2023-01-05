import { ComponentProps, ComponentType, useMemo } from "react";

import { useLinkProps } from "../hooks.js";
import { AnyRouteReference, RouteReferenceParams } from "../Routes.js";
import { PartialHistoryPathStrict } from "../types.js";

/**
 * This song & dance is necessary for `void` JSX props to be
 * considered optional.
 *
 * @internal
 */
type LinkPropParams<Route extends AnyRouteReference> =
  RouteReferenceParams<Route> extends Record<string, unknown>
    ? {
        /**
         * A literal object of route parameter values used
         * to build the hyperlink.
         *
         * @public
         */
        params: RouteReferenceParams<Route>;
      }
    : {
        params?: Record<string, unknown>;
      };

/** @internal */
type LinkProps<Route extends AnyRouteReference> = Omit<
  ComponentProps<"a">,
  "href"
> &
  LinkPropParams<Route> & {
    /**
     * The presenter component used for rendering.
     *
     * @defaultValue `"a"`
     *
     * @public
     */
    as?: ComponentType<ComponentProps<"a">>;
    /**
     * A hash to append to the built hyperlink.
     *
     * @public
     */
    hash?: `#${string}`;
    /**
     * A route reference to link to.
     *
     * @public
     */
    route: Route;
  };

/**
 * A React component that renders an anchor component that navigates to given route when clicked.
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("profile", "/profiles/:handle");
 *
 * <Link route={routes.Root}>Home</Link>;
 *
 * <Link route={routes.Profile} params={{ handle: "@ash.ketchum" }}>
 *   View Ash Ketchum's profile.
 * </Link>;
 *
 * @public
 */
export function Link<Route extends AnyRouteReference>({
  as,
  children,
  hash,
  onClick,
  params,
  route,
  ...componentProps
}: LinkProps<Route>) {
  const Component = as || "a";
  const historyPath = useMemo(
    (): PartialHistoryPathStrict => ({ pathname: route.build(params), hash }),
    [hash, params, route]
  );
  const { href, handleClick } = useLinkProps(onClick, historyPath);

  return (
    <Component href={href} onClick={handleClick} {...componentProps}>
      {children}
    </Component>
  );
}

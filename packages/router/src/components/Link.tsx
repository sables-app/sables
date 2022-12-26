import { ComponentProps, ComponentType, useMemo } from "react";

import { useLinkProps } from "../hooks.js";
import { AnyRouteReference } from "../Routes.js";
import { PartialHistoryPathStrict, RouteParams } from "../types.js";

/** @internal */
type LinkProps = Omit<ComponentProps<"a">, "href"> & {
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
   * A literal object of route parameter values used
   * to build the hyperlink.
   *
   * @public
   */
  params?: RouteParams;
  /**
   * A route reference to link to.
   *
   * @public
   */
  route: AnyRouteReference;
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
export function Link({
  as,
  children,
  hash,
  onClick,
  params,
  route,
  ...componentProps
}: LinkProps) {
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

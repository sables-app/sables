import { useSelector } from "@sables/core";

import {
  Children,
  ComponentProps,
  isValidElement,
  ReactElement,
  ReactNode,
  useMemo,
} from "react";

import { AnyRouteReference } from "../Routes.js";
import { selectCurrentRoute } from "../selectors.js";

function getRouteProps(
  node: ReactNode
): ComponentProps<typeof Route> | undefined {
  if (isValidElement(node) && node.type === Route) {
    return node.props;
  }
}

/**
 * A React component that provides a JSX interface for rendering content
 * based on the current route.
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("profile", "/profiles/:handle");
 *
 * <Router>
 *   <Router.Route route={routes.Root}>
 *     Rendered for the Root route.
 *   </Router.Route>
 *   <Router.Route route={routes.Profile}>
 *     Rendered for the Profile route.
 *   </Router.Route>
 * </Router>;
 *
 * @public
 */
export function Router({ children }: { children: ReactNode }) {
  const route = useSelector(selectCurrentRoute);

  return useMemo(() => {
    const nodes = Children.toArray(children);

    let fallback: ReactElement | undefined;

    for (const node of nodes) {
      const routeProps = getRouteProps(node);

      if (!routeProps) {
        continue;
      } else if (!routeProps.route) {
        fallback = <>{routeProps.children}</>;
      } else if (routeProps.route.id === route?.id) {
        return <>{routeProps.children}</>;
      }
    }

    return fallback || <></>;
  }, [route, children]);
}

/**
 * @see {Router}
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Route(_props: { route?: AnyRouteReference; children: ReactNode }) {
  // This component is a facade used by the `Router` component.
  return null;
}

Router.Route = Route;

/**
 * A React component that renders its children
 * based on the current route.
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("profile", "/profiles/:handle");
 *
 * <RouteGate route={routes.Profile}>
 *   Rendered only for the Profile route.
 * </RouteGate>;
 *
 * <RouteGate not route={routes.Root}>
 *   Rendered for any location that doesn't match the Root route.
 * </RouteGate>;
 *
 * @public
 */
export function RouteGate({
  children,
  not,
  route,
}: {
  children: ReactNode;
  not?: boolean;
  route: AnyRouteReference;
}) {
  const routeMatches = useSelector(selectCurrentRoute)?.id === route.id;

  return !!not !== routeMatches ? <>{children}</> : null;
}

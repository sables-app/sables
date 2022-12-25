import { createSelector } from "@sables/core";
import { createMutableRef } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import {
  ComponentType,
  lazy as reactLazy,
  memo,
  ReactElement,
  ReactNode,
  Suspense,
} from "react";
import { useSelector, useStore } from "react-redux";

import type { AnyRouteReference } from "../Routes.js";
import { selectCurrentRoute } from "../selectors.js";
import type { CombinedRouterState } from "../types.js";

type ComponentWithoutProps = ComponentType<Record<string, never>>;
type ComponentImporter<T = ComponentWithoutProps> = () => Promise<{
  default: T;
}>;
type BooleanSelector<StoreState extends CombinedRouterState> =
  ReduxToolkit.Selector<StoreState, boolean>;

/** @internal */
export type RouteSwitchComponent = (
  props: Record<string, never>
) => ReactElement;

export type RouteSwitch<StoreState extends CombinedRouterState> =
  RouteSwitchComponent & {
    case<R extends AnyRouteReference | BooleanSelector<StoreState>>(
      route: R,
      component: ReactElement | ComponentImporter
    ): RouteSwitch<StoreState>;
    default(component: ReactElement | ComponentImporter): RouteSwitchComponent;
  };

export interface RouteSwitchConfig {
  fallback?: ReactNode;
  suspense: boolean;
}

const DEFAULT_OPTIONS: RouteSwitchConfig = { suspense: true };

type LazyFn<T extends ComponentType<any>> = (
  importer: ComponentImporter<T>
) => T;

/** @internal */
export function createRouteSwitchCreator(lazy: LazyFn<any>) {
  return function routeSwitchCreator<
    StoreState extends CombinedRouterState = CombinedRouterState
  >(options?: Partial<RouteSwitchConfig>): RouteSwitch<StoreState> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const shouldUseSuspense = config.suspense;
    /**
     * React Elements to reducer by their selectors
     * which determine whether they should be displayed.
     */
    const elementsBySelector = new Map<
      BooleanSelector<StoreState>,
      ReactElement
    >();

    const subscriptionSelector = createMutableRef<
      ReduxToolkit.Selector<StoreState, boolean[]>
    >(undefined, () => []);

    function resolveElement(
      element: ReactElement | ComponentImporter
    ): ReactElement {
      if (typeof element == "object") {
        return element;
      }

      const Component = lazy(element);

      return <Component />;
    }

    function resolveSelector<
      StoreState extends CombinedRouterState = CombinedRouterState
    >(route: AnyRouteReference | BooleanSelector<StoreState>) {
      if (typeof route == "function") {
        return route;
      }
      return createSelector(
        selectCurrentRoute,
        (currentRoute) => currentRoute?.id === route.id
      );
    }

    function updateSubscriptionSelector() {
      subscriptionSelector.current = createSelector(
        [...elementsBySelector.keys()],
        (...selections) => selections
      );
    }

    function findElementToRender(state: StoreState) {
      const entries = [...elementsBySelector.entries()];
      const [, elementToRender] =
        entries.find(([selector]) => selector(state)) || [];

      return elementToRender;
    }

    const routeSwitch = Object.assign(
      memo(function RouteSwitchComponent(): ReactElement {
        useSelector(subscriptionSelector.demand());

        const element = findElementToRender(useStore<StoreState>().getState());

        if (shouldUseSuspense) {
          return <Suspense fallback={config.fallback}>{element}</Suspense>;
        }

        return <>{element}</>;
      }),
      {
        case(
          routeOrSelector: AnyRouteReference | BooleanSelector<StoreState>,
          elementOrComponent: ReactElement | ComponentImporter
        ) {
          elementsBySelector.set(
            resolveSelector(routeOrSelector),
            resolveElement(elementOrComponent)
          );
          updateSubscriptionSelector();

          return this as RouteSwitch<StoreState>;
        },
        default(elementOrComponent: ReactElement | ComponentImporter) {
          elementsBySelector.set(
            () => true,
            resolveElement(elementOrComponent)
          );
          updateSubscriptionSelector();

          return this as unknown as RouteSwitchComponent;
        },
      }
    );

    return routeSwitch as RouteSwitch<StoreState>;
  };
}

/**
 * Creates a React component that renders content based on the current route.
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("home", "/")
 *   .set("about", "/about-us");
 *
 * const ScreenSwitch = createRouteSwitch()
 *   .case(routes.Home, <h1>Welcome!</h1>)
 *   // Lazy-load a component with `React.lazy` and `React.Suspense`
 *   .case(routes.About, () => import("./AboutScreen.js"))
 *   .default(<h1>Not Found</h1>);
 *
 * @public
 */
export const createRouteSwitch = createRouteSwitchCreator(reactLazy);

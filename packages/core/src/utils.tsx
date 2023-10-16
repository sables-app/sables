import { createMutableRef, MutableReferenceObjectValue } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import type { ComponentProps, ElementType, FunctionComponent } from "react";
import type * as Redux from "redux";

import {
  LIFECYCLE_REF_MESSAGE,
  ROUTES_COLLECTION_REF_MESSAGE,
  SYMBOL_EFFECT_API_LIFECYCLE,
  SYMBOL_EFFECT_API_ROUTES,
  SYMBOL_LAZY_META,
  SYMBOL_LAZY_SELECTOR,
} from "./constants.js";
import { ActionSubject } from "./main.js";
import type {
  AnyLazySelector,
  DefaultEffectAPI,
  LazyMeta,
  ObjectWithLazyMeta,
} from "./types.js";

/** @internal */
export function hasLazyMeta<T extends object>(
  value: T,
): value is T & ObjectWithLazyMeta {
  return Object.hasOwn(value, SYMBOL_LAZY_META);
}

/** @internal */
export function createLazyMeta(): LazyMeta {
  return {
    observers: new Set(),
    slices: new Set(),
  };
}

/** @internal */
export function isEnhancedSelector(value: unknown): value is AnyLazySelector {
  return (
    typeof value == "function" && Object.hasOwn(value, SYMBOL_LAZY_SELECTOR)
  );
}

/** @internal */
export function getSlicesFromSelector(
  selector: ReduxToolkit.Selector,
): ReduxToolkit.Slice[] {
  return isEnhancedSelector(selector)
    ? [...selector[SYMBOL_LAZY_META].slices]
    : [];
}

type LifecycleRef<
  StoreState extends Record<string, unknown> = Record<string, unknown>,
> = DefaultEffectAPI<StoreState>[typeof SYMBOL_EFFECT_API_LIFECYCLE];

type RoutesCollectionRef<
  StoreState extends Record<string, unknown> = Record<string, unknown>,
> = DefaultEffectAPI<StoreState>[typeof SYMBOL_EFFECT_API_ROUTES];

/** @internal */
export function createEffectAPIDefaults<
  StoreState extends Record<string, unknown> = Record<string, unknown>,
>({
  actions$,
  dispatch,
  getState,
  lifecycleRef,
  routesCollectionRef,
}: {
  actions$?: ActionSubject;
  dispatch: ReduxToolkit.Dispatch;
  getState: Redux.Store<StoreState>["getState"];
  lifecycleRef?: LifecycleRef<StoreState>;
  routesCollectionRef?: RoutesCollectionRef<StoreState>;
}): DefaultEffectAPI<StoreState> {
  return {
    actions$: actions$ || new ActionSubject(),
    dispatch,
    getState,
    [SYMBOL_EFFECT_API_LIFECYCLE]:
      lifecycleRef ||
      createMutableRef<MutableReferenceObjectValue<LifecycleRef>>(
        LIFECYCLE_REF_MESSAGE,
      ),
    [SYMBOL_EFFECT_API_ROUTES]:
      routesCollectionRef ||
      createMutableRef<MutableReferenceObjectValue<RoutesCollectionRef>>(
        ROUTES_COLLECTION_REF_MESSAGE,
      ),
  };
}

type WithPropsTransformHook<Props> = (props: Props) => Props;
type WithPropsInput<Props> = Props | WithPropsTransformHook<Props>;

/**
 * A higher-order component that assigns props to the given component.
 *
 * @see {@link https://sables.dev/api#withprops withProps documentation}
 *
 * @example
 *
 * const Link = withProps("a", { className: "link" });
 * const ButtonLink = withProps(Link, { role: "button" });
 * const A11yButtonLink = withProps(
 *   ButtonLink,
 *   (props) => ({ "aria-label": props.title })
 * );
 *
 * @public
 */
export function withProps<C extends ElementType>(
  Component: C,
  input: WithPropsInput<ComponentProps<C>>,
): FunctionComponent<ComponentProps<C>> {
  type Props = ComponentProps<C>;

  function isWithPropsTransformHook(
    value: WithPropsInput<Props>,
  ): value is WithPropsTransformHook<Props> {
    return typeof value == "function";
  }

  const useProps = isWithPropsTransformHook(input)
    ? input
    : (props: Props) => ({ ...input, ...props });

  function ComponentWithProps(props: Props) {
    return <Component {...useProps(props)} />;
  }

  const originalDisplayName =
    (typeof Component == "function" && Component.displayName) || "Component";

  ComponentWithProps.displayName = `withProps(${originalDisplayName})`;

  return ComponentWithProps;
}

import { MutableReferenceObject } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import type * as Redux from "redux";
import type * as RxJS from "rxjs";

import type {
  SYMBOL_EFFECT_API_EFFECT_STATE,
  SYMBOL_EFFECT_API_LIFECYCLE,
  SYMBOL_EFFECT_API_ROUTES,
  SYMBOL_LAZY_META,
  SYMBOL_LAZY_SELECTOR,
  SYMBOL_ROUTES_COLLECTION_INSTANCE,
} from "./constants.js";

/* --- Action --- */

/**
 * The meta object of a Flux Standard Action.
 *
 * @public
 */
export type ActionMeta = Record<string | symbol, any>;

/**
 * A Flux Standard Action.
 *
 * @public
 */
export interface PayloadAction<Payload = void, Type extends string = string> {
  error?: boolean;
  meta?: ActionMeta;
  payload: Payload;
  type: Type;
}

/**
 * A Flux Standard Action with extra properties.
 *
 * @public
 */
export interface StandardAction<Type extends string, Payload = any> {
  error?: boolean;
  meta?: ActionMeta;
  payload: Payload;
  type: Type;
  [extraProps: string]: any;
}

/** @internal */
export interface BasicActionCreator<
  T extends string,
  P extends [...params: any] = [],
  A extends StandardAction<T> = StandardAction<T>
> {
  (...params: P): A;
}

/** @internal */
export type DecoratedActionCreator<
  T extends string,
  AC extends BasicActionCreator<T>
> = AC & {
  match(action?: Redux.Action): action is ReturnType<AC>;
  toString(): T;
  readonly type: T;
};

/** @internal */
export type StandardActionCreator<
  Type extends string,
  Params extends [...params: any] = [],
  Action extends StandardAction<Type> = StandardAction<Type>
> = DecoratedActionCreator<Type, BasicActionCreator<Type, Params, Action>>;

/** @internal */
export type ActionDependency = ReduxToolkit.Slice | ObservableCreator<any>;

/** @internal */
export type EnhancedActionCreator<AC extends StandardActionCreator<string>> =
  AC &
    ObjectWithLazyMeta & {
      /**
       * Adds a dependency to the action creator.
       * When a created action is dispatched, its dependencies are included.
       *
       * - Slices are inserted before the action is given to the reducer.
       * - Observables are created and subscribed to before the action is emitted.
       *
       * @see {@link https://sables.dev/api#actiondependsupon Action.dependsUpon documentation}
       *
       * @public
       *
       * @returns Itself
       */
      dependsUpon: DependsUponFn<EnhancedActionCreator<AC>>;
    };

/** @internal */
export type EnhancedActionCreatorWithPayload<
  AC extends ReduxToolkit.ActionCreatorWithPayload<any>
> = EnhancedActionCreator<
  StandardActionCreator<ReturnType<AC>["type"], Parameters<AC>, ReturnType<AC>>
>;

/**
 * An action creator that accepts multiple parameters.
 * Creates actions that adhere to Flux Standard Action.
 *
 * @public
 */
export type ActionCreator<
  Type extends string = string,
  Params extends [...params: any] = unknown[],
  Action extends StandardAction<Type> = StandardAction<Type>
> = EnhancedActionCreator<StandardActionCreator<Type, Params, Action>>;

/**
 * An action creator that accepts a single payload parameter.
 * Creates actions that adhere to Flux Standard Action.
 *
 * @public
 */
export type PayloadActionCreator<
  Payload = void,
  Type extends string = string,
  Action extends StandardAction<Type, Payload> = StandardAction<Type, Payload>
> = EnhancedActionCreator<
  StandardActionCreator<Type, Payload extends void ? [] : [Payload], Action>
>;

type StartTypeValue<Type extends string = string> = `${Type}/start`;
type EndTypeValue<Type extends string = string> = `${Type}/end`;

/**
 * An action creator representing the start of a side effect.
 *
 * @public */
export type StartAction<
  Payload = void,
  Type extends string = string
> = StandardAction<StartTypeValue<Type>, Payload>;

/**
 * An action creator representing the end of a side effect.
 *
 * @public */
export type EndAction<
  Payload = void,
  Type extends string = string
> = StandardAction<EndTypeValue<Type>, Payload>;

/** @internal */
type DependsUponFn<T> = (...dependencies: ActionDependency[]) => T;

/** @public */
export type SideEffectActions<
  StartPayload = void,
  EndPayload = void,
  Type extends string = string
> = {
  /**
   * Adds a dependency to the action.
   * When the action is dispatched, the dependencies are included.
   *
   * @see {@link https://sables.dev/api#actiondependsupon Action.dependsUpon documentation}
   *
   * @public
   *
   * @returns Itself
   */
  dependsUpon: DependsUponFn<SideEffectActions<StartPayload, EndPayload, Type>>;
  end: ActionCreator<
    EndTypeValue<Type>,
    [EndPayload, StartAction<StartPayload, Type> | void],
    EndAction<EndPayload, Type>
  >;
  getStartAction(
    endAction: EndAction<EndPayload, Type>
  ): StartAction<StartPayload, Type> | undefined;
  hasAffiliation(
    startAction: Redux.AnyAction,
    endAction: Redux.AnyAction
  ): boolean;
  match(
    action?: Redux.Action
  ): action is StartAction<StartPayload, Type> | EndAction<EndPayload, Type>;
  start: ActionCreator<
    StartTypeValue<Type>,
    [StartPayload],
    StartAction<StartPayload, Type>
  >;
  toString: () => Type;
  type: Type;
};

/** @internal */
export type StartPayloadFromSideEffectActions<
  T extends SideEffectActions<any, any, any>
> = T extends SideEffectActions<infer P, any, any> ? P : never;

/** @internal */
export type EndPayloadFromSideEffectActions<
  T extends SideEffectActions<any, any, any>
> = T extends SideEffectActions<any, infer P, any> ? P : never;

/* --- Slice --- */

type SliceState<T> = T extends ReduxToolkit.Slice<infer State, any, string>
  ? State
  : never;
/** @internal */
export type SliceName<S extends ReduxToolkit.Slice> = S["name"];
/** @internal */
export type LazySliceStoreState<S extends ReduxToolkit.Slice> = {
  [P in SliceName<S>]: SliceState<S>;
} & {
  [key: string]: any;
};
/** @internal */
export type LazySliceSelectorName<S extends ReduxToolkit.Slice> =
  `select${Capitalize<S["name"]>}State`;

/** @internal */
export type BaseSliceLazySelector<S extends ReduxToolkit.Slice> =
  ReduxToolkit.Selector<LazySliceStoreState<S>, SliceState<S>>;
/**
 * An object that carries dependencies
 * @internal
 */
export type ObjectWithLazyMeta = {
  [SYMBOL_LAZY_META]: LazyMeta;
};
/** @internal */
export type LazySelectorProperties = ObjectWithLazyMeta & {
  [SYMBOL_LAZY_SELECTOR]: undefined;
};
/** @internal */
export type SliceLazySelector<S extends ReduxToolkit.Slice> =
  BaseSliceLazySelector<S> & LazySelectorProperties;
/** @internal */
export type AnyLazySelector = ReduxToolkit.Selector<any, any> &
  LazySelectorProperties;
/** @internal */
type EnhancedSliceActions<S extends ReduxToolkit.Slice = ReduxToolkit.Slice> = {
  [K in keyof S["actions"]]: EnhancedActionCreatorWithPayload<S["actions"][K]>;
};

/** @internal */
export type EnhancedSlice<S extends ReduxToolkit.Slice = ReduxToolkit.Slice> =
  Omit<S, "actions"> &
    Record<LazySliceSelectorName<S>, SliceLazySelector<S>> & {
      actions: EnhancedSliceActions<S>;
      /**
       * A reselect selector that retrieves the state of its slice.
       * The selector is exposed on both the `selector` property, and a property based on the slice's `name`.
       * For example, if the slice's name is `"books"`, the named selector will be called `selectBooksState`.
       *
       * @see {@link https://sables.dev/api#sliceselector Slice.selector}
       *
       * @public
       */
      selector: SliceLazySelector<S>;
    };
/**
 * An enhanced Redux Toolkit Slice.
 *
 * @see {@link https://sables.dev/api#createslice createSlice documentation}
 *
 * @public
 */
export type Slice<
  State = any,
  CaseReducers extends ReduxToolkit.SliceCaseReducers<State> = ReduxToolkit.SliceCaseReducers<State>,
  Name extends string = string
> = EnhancedSlice<ReduxToolkit.Slice<State, CaseReducers, Name>>;
/** @internal */
export type AnySlice = ReduxToolkit.Slice<any, any, any>;
/** @internal */
export type LazyMeta = {
  observers: Set<ObservableCreator>;
  slices: Set<ReduxToolkit.Slice>;
};

/* --- Base --- */

/** @internal */
export type RouteEffectsState = Map<symbol, unknown>;
/** @internal */
export type RouteCollectionRefValue = {
  [SYMBOL_ROUTES_COLLECTION_INSTANCE]: undefined;
};
/** @internal */
export type DefaultEffectAPI<StoreState extends Record<string, unknown> = any> =
  {
    /**
     * An observable that asynchronously emits dispatched actions.
     *
     * @see {@link https://rxjs.dev/}
     *
     * @public
     */
    actions$: RxJS.Observable<Redux.AnyAction>;
    /**
     * A Redux `dispatch` function.
     *
     * @see {@link https://redux.js.org/tutorials/fundamentals/part-2-concepts-data-flow#dispatch}
     *
     * @public
     */
    dispatch: Redux.Dispatch;
    /**
     * A Redux `getState` function.
     *      *
     * @see {@link https://redux.js.org/tutorials/fundamentals/part-2-concepts-data-flow#store}
     *
     * @public
     */
    getState: Redux.Store<StoreState>["getState"];
    /**
     * Reserved for a `LifecycleRef` instance
     * @internal
     */
    [SYMBOL_EFFECT_API_LIFECYCLE]: MutableReferenceObject<{
      serverRequestStateRef: MutableReferenceObject<{
        invokedImporters: Set<string>;
      }>;
    }>;
    /**
     * Reserved for a `RouteCollection` instance.
     * @internal
     */
    [SYMBOL_EFFECT_API_ROUTES]: MutableReferenceObject<RouteCollectionRefValue>;
    /**
     * Used by observer React hooks.
     * @internal
     */
    [SYMBOL_EFFECT_API_EFFECT_STATE]?: RouteEffectsState;
  };

/**
 * Creates an observable using the given Effect API object.
 *
 * @public
 */
export type ObservableCreator<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
  T = unknown
> = (effectAPI: EffectAPI) => RxJS.Observable<T>;

/** @internal */
export type AnyObservableCreator = ObservableCreator<any>;

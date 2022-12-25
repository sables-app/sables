import { capitalize, demandValue } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";

import { createSliceReduxToolkit } from "../deps.js";
import { enhanceAction } from "./Action.js";
import { SYMBOL_LAZY_META, SYMBOL_LAZY_SELECTOR } from "./constants.js";
import type {
  AnySlice,
  BaseSliceLazySelector,
  EnhancedActionCreator,
  EnhancedSlice,
  LazySliceSelectorName,
  LazySliceStoreState,
  SliceLazySelector,
  SliceName,
  StandardActionCreator,
} from "./types.js";
import { createLazyMeta } from "./utils.js";

function createLazySliceSelectorName<S extends ReduxToolkit.Slice>(
  slice: S
): LazySliceSelectorName<S> {
  return `select${capitalize(slice.name)}State`;
}

function createLazySliceSelector<S extends ReduxToolkit.Slice>(
  enhancedSliceShell: Partial<EnhancedSlice<S>>
): SliceLazySelector<S> {
  const stateProperty: SliceName<S> = demandValue(enhancedSliceShell.name);
  const baseLazySelector: BaseSliceLazySelector<S> = function lazySelector(
    storeState?: LazySliceStoreState<S>
  ) {
    if (storeState === undefined || !Object.hasOwn(storeState, stateProperty)) {
      // The slice has not been added yet, so the initial state is used instead.
      return demandValue(enhancedSliceShell.getInitialState)();
    }

    return storeState[stateProperty];
  };

  const lazySelector: SliceLazySelector<S> = Object.assign(baseLazySelector, {
    [SYMBOL_LAZY_SELECTOR]: undefined,
    [SYMBOL_LAZY_META]: createLazyMeta(),
  });

  lazySelector[SYMBOL_LAZY_META].slices.add(
    enhancedSliceShell as unknown as ReduxToolkit.Slice
  );

  return lazySelector;
}

function enhanceSliceActions<S extends AnySlice>(
  actions: S["actions"],
  enhancedSliceShell: Partial<EnhancedSlice<S>>
): EnhancedSlice<S>["actions"] {
  type ActionCreatorEntries = Array<[string, StandardActionCreator<string>]>;
  type LazyActionCreatorEntries = Array<
    [string, EnhancedActionCreator<StandardActionCreator<string>>]
  >;
  const actionCreatorEntries = Object.entries(actions) as ActionCreatorEntries;
  const lazyActionCreatorEntries: LazyActionCreatorEntries =
    actionCreatorEntries.map(([name, actionCreator]) => {
      const nextActionCreator = enhanceAction(actionCreator);

      nextActionCreator[SYMBOL_LAZY_META].slices.add(
        enhancedSliceShell as ReduxToolkit.Slice
      );

      return [name, nextActionCreator];
    });
  const nextActions = Object.fromEntries(lazyActionCreatorEntries);

  return nextActions as any;
}

/**
 * Enhances the given slice by adding a named selector,
 * and actions that can be set as a slice dependent.
 *
 * @example
 *
 * const dogsSliceBasic = ReduxToolkit.createSlice({
 *   name: "dogs",
 *   initialState: {},
 *   reducers: {},
 * });
 *
 * const dogsSlice = enhanceSlice(dogsSliceBasic);
 *
 * dogsSlice.selector(store.getState());
 * dogsSlice.selectDogsState(store.getState());
 *
 * @public
 */
export function enhanceSlice<S extends ReduxToolkit.Slice>(
  slice: S
): EnhancedSlice<S> {
  const selectorName = createLazySliceSelectorName(slice);

  function isEnhancedSlice(
    value: ReduxToolkit.Slice | EnhancedSlice<S>
  ): value is EnhancedSlice<S> {
    return Object.hasOwn(value, selectorName);
  }

  if (isEnhancedSlice(slice)) return slice;

  const { actions, ...otherSliceProps } = slice;
  /**
   * A plain object that will be mutated to become the enhanced slice.
   * This object should be referenced as the returned enhanced slice.
   */
  const enhancedSliceShell = otherSliceProps as Partial<EnhancedSlice<S>>;
  const lazySelector = createLazySliceSelector(enhancedSliceShell);
  const enhancedActions = enhanceSliceActions(actions, enhancedSliceShell);

  return Object.assign(enhancedSliceShell, {
    ...otherSliceProps,
    [selectorName]: lazySelector,
    actions: enhancedActions,
    selector: lazySelector,
  }) as EnhancedSlice<S>;
}

/**
 * An enhanced version of Redux Toolkit's `createSlice`.
 *
 * @see {@link https://sables.dev/api#createslice `createSlice` documentation}
 * @see {@link https://redux-toolkit.js.org/api/createslice `ReduxToolkit.createSlice` documentation}
 * @see {@link enhanceSlice}
 *
 * @public
 */
export function createSlice<
  State,
  CaseReducers extends ReduxToolkit.SliceCaseReducers<State>,
  Name extends string = string
>(options: ReduxToolkit.CreateSliceOptions<State, CaseReducers, Name>) {
  return enhanceSlice(createSliceReduxToolkit(options));
}

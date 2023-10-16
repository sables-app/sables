import type * as Reselect from "reselect";

import { createSelectorReduxToolkit } from "../deps.js";
import { SYMBOL_LAZY_META, SYMBOL_LAZY_SELECTOR } from "./constants.js";
import { AnyLazySelector } from "./types.js";
import {
  createLazyMeta,
  getSlicesFromSelector,
  isEnhancedSelector,
} from "./utils.js";

/**
 * An enhanced version of Reselect's `createSelector` function that
 * creates selectors with slice dependencies.
 *
 * When selectors with slice dependencies are used with Sables' `useSelector`,
 * associated slices will automatically be inserted into the store.
 *
 * @example
 *
 * const booksSlice = createSlice("books", {
 *   books: [],
 * }).setReducer((builder) => builder);
 *
 * const selectBooks = createSelector(
 *   booksSlice.selector,
 *   ({ books }) => books
 * );
 *
 * @public
 */
export const createSelector: Reselect.CreateSelectorFunction<
  (...args: unknown[]) => unknown,
  typeof Reselect.defaultMemoize,
  [
    equalityCheckOrOptions?:
      | Reselect.EqualityFn
      | Reselect.DefaultMemoizeOptions
      | undefined,
  ],
  {
    clearCache: () => void;
  }
> = function createSelector(...args: [any, any, ...any[]]) {
  const lazyMeta = args
    .filter(isEnhancedSelector)
    .reduce((lazyMeta, lazySelector) => {
      const slices = getSlicesFromSelector(lazySelector);

      for (const slice of slices) {
        lazyMeta.slices.add(slice);
      }

      return lazyMeta;
    }, createLazyMeta());

  const baseSelector = createSelectorReduxToolkit(...args);

  const lazySelector: AnyLazySelector = Object.assign(baseSelector, {
    [SYMBOL_LAZY_META]: lazyMeta,
    [SYMBOL_LAZY_SELECTOR]: undefined,
  });

  return lazySelector;
} as any;

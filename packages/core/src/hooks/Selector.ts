import { useRef } from "react";
import type * as ReactRedux from "react-redux";
import { useSelector as useBaseSelector, useStore } from "react-redux";

import { isLazySlicesEnhancedStore } from "../middleware/mod.js";
import { getSlicesFromSelector } from "../utils.js";

/**
 * An enhanced version of `useSelector` from react-redux that
 * asynchronously inserts slices from selector dependencies.
 *
 * @remarks
 *
 * **This method is optional.**
 *
 * When slices are properly set as dependencies of actions,
 * the usage of this hook isn't necessary. However, using this
 * hook will help cover developer mistakes when a slice isn't
 * set as dependency by accident.
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
 * function MyComponent() {
 *   // `booksSlice` is asynchronously inserted
 *   const books = useSelector(selectBooks);
 *
 *   return null;
 * }
 *
 * @see {@link https://sables.dev/api#useselector}
 * @see {@link https://react-redux.js.org/api/hooks#useselector}
 *
 * @public
 */
export function useSelector<StoreState = unknown, Selected = unknown>(
  selector: (state: StoreState) => Selected,
  equalityFn?: ReactRedux.EqualityFn<Selected> | undefined
): Selected {
  const hasAddedSlicesRef = useRef(false);
  const store = useStore();

  if (!hasAddedSlicesRef.current && isLazySlicesEnhancedStore(store)) {
    store.insertSlices(...getSlicesFromSelector(selector));
    hasAddedSlicesRef.current = true;
  }

  return useBaseSelector(selector, equalityFn);
}

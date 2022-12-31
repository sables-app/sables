import {
  createMutableRef,
  isDevEnv,
  isTestEnv,
  MutableReferenceObject,
} from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import type * as Redux from "redux";
import { combineReducers } from "redux";
import type * as RxJS from "rxjs";
import { merge } from "rxjs";

import { SYMBOL_LAZY_META } from "../constants.js";
import {
  DefaultEffectAPI,
  ObjectWithLazyMeta,
  ObservableCreator,
} from "../types.js";
import { hasLazyMeta } from "../utils.js";

/**
 * Modes for the `insertSlices` function.
 */
const insertSlicesModes = {
  /**
   * Queues a microtask to add the slices.
   */
  ASYNC: "ASYNC",
  /**
   * Synchronously adds slices to the store.
   */
  SYNC: "SYNC",
} as const;

type InsertSlicesMode =
  typeof insertSlicesModes[keyof typeof insertSlicesModes];

/** @internal */
export type SubscribeToFn<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
> = (
  ...observableCreators: ObservableCreator<EffectAPI>[]
) => RxJS.Subscription;

/** @internal */
export type LazySlicesEnhancerExt<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
> = {
  /**
   * Asynchronously adds slices to the store.
   *
   * @remarks
   *
   * Instead of manually adding slices to the store, it's recommended
   * to add slices to action creators as dependencies, so they'll
   * automatically be inserted.
   *
   * @example
   *
   * const basicSlice = ReduxToolkit.createSlice({
   *   name: "basic",
   *   initialState: {},
   *   reducers: {},
   * });
   * const enhancedSlice = ReduxToolkit.createSlice(
   *   "enhanced",
   *   {}
   * ).setReducer((builder) => builder);
   *
   * manager.store.insertSlices(birdsSlice, enhancedSlice);
   *
   * @privateRemarks
   *
   * `insertSlices` waits for the next microtask
   * before inserting the slice. This avoids issues
   * where inserting a slice may result in component
   * state being updated before a React component is
   * finished rendering.
   *
   * @public
   */
  insertSlices(...slices: ReduxToolkit.Slice[]): Promise<void>;
  /**
   * @internal Use `manager.subscribeTo` instead.
   */
  subscribeTo(
    ...observableCreators: ObservableCreator<EffectAPI>[]
  ): RxJS.Subscription;
};

/** @internal */
export type LazySlicesEnhancedStore<
  StoreState extends Record<string, unknown> = Record<string, unknown>,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
> = ReduxToolkit.Store<StoreState> & LazySlicesEnhancerExt<EffectAPI>;

/** @internal */
export function isLazySlicesEnhancedStore(
  store: Redux.Store | LazySlicesEnhancedStore
): store is LazySlicesEnhancedStore {
  return Object.hasOwn(store, "insertSlices");
}

/** @internal */
export function createActionDependencyEnhancer<
  StoreState extends Record<string, unknown>,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>({
  effectAPIRef,
  reducersMap: reducersMapInput,
}: {
  effectAPIRef: MutableReferenceObject<EffectAPI>;
  reducersMap: Redux.ReducersMapObject<StoreState>;
}) {
  const reducersMap = { ...reducersMapInput };
  const replaceReducerRef = createMutableRef<Redux.Store["replaceReducer"]>();

  function updateStoreReducerSync() {
    const replaceReducer = replaceReducerRef.demand();
    const nextReducer = combineReducers<StoreState>(reducersMap);

    replaceReducer(nextReducer);
  }

  let isUpdatingReducer = false;

  async function updateStoreReducerAsync() {
    if (isUpdatingReducer) return;
    isUpdatingReducer = true;
    // Wait for the next microtask
    await Promise.resolve();
    updateStoreReducerSync();
    isUpdatingReducer = false;
  }

  function insertSlices(
    mode: InsertSlicesMode,
    slices: Iterable<ReduxToolkit.Slice>
  ) {
    const isDev = isDevEnv();
    const isTest = isTestEnv();

    let changed = false;

    for (const slice of slices) {
      const name: keyof StoreState & string = slice.name;

      if (!(name in reducersMap)) {
        reducersMap[name] = slice.reducer;
        changed = true;
        continue;
      }

      // This block is a runtime check for detecting duplicate slice names.
      {
        if (
          isDev &&
          // If the reducers don't match
          reducersMap[name] !== slice.reducer &&
          // vitest does some magic that may cause the reducers to be equivalent,
          // but not exactly the same. So, when were testing, only log the "duplicate slice"
          // error message if strict string comparison doesn't also work
          !(isTest && String(reducersMap[name]) === String(slice.reducer))
        ) {
          console.error(`Duplicate slice name detected: ${name}.`);
        }
      }
    }

    if (!changed) return;

    if (mode === insertSlicesModes.SYNC) {
      updateStoreReducerSync();
    } else {
      return updateStoreReducerAsync();
    }
  }

  async function insertSlicesFacade(...slices: ReduxToolkit.Slice[]) {
    // Slices should be inserted asynchronously when
    // they're not be inserted from a dispatched action.
    return insertSlices(insertSlicesModes.ASYNC, slices);
  }

  const addedObservableCreators = new Set<ObservableCreator<EffectAPI>>();

  function subscribeToObservables(
    ...observableCreators: ObservableCreator<EffectAPI>[]
  ): RxJS.Subscription {
    const observables = observableCreators
      .filter((creator) => !addedObservableCreators.has(creator))
      .map((creator) => {
        addedObservableCreators.add(creator);

        return creator(effectAPIRef.demand());
      });

    return merge(...observables).subscribe();
  }

  type ActionWithLazyMeta = Redux.AnyAction & { meta: ObjectWithLazyMeta };

  function actionHasLazyMeta(
    action: Redux.AnyAction
  ): action is ActionWithLazyMeta {
    return !!action.meta && hasLazyMeta(action.meta);
  }

  function insertDependenciesFromAction(action: Redux.AnyAction) {
    if (actionHasLazyMeta(action)) {
      const { observers, slices } = action.meta[SYMBOL_LAZY_META];
      if (slices.size) {
        insertSlices(
          // Slices must be added synchronously when dispatching actions
          insertSlicesModes.SYNC,
          slices
        );
      }
      if (observers.size) {
        subscribeToObservables(...observers);
      }
    }
  }

  const actionDependencyEnhancer: Redux.StoreEnhancer<
    LazySlicesEnhancerExt<EffectAPI>
  > = function actionDependencyEnhancer(createStore) {
    return (reducer, preloadedState) => {
      const store = createStore(reducer, preloadedState);

      replaceReducerRef.current = store.replaceReducer;

      const originalDispatch = store.dispatch;
      const dispatch: typeof originalDispatch = function dispatch(action) {
        insertDependenciesFromAction(action);

        return originalDispatch(action);
      };

      return {
        ...store,
        dispatch,
        insertSlices: insertSlicesFacade,
        subscribeTo: subscribeToObservables,
      };
    };
  };

  return {
    actionDependencyEnhancer,
    insertSlices: insertSlicesFacade,
    subscribeTo: subscribeToObservables,
  };
}

import { capitalize, demandValue, NoInfer } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import type * as Redux from "redux";

import { createSliceReduxToolkit } from "../deps.js";
import { enhanceAction } from "./Action.js";
import { SYMBOL_LAZY_META, SYMBOL_LAZY_SELECTOR } from "./constants.js";
import { hasLazyMeta } from "./main.js";
import type {
  ActionCreator,
  AnySlice,
  BaseSliceLazySelector,
  EnhancedActionCreatorWithPayload,
  EnhancedSlice,
  EnhancedStandardActionCreator,
  LazySliceSelectorName,
  LazySliceStoreState,
  PayloadAction,
  SliceLazySelector,
  SliceName,
  StandardAction,
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
  type StandardActionCreatorWithType<Type extends string> =
    StandardActionCreator<Type, [...params: any], StandardAction<Type>>;
  type ActionCreatorEntry<Type extends string> = [
    Type,
    StandardActionCreatorWithType<Type>
  ];
  type ActionCreatorEntries = ActionCreatorEntry<string>[];
  type EnhancedActionCreatorEntry<Type extends string> = [
    Type,
    EnhancedStandardActionCreator<StandardActionCreatorWithType<Type>>
  ];
  type LazyActionCreatorEntries = EnhancedActionCreatorEntry<string>[];
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

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace SliceBuilder {
  export type ActionTypeCase = [
    actionType: string,
    reducer: ReduxToolkit.CaseReducer<any, PayloadAction<any>>
  ];

  /**
   * Unlike Redux Toolkit, Sables only accepts enhanced action creators.
   */
  export type ActionCreatorCase = [
    actionCreator: ActionCreator<any, any[]>,
    reducer: ReduxToolkit.CaseReducer<any, PayloadAction<any>>
  ];

  export type ActionMatcher<A extends Redux.AnyAction> = (
    value: Redux.AnyAction
  ) => value is A;

  /**
   * Unlike Redux Toolkit, Sables only accepts matcher that are type guards.
   * Just returning a `boolean` isn't enough.
   */
  export type MatcherCase<A extends Redux.AnyAction = Redux.AnyAction> = [
    actionMatcher: ActionMatcher<A>,
    reducer: ReduxToolkit.CaseReducer<any, A>
  ];

  export type DefaultCase = [
    empty: undefined,
    reducer: ReduxToolkit.CaseReducer<any, Redux.AnyAction>
  ];

  export type Case =
    | ActionTypeCase
    | ActionCreatorCase
    | MatcherCase
    | DefaultCase;

  export function isActionTypeCase(
    reducerCase: SliceBuilder.Case
  ): reducerCase is SliceBuilder.ActionTypeCase {
    return typeof reducerCase[0] === "string";
  }

  export function isActionCreatorCase(
    reducerCase: SliceBuilder.Case
  ): reducerCase is SliceBuilder.ActionCreatorCase {
    const [value] = reducerCase;

    return typeof value === "function" && hasLazyMeta(value);
  }

  export function isMatcherCase(
    reducerCase: SliceBuilder.Case
  ): reducerCase is SliceBuilder.MatcherCase {
    const [value] = reducerCase;

    return typeof value === "function" && !hasLazyMeta(value);
  }

  export function isDefaultCase(
    reducerCase: SliceBuilder.Case
  ): reducerCase is SliceBuilder.DefaultCase {
    return typeof reducerCase[0] === "undefined";
  }
}

type CaseReducersFromSliceReducerBuilder<B> =
  // First attempt to infer `CaseReducers` from the return value of `addDefaultCase`
  // prettier-ignore
  B extends SliceReducerBuilderBase<any, infer C, any> ? C :
  // Then attempt to infer `CaseReducers` from the return value of `addMatcher`
  // prettier-ignore
  B extends Omit<SliceReducerBuilder<any, infer C, any>, "addCase" | "addCases"> ? C :
  // Lastly, attempt to infer `CaseReducers` from the return value of `addCase` and `addCases`
  // prettier-ignore
  B extends SliceReducerBuilder<any, infer C, any> ? C : never;

interface SliceReducerBuilderBase<
  State,
  CaseReducers extends ReduxToolkit.SliceCaseReducers<State>,
  Name extends string
> {
  /** @internal */
  _assemble(): EnhancedSlice<ReduxToolkit.Slice<State, CaseReducers, Name>>;
}

interface SliceReducerBuilder<
  State,
  CaseReducers extends ReduxToolkit.SliceCaseReducers<State>,
  Name extends string
> extends SliceReducerBuilderBase<State, CaseReducers, Name> {
  /**
   * Adds a reducer to handle a specific action.
   *
   * @public
   */
  addCase<
    Type extends string,
    R extends ReduxToolkit.CaseReducer<State, PayloadAction<any>>
  >(
    actionType: Type,
    caseReducer: R
  ): SliceReducerBuilder<State, CaseReducers & { [K in Type]: R }, Name>;
  addCase<
    AC extends EnhancedActionCreatorWithPayload<
      ReduxToolkit.ActionCreatorWithPayload<any>
    >
  >(
    actionCreator: AC,
    caseReducer: ReduxToolkit.CaseReducer<State, ReturnType<AC>>
  ): SliceReducerBuilder<State, CaseReducers, Name>;

  /**
   * Adds a map of reducers to handle specific actions.
   *
   * @public
   */
  addCases<C extends ReduxToolkit.SliceCaseReducers<State>>(
    reducersMap: C
  ): SliceReducerBuilder<State, CaseReducers & C, Name>;

  /**
   * Adds a reducer to handle actions that meet the condition of the given match function.
   * The given match function _must_ be a type guard for an action.
   *
   * @public
   */
  addMatcher<A extends Redux.AnyAction>(
    actionMatcher: SliceBuilder.ActionMatcher<A>,
    caseReducer: ReduxToolkit.CaseReducer<State, A>
  ): Omit<
    SliceReducerBuilder<State, CaseReducers, Name>,
    "addCase" | "addCases"
  >;

  /**
   * Adds a reducer to handle actions that aren't handled by other reducers.
   *
   * @public
   */
  addDefaultCase(
    caseReducer: ReduxToolkit.CaseReducer<State, Redux.AnyAction>
  ): SliceReducerBuilderBase<State, CaseReducers, Name>;
}

function createSliceReducerBuilder<
  State,
  CaseReducers extends ReduxToolkit.SliceCaseReducers<State>,
  Name extends string
>(
  name: Name,
  initialState: State,
  cases: SliceBuilder.Case[]
): SliceReducerBuilder<State, CaseReducers, Name> {
  function getReducersOption() {
    return cases.reduce<ReduxToolkit.SliceCaseReducers<State>>(
      (result, reducerCase) => {
        if (SliceBuilder.isActionTypeCase(reducerCase)) {
          const [actionTypeOrCreator, reducer] = reducerCase;

          return {
            ...result,
            [actionTypeOrCreator]: reducer,
          };
        }

        return result;
      },
      {}
    );
  }

  function getExtraReducersOption() {
    return (builder: ReduxToolkit.ActionReducerMapBuilder<NoInfer<State>>) => {
      for (const reducerCase of cases) {
        if (SliceBuilder.isActionCreatorCase(reducerCase)) {
          builder.addCase(...reducerCase);
        }
        if (SliceBuilder.isMatcherCase(reducerCase)) {
          builder.addMatcher(...reducerCase);
        }
        if (SliceBuilder.isDefaultCase(reducerCase)) {
          const [, reducer] = reducerCase;
          builder.addDefaultCase(reducer);
        }
      }
    };
  }

  function createBaseSlice() {
    return createSliceReduxToolkit({
      name,
      initialState,
      reducers: getReducersOption(),
      extraReducers: getExtraReducersOption(),
    });
  }

  function addCase(...reducerCase: SliceBuilder.Case) {
    return createSliceReducerBuilder(name, initialState, [
      ...cases,
      reducerCase,
    ]);
  }

  function addCases<C extends ReduxToolkit.SliceCaseReducers<State>>(
    reducers: C
  ) {
    const nextCases = Object.entries(reducers) as SliceBuilder.Case[];

    return createSliceReducerBuilder(name, initialState, [
      ...cases,
      ...nextCases,
    ]);
  }

  function addDefaultCase(
    reducer: ReduxToolkit.CaseReducer<State, Redux.AnyAction>
  ) {
    return createSliceReducerBuilder(name, initialState, [
      ...cases,
      [undefined, reducer],
    ]);
  }

  function addMatcher(...reducerCase: SliceBuilder.MatcherCase) {
    return createSliceReducerBuilder(name, initialState, [
      ...cases,
      reducerCase,
    ]);
  }

  function _assemble() {
    return enhanceSlice(createBaseSlice());
  }

  const builder = {
    _assemble,
    addCase,
    addCases,
    addDefaultCase,
    addMatcher,
    // Casting to avoid unnecessary generic propagation
  } as unknown as SliceReducerBuilder<State, CaseReducers, Name>;

  return builder;
}

/** @public */
type DraftSlice<State, Name extends string = string> = {
  /**
   *
   * @example
   *
   * type PetName = string;
   *
   * const adoptCats = createAction<PetName[], "adoptCats">(
   *   "adoptCats"
   * );
   * const adoptDogs = createAction<PetName[], "adoptDogs">(
   *   "adoptDogs"
   * );
   *
   * const slice = createSlice("pets", {
   *   adoptedPetCount: 0,
   * }).setReducer((builder) =>
   *   builder
   *     .addCase(
   *       "adoptPuppies",
   *       (state, action: PayloadAction<PetName[]>) => {
   *         state.adoptedPetCount += action.payload.length;
   *       }
   *     )
   *     .addCase(adoptDogs, (state, action) => {
   *       state.adoptedPetCount += action.payload.length;
   *     })
   *     .addCases({
   *       adoptKittens: (
   *         state,
   *         action: PayloadAction<PetName[]>
   *       ) => {
   *         state.adoptedPetCount += action.payload.length;
   *       },
   *     })
   *     .addMatcher(adoptCats.match, (state, action) => {
   *       state.adoptedPetCount += action.payload.length;
   *     })
   *     .addDefaultCase((state) => {
   *       return state;
   *     })
   * );
   *
   * adoptDogs.dependsUpon(slice);
   * adoptCats.dependsUpon(slice);
   *
   * const { adoptKittens, adoptPuppies } = petSlice.actions;
   *
   * @public
   */
  setReducer<
    B extends SliceReducerBuilderBase<
      State,
      ReduxToolkit.SliceCaseReducers<State>,
      Name
    >
  >(
    buildReducerFn: (
      // eslint-disable-next-line @typescript-eslint/ban-types
      builder: SliceReducerBuilder<State, {}, Name>
    ) => B
  ): EnhancedSlice<
    ReduxToolkit.Slice<State, CaseReducersFromSliceReducerBuilder<B>, Name>
  >;
};

/**
 * An enhanced version of Redux Toolkit's `createSlice` with a fluent interface.
 *
 * @example
 *
 * const booksSlice = createSlice("books", {
 *   purchasedBookCount: 0,
 * }).setReducer((builder) =>
 *   builder.addCase(
 *     "buyBooks",
 *     (state, action: PayloadAction<string[]>) => {
 *       state.purchasedBookCount += action.payload.length;
 *     }
 *   )
 * );
 *
 * const { buyBooks } = booksSlice.actions;
 * const { selectBooksState } = booksSlice;
 *
 * // `booksSlice` is inserted into the store
 * store.dispatch(
 *   buyBooks([
 *     "Goosebumps: Night of the Living Dummy",
 *     "Goosebumps: Welcome to Dead House",
 *   ])
 * );
 *
 * const selectPurchasedBookCount = createSelector(
 *   selectBooksState,
 *   ({ purchasedBookCount }) => purchasedBookCount
 * );
 *
 * // Returns `2`
 * selectPurchasedBookCount(store.getState());
 *
 * @see {@link https://sables.dev/api#createslice `createSlice` documentation}
 * @see {@link https://redux-toolkit.js.org/api/createslice `ReduxToolkit.createSlice` documentation}
 * @see {@link enhanceSlice}
 *
 * @public
 */
export function createSlice<State, Name extends string = string>(
  name: Name,
  initialState: State
): DraftSlice<State, Name> {
  return {
    setReducer(buildReducerFn) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const initialBuilder = createSliceReducerBuilder<State, {}, Name>(
        name,
        initialState,
        []
      );
      const finalBuilder = buildReducerFn(initialBuilder);

      return finalBuilder._assemble() as any;
    },
  };
}

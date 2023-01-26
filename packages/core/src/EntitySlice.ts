import type * as ReduxToolkit from "@reduxjs/toolkit";

import { createEntityAdapter } from "../deps.js";
import {
  createNotableEntities,
  distinctEntityReducers,
  distinctEntitySelectors,
  EntityReducers,
  EntitySelectors,
  NotableEntities,
} from "./Entity.js";
import { createSlice } from "./Slice.js";
import { EnhancedSlice } from "./types.js";

type EntityAdapterOptions<Entity> = Parameters<
  typeof createEntityAdapter<Entity>
>[0];

type EntitySliceState<
  Entity,
  Adjectives extends NotableEntities.Adjectives,
  SingularName extends string
> = ReduxToolkit.EntityState<Entity> &
  NotableEntities.SliceState<Entity, Adjectives, SingularName>;

type EntitySliceReducers<
  Entity,
  Adjectives extends NotableEntities.Adjectives,
  SingularName extends string,
  PluralName extends string
> = NotableEntities.Instance<Entity, Adjectives, SingularName>["reducers"] &
  EntityReducers.Reducers<Entity, SingularName, PluralName> &
  ReduxToolkit.EntityStateAdapter<Entity>;

type EntitySliceSelectors<
  Entity,
  Adjectives extends NotableEntities.Adjectives,
  SingularName extends string,
  PluralName extends string
> = NotableEntities.Selectors<
  Record<PluralName, EntitySliceState<Entity, Adjectives, SingularName>> &
    Record<string, unknown>,
  Entity,
  Adjectives,
  SingularName
> &
  EntitySelectors.Selectors<Entity, SingularName, PluralName> &
  ReduxToolkit.EntitySelectors<Entity, Record<string, unknown>>;
type EntitySliceMixin<
  Entity,
  Adjectives extends NotableEntities.Adjectives,
  SingularName extends string,
  PluralName extends string
> = {
  entityAdapter: ReduxToolkit.EntityAdapter<Entity>;
  selectors: EntitySliceSelectors<Entity, Adjectives, SingularName, PluralName>;
};

/** @internal */
function getEntityReducers<
  Adapter extends ReduxToolkit.EntityStateAdapter<any>
>(adapter: Adapter) {
  return {
    addOne: adapter.addOne,
    addMany: adapter.addMany,
    setOne: adapter.setOne,
    setMany: adapter.setMany,
    setAll: adapter.setAll,
    removeOne: adapter.removeOne,
    removeMany: adapter.removeMany,
    removeAll: adapter.removeAll,
    updateOne: adapter.updateOne,
    updateMany: adapter.updateMany,
    upsertOne: adapter.upsertOne,
    upsertMany: adapter.upsertMany,
  } as const;
}

/**
 * @see {createEntitySlice}
 *
 * @public
 */
export type EntitySlice<
  Entity,
  Adjectives extends NotableEntities.Adjectives,
  SingularName extends string,
  PluralName extends string
> = EnhancedSlice<
  ReduxToolkit.Slice<
    EntitySliceState<Entity, Adjectives, SingularName>,
    EntitySliceReducers<Entity, Adjectives, SingularName, PluralName>,
    PluralName
  >
> &
  EntitySliceMixin<Entity, Adjectives, SingularName, PluralName>;

type NormalizeAdjectives<Adjectives> =
  Adjectives extends NotableEntities.Adjectives
    ? Adjectives
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {};

type ReduxToolkitReducer<State> = ReturnType<
  typeof ReduxToolkit.createReducer<State>
>;

/**
 * Creates a slice to store a specific entity.
 *
 * The slice is created by composing the following functions together:
 *
 * - `createEntityAdapter`
 * - `distinctEntityReducers`
 * - `createNotableEntities`
 * - `createSlice`
 * - `entityAdapter.getSelectors`
 * - `notableEntities.getSelectors`
 *
 * @example
 *
 * type Book = { id: string; name: string };
 *
 * const booksSlice = createEntitySlice<Book>().setReducer(
 *   "book",
 *   { best: (id: string) => id }
 * );
 *
 * const { addBook, denoteBestBook } = booksSlice.actions;
 * const { selectBestBook } = booksSlice.selectors;
 *
 * store.dispatch(
 *   addBook({
 *     id: "1",
 *     name: "Goosebumps: Night of the Living Dummy",
 *   })
 * );
 *
 * store.dispatch(denoteBestBook("1"));
 *
 * // Returns: { id: "1", name: "Goosebumps: Night of the Living Dummy" }
 * selectBestBook(store.getState());
 *
 * @see {createEntityAdapter}
 * @see {distinctEntityReducers}
 * @see {distinctEntitySelectors}
 * @see {createNotableEntities}
 * @see {createSlice}
 *
 * @public
 */
export function createEntitySlice<Entity>(
  adapterOptions?: EntityAdapterOptions<Entity>
) {
  return {
    setReducer<
      Adjectives extends NotableEntities.Adjectives | void,
      SingularName extends string,
      PluralName extends string = `${SingularName}s`
    >(
      name: SingularName | [SingularName, PluralName],
      adjectives?: Adjectives,
      createReducerExtension?: (
        initialState: EntitySliceState<
          Entity,
          NormalizeAdjectives<Adjectives>,
          SingularName
        >
      ) => ReduxToolkitReducer<
        EntitySliceState<Entity, NormalizeAdjectives<Adjectives>, SingularName>
      >
    ): EntitySlice<
      Entity,
      NormalizeAdjectives<Adjectives>,
      SingularName,
      PluralName
    > {
      const [singularName, plural] = typeof name === "string" ? [name] : name;
      const pluralName = plural ?? (`${singularName}s` as const);
      const entityAdapter = createEntityAdapter<Entity>(adapterOptions);
      const adapterReducers = distinctEntityReducers(entityAdapter, name);
      const notableEntities = createNotableEntities(
        entityAdapter,
        singularName,
        adjectives || {}
      );
      const initialState = {
        ...entityAdapter.getInitialState(),
        ...notableEntities.getInitialState(),
      };
      const slice = createSlice(pluralName, initialState).setReducer(
        (builder) => {
          const builderWithEntityCases = builder.addCases({
            ...getEntityReducers(entityAdapter),
            ...adapterReducers,
            ...notableEntities.reducers,
          });

          if (createReducerExtension) {
            const reducerExtension = createReducerExtension(
              initialState
            ) as ReduxToolkit.CaseReducer;

            return builderWithEntityCases.addDefaultCase(reducerExtension);
          }

          return builderWithEntityCases;
        }
      );
      const adapterSelectors = entityAdapter.getSelectors(slice.selector);
      const selectors = {
        ...adapterSelectors,
        ...distinctEntitySelectors(adapterSelectors, name),
        ...notableEntities.getSelectors(slice.selector),
      };
      (slice as any).entityAdapter = entityAdapter;
      (slice as any).selectors = selectors;

      return slice as any;
    },
  };
}

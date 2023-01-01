import type * as ReduxToolkit from "@reduxjs/toolkit";

import { createEntityAdapter } from "../deps.js";
import {
  createNotableEntities,
  entityAdapterToReducers,
  EntityReducers,
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
  EntityReducers.Reducers<Entity, SingularName, PluralName>;

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
>;
type EntitySliceMixin<
  Entity,
  Adjectives extends NotableEntities.Adjectives,
  SingularName extends string,
  PluralName extends string
> = {
  selectors: EntitySliceSelectors<Entity, Adjectives, SingularName, PluralName>;
};

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

/**
 * Creates a slice to store a specific entity.
 *
 * The slice is created by composing the following functions together:
 *
 * - `createEntityAdapter`
 * - `entityAdapterToReducers`
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
 *   "books",
 *   {
 *     best: (id: string) => id,
 *   }
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
 * @see {entityAdapterToReducers}
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
      singularName: SingularName,
      plural: PluralName,
      adjectives?: Adjectives
    ): EntitySlice<
      Entity,
      Adjectives extends NotableEntities.Adjectives
        ? Adjectives
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      SingularName,
      PluralName
    > {
      const pluralName = plural ?? (`${singularName}s` as const);
      const entityAdapter = createEntityAdapter<Entity>(adapterOptions);
      const adapterReducers = entityAdapterToReducers(
        entityAdapter,
        singularName,
        pluralName
      );

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
        (builder) =>
          builder.addCases({ ...adapterReducers, ...notableEntities.reducers })
      );

      const selectors = {
        ...entityAdapter.getSelectors(slice.selector),
        ...notableEntities.getSelectors(slice.selector),
      };

      (slice as any).selectors = selectors;

      return slice as any;
    },
  };
}

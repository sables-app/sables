import { capitalize } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";

import { createSelector } from "./Selector.js";
import { PayloadAction } from "./types.js";

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace EntityReducers {
  // prettier-ignore
  export type ReducerName<
    K,
    SingularName extends string,
    PluralName extends string
  > = K extends "addOne"     ? `add${Capitalize<SingularName>}`     : never
    | K extends "addMany"    ? `add${Capitalize<PluralName>}`       : never
    | K extends "setOne"     ? `set${Capitalize<SingularName>}`     : never
    | K extends "setMany"    ? `set${Capitalize<PluralName>}`       : never
    | K extends "setAll"     ? `setAll${Capitalize<PluralName>}`    : never
    | K extends "removeOne"  ? `remove${Capitalize<SingularName>}`  : never
    | K extends "removeMany" ? `remove${Capitalize<PluralName>}`    : never
    | K extends "removeAll"  ? `removeAll${Capitalize<PluralName>}` : never
    | K extends "updateOne"  ? `update${Capitalize<SingularName>}`  : never
    | K extends "updateMany" ? `update${Capitalize<PluralName>}`    : never
    | K extends "upsertOne"  ? `upsert${Capitalize<SingularName>}`  : never
    | K extends "upsertMany" ? `upsert${Capitalize<PluralName>}`    : never;

  export type Reducers<
    Entity extends Record<string, unknown>,
    SingularName extends string,
    PluralName extends string
  > = {
    [K in keyof ReduxToolkit.EntityStateAdapter<Entity> as ReducerName<
      K,
      SingularName,
      PluralName
    >]: ReduxToolkit.EntityStateAdapter<Entity>[K];
  };

  export type ExtractEntityFromAdapter<T> =
    T extends ReduxToolkit.EntityStateAdapter<infer Entity> ? Entity : never;
}

/**
 * Creates unique names for entity adapter actions.
 *
 * @see {@link https://sables.dev/api#entityadaptertoreducers `entityAdapterToReducers` documentation}
 *
 * @example
 *
 * interface Dog {
 *   id: number;
 *   name: string;
 * }
 *
 * const dogsEntityAdapter = createEntityAdapter<Dog>();
 *
 * const dogsSlice = createSlice(
 *   "dogs",
 *   dogsEntityAdapter.getInitialState()
 * ).setReducer((builder) =>
 *   builder.addCases(
 *     entityAdapterToReducers(dogsEntityAdapter, "dog")
 *   )
 * );
 *
 * // `addDog` is equal to `addOne` from Redux Toolkit
 * const { addDog } = dogsSlice.actions;
 *
 * @public
 */
export function entityAdapterToReducers<
  Adapter extends ReduxToolkit.EntityStateAdapter<any>,
  SingularName extends string,
  PluralName extends string = `${SingularName}s`
>(
  adapter: Adapter,
  singularName: SingularName,
  plural?: PluralName
): EntityReducers.Reducers<
  EntityReducers.ExtractEntityFromAdapter<Adapter>,
  SingularName,
  PluralName
> {
  const pluralName = plural ?? `${singularName}s`;
  return {
    [`add${capitalize(singularName)}`]: adapter.addOne,
    [`add${capitalize(pluralName)}`]: adapter.addMany,
    [`set${capitalize(singularName)}`]: adapter.setOne,
    [`set${capitalize(pluralName)}`]: adapter.setMany,
    [`setAll${capitalize(pluralName)}`]: adapter.setAll,
    [`remove${capitalize(singularName)}`]: adapter.removeOne,
    [`remove${capitalize(pluralName)}`]: adapter.removeMany,
    [`removeAll${capitalize(pluralName)}`]: adapter.removeAll,
    [`update${capitalize(singularName)}`]: adapter.updateOne,
    [`update${capitalize(pluralName)}`]: adapter.updateMany,
    [`upsert${capitalize(singularName)}`]: adapter.upsertOne,
    [`upsert${capitalize(pluralName)}`]: adapter.upsertMany,
  } as any;
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace NotableEntities {
  type AdjectiveEntityIDGetter<Payload> = {
    (actionPayload: Payload): ReduxToolkit.EntityId | undefined;
  };

  export type Adjectives = {
    [adjective: string]: AdjectiveEntityIDGetter<never>;
  };

  export type SliceStatePropertyName<
    Adjective extends string,
    Name extends string
  > = `${Extract<Adjective, string>}${Capitalize<Name>}Payload`;

  export type PayloadFromAdjectiveFn<T extends AdjectiveEntityIDGetter<never>> =
    Parameters<T>[0];

  export type SliceState<
    Entity,
    A extends Adjectives,
    Name extends string
  > = ReduxToolkit.EntityState<Entity> & {
    [K in keyof A as SliceStatePropertyName<
      Extract<K, string>,
      Name
    >]?: PayloadFromAdjectiveFn<A[K]>;
  };

  export type ReducerName<
    Adjective extends string,
    Name extends string
  > = `denote${Capitalize<Extract<Adjective, string>>}${Capitalize<Name>}`;

  export type EntitySelectorName<
    TAdjective extends string,
    Name extends string
  > = `select${Capitalize<Extract<TAdjective, string>>}${Capitalize<Name>}`;

  export type PayloadSelectorName<
    Adjective extends string,
    Name extends string
  > = `select${Capitalize<
    Extract<Adjective, string>
  >}${Capitalize<Name>}Payload`;

  export type Selectors<
    StoreState,
    Entity,
    A extends Adjectives,
    Name extends string
  > = {
    [K in keyof A as EntitySelectorName<Extract<K, string>, Name>]: (
      storeState: StoreState
    ) => Entity | undefined;
  } & {
    [K in keyof A as PayloadSelectorName<Extract<K, string>, Name>]: (
      storeState: StoreState
    ) => NotableEntities.PayloadFromAdjectiveFn<A[K]> | undefined;
  };

  export type Instance<Entity, A extends Adjectives, Name extends string> = {
    getSelectors<StoreState>(
      selectState: (storeState: StoreState) => SliceState<Entity, A, Name>
    ): Selectors<StoreState, Entity, A, Name>;
    getInitialState(): SliceState<Entity, A, Name>;
    reducers: {
      [K in keyof A as ReducerName<
        Extract<K, string>,
        Name
      >]: ReduxToolkit.CaseReducer<
        // NotableEntitiesState<Entity, A, Name> & Record<string, unknown>,
        //
        // TODO - Find a way to avoid using `any` here without forcing devs to
        // manually add types in generics. Using a type other than `any` results
        // in a type error.
        //
        // The only side effect of using `any` here is that reducers will accept
        // `any` slice state; all other types are maintained. This is only an issue
        // if the dev calls the reducer directly from outside of the slice.
        // Then the provided slice state won't be type checked. This isn't an expected
        // usage pattern, so this improvement is low priority.
        any,
        PayloadAction<NotableEntities.PayloadFromAdjectiveFn<A[K]>>
      >;
    };
  };
}

/**
 * Creates actions and reducers for notable entities.
 *
 * @see {@link https://sables.dev/api#createnotableentities `createNotableEntities` documentation}
 *
 * @public
 */
export function createNotableEntities<
  Adapter extends ReduxToolkit.EntityStateAdapter<any>,
  A extends NotableEntities.Adjectives,
  Name extends string
>(
  _adapter: Adapter,
  singularName: Name,
  adjectives: A
): NotableEntities.Instance<
  EntityReducers.ExtractEntityFromAdapter<Adapter>,
  A,
  Name
> {
  type State = NotableEntities.SliceState<
    EntityReducers.ExtractEntityFromAdapter<Adapter>,
    A,
    Name
  >;

  function getStatePropertyName(
    adjective: string,
    name: string
  ): NotableEntities.SliceStatePropertyName<typeof adjective, typeof name> {
    return `${adjective}${capitalize(name)}Payload`;
  }

  function getReducerName(
    adjective: string,
    name: string
  ): NotableEntities.ReducerName<typeof adjective, typeof name> {
    return `denote${capitalize(adjective)}${capitalize(name)}`;
  }

  function getEntitySelectorName(
    adjective: string,
    name: string
  ): NotableEntities.EntitySelectorName<typeof adjective, typeof name> {
    return `select${capitalize(adjective)}${capitalize(name)}`;
  }

  function getPayloadSelectorName(
    adjective: string,
    name: string
  ): NotableEntities.PayloadSelectorName<typeof adjective, typeof name> {
    return `select${capitalize(adjective)}${capitalize(name)}Payload`;
  }

  function getSelectors(selectState: (storeState: any) => State) {
    return Object.entries(adjectives).reduce(
      (result, [adjective, getEntityId]) => {
        type Payload = NotableEntities.PayloadFromAdjectiveFn<
          typeof getEntityId
        >;
        const entitySelectorName = getEntitySelectorName(
          adjective,
          singularName
        );
        const payloadSelectorName = getPayloadSelectorName(
          adjective,
          singularName
        );
        const statePropertyName = getStatePropertyName(adjective, singularName);
        const payloadSelector = createSelector(
          selectState,
          (state) => (state as any)[statePropertyName]
        );
        const entitySelector = createSelector(
          selectState,
          payloadSelector,
          (sliceState, payload) => {
            const id =
              payload !== undefined
                ? getEntityId(payload as Payload)
                : undefined;

            return id ? sliceState.entities[id] : undefined;
          }
        );

        return {
          ...result,
          [entitySelectorName]: entitySelector,
          [payloadSelectorName]: payloadSelector,
        };
      },
      {}
    );
  }

  function getInitialState() {
    return Object.keys(adjectives).reduce((result, adjective) => {
      const statePropertyName = getStatePropertyName(adjective, singularName);

      return {
        ...result,
        [statePropertyName]: undefined,
      };
    }, {});
  }

  const reducers = Object.entries(adjectives).reduce(
    (result, [adjective, _getEntityId]) => {
      const reducerName = getReducerName(adjective, singularName);
      const statePropertyName = getStatePropertyName(adjective, singularName);
      type Action = PayloadAction<
        NotableEntities.PayloadFromAdjectiveFn<typeof _getEntityId>
      >;

      return {
        ...result,
        [reducerName]: (state: Record<string, unknown>, action: Action) => {
          state[statePropertyName] = action.payload;
        },
      };
    },
    {}
  );

  return {
    getInitialState,
    getSelectors,
    reducers,
  } as any;
}

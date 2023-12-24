import { capitalize } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";

import { createSelector } from "./Selector.js";
import { PayloadAction } from "./types.js";

/** @internal */
type ExtractEntityFromAdapter<T> = T extends ReduxToolkit.EntityStateAdapter<
  infer Entity
>
  ? Entity
  : never;

/** @internal */
type ExtractEntityFromSelector<T> = T extends ReduxToolkit.EntitySelectors<
  infer Entity,
  any
>
  ? Entity
  : never;

/** @internal */
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
    Entity,
    SingularName extends string,
    PluralName extends string,
  > = {
    [K in keyof ReduxToolkit.EntityStateAdapter<Entity> as ReducerName<
      K,
      SingularName,
      PluralName
    >]: ReduxToolkit.EntityStateAdapter<Entity>[K];
  };
}

/** @internal */
export namespace EntitySelectors {
  // prettier-ignore
  export type SelectorName<
    K,
    SingularName extends string,
    PluralName extends string
  > =
    | K extends "selectAll"      ? `selectAll${Capitalize<PluralName>}`          : never
    | K extends "selectById"     ? `select${Capitalize<SingularName>}ById`       : never
    | K extends "selectTotal"    ? `select${Capitalize<SingularName>}Count`      : never
    | K extends "selectEntities" ? `select${Capitalize<SingularName>}Dictionary` : never
    | K extends "selectIds"      ? `select${Capitalize<SingularName>}Ids`        : never;

  export type Selectors<
    Entity,
    SingularName extends string,
    PluralName extends string,
  > = {
    [K in keyof ReduxToolkit.EntitySelectors<
      Entity,
      Record<string, unknown>
    > as SelectorName<
      K,
      SingularName,
      PluralName
    >]: ReduxToolkit.EntitySelectors<Entity, Record<string, unknown>>[K];
  };
}

/**
 * Assigns distinctive names to entity adapter case reducers.
 *
 * @see {@link https://sables.dev/api#distinctentityreducers `distinctEntityReducers` documentation}
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
 *     distinctEntityReducers(dogsEntityAdapter, "dog")
 *   )
 * );
 *
 * // `addDog` is equal to `addOne` from Redux Toolkit
 * const { addDog } = dogsSlice.actions;
 *
 * @public
 */
export function distinctEntityReducers<
  Adapter extends ReduxToolkit.EntityStateAdapter<any>,
  SingularName extends string,
  PluralName extends string = `${SingularName}s`,
>(
  adapter: Adapter,
  name: SingularName | [SingularName, PluralName],
): EntityReducers.Reducers<
  ExtractEntityFromAdapter<Adapter>,
  SingularName,
  PluralName
> {
  const [singular, plural] = typeof name === "string" ? [name] : name;
  const singularName = capitalize(singular);
  const pluralName = capitalize(plural ?? `${singular}s`);

  return {
    [`add${singularName}`]: adapter.addOne,
    [`add${pluralName}`]: adapter.addMany,
    [`set${singularName}`]: adapter.setOne,
    [`set${pluralName}`]: adapter.setMany,
    [`setAll${pluralName}`]: adapter.setAll,
    [`remove${singularName}`]: adapter.removeOne,
    [`remove${pluralName}`]: adapter.removeMany,
    [`removeAll${pluralName}`]: adapter.removeAll,
    [`update${singularName}`]: adapter.updateOne,
    [`update${pluralName}`]: adapter.updateMany,
    [`upsert${singularName}`]: adapter.upsertOne,
    [`upsert${pluralName}`]: adapter.upsertMany,
  } as any;
}

/**
 * Assigns distinctive names to entity adapter selectors.
 *
 * @see {@link https://sables.dev/api#distinctentityselectors `distinctEntitySelectors` documentation}
 *
 * @example
 *
 * interface Book {
 *   id: number;
 *   name: string;
 * }
 *
 * const booksEntityAdapter = createEntityAdapter<Book>();
 * const booksSlice = createSlice(
 *   "books",
 *   booksEntityAdapter.getInitialState()
 * ).setReducer((builder) => builder);
 *
 * // `selectBookCount` is equal to `selectTotal` from Redux Toolkit
 * const { selectBookCount } = distinctEntitySelectors(
 *   booksEntityAdapter.getSelectors(booksSlice.selector),
 *   "book"
 * );
 *
 * @public
 */
export function distinctEntitySelectors<
  Selectors extends ReduxToolkit.EntitySelectors<any, any>,
  SingularName extends string,
  PluralName extends string = `${SingularName}s`,
>(
  selectors: Selectors,
  name: SingularName | [SingularName, PluralName],
): EntitySelectors.Selectors<
  ExtractEntityFromSelector<Selectors>,
  SingularName,
  PluralName
> {
  const [singular, plural] = typeof name === "string" ? [name] : name;
  const singularName = capitalize(singular);
  const pluralName = capitalize(plural ?? `${singular}s`);

  return {
    [`selectAll${pluralName}`]: selectors.selectAll,
    [`select${singularName}ById`]: selectors.selectById,
    [`select${singularName}Count`]: selectors.selectTotal,
    [`select${singularName}Dictionary`]: selectors.selectEntities,
    [`select${singularName}Ids`]: selectors.selectIds,
  } as any;
}

/** @internal */
export namespace NotableEntities {
  type AdjectiveEntityIDGetter<Payload> = {
    (actionPayload: Payload): ReduxToolkit.EntityId | undefined;
  };

  export type Adjectives = {
    [adjective: string]: AdjectiveEntityIDGetter<never>;
  };

  export type SliceStatePropertyName<
    Adjective extends string,
    Name extends string,
  > = `${Extract<Adjective, string>}${Capitalize<Name>}Payload`;

  export type PayloadFromAdjectiveFn<T extends AdjectiveEntityIDGetter<never>> =
    Parameters<T>[0];

  export type SliceState<
    Entity,
    A extends Adjectives,
    Name extends string,
  > = ReduxToolkit.EntityState<Entity> & {
    [K in keyof A as SliceStatePropertyName<
      Extract<K, string>,
      Name
    >]?: PayloadFromAdjectiveFn<A[K]>;
  };

  export type ReducerName<
    Adjective extends string,
    Name extends string,
  > = `denote${Capitalize<Extract<Adjective, string>>}${Capitalize<Name>}`;

  export type EntitySelectorName<
    TAdjective extends string,
    Name extends string,
  > = `select${Capitalize<Extract<TAdjective, string>>}${Capitalize<Name>}`;

  export type IdSelectorName<
    Adjective extends string,
    Name extends string,
  > = `select${Capitalize<Extract<Adjective, string>>}${Capitalize<Name>}Id`;

  export type PayloadSelectorName<
    Adjective extends string,
    Name extends string,
  > = `select${Capitalize<
    Extract<Adjective, string>
  >}${Capitalize<Name>}Payload`;

  export type Selectors<
    StoreState,
    Entity,
    A extends Adjectives,
    Name extends string,
  > = {
    [K in keyof A as EntitySelectorName<Extract<K, string>, Name>]: (
      storeState: StoreState,
    ) => Entity | undefined;
  } & {
    [K in keyof A as IdSelectorName<Extract<K, string>, Name>]: (
      storeState: StoreState,
    ) => ReduxToolkit.EntityId | undefined;
  } & {
    [K in keyof A as PayloadSelectorName<Extract<K, string>, Name>]: (
      storeState: StoreState,
    ) => NotableEntities.PayloadFromAdjectiveFn<A[K]> | undefined;
  };

  export type Instance<Entity, A extends Adjectives, Name extends string> = {
    getSelectors<StoreState>(
      selectState: (storeState: StoreState) => SliceState<Entity, A, Name>,
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
  Name extends string,
>(
  _adapter: Adapter,
  singularName: Name,
  adjectives: A,
): NotableEntities.Instance<ExtractEntityFromAdapter<Adapter>, A, Name> {
  type State = NotableEntities.SliceState<
    ExtractEntityFromAdapter<Adapter>,
    A,
    Name
  >;

  function getStatePropertyName(
    adjective: string,
    name: string,
  ): NotableEntities.SliceStatePropertyName<typeof adjective, typeof name> {
    return `${adjective}${capitalize(name)}Payload`;
  }

  function getReducerName(
    adjective: string,
    name: string,
  ): NotableEntities.ReducerName<typeof adjective, typeof name> {
    return `denote${capitalize(adjective)}${capitalize(name)}`;
  }

  function getEntitySelectorName(
    adjective: string,
    name: string,
  ): NotableEntities.EntitySelectorName<typeof adjective, typeof name> {
    return `select${capitalize(adjective)}${capitalize(name)}`;
  }

  function getIdSelectorName(
    adjective: string,
    name: string,
  ): NotableEntities.IdSelectorName<typeof adjective, typeof name> {
    return `select${capitalize(adjective)}${capitalize(name)}Id`;
  }

  function getPayloadSelectorName(
    adjective: string,
    name: string,
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
          singularName,
        );
        const idSelectorName = getIdSelectorName(adjective, singularName);
        const payloadSelectorName = getPayloadSelectorName(
          adjective,
          singularName,
        );
        const statePropertyName = getStatePropertyName(adjective, singularName);
        const payloadSelector = createSelector(
          selectState,
          (state) => (state as any)[statePropertyName],
        );
        const idSelector = createSelector(payloadSelector, (payload) => {
          return payload !== undefined
            ? getEntityId(payload as Payload)
            : undefined;
        });
        const entitySelector = createSelector(
          selectState,
          idSelector,
          (sliceState, id) => {
            return id ? sliceState.entities[id] : undefined;
          },
        );

        return {
          ...result,
          [entitySelectorName]: entitySelector,
          [idSelectorName]: idSelector,
          [payloadSelectorName]: payloadSelector,
        };
      },
      {},
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
    {},
  );

  return {
    getInitialState,
    getSelectors,
    reducers,
  } as any;
}

import { createMutableRef } from "@sables/utils";

import type * as Redux from "redux";
import { filter, firstValueFrom, map, switchMap, zipWith } from "rxjs";

import { createSideEffectActions } from "./Action.js";
import {
  ActionDependency,
  DefaultEffectAPI,
  EndAction,
  EndPayloadFromSideEffectActions,
  ObservableCreator,
  SideEffectActions,
  StartAction,
  StartPayloadFromSideEffectActions,
} from "./types.js";

/**
 * Create an Observable Creator.
 *
 * An Observable Creator is a function that creates an observable
 * using the given Effect API object.
 *
 * @example
 *
 * const actionLogger = createObservable(({ actions$ }) => {
 *   return actions$.pipe(tap(console.log));
 * });
 *
 * @see {ObservableCreator}
 *
 * @public
 */
// Rename this to `defineObservableCreator`?
export function createObservable<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
  T = unknown
>(observableCreator: ObservableCreator<EffectAPI, T>) {
  return observableCreator;
}

/**
 * A asynchronous function that maps the given
 * start action to an end action payload.
 *
 * @public
 */
export type MapActionFn<
  EffectAPI extends DefaultEffectAPI,
  S extends StartAction<any>,
  EndPayload
> = (startAction: S, effectAPI: EffectAPI) => Promise<EndPayload>;

/**
 * Creates an Observable Creator containing logic for handling side effects.
 *
 * @see {createObservable}
 *
 * type MyData = { hello: string };
 * const getData = createSideEffectActions<void, MyData>(
 *   "getData"
 * );
 * const getDataObservableCreator = createSideEffectObservable(
 *   getData,
 *   (effectAPI) =>
 *     fetch("https://api.example.com/data.json").then(
 *       (response) => response.json()
 *     )
 * );
 *
 * // Dispatching the start action will send the request
 * store.dispatch(getData.start());
 *
 * @public
 */
export function createSideEffectObservable<
  EffectAPI extends DefaultEffectAPI,
  StartPayload,
  EndPayload,
  Type extends string
>(
  actions: SideEffectActions<StartPayload, EndPayload, Type>,
  mapStartAction: MapActionFn<
    EffectAPI,
    StartAction<StartPayload, Type>,
    EndPayload
  >
) {
  return createObservable<EffectAPI>((effectAPI) => {
    const { actions$, dispatch } = effectAPI;

    const startActions$ = actions$.pipe(
      filter((action): action is StartAction<StartPayload, Type> =>
        actions.start.match(action)
      )
    );

    const endActionPayloads$ = startActions$.pipe(
      switchMap((startAction: StartAction<StartPayload, Type>) =>
        mapStartAction(startAction, effectAPI)
      )
    );

    return startActions$.pipe(
      zipWith(endActionPayloads$),
      map(([startAction, endPayload]) => {
        dispatch(actions.end(endPayload, startAction));
      })
    );
  });
}

/**
 * A reactive side effect using a combination of actions and observables.
 *
 * @example
 *
 * const getUser = createSideEffect(
 *   "getUser",
 *   async (action: PayloadAction<string>, effectAPI) => {
 *     return fetch(`https://api.example.com/users/${action.payload}`);
 *   }
 * );
 *
 * // The dispatched action will cause a request to be sent to
 * // https://api.example.com/users/@ash.ketchum
 * store.dispatch(getUser.actions.start("@ash.ketchum"));
 *
 * @see {createSideEffect}
 *
 * @public
 */
export type SideEffect<
  StartPayload = void,
  EndPayload = void,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
  Type extends string = string
> = {
  (effectAPI: EffectAPI, payload: StartPayload): Promise<EndPayload>;
  actions: SideEffectActions<StartPayload, EndPayload, Type>;
  dependsUpon(
    ...dependencies: ActionDependency[]
  ): SideEffect<StartPayload, EndPayload, EffectAPI, Type>;
};

/**
 * Creates a reactive side effect using a combination of actions and observables.
 *
 * @example
 *
 * const getUser = createSideEffect(
 *   "getUser",
 *   async (action: PayloadAction<string>, effectAPI) => {
 *     return fetch(`https://api.example.com/users/${action.payload}`);
 *   }
 * );
 *
 * // The dispatched action will cause a request to be sent to
 * // https://api.example.com/users/@ash.ketchum
 * store.dispatch(getUser.actions.start("@ash.ketchum"));
 *
 * @see {SideEffect}
 * @see {createSideEffectActions}
 * @see {createSideEffectObservable}
 *
 * @public
 */
export function createSideEffect<
  StartPayload = void,
  EndPayload = void,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
  Type extends string = string
>(
  type: Type,
  mapStartAction: MapActionFn<
    EffectAPI,
    StartAction<StartPayload, Type>,
    EndPayload
  >
): SideEffect<StartPayload, EndPayload, EffectAPI, Type> {
  const actions = createSideEffectActions<StartPayload, EndPayload, Type>(type);
  const observable = createSideEffectObservable(actions, mapStartAction);

  actions.dependsUpon(observable);

  function sideEffect(effectAPI: EffectAPI, payload: StartPayload) {
    return callSideEffect(effectAPI, actions, payload);
  }

  sideEffect.actions = actions;
  sideEffect.dependsUpon = (...dependencies: ActionDependency[]) => {
    actions.dependsUpon(...dependencies);
    return sideEffect;
  };

  return sideEffect;
}

/** @internal */
export function bindSideEffect<T extends SideEffectActions<any, any, any>>(
  dispatch: Redux.Dispatch,
  actions: T,
  onAwaitingChange?: (isAwaiting: boolean) => void
) {
  type StartPayload = StartPayloadFromSideEffectActions<T>;

  const startActionRef = createMutableRef<StartAction<StartPayload>>();

  const dispatchStartAction = (payload: StartPayload) => {
    if (startActionRef.current) return;

    const action = actions.start(payload);

    startActionRef.current = action;
    onAwaitingChange?.(true);
    dispatch(action);
  };

  const observableCreator = createObservable(({ actions$ }) =>
    actions$.pipe(
      filter(
        (endAction): endAction is EndAction<EndPayloadFromSideEffectActions<T>> =>
          !!startActionRef.current &&
          actions.hasAffiliation(startActionRef.current, endAction)
      ),
      map((endAction) => {
        onAwaitingChange?.(false);
        startActionRef.current = undefined;

        return endAction;
      })
    )
  );

  return { dispatchStartAction, observableCreator };
}

/** @internal */
async function callSideEffect<
  EffectAPI extends DefaultEffectAPI,
  T extends SideEffectActions<any, any, any>
>(
  effectAPI: EffectAPI,
  actions: T,
  startPayload: StartPayloadFromSideEffectActions<T>
): Promise<EndPayloadFromSideEffectActions<T>> {
  const { dispatchStartAction, observableCreator } = bindSideEffect(
    effectAPI.dispatch,
    actions
  );
  const endActionPromise = firstValueFrom(observableCreator(effectAPI));

  dispatchStartAction(startPayload);

  return (await endActionPromise).payload;
}

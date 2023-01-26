import { createMutableRef } from "@sables/utils";

import type * as Redux from "redux";
import { filter, firstValueFrom, map, switchMap, zipWith } from "rxjs";

import { createSideEffectActions } from "./main.js";
import {
  ActionDependency,
  DefaultEffectAPI,
  ObservableCreator,
  PayloadActionCreator,
  SideEffectActions,
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
// TODO - Rename this to `defineObserver`
export function createObservable<
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
  T = unknown
>(observableCreator: ObservableCreator<EffectAPI, T>) {
  return observableCreator;
}

/**
 * Creates an Observable Creator containing logic for handling side effects.
 *
 * @param mapStartAction A asynchronous function that maps the given start action to an end action payload.
 *
 * @see {createObservable}
 *
 * type MyData = { hello: string };
 * const getData = createSideEffectActions(
 *   createAction<void>("getData/start"),
 *   createAction<MyData>("getData/end")
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
  ActionCreators extends SideEffectActions<any, any>
>(
  actionCreators: ActionCreators,
  mapStartAction: (
    startAction: ReturnType<ActionCreators["start"]>,
    effectAPI: EffectAPI
  ) => Promise<ReturnType<ActionCreators["end"]>["payload"]>
) {
  return createObservable<EffectAPI, void>((effectAPI) => {
    const { actions$, dispatch } = effectAPI;

    const startActions$ = actions$.pipe(
      filter((action): action is ReturnType<ActionCreators["start"]> =>
        actionCreators.start.match(action)
      )
    );

    const endActionPayloads$ = startActions$.pipe(
      switchMap((startAction: ReturnType<ActionCreators["start"]>) =>
        mapStartAction(startAction, effectAPI)
      )
    );

    return startActions$.pipe(
      zipWith(endActionPayloads$),
      map(([startAction, endPayload]) => {
        dispatch(actionCreators.end(endPayload, startAction));
      })
    );
  });
}

/**
 * A reactive side effect using a combination of actions and observables.
 *
 * @example
 *
 * @see {createSideEffect}
 * @see {@link https://sables.dev/docs/api#createsideeffect createSideEffect documentation}
 *
 * @public
 */
export type SideEffect<
  StartActionCreator extends PayloadActionCreator<any>,
  EndActionCreator extends PayloadActionCreator<any>,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
> = {
  (
    effectAPI: EffectAPI,
    payload: ReturnType<StartActionCreator>["payload"]
  ): Promise<ReturnType<EndActionCreator>["payload"]>;
  actions: SideEffectActions<StartActionCreator, EndActionCreator>;
  dependsUpon(
    ...dependencies: ActionDependency[]
  ): SideEffect<StartActionCreator, EndActionCreator, EffectAPI>;
};

function createSideEffectInstance<
  ActionCreators extends SideEffectActions<any, any>,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(
  actionCreators: ActionCreators,
  observableCreator: ObservableCreator<EffectAPI, void>
): SideEffect<
  typeof actionCreators["start"],
  typeof actionCreators["end"],
  EffectAPI
> {
  actionCreators.dependsUpon(observableCreator);

  function sideEffect(
    effectAPI: EffectAPI,
    payload: ReturnType<typeof actionCreators["start"]>["payload"]
  ) {
    return callSideEffect(effectAPI, actionCreators, payload);
  }

  sideEffect.actions = actionCreators;
  sideEffect.dependsUpon = (...dependencies: ActionDependency[]) => {
    actionCreators.dependsUpon(...dependencies);
    return sideEffect;
  };

  return sideEffect;
}

/**
 * Creates a reactive side effect using a combination of actions and observables.
 *
 * @example
 *
 * const getUser = createSideEffect(
 *   createAction<string>("getUser/start"),
 *   createAction<Response>("getUser/end"),
 *   async (action, effectAPI) =>
 *     fetch(`https://api.example.com/users/${action.payload}`)
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
  StartActionCreator extends PayloadActionCreator<any>,
  EndActionCreator extends PayloadActionCreator<any>,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI
>(
  startBase: StartActionCreator,
  endBase: EndActionCreator,
  mapStartAction: (
    startAction: ReturnType<
      SideEffectActions<StartActionCreator, EndActionCreator>["start"]
    >,
    effectAPI: EffectAPI
  ) => Promise<
    ReturnType<
      SideEffectActions<StartActionCreator, EndActionCreator>["end"]
    >["payload"]
  >
) {
  const actionCreators = createSideEffectActions(startBase, endBase);
  const observableCreator = createSideEffectObservable(
    actionCreators,
    mapStartAction
  );

  return createSideEffectInstance(actionCreators, observableCreator);
}

/** @internal */
export function bindSideEffect<T extends SideEffectActions<any, any>>({
  dispatch,
  actions,
  onAwaitingChange,
  onEndAction,
}: {
  dispatch: Redux.Dispatch;
  actions: T;
  onAwaitingChange?: (isAwaiting: boolean) => void;
  onEndAction?: (endAction: ReturnType<typeof actions.end>) => void;
}) {
  type StartAction = ReturnType<typeof actions.start>;
  type EndAction = ReturnType<typeof actions.end>;
  type StartPayload = StartAction["payload"];

  const startActionRef = createMutableRef<StartAction>();

  const dispatchStartAction = (payload: StartPayload) => {
    if (startActionRef.current) return;

    const action: StartAction = actions.start(payload);

    startActionRef.current = action;
    onAwaitingChange?.(true);
    dispatch(action);
  };

  const observableCreator = createObservable(({ actions$ }) =>
    actions$.pipe(
      filter(
        (endAction): endAction is EndAction =>
          !!startActionRef.current &&
          actions.hasAffiliation(startActionRef.current, endAction)
      ),
      map((endAction) => {
        onAwaitingChange?.(false);
        onEndAction?.(endAction);
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
  T extends SideEffectActions<any, any>
>(
  effectAPI: EffectAPI,
  actions: T,
  startPayload: ReturnType<T["start"]>["payload"]
): Promise<ReturnType<T["end"]>["payload"]> {
  const { dispatchStartAction, observableCreator } = bindSideEffect({
    dispatch: effectAPI.dispatch,
    actions,
  });
  const endActionPromise = firstValueFrom(observableCreator(effectAPI));

  dispatchStartAction(startPayload);

  return (await endActionPromise).payload;
}

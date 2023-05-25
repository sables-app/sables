import type { PayloadActionCreator } from "@reduxjs/toolkit";
import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { bindSideEffect } from "../Observable.js";
import {
  ActionCreator,
  PayloadAction,
  SideEffectActions,
  StandardAction,
} from "../types.js";
import { useObservable } from "./Observable.js";

type AnyActionCreator = ActionCreator<any, any[], StandardAction<any, any>>;

type BoundActionCreator<T> = T extends ActionCreator<
  any,
  infer Params,
  StandardAction<any, any>
>
  ? (...params: Params) => void
  : never;

type BoundActionCreators<Tuple extends [...AnyActionCreator[]]> = {
  [Index in keyof Tuple]: BoundActionCreator<Tuple[Index]>;
};

/**
 * A React hook that binds the given action creators to the dispatch
 * function available in the context.
 *
 * @example
 *
 * const sayHello = createAction("sayHello");
 *
 * function MyComponent() {
 *   const [dispatchSayHello] = useAction(sayHello);
 *
 *   return (
 *     <button type="button" onClick={() => dispatchSayHello()}>
 *       Hello!
 *     </button>
 *   );
 * }
 *
 * @public
 */
export function useAction<T extends [...actionCreators: AnyActionCreator[]]>(
  ...actionCreators: T
): BoundActionCreators<T> {
  const dispatch = useDispatch();

  const boundActionCreators = useMemo(() => {
    return actionCreators.map((actionCreator: AnyActionCreator) => {
      return (...params: Parameters<typeof actionCreator>) => {
        dispatch(actionCreator(...params));
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...actionCreators, dispatch]);

  return boundActionCreators as BoundActionCreators<T>;
}

/**
 * A React hook that binds the given payload action creator to the dispatch
 * function available in the context. When called, an action is
 * dispatched with the given payload.
 *
 * @example
 *
 * const sayHello = createAction<string>("sayHello");
 *
 * function MyComponent() {
 *   const sayHelloMary = useActionCallback(sayHello, "Mary");
 *
 *   return (
 *     <button type="button" onClick={sayHelloMary}>
 *       Hello!
 *     </button>
 *   );
 * }
 *
 * @public
 */
export function useActionCallback<AC extends PayloadActionCreator<any>>(
  ...args: ReturnType<AC>["payload"] extends undefined
    ? [actionCreator: AC]
    : [actionCreator: AC, payload: ReturnType<AC>["payload"]]
): () => void {
  const [actionCreator, payload] = args;
  const dispatch = useDispatch();

  return useCallback(() => {
    dispatch(actionCreator(payload));
  }, [dispatch, actionCreator, payload]);
}

/**
 * A React hook that facilitates the invocation of a side effect in a component.
 *
 * @returns
 *
 * An object with methods to interact with the side effect.
 *
 * - `start` — A function to dispatch the side effect's start action, triggering the side effect.
 * - `isAwaiting` — A boolean that represents whether the side effect is currently awaiting resolution.
 * - `latest` — An end action resolved from the latest side effect call.
 *
 * @remarks
 *
 * Each invocation of `useSideEffect` within a component allows for one
 * occurrence of a side effect to be awaited at a time.
 * Component state is used to monitor each side effect occurrence.
 *
 * @example
 *
 * const sendRequest = createSideEffect(
 *   createAction("sendRequest/start"),
 *   createAction("sendRequest/end"),
 *   async () => {
 *     return;
 *   }
 * );
 *
 * function MyComponent() {
 *   const { isAwaiting, start } = useSideEffect(sendRequest);
 *
 *   return (
 *     <button
 *       type="button"
 *       onClick={start}
 *       disabled={isAwaiting}
 *     >
 *       Update Date
 *     </button>
 *   );
 * }
 *
 * @public
 */
export function useSideEffect<T extends SideEffectActions<any, any>>(
  input: T | { actions: T }
) {
  function isActions(input: T | { actions: T }): input is T {
    return !Object.hasOwn(input, "actions");
  }

  const dispatch = useDispatch();
  const actions = isActions(input) ? input : input.actions;
  const [isAwaiting, onAwaitingChange] = useState(false);
  type StartPayload = PayloadAction<
    ReturnType<(typeof actions)["end"]>["payload"]
  >;
  const [latestEndAction, onEndAction] = useState<StartPayload>();
  const { dispatchStartAction, observableCreator } = useMemo(
    () =>
      bindSideEffect({
        actions,
        dispatch,
        onAwaitingChange,
        onEndAction,
      }),
    [actions, dispatch]
  );

  useObservable(observableCreator);

  return {
    isAwaiting,
    latest: latestEndAction,
    start: dispatchStartAction,
  };
}

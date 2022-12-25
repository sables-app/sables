import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { bindSideEffect } from "../Observable.js";
import { ActionCreator, SideEffectActions, StandardAction } from "../types.js";
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
 *   const [dispatchSayHello] = useWithDispatch(sayHello);
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
export function useWithDispatch<
  T extends [...actionCreators: AnyActionCreator[]]
>(...actionCreators: T): BoundActionCreators<T> {
  const dispatch = useDispatch();

  const boundActionCreators = useMemo(() => {
    return actionCreators.map((actionCreator: AnyActionCreator) => {
      return (...params: Parameters<typeof actionCreator>) => {
        dispatch(actionCreator(...params));
      };
    });
  }, [actionCreators, dispatch]);

  return boundActionCreators as BoundActionCreators<T>;
}

/**
 * A React hook that facilitates the invocation of a side effect in a component.
 *
 * @returns
 *
 * A tuple containing a function to dispatch the side effect's
 * start action, and a boolean that represents whether the side effect is
 * currently awaiting resolution.
 *
 * @remarks
 *
 * Each invocation of `useSideEffect` within a component allows for one
 * occurrence of a side effect to be awaited at a time.
 * Component state is used to monitor each side effect occurrence.
 *
 * @example
 *
 * const fetchCurrentDate = createSideEffect(
 *   "fetchCurrentDate",
 *   async () => new Date()
 * );
 *
 * function MyComponent() {
 *   const [updateDate, isAwaiting] = useSideEffect(fetchCurrentDate);
 *
 *   return (
 *     <button type="button" onClick={updateDate} disabled={isAwaiting}>
 *       Update Date
 *     </button>
 *   );
 * }
 *
 * @public
 */
export function useSideEffect<T extends SideEffectActions<any, any, any>>(
  sideEffect: T | { actions: T }
) {
  const dispatch = useDispatch();
  const isActions = (sideEffect: T | { actions: T }): sideEffect is T =>
    !Object.hasOwn(sideEffect, "actions");
  const actions = isActions(sideEffect) ? sideEffect : sideEffect.actions;
  const [isAwaiting, setIsAwaiting] = useState(false);
  const { dispatchStartAction, observableCreator } = useMemo(
    () => bindSideEffect(dispatch, actions, setIsAwaiting),
    [actions, dispatch]
  );

  useObservable(observableCreator);

  return [dispatchStartAction, isAwaiting] as const;
}

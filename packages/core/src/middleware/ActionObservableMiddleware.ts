import type * as Redux from "redux";
import { Subject } from "rxjs";

/**
 * An `RxJS.Subject` that asynchronously emits
 * dispatched actions on the next microtask.
 *
 * @example
 *
 * const actions$ = new ActionSubject();
 *
 * actions$.subscribe(console.log);
 *
 * actions$.next({
 *   type: "myAction",
 *   payload: "my payload value"
 * });
 *
 * @public
 */
export class ActionSubject extends Subject<Redux.AnyAction> {
  /**
   * Feeds the next value after the next microtask
   */
  next(action?: Redux.AnyAction | null) {
    // Skip `undefined` and `null`, because some middleware,
    // call `next` without providing an action.
    if (action == null) return;

    queueMicrotask(() => super.next(action));
  }
}

/**
 * Creates a Redux middleware function that emits dispatched
 * actions to an `ActionSubject`.
 *
 * @see {ActionSubject}
 *
 * @example
 *
 * const { actionObservableMiddleware, actions$ } =
 *   createActionObservableMiddleware();
 *
 * @public
 */
export function createActionObservableMiddleware() {
  const actions$ = new ActionSubject();
  const actionObservableMiddleware: Redux.Middleware =
    function actionObservableMiddleware() {
      return (next) => (action: Redux.AnyAction) => {
        const result = next(action);

        actions$.next(result);

        return result;
      };
    };

  return {
    actionObservableMiddleware,
    actions$,
  };
}

import { nanoid } from "nanoid";
import type * as Redux from "redux";

import {
  PROPERTY_EFFECT_ACTIONS_ID,
  PROPERTY_EFFECT_ACTIONS_START_ACTION,
  SYMBOL_LAZY_META,
} from "./constants.js";
import type {
  ActionDependency,
  ActionMeta,
  BasicActionCreator,
  BasicPayloadActionCreator,
  EnhancedStandardActionCreator,
  ObservableCreator,
  PayloadAction,
  PayloadActionCreator,
  SideEffectActions,
  StandardAction,
  StandardActionCreator,
} from "./types.js";
import { createLazyMeta, hasLazyMeta } from "./utils.js";

/**
 * Determines whether the given action creator
 * is an enhanced action creator.
 *
 * @see {enhanceAction}
 *
 * @public
 */
export function isEnhancedActionCreator<
  T extends string,
  P extends [...params: any] = [],
  A extends StandardAction<T> = StandardAction<T>
>(
  actionCreator: BasicActionCreator<T, P, A>
): actionCreator is EnhancedStandardActionCreator<StandardActionCreator<T, P, A>> {
  return hasLazyMeta(actionCreator);
}

function findActionCreatorType<T extends string>(
  actionCreator: BasicActionCreator<T, any, any>
): T {
  try {
    return actionCreator().type;
  } catch (_error) {
    // Do nothing;
  }

  function hasType(value: unknown): value is { type: T } {
    return typeof value == "function" && typeof (value as any).type == "string";
  }

  if (hasType(actionCreator)) {
    return actionCreator.type;
  }

  throw new Error("Couldn't determine action type. A type must be provided.");
}

type HasNoParameters = [] & { length: 0 };
type HasOneOptionalParameter = [payload?: any] & { length: 0 | 1 };

/**
 * Creates a new, enhanced action creator.
 *
 * Enhanced action creators can create actions with dependencies,
 * and have additional utility functions attached.
 *
 * @example
 *
 * import { enhanceAction } from "@sables/framework";
 *
 * function wakeCat(payload?: Error) {
 *   return {
 *     type: "wakeCat",
 *     payload,
 *   };
 * }
 *
 * const enhancedWakeCat = enhanceAction(wakeCat);
 *
 * // Returns `true`
 * enhancedWakeCat.match(wakeCat());
 *
 * @public
 */
export function enhanceAction<AC extends BasicPayloadActionCreator<any, any>>(
  actionCreator: AC
): PayloadActionCreator<
  Parameters<AC> extends HasNoParameters
    ? void
    : Parameters<AC> extends HasOneOptionalParameter
    ? ReturnType<AC>["payload"] | void
    : ReturnType<AC>["payload"],
  ReturnType<AC>["type"]
>;
export function enhanceAction<
  Type extends string,
  Params extends [...params: any] = [],
  TAction extends StandardAction<Type> = StandardAction<Type>
>(
  actionCreator: BasicActionCreator<Type, Params, TAction>,
  typeInput?: Type
): EnhancedStandardActionCreator<StandardActionCreator<Type, Params, TAction>>;
export function enhanceAction<
  Type extends string,
  Params extends [...params: any] = [],
  TAction extends StandardAction<Type> = StandardAction<Type>
>(actionCreator: BasicActionCreator<Type, Params, TAction>, typeInput?: Type) {
  if (isEnhancedActionCreator(actionCreator)) {
    return actionCreator;
  }

  const type = typeInput || findActionCreatorType(actionCreator);

  function match(action?: Redux.Action): action is TAction {
    return action?.type === type;
  }

  function toString(): Type {
    return type;
  }

  const lazyMeta = createLazyMeta();

  function wrappedActionCreator(
    ...args: Parameters<typeof actionCreator>
  ): TAction {
    const action = actionCreator(...args);

    return {
      ...action,
      error: action.payload instanceof Error,
      meta: {
        ...action.meta,
        [SYMBOL_LAZY_META]: lazyMeta,
      },
    };
  }

  function isObserverBuilder(
    value: ActionDependency
  ): value is ObservableCreator {
    return typeof value == "function";
  }

  function dependsUpon(...dependencies: ActionDependency[]) {
    for (const dependency of dependencies) {
      if (isObserverBuilder(dependency)) {
        lazyMeta.observers.add(dependency);
      } else {
        lazyMeta.slices.add(dependency);
      }
    }

    return enhancedActionCreator;
  }

  const mixin = {
    ...actionCreator,
    dependsUpon,
    match,
    toString,
    type,
    [SYMBOL_LAZY_META]: lazyMeta,
  };

  const enhancedActionCreator = Object.assign(wrappedActionCreator, mixin);

  return enhancedActionCreator;
}

/**
 * Creates an enhanced action creator that adheres
 * to Flux Standard Action conventions.
 *
 * Enhanced action creators can create actions with
 * dependencies, and have additional utility functions attached.
 *
 * @example
 *
 * const wakeCat = createAction("wakeCat");
 *
 * // { type: "wakeCat", payload: undefined, error: false, meta: {} }
 * const action = wakeCat();
 *
 * @public
 */
export function createAction<Payload = void, Type extends string = string>(
  type: Type
) {
  return enhanceAction(function actionCreator(
    payload: Payload
  ): PayloadAction<Payload, Type> {
    return { type, payload };
  }) as PayloadActionCreator<Payload, Type>;
}

/**
 * Creates a pair of action creators intended for use with side effects.
 *
 * @example
 *
 * const mySideEffect = createSideEffectActions(
 *   createAction<Date>("mySideEffect/start"),
 *   createAction<void | Error>("mySideEffect/end")
 * );
 * const startAction = mySideEffect.start(new Date());
 * const endAction = mySideEffect.end(new Error("Side effect failed."), startAction);
 * const actionsAreAffiliated = mySideEffect.hasAffiliation(startAction, endAction);
 *
 * @public
 */
export function createSideEffectActions<
  StartActionCreator extends PayloadActionCreator<any>,
  EndActionCreator extends PayloadActionCreator<any>
>(
  startBase: StartActionCreator,
  endBase: EndActionCreator
): SideEffectActions<StartActionCreator, EndActionCreator> {
  type T = SideEffectActions<StartActionCreator, EndActionCreator>;
  type StartAction = ReturnType<T["start"]>;
  type EndAction = ReturnType<T["end"]>;
  type StartPayload = StartAction["payload"];
  type EndPayload = EndAction["payload"];
  const startType = startBase.type;
  const endType = endBase.type;

  const startActionCreator: T["start"] = enhanceAction(
    (payload: StartPayload) => {
      const actionBase = startBase(payload);
      const meta: ActionMeta = {
        ...actionBase.meta,
        [PROPERTY_EFFECT_ACTIONS_ID]: nanoid(),
      };

      return { ...actionBase, meta };
    },
    startType
  );

  const endActionCreator: T["end"] = enhanceAction(
    (payload: EndPayload, startAction?: StartAction) => {
      const actionBase = endBase(payload);
      const meta: ActionMeta = {
        ...actionBase.meta,
        [PROPERTY_EFFECT_ACTIONS_ID]:
          startAction?.meta?.[PROPERTY_EFFECT_ACTIONS_ID],
        [PROPERTY_EFFECT_ACTIONS_START_ACTION]: startAction,
      };

      return { ...actionBase, meta };
    },
    endType
  );

  const match: T["match"] = function match(
    action?: Redux.Action
  ): action is ReturnType<typeof startBase> | ReturnType<typeof endBase> {
    return startBase.match(action) || endBase.match(action);
  };

  const hasAffiliation: T["hasAffiliation"] = function hasAffiliation(
    startAction,
    endAction
  ) {
    return !!(
      startActionCreator.match(startAction) &&
      endActionCreator.match(endAction) &&
      startAction.meta &&
      startAction.meta[PROPERTY_EFFECT_ACTIONS_ID] ===
        endAction.meta?.[PROPERTY_EFFECT_ACTIONS_ID]
    );
  };

  const dependsUpon: T["dependsUpon"] = function dependsUpon(...dependencies) {
    startActionCreator.dependsUpon(...dependencies);
    endActionCreator.dependsUpon(...dependencies);

    return effectActions;
  };

  const getStartAction: T["getStartAction"] = function getStartAction(
    endAction
  ) {
    return endAction.meta?.[PROPERTY_EFFECT_ACTIONS_START_ACTION];
  };

  const effectActions: T = {
    dependsUpon,
    end: endActionCreator,
    getStartAction,
    hasAffiliation,
    match,
    start: startActionCreator,
  };

  return effectActions;
}

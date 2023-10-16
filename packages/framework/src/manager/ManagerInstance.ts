import {
  ActionSubject,
  DefaultEffectAPI,
  SYMBOL_EFFECT_API_LIFECYCLE,
  SYMBOL_EFFECT_API_ROUTES,
  SYMBOL_MANAGER_EFFECT_API,
} from "@sables/core";
import {
  BuildHrefInput,
  BuildHrefOptions,
  buildLink,
  RoutesCollection,
} from "@sables/router";
import type { MutableReferenceObject } from "@sables/utils";

import type * as History from "history";

import { LifecycleRef } from "../LifecycleContext.js";
import type { DefaultStoreState, Manager, ManagerStore } from "../types.js";

/** @internal */
export function createManagerInstance<
  StoreState extends DefaultStoreState,
  EffectAPI extends DefaultEffectAPI = DefaultEffectAPI,
>({
  actions$,
  effectAPIRef,
  history,
  lifecycleRef,
  routesCollectionRef,
  store,
}: {
  actions$: ActionSubject;
  effectAPIRef: MutableReferenceObject<EffectAPI>;
  history: History.History;
  lifecycleRef: LifecycleRef;
  routesCollectionRef: MutableReferenceObject<RoutesCollection<EffectAPI>>;
  store: ManagerStore<StoreState, EffectAPI>;
}): Manager<StoreState, EffectAPI> {
  const { dispatch, getState } = store;

  return {
    [SYMBOL_EFFECT_API_LIFECYCLE]: lifecycleRef,
    [SYMBOL_EFFECT_API_ROUTES]: routesCollectionRef,
    [SYMBOL_MANAGER_EFFECT_API]: effectAPIRef,
    actions$,
    buildLink<Route extends BuildHrefInput>(...args: BuildHrefOptions<Route>) {
      return buildLink<Route>(dispatch, args);
    },
    dispatch,
    getState,
    history,
    store,
    subscribeTo: store.subscribeTo,
  };
}

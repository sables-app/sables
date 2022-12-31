import { createMutableRef } from "@sables/utils";

import type * as ReduxToolkit from "@reduxjs/toolkit";
import { BehaviorSubject } from "rxjs";

import { configureStore } from "../../deps.js";
import {
  createActionDependencyEnhancer,
  createActionObservableMiddleware,
} from "../middleware/mod.js";
import { DefaultEffectAPI } from "../types.js";
import { createEffectAPIDefaults } from "../utils.js";

export function mockEffectAPI(
  vitest: typeof import("vitest")
): DefaultEffectAPI {
  return createEffectAPIDefaults({
    dispatch: vitest.vi.fn(),
    getState: vitest.vi.fn(),
  });
}

export function createTestStore(
  vitest: typeof import("vitest"),
  {
    enhancers,
    middleware,
    preloadedState,
    reducer = (state) => state,
  }: {
    enhancers?: ReduxToolkit.StoreEnhancer[];
    middleware?: ReduxToolkit.Middleware[];
    preloadedState?: Record<string, unknown>;
    reducer?: ReduxToolkit.Reducer;
  } = {}
) {
  const { actions$, actionObservableMiddleware } =
    createActionObservableMiddleware();
  const effectAPIRef = createMutableRef(undefined, mockEffectAPI(vitest));

  effectAPIRef.demand().actions$ = actions$;

  const { insertSlices, subscribeTo, actionDependencyEnhancer } =
    createActionDependencyEnhancer({
      effectAPIRef,
      reducersMap: {},
    });

  const store: ReduxToolkit.Store = configureStore({
    devTools: false,
    enhancers: enhancers || [actionDependencyEnhancer],
    middleware: middleware || [actionObservableMiddleware],
    preloadedState,
    reducer,
  });

  vitest.vi.spyOn(store, "dispatch");
  vitest.vi.spyOn(store, "getState");

  effectAPIRef.demand().dispatch = store.dispatch;
  effectAPIRef.demand().getState = store.getState;

  const storeStates$ = new BehaviorSubject<Record<string, unknown>>(
    store.getState()
  );

  function recordState() {
    storeStates$.next(store.getState());
  }

  store.subscribe(recordState);

  return {
    actions$,
    insertSlices,
    storeStates$,
    store,
    subscribeTo,
  };
}

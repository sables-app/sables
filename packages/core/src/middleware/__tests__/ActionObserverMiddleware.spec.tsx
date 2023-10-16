import { firstValueFrom, tap } from "rxjs";
import * as vitest from "vitest";
import { describe, expect, it } from "vitest";

import { createTestStore } from "../../__tests__/utils.js";
import { createActionObservableMiddleware } from "../ActionObservableMiddleware.js";

describe("ActionObservableMiddleware", () => {
  describe("createActionObservableMiddleware", () => {
    it("creates middleware that observes dispatched actions ", async () => {
      const { actions$, actionObservableMiddleware } =
        createActionObservableMiddleware();
      const { store } = createTestStore(vitest, {
        enhancers: [],
        middleware: [actionObservableMiddleware],
      });
      const firstAction = { type: "test1" };

      let observerEmittedAnAction = false;

      const firstDispatchedAction = firstValueFrom(
        actions$.pipe(
          tap(() => {
            observerEmittedAnAction = true;
          }),
        ),
      );

      store.dispatch(firstAction);

      // Actions are emitted asynchronously
      expect(observerEmittedAnAction).toBe(false);

      // Wait for the next microtask
      await Promise.resolve();

      expect(observerEmittedAnAction).toBe(true);

      expect(await firstDispatchedAction).toBe(firstAction);
    });
  });
});

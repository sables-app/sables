import { Provider } from "react-redux";
import { create } from "react-test-renderer";
import * as vitest from "vitest";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestStore } from "../../__tests__/utils.js";
import { createSelector } from "../../Selector.js";
import { createSlice } from "../../Slice.js";
import { useSelector } from "../Selector.js";

describe("Selector", () => {
  function createTestSlice() {
    return createSlice("cat", { sleep: true }).setReducer((builder) => builder);
  }

  function createTestSelector() {
    return createSelector(testSlice.selectCatState, ({ sleep }) => sleep);
  }

  let testSlice: ReturnType<typeof createTestSlice>;
  let selectCatIsSleeping: ReturnType<typeof createTestSelector>;

  beforeEach(() => {
    testSlice = createTestSlice();
    selectCatIsSleeping = createTestSelector();
  });

  describe("useSelector", () => {
    it("adds dependent slices to the store when provided  with an enhanced selector", async () => {
      function MyComponent() {
        const catIsSleeping = useSelector(selectCatIsSleeping);

        expect(catIsSleeping).toBeTypeOf("boolean");

        return null;
      }

      const { store } = createTestStore(vitest);

      expect(store.getState()).toBeUndefined();

      create(
        <Provider store={store}>
          <MyComponent />
        </Provider>
      );

      // Wait for the slice to be added in the next microtask
      await Promise.resolve();

      expect(store.getState()).toEqual({ cat: { sleep: true } });
    });
  });
});

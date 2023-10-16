import { Selector } from "reselect";
import { beforeEach, describe, expect, it } from "vitest";

import { SYMBOL_LAZY_META } from "../constants.js";
import { createSelector } from "../Selector.js";
import { createSlice } from "../Slice.js";
import type { ObjectWithLazyMeta } from "../types.js";
import { hasLazyMeta } from "../utils.js";

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

  describe("createSelector", () => {
    it("creates a selector", async () => {
      const selector = createSelector(
        ({ cat }: { cat: { name: string } }) => cat,
        ({ name }) => name,
      );

      expect(selector({ cat: { name: "fry" } })).toEqual("fry");
    });

    describe("returned selector", () => {
      function assertSliceDependency(
        slice: Selector | (Selector & ObjectWithLazyMeta),
      ): asserts slice is Selector & ObjectWithLazyMeta {
        expect(hasLazyMeta(slice)).toBe(true);
      }

      it("returns an enhanced selector", async () => {
        assertSliceDependency(selectCatIsSleeping);
      });

      it("returns a selector that _can_ be used as a slice dependency", async () => {
        expect(hasLazyMeta(selectCatIsSleeping)).toBe(true);
      });

      it("adopts slice dependencies from provided enhanced selectors", async () => {
        assertSliceDependency(selectCatIsSleeping);

        const selectorSlices = selectCatIsSleeping[SYMBOL_LAZY_META].slices;

        expect(selectorSlices).toHaveProperty("size", 1);
        expect(selectorSlices.has(testSlice as any)).toBe(true);
      });
    });
  });
});

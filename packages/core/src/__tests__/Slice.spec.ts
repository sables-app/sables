import { firstValueFrom, take, toArray } from "rxjs";
import * as vitest from "vitest";
import { beforeEach, describe, expect, it } from "vitest";

import { SYMBOL_LAZY_META } from "../constants.js";
import { createSlice } from "../Slice.js";
import { PayloadAction } from "../types.js";
import { createTestStore } from "./utils.js";

describe("createSlice", () => {
  function createDogsSlice() {
    return createSlice({
      name: "dogs",
      initialState: { puppyCount: 0 },
      reducers: {
        adoptPuppies(state, action: PayloadAction<string[]>) {
          state.puppyCount += action.payload.length;
        },
      },
    });
  }

  let dogsSlice: ReturnType<typeof createDogsSlice>;

  beforeEach(() => {
    dogsSlice = createDogsSlice();
  });

  it("creates slices with enhanced actions", async () => {
    const { store, storeStates$ } = createTestStore(vitest);

    const statesPromise = firstValueFrom(storeStates$.pipe(take(3), toArray()));

    store.dispatch(dogsSlice.actions.adoptPuppies(["Fei", "Ekko"]));

    const states = await statesPromise;

    expect(states).toHaveLength(3);
    expect(states[0]).toEqual(undefined);
    expect(states[1]).toEqual({ dogs: { puppyCount: 0 } });
    expect(states[2]).toEqual({ dogs: { puppyCount: 2 } });
  });

  it("sets a selector", async () => {
    expect(dogsSlice.selector).toEqual(expect.any(Function));
  });

  it("sets a named selector", async () => {
    expect(dogsSlice.selectDogsState).toBe(dogsSlice.selector);
  });

  describe("named selector", () => {
    it("returns initial state when the slice hasn't been added", async () => {
      const { store } = createTestStore(vitest);

      const storeState = store.getState();
      const dogsState = dogsSlice.selectDogsState(storeState);

      expect(storeState).toBe(undefined);
      expect(dogsState).toEqual({ puppyCount: 0 });
    });

    it("has the progenitor slice as a dependent", async () => {
      const selectorSlices = dogsSlice.selectDogsState[SYMBOL_LAZY_META].slices;

      expect(selectorSlices.size).toBe(1);
      expect([...selectorSlices].at(0)).toBe(dogsSlice);
    });
  });

  describe("actions", () => {
    it("enhanced actions can set dependencies", async () => {
      const { store } = createTestStore(vitest);
      const { adoptPuppies } = dogsSlice.actions;
      const catSlice = createSlice({
        name: "cat",
        initialState: { isAnnoyed: false },
        reducers: {},
        extraReducers(builder) {
          builder.addCase(adoptPuppies, (state) => {
            state.isAnnoyed = true;
          });
        },
      });

      adoptPuppies.dependsUpon(catSlice);

      {
        const state = store.getState();

        expect(state).toEqual(undefined);
        expect(catSlice.selectCatState(state)).toHaveProperty(
          "isAnnoyed",
          false
        );
      }

      store.dispatch(adoptPuppies(["Fei", "Ekko"]));

      {
        const state = store.getState();

        expect(store.getState()).toEqual({
          cat: { isAnnoyed: true },
          dogs: { puppyCount: 2 },
        });
        expect(catSlice.selectCatState(state)).toHaveProperty(
          "isAnnoyed",
          true
        );
      }
    });
  });
});

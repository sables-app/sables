import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { firstValueFrom, take, toArray } from "rxjs";
import * as vitest from "vitest";
import { assertType, beforeEach, describe, expect, it, test } from "vitest";

import { SYMBOL_LAZY_META } from "../constants.js";
import { createAction } from "../main.js";
import { createSlice } from "../Slice.js";
import { EnhancedActionCreatorWithPayload, PayloadAction } from "../types.js";
import { createTestStore } from "./utils.js";

describe("createSlice", () => {
  function createDogsSlice() {
    return createSlice("dogs", { puppyCount: 0 }).setReducer((builder) =>
      builder.addCase(
        "adoptPuppies",
        (state, action: PayloadAction<string[]>) => {
          state.puppyCount += action.payload.length;
        }
      )
    );
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
      const catSlice = createSlice("cat", { isAnnoyed: false }).setReducer(
        (builder) =>
          builder.addCase(adoptPuppies, (state) => {
            state.isAnnoyed = true;
          })
      );

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

  describe("created slices", () => {
    it("reduces slices from different sources", async () => {
      type PetName = string;
      const adoptCats = createAction<PetName[]>("adoptCats");
      const adoptDogs = createAction<PetName[]>("adoptDogs");

      const petSlice = createSlice("pets", {
        adoptedPetCount: 0,
      }).setReducer((builder) =>
        builder
          .addCase(
            "adoptPuppies",
            (state, action: PayloadAction<PetName[]>) => {
              state.adoptedPetCount += action.payload.length;
            }
          )
          .addCase(adoptDogs, (state, action) => {
            state.adoptedPetCount += action.payload.length;
          })
          .addCases({
            adoptKittens: (state, action: PayloadAction<PetName[]>) => {
              state.adoptedPetCount += action.payload.length;
            },
          })
          .addMatcher(adoptCats.match, (state, action) => {
            state.adoptedPetCount += action.payload.length;
          })
          .addDefaultCase((state) => {
            return state;
          })
      );

      adoptDogs.dependsUpon(petSlice);
      adoptCats.dependsUpon(petSlice);

      const { adoptKittens, adoptPuppies } = petSlice.actions;
      const { store } = createTestStore(vitest);

      store.dispatch(adoptDogs(["Pay", "Tai"]));
      store.dispatch(adoptCats(["Rex", "Ace"]));
      store.dispatch(adoptKittens(["Amy", "May"]));
      store.dispatch(adoptPuppies(["Max", "Dex"]));

      expect(store.getState()).toEqual({
        pets: {
          adoptedPetCount: 8,
        },
      });
    });
  });

  test("createSlice types", () => {
    const sliceDraft = createSlice("books", { purchasedBookCount: 0 });
    const slice = sliceDraft.setReducer((initialBuilder) => {
      const finalBuilder = initialBuilder.addCase(
        "buyBooks",
        (state, action: PayloadAction<string[]>) => {
          state.purchasedBookCount += action.payload.length;
        }
      );
      return finalBuilder;
    });

    const action = slice.actions.buyBooks([
      "Goosebumps: Night of the Living Dummy",
      "Goosebumps: Welcome to Dead House",
    ]);

    assertType<string[]>(action.payload);
    assertType<"books/buyBooks">(action.type);
    assertType<string>(action.type);
    // @ts-expect-error The `buyBooks` action type should be
    // strictly "books/buyBooks"
    assertType<"foo">(action.type);
    // It can match the more generic `PayloadAction` type
    assertType<PayloadAction<string[]>>(action);

    assertType<
      EnhancedActionCreatorWithPayload<
        ActionCreatorWithPayload<string[], "books/buyBooks">
      >
    >(slice.actions.buyBooks);

    // @ts-expect-error `buyBooks` should requires a payload
    slice.actions.buyBooks();

    slice.actions.buyBooks([
      // @ts-expect-error `buyBooks` should only accept a string array
      true,
      "Goosebumps: Night of the Living Dummy",
      "Goosebumps: Welcome to Dead House",
    ]);
  });
});

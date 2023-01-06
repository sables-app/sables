import { firstValueFrom, map, take, toArray } from "rxjs";
import * as vitest from "vitest";
import { assertType, describe, expect, test } from "vitest";

import { createEntityAdapter } from "../../deps.js";
import { createAction } from "../Action.js";
import { distinctEntityReducers } from "../Entity.js";
import { createSideEffect } from "../Observable.js";
import { createSelector } from "../Selector.js";
import { createSlice } from "../Slice.js";
import { DefaultEffectAPI, PayloadAction } from "../types.js";
import { createTestStore } from "./utils.js";

describe("Observable", () => {
  describe("createSideEffect", () => {
    test("integration with slices", async () => {
      interface Dog {
        id: number;
        name: string;
        breed: string;
        dob: number | null;
      }

      const dogsEntityAdapter = createEntityAdapter<Dog>({
        selectId: ({ id }) => id,
        sortComparer: (dogA, dogB) => dogA.name.localeCompare(dogB.name),
      });

      const dogsSlice = createSlice(
        "dogs",
        dogsEntityAdapter.getInitialState()
      ).setReducer((builder) =>
        builder.addCases(distinctEntityReducers(dogsEntityAdapter, "dog"))
      );

      const Fei: Dog = {
        id: 1,
        name: "Fei",
        breed: "Labrador Retriever",
        dob: null,
      };

      const Ekko: Dog = {
        id: 2,
        name: "Ekko",
        breed: "Labrador Retriever",
        dob: null,
      };

      const searchDogs = createSideEffect(
        createAction<Partial<Dog>>("searchDogs/start"),
        createAction<void | Error>("searchDogs/end"),
        async (action, effectAPI) => {
          assertType<PayloadAction<Partial<Dog>>>(action);
          assertType<DefaultEffectAPI>(effectAPI);

          if (action.payload.name === "error") {
            return new Error("Bad Request");
          }

          effectAPI.dispatch(dogsSlice.actions.addDogs([Fei, Ekko]));
        }
      );

      const { store, actions$ } = createTestStore(vitest);

      const actionTypesPromise = firstValueFrom(
        actions$.pipe(
          map(({ type }) => type),
          take(3),
          toArray()
        )
      );

      const selectFei = createSelector(
        dogsSlice.selectDogsState,
        (dogsState) => dogsState.entities[1]
      );

      expect(store.getState()).toEqual(undefined);

      store.dispatch(searchDogs.actions.start({ id: 1 }));

      expect(selectFei(store.getState())).toEqual(undefined);

      // Wait for the side effect to complete
      await Promise.resolve();

      expect(selectFei(store.getState())).toEqual(Fei);

      expect(await actionTypesPromise).toEqual([
        searchDogs.actions.start.type,
        dogsSlice.actions.addDogs.type,
        searchDogs.actions.end.type,
      ]);
    });
  });
});

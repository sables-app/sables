import { filter, firstValueFrom, take, tap, toArray } from "rxjs";
import * as vitest from "vitest";
import { describe, expect, it } from "vitest";

import { createAction, enhanceAction } from "../Action.js";
import { SYMBOL_LAZY_META } from "../constants.js";
import { createObservable } from "../Observable.js";
import { createSlice } from "../Slice.js";
import { PayloadActionCreator } from "../types.js";
import { createTestStore } from "./utils.js";

describe("Action", () => {
  function actionCreatorTests(wakeCat: PayloadActionCreator<void | Error>) {
    it("sets the error property to `true` when an error is given as a payload", () => {
      expect(wakeCat().error).toEqual(false);
      expect(wakeCat(new Error()).error).toEqual(true);
    });

    it("creates an action creator that can set dependencies", async () => {
      const { store, storeStates$ } = createTestStore(vitest);

      const statesPromise = firstValueFrom(
        storeStates$.pipe(take(3), toArray())
      );

      const wakeCat = createAction("wakeCat");
      const catsSlice = createSlice({
        name: "cat",
        initialState: {
          sleep: true,
        },
        reducers: {},
        extraReducers: (builder) =>
          builder.addCase(wakeCat, (state, action) => {
            state.sleep = false;
          }),
      });

      wakeCat.dependsUpon(catsSlice);

      // The slice is automatically added to the store
      // before the action is reduced into the store.
      store.dispatch(wakeCat());

      const states = await statesPromise;

      expect(states).toHaveLength(3);
      expect(states[0]).toEqual(undefined);
      expect(states[1]).toEqual({ cat: { sleep: true } });
      expect(states[2]).toEqual({ cat: { sleep: false } });
    });

    describe("`match` method", () => {
      it("matches actions", () => {
        expect(wakeCat.match()).toEqual(false);
        expect(wakeCat.match({ type: "foo" })).toEqual(false);
        expect(wakeCat.match({ type: "wakeCat" })).toEqual(true);
      });
    });

    describe("`toString` method", () => {
      it("returns the action type", () => {
        expect(wakeCat.toString()).toEqual("wakeCat");
      });
    });

    describe("`type` property", () => {
      it("is set to the action type", () => {
        expect(wakeCat.type).toEqual("wakeCat");
      });
    });
  }

  describe("enhanceAction", () => {
    function wakeCat(payload?: Error) {
      return {
        type: "wakeCat",
        payload,
      };
    }

    const enhancedWakeCat = enhanceAction(wakeCat);

    it("enhances the given action creator", () => {
      expect(enhancedWakeCat.match(wakeCat())).toEqual(true);
    });

    actionCreatorTests(enhancedWakeCat);
  });

  describe("createAction", () => {
    const wakeCat = createAction<void | Error>("wakeCat");

    it("creates a payload action creator", () => {
      expect(wakeCat()).toEqual({
        type: "wakeCat",
        payload: undefined,
        error: false,
        meta: {
          [SYMBOL_LAZY_META]: {
            observers: expect.any(Set),
            slices: expect.any(Set),
          },
        },
      });
    });

    actionCreatorTests(wakeCat);

    describe("`dependsUpon` method", () => {
      it("sets dependencies", async () => {
        const { store } = createTestStore(vitest);

        const adoptDog = createAction("adoptDog");
        const dogsSlice = createSlice({
          name: "dogs",
          initialState: { adoptionCount: 0 },
          reducers: {},
          extraReducers(builder) {
            builder.addCase(adoptDog, (state) => {
              state.adoptionCount++;
            });
          },
        });
        const tapStub = vitest.vi.fn();
        const dogsObservable = createObservable(({ actions$ }) =>
          actions$.pipe(filter(adoptDog.match), tap(tapStub))
        );

        adoptDog.dependsUpon(dogsSlice, dogsObservable);

        expect(store.getState()).toBeUndefined();

        const action = adoptDog();

        store.dispatch(action);

        expect(store.getState()).toEqual({ dogs: { adoptionCount: 1 } });

        expect(tapStub).not.toHaveBeenCalled();

        // Wait for action to be observed
        await Promise.resolve();

        expect(tapStub).toHaveBeenCalledOnce();
        expect(tapStub).toHaveBeenCalledWith(action);
      });
    });
  });
});

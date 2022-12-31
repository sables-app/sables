import { filter, firstValueFrom, take, tap, toArray } from "rxjs";
import * as vitest from "vitest";
import { assertType, describe, expect, it, test } from "vitest";

import { createAction, enhanceAction } from "../Action.js";
import { SYMBOL_LAZY_META } from "../constants.js";
import { createObservable } from "../Observable.js";
import { createSlice } from "../Slice.js";
import { PayloadActionCreator } from "../types.js";
import { createTestStore } from "./utils.js";

describe("Action", () => {
  function actionCreatorTests(wakeCat: PayloadActionCreator<void | Error>) {
    it("sets the error property to `true` when an error is given as a payload", () => {
      expect(wakeCat()).toHaveProperty("error", false);
      expect(wakeCat(new Error())).toHaveProperty("error", true);
    });

    it("creates an action creator that can set dependencies", async () => {
      const { store, storeStates$ } = createTestStore(vitest);

      const statesPromise = firstValueFrom(
        storeStates$.pipe(take(3), toArray())
      );
      const catsSlice = createSlice("cat", { sleep: true }).setReducer(
        (builder) =>
          builder.addCase(wakeCat, (state, action) => {
            state.sleep = false;
          })
      );

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

    test("types", () => {
      // It accepts `void`
      wakeCat();
      // It accepts `undefined`
      wakeCat(undefined);
      // It accepts an `Error`
      wakeCat(new Error());
      // @ts-expect-error It doesn't accept invalid values
      wakeCat(true);
      // @ts-expect-error It doesn't accept invalid values
      wakeCat("text");
    });
  }

  describe("enhanceAction", () => {
    function wakeCat(payload?: Error) {
      return {
        type: "wakeCat",
        payload,
      };
    }

    it("enhances the given action creator", () => {
      const enhancedWakeCat = enhanceAction(wakeCat);

      expect(enhancedWakeCat.match(wakeCat())).toEqual(true);
    });

    test("enhanced action creator types", () => {
      const enhancedWakeCat = enhanceAction(wakeCat);

      // It accepts `void`
      enhancedWakeCat();
      // It accepts `undefined`
      enhancedWakeCat(undefined);
      // It accepts an `Error`
      enhancedWakeCat(new Error());
      // @ts-expect-error It doesn't accept invalid values
      enhancedWakeCat(true);
      // It should match a string type
      assertType<string>(enhancedWakeCat.type);

      const addNumbers = enhanceAction(function addNumbers(
        numA: number,
        numB: number
      ) {
        return {
          type: "addNumbers",
          payload: numA + numB,
          error: false,
          meta: {
            customStatus: "success",
          },
        };
      });

      // It accepts two numbers
      addNumbers(1, 2);
      // @ts-expect-error It doesn't accept `undefined`
      addNumbers(undefined);
      // @ts-expect-error It doesn't accept an `Error`
      addNumbers(new Error());
      // @ts-expect-error It doesn't accept invalid values
      addNumbers(true);
      // It should match a string type
      assertType<string>(addNumbers.type);

      const doSomething = enhanceAction(() => ({
        type: "doSomething",
        payload: undefined,
      }));

      // @ts-expect-error It doesn't accept a value
      doSomething([1, 2, 3]);
      // It accepts `void`
      doSomething();
      // It accepts `undefined`
      doSomething(undefined);
      // @ts-expect-error It doesn't accept an `Error`
      doSomething(new Error());
      // It should match a string type
      assertType<string>(doSomething.type);
    });

    actionCreatorTests(enhanceAction(wakeCat));
  });

  describe("createAction", () => {
    it("creates a payload action creator", () => {
      const wakeCat = createAction<void | Error>("wakeCat");

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

    actionCreatorTests(createAction<void | Error>("wakeCat"));

    describe("`dependsUpon` method", () => {
      it("sets dependencies", async () => {
        const { store } = createTestStore(vitest);

        const adoptDog = createAction("adoptDog");
        const dogsSlice = createSlice("dogs", { adoptionCount: 0 }).setReducer(
          (builder) =>
            builder.addCase(adoptDog, (state) => {
              state.adoptionCount++;
            })
        );
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

    test("action creator types", () => {
      const wakeCat = createAction<void | Error>("wakeCat");

      // It accepts `void`
      wakeCat();
      // It accepts `undefined`
      wakeCat(undefined);
      // It accepts an `Error`
      wakeCat(new Error());
      // @ts-expect-error It doesn't accept invalid values
      wakeCat(true);
      // It should match a string type
      assertType<string>(wakeCat.type);

      const addNumbers = createAction<[number, number] & { length: 2 }>(
        "addNumbers"
      );

      // It accepts number tuple
      addNumbers([1, 2]);
      // @ts-expect-error It accepts only two numbers in the tuple
      addNumbers([1, 2, 3]);
      // @ts-expect-error It doesn't accept `void`
      addNumbers();
      // @ts-expect-error It doesn't accept `undefined`
      addNumbers(undefined);
      // @ts-expect-error It doesn't accept an `Error`
      addNumbers(new Error());
      // @ts-expect-error It doesn't accept invalid values
      addNumbers(true);
      // It should match a string type
      assertType<string>(addNumbers.type);

      const doSomething = createAction("doSomething");

      // @ts-expect-error It doesn't accept a value
      doSomething([1, 2, 3]);
      // It accepts `void`
      doSomething();
      // It accepts `undefined`
      doSomething(undefined);
      // @ts-expect-error It doesn't accept an `Error`
      doSomething(new Error());
      // It should match a string type
      assertType<string>(doSomething.type);
    });
  });
});

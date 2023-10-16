import { Provider } from "react-redux";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { firstValueFrom, map, take, toArray } from "rxjs";
import * as vitest from "vitest";
import { describe, expect, test } from "vitest";

import { createTestStore } from "../../__tests__/utils.js";
import { createAction, EffectAPIProvider } from "../../main.js";
import { createSideEffect } from "../../Observable.js";
import { useSideEffect } from "../Action.js";

describe("Action", () => {
  describe("useSideEffect", () => {
    test("store integration", async () => {
      const sendRequest = createSideEffect(
        createAction<Date>("sendRequest/start"),
        createAction("sendRequest/end"),
        async () => {
          return;
        },
      );

      function MyComponent() {
        const { isAwaiting, start } = useSideEffect(sendRequest);

        return (
          <button disabled={isAwaiting} onClick={() => start(new Date())} />
        );
      }

      const { store, actions$, effectAPIRef } = createTestStore(vitest);

      const actionsPromise = firstValueFrom(
        actions$.pipe(
          map(({ type }) => type),
          take(2),
          toArray(),
        ),
      );

      expect(store.getState()).toBeUndefined();

      const testJSX = (
        <Provider store={store}>
          <EffectAPIProvider effectAPI={effectAPIRef.demand()}>
            <MyComponent />
          </EffectAPIProvider>
        </Provider>
      );

      let render: ReactTestRenderer;

      act(() => {
        render = create(testJSX);
      });

      function getButton() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return render!.root.findByType("button");
      }

      const buttonClickHandler = getButton().props.onClick;

      expect(buttonClickHandler).toStrictEqual(expect.any(Function));
      // console.log(button.props.disabled);
      expect(getButton()).toHaveProperty("props.disabled", false);

      act(() => {
        buttonClickHandler();
        render.update(testJSX);
      });

      // `isAwaiting` should update synchronously
      expect(getButton()).toHaveProperty("props.disabled", true);

      // Wait for the start action to be observed
      await Promise.resolve();
      // Wait for the side effect to resolve
      await Promise.resolve();
      // Wait for the end action to be observed
      await Promise.resolve();

      act(() => {
        render.update(testJSX);
      });

      expect(getButton()).toHaveProperty("props.disabled", false);

      expect(await actionsPromise).toEqual([
        sendRequest.actions.start.type,
        sendRequest.actions.end.type,
      ]);
    });
  });
});

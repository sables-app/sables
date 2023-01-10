import * as vitest from "vitest";
import { assertType, beforeEach, describe, expect, it } from "vitest";

import { createAction, enhanceAction } from "../../Action.js";
import { useAction, useActionCallback } from "../Action.js";

// TODO - Add render time assertions
describe("framework/hooks/Action", () => {
  const firstActionCreator = createAction<{ foo: boolean }>("firstAction");
  const secondActionCreator = createAction("secondAction");
  const thirdActionCreator = enhanceAction(function thirdAction(
    time: Date,
    text: string
  ) {
    return {
      type: "thirdAction",
      payload: { time, text },
    } as const;
  });

  describe("useAction", () => {
    it("returns memoized array of action creators bound to dispatch", async () => {
      function Foo() {
        const [dispatchFirstAction, dispatchSecondAction, dispatchThirdAction] =
          useAction(
            firstActionCreator,
            secondActionCreator,
            thirdActionCreator
          );

        assertType<(payload: { foo: boolean }) => void>(dispatchFirstAction);
        assertType<(payload?: void | undefined) => void>(dispatchSecondAction);
        assertType<(time: Date, text: string) => void>(dispatchThirdAction);

        assertType<void>(dispatchFirstAction({ foo: true }));
        assertType<void>(dispatchSecondAction());
        assertType<void>(dispatchThirdAction(new Date(), "hello"));
      }
    });

    describe("useActionCallback", () => {
      it("returns memoized array of action creators bound to dispatch", async () => {
        function Foo() {
          const firstAction = useActionCallback(firstActionCreator, {
            foo: true,
          });
          // No error, action creators with `void` payloads can be called
          // without providing the second parameter
          const secondAction = useActionCallback(secondActionCreator);
          // @ts-expect-error The hook only accepts payload action creators
          const thirdAction = useActionCallback(thirdActionCreator, 1 as any);

          assertType<() => void>(firstAction);
          assertType<() => void>(secondAction);
          assertType<() => void>(thirdAction);
        }
      });
    });
  });
});

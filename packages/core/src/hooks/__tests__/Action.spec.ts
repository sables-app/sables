import * as vitest from "vitest";
import { beforeEach, describe, expect, it } from "vitest";

import { createAction, enhanceAction } from "../../Action.js";
import { useWithDispatch } from "../Action.js";

describe("framework/hooks/Action", () => {
  describe("useWithDispatch", () => {
    it("returns memoized array of action creators bound to dispatch", async () => {
      const firstAction = createAction<{ foo: boolean }>("firstAction");
      const secondAction = createAction("secondAction");
      const thirdAction = enhanceAction(function thirdAction(
        time: Date,
        text: string
      ) {
        return {
          type: "thirdAction",
          payload: { time, text },
        } as const;
      });

      function Foo() {
        const [dispatchFirstAction, dispatchSecondAction, dispatchThirdAction] =
          useWithDispatch(firstAction, secondAction, thirdAction);
      }
    });
  });
});

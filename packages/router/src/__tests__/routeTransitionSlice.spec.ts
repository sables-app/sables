import { assertType, describe, test } from "vitest";

import { transitionRoute } from "../routeTransitionSlice.js";
import { EndTransitionAction, StartTransitionAction } from "../types.js";

describe("routeTransitionSlice", () => {
  describe("transitionRoute", () => {
    test("types", () => {
      assertType<StartTransitionAction>(transitionRoute.start(1 as any));
      assertType<EndTransitionAction>(transitionRoute.end(1 as any));
    });
  });
});

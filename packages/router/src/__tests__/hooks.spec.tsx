import * as vitest from "vitest";
import { describe, expect, it } from "vitest";

import { useLink, useLinkProps } from "../hooks.js";
import { createRouterHookTester } from "./utils.js";

describe("hooks", () => {
  describe("useLink", () => {
    it("returns a route link payload", () => {
      const { render, resultRef } = createRouterHookTester(vitest, () =>
        useLink()
      );

      render();

      expect(resultRef.current).toMatchSnapshot();
    });
  });

  describe("useLinkProps", () => {
    it("returns a link props payload", () => {
      const { render, resultRef } = createRouterHookTester(vitest, () =>
        useLinkProps()
      );

      render();

      expect(resultRef.current).toMatchSnapshot();
    });
  });
});

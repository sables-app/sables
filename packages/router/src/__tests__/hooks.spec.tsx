import * as vitest from "vitest";
import { describe, expect, it, test } from "vitest";

import { useLink, useLinkProps } from "../hooks.js";
import { definePath } from "../Path.js";
import { createRoutes } from "../Routes.js";
import { createRouterHookTester } from "./utils.js";

describe("hooks", () => {
  describe("useLink", () => {
    it("returns a route link payload", () => {
      const { render, resultRef } = createRouterHookTester(vitest, () =>
        useLink(),
      );

      render();

      expect(resultRef.current).toMatchSnapshot();
    });
  });

  describe("useLinkProps", () => {
    it("returns a link props payload", () => {
      const { render, resultRef } = createRouterHookTester(vitest, () =>
        useLinkProps(),
      );

      render();

      expect(resultRef.current).toMatchSnapshot();
    });

    function createTestRoutes() {
      return createRoutes()
        .set("appRoot", "/app")
        .set("dogs", "/app/dogs/:name")
        .set("cats", definePath`/app/cats/${":name"}`)
        .setWildcard("birds", definePath`/app/birds/${"*"}`);
    }

    test("types", () => {
      const routes = createTestRoutes();
      const handleClick = () => undefined;

      /**
       * Theses type tests aren't statically checked,
       * so these hooks don't need to be invoked
       * inside a component.
       */
      function __NOT_INVOKED__() {
        useLinkProps();

        // @ts Undefined paths aren't checked
        {
          useLinkProps(handleClick, routes.AppRoot);
          useLinkProps(handleClick, routes.AppRoot, {});
          useLinkProps(handleClick, routes.AppRoot, { foo: "bar" });

          useLinkProps(handleClick, routes.Dogs);
          useLinkProps(handleClick, routes.Dogs, {});
          useLinkProps(handleClick, routes.Dogs, { foo: "bar" });
        }

        // @ts-expect-error Params are required
        useLinkProps(handleClick, routes.Cats);
        // @ts-expect-error Params are required
        useLinkProps(handleClick, routes.Cats, {});
        // @ts-expect-error Invalid params
        useLinkProps(handleClick, routes.Cats, { foo: "bar" });
        useLinkProps(handleClick, routes.Cats, { name: "Max" });

        // @ts-expect-error Params are required
        useLinkProps(handleClick, routes.Birds);
        // @ts-expect-error Params are required
        useLinkProps(handleClick, routes.Birds, {});
        // @ts-expect-error Invalid params
        useLinkProps(handleClick, routes.Birds, { foo: "bar" });
        useLinkProps(handleClick, routes.Birds, { wildcard: "way/too/much" });
      }
    });
  });
});

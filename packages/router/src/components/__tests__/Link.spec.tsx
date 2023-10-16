import { assertType, describe, expect, test } from "vitest";

import { definePath } from "../../Path.js";
import { AnyRouteReference, createRoutes } from "../../Routes.js";
import { Link } from "../Link";

describe("Link", () => {
  function createTestRoutes() {
    return createRoutes()
      .set("appRoot", "/app")
      .set("dogs", "/app/dogs/:name")
      .set("cats", definePath`/app/cats/${":name"}`)
      .setWildcard("birds", definePath`/app/birds/${"*"}`);
  }

  describe("types", async () => {
    test("params prop", () => {
      const routes = createTestRoutes();

      type LinkParamsProp<Route extends AnyRouteReference> = Parameters<
        typeof Link<Route>
      >[0]["params"];

      function getLinkParamsProp<Route extends AnyRouteReference>(
        route: Route,
      ): LinkParamsProp<Route> {
        return 1 as any;
      }

      // An undefined path without params results in unknown params
      assertType<Record<string, unknown> | undefined>(
        getLinkParamsProp(routes.AppRoot),
      );
      // An undefined path with params results in unknown params
      assertType<Record<string, unknown> | undefined>(
        getLinkParamsProp(routes.Dogs),
      );
      // An defined path with params results in defined params
      assertType<{ name: unknown }>(getLinkParamsProp(routes.Cats));
      // An defined wildcard path results in defined params
      assertType<{ wildcard: unknown }>(getLinkParamsProp(routes.Birds));
    });

    test("route without params", () => {
      const routes = createTestRoutes();

      // Params aren't require for an undefined path without params
      <Link route={routes.AppRoot} />;
    });

    test("route with undefined params", () => {
      const routes = createTestRoutes();

      // Params aren't require for an undefined path with params
      <Link route={routes.Dogs} />;
    });

    test("route with missing params", () => {
      const routes = createTestRoutes();

      // @ts-expect-error Params are required for a defined wildcard path
      <Link route={routes.Birds} />;
    });

    test("route with inaccurate params", () => {
      const routes = createTestRoutes();

      // Inaccurate params are allowed for an undefined path with params
      // However, an error will be thrown at runtime.
      <Link route={routes.Dogs} params={{ dogName: "Rex" }} />;
    });

    test("route with accurate params", () => {
      const routes = createTestRoutes();

      // Accurate params are allowed for an undefined path with params
      <Link route={routes.Dogs} params={{ name: "Rex" }} />;
    });

    test("route provided with a string param", () => {
      const routes = createTestRoutes();

      // Params with string values are allowed
      <Link route={routes.Cats} params={{ name: "Max" }} />;
    });

    test("route provided with a number param", () => {
      const routes = createTestRoutes();

      // Params with number values are allowed
      <Link route={routes.Cats} params={{ name: 1 }} />;
    });

    test("route provided with an object param", () => {
      const routes = createTestRoutes();

      // Any value type is allowed, as long as the property name are correct
      <Link route={routes.Cats} params={{ name: { toString: () => "Ray" } }} />;
    });
  });
});

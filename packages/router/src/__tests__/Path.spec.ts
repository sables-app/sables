import { assertType, describe, expect, it, test } from "vitest";

import { defineParam, definePath } from "../Path.js";
import { createRoutes } from "../Routes.js";
import { MatchingHref } from "../types.js";

describe("Routes", () => {
  describe("definePath", () => {
    // TODO - Break this apart into smaller tests
    test("types", () => {
      expect(() => {
        createRoutes()
          // @ts-expect-error The defined route isn't a wildcard
          .setWildcard("invalidWildcard", definePath`/profiles/${":handle"}`);
      }).toThrowError();

      // @ts-expect-error Routes using `definePath` must have a parameter
      createRoutes().set("defineRouteWithoutParams", definePath`/stand/proud`);

      const routes = createRoutes()
        .set("root", "/")
        .set("profile", definePath`/profiles/${":handle"}`)
        .set("definedRoute", definePath`/boom/${":pow"}/${":kaboom"}`)
        .setWildcard("validWildcard", definePath`/foo/${":bar"}/${"*"}`);

      const paramPath = definePath`/profiles/${defineParam(":handle")}`;
      const multiPath = definePath`/boom/${defineParam(":pow")}/${defineParam(
        ":kaboom"
      )}`;
      const wildcardPath = definePath`/foo/${defineParam(":bar")}/${defineParam(
        "*"
      )}`;

      // `defineParam` infers params
      assertType<
        Readonly<{
          _pieces?: readonly string[] | undefined;
          _rawParamNames?: ":handle"[] | undefined;
          path: `/${string}`;
        }>
      >(paramPath);

      // `defineParam` infers multiple params
      assertType<
        Readonly<{
          _pieces?: readonly string[] | undefined;
          _rawParamNames?: (":pow" | ":kaboom")[] | undefined;
          path: `/${string}`;
        }>
      >(multiPath);

      // `defineParam` infers wildcard params
      assertType<
        Readonly<{
          _pieces?: readonly string[] | undefined;
          _rawParamNames?: (":bar" | "*")[] | undefined;
          path: `/${string}/*`;
        }>
      >(wildcardPath);

      expect(paramPath).toMatchSnapshot();
      expect(multiPath).toMatchSnapshot();
      expect(wildcardPath).toMatchSnapshot();

      // The `build` accepts valid params
      routes.Root.build();
      routes.Root.build({});
      routes.Root.build({ foo: "1" });

      // The `build` accepts valid params
      routes.Profile.build({ handle: "@ash.ketchum" });
      expect(() => {
        // @ts-expect-error The `build` method requires params
        routes.Profile.build();
      }).toThrowError();
      expect(() => {
        // @ts-expect-error The `build` method doesn't accept invalid params
        routes.Profile.build({ foo: "bar" });
      }).toThrowError();
      expect(() => {
        // @ts-expect-error All defined parameters are required
        routes.ValidWildcard.build({ bar: "foo" });
      }).toThrowError();
      expect(() => {
        // @ts-expect-error All defined parameters are required
        routes.ValidWildcard.build({ wildcard: "qux" });
      }).toThrowError();
      expect(() => {
        // @ts-expect-error All defined parameters are required
        routes.ValidWildcard.build({});
      }).toThrowError();
      // All defined parameters are required
      routes.ValidWildcard.build({ bar: "foo", wildcard: "qux" });

      expect(routes.Profile).toMatchSnapshot();
      expect(routes.ValidWildcard).toMatchSnapshot();
      expect(routes.DefinedRoute).toMatchSnapshot();

      // Strictly infers path types
      assertType<
        Readonly<{
          build(params: Record<string, unknown> | void): `/${string}`;
          id: "root";
          path: `/${string}`;
          test(href: MatchingHref): Record<string, unknown> | void | null;
          match(href: MatchingHref): boolean;
          toString(): "root";
        }>
      >(routes.Root);

      // Strictly infers path types
      assertType<
        Readonly<{
          build(params: Record<"handle", unknown>): `/${string}`;
          id: "profile";
          path: `/${string}`;
          test(href: MatchingHref): Record<"handle", unknown> | null;
          match(href: MatchingHref): boolean;
          toString(): "profile";
        }>
      >(routes.Profile);

      // Strictly infers wildcard path types
      assertType<
        Readonly<{
          build(params: Record<"wildcard" | "bar", unknown>): `/${string}`;
          id: "validWildcard";
          path: `/${string}/*`;
          test(href: MatchingHref): Record<"wildcard" | "bar", unknown> | null;
          match(href: MatchingHref): boolean;
          toString(): "validWildcard";
        }>
      >(routes.ValidWildcard);

      // Infers types for multiple parameters
      assertType<
        Readonly<{
          build(
            params?: Record<"pow" | "kaboom", unknown> | null | undefined
          ): `/${string}`;
          id: "definedRoute";
          path: `/${string}`;
          test(href: MatchingHref): Record<"pow" | "kaboom", unknown> | null;
          match(href: MatchingHref): boolean;
          toString(): "definedRoute";
        }>
      >(routes.DefinedRoute);

      const profileRoute = routes.find("/profiles/@ash.ketchum");

      expect(profileRoute).toEqual({
        id: "profile",
        path: "/profiles/:handle",
        params: { handle: "@ash.ketchum" },
      });
    });
  });
});

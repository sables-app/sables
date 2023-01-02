import { Path as ParserPath } from "path-parser";

import { AnyRoutePath, RoutePathType, WildCardPathType } from "./types";

/** @internal */
export const RAW_WILDCARD_PARAM_NAME = "*";

/** @internal */
export const PARSER_WILDCARD_PARAM_NAME = "wildcard";

/**
 * @public
 */
export type TemplatePath<Path extends AnyRoutePath, RawParamName> = Readonly<{
  /** @internal */
  _pieces?: ReadonlyArray<string>;
  /** @internal */
  _rawParamNames?: RawParamName[];
  path: Path;
}>;

/** @internal */
export type PathFromRawParamName<RawParamName> = Extract<
  RawParamName,
  typeof RAW_WILDCARD_PARAM_NAME
> extends never
  ? RoutePathType
  : WildCardPathType;

/** @internal */
export type PathFromParamName<ParamName> = Extract<
  ParamName,
  typeof PARSER_WILDCARD_PARAM_NAME
> extends never
  ? RoutePathType
  : WildCardPathType;

/** @internal */
export type TemplatePathFromRawParamName<RawParamName> = TemplatePath<
  PathFromRawParamName<RawParamName>,
  RawParamName
>;

type RawParamNameType = `:${string}` | typeof RAW_WILDCARD_PARAM_NAME;

/** @internal */
export type ExtractParamName<RawParamName> =
  RawParamName extends `:${infer ParamName}`
    ? ParamName
    : typeof PARSER_WILDCARD_PARAM_NAME;

/**
 * A helper function to assist in defining paths using [`definePath`](#definepath).
 * `defineParam` coerces TypeScript to infer a string literal type instead of `string`.
 * Writing `defineParam(":parameterName")` is effectively the same as writing
 * `":parameterName" as const`.
 *
 * @example
 *
 * const profilePath = definePath`/profiles/${defineParam(
 *   ":handle"
 * )}`;
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("profile", profilePath);
 *
 * @see {definePath}
 *
 * @public
 */
export function defineParam<RawParamName extends RawParamNameType>(
  rawParamName: RawParamName
): RawParamName {
  return rawParamName;
}

/**
 * A tagged template that enables strict typing of route parameters.
 * Using `definePath` for routes with many parameters is recommended but optional.
 *
 * Sables Router considers route parameter values to be user input,so they aren't trusted.
 * As a result, the types defined by `definePath` should only be used to check interface
 * compatibility. For example, `definePath` types can be used to check whether an associated
 * validation schema has correct property names.
 *
 * @see {@link https://sables.dev/docs/api#definepath definePath documentation}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates MDN: Tagged Template documentation}
 *
 * @example
 *
 * const routes = createRoutes()
 *   .set("root", "/")
 *   .set("profile", definePath`/profiles/${":handle"}`);
 *
 * // No type error
 * routes.Profile.build({ handle: "@ash.ketchum" });
 * // @ts-expect-error The `build` method doesn't accept invalid params
 * routes.Profile.build({ foo: "bar" });
 *
 * @public
 */
export function definePath<RawParamName>(
  pieces: TemplateStringsArray,
  ...rawParamNames: RawParamName[]
): TemplatePathFromRawParamName<RawParamName> {
  const path = pieces.reduce(
    (result, piece, index) => `${result}${piece}${rawParamNames[index] || ""}`,
    ""
  );

  assertRoutePathType(path);

  return {
    _pieces: pieces,
    _rawParamNames: rawParamNames,
    path: path as PathFromRawParamName<RawParamName>,
  };
}

/** @internal */
export function routePathToTemplatePath<Path extends RoutePathType>(
  path: Path
): TemplatePath<Path, unknown> {
  return { path };
}

/** @internal */
export function isWildCardPath(path: AnyRoutePath): path is WildCardPathType {
  return path.endsWith("/*");
}

/** @internal */
export function assertWildCardRoutePath(
  path: AnyRoutePath
): asserts path is WildCardPathType {
  if (!isWildCardPath(path)) {
    throw new Error(`The provided route path must be a wildcard path.`);
  }
}

/** @internal */
export function assertNotWildCardRoutePath(
  path: AnyRoutePath
): asserts path is RoutePathType {
  if (isWildCardPath(path)) {
    throw new Error(`The provided route path must not be a wildcard path.`);
  }
}

/** @internal */
export function assertWildCardRouteTemplatePath<ParamName = any>(
  templatePath: TemplatePath<any, ParamName>
): asserts templatePath is TemplatePath<WildCardPathType, ParamName> {
  if (!isWildCardPath(templatePath.path)) {
    throw new Error(`The provided route path must be a wildcard path.`);
  }
}

/** @internal */
export function assertNotWildCardRouteTemplatePath<ParamName = any>(
  templatePath: TemplatePath<any, ParamName>
): asserts templatePath is TemplatePath<RoutePathType, ParamName> {
  if (isWildCardPath(templatePath.path)) {
    throw new Error(`The provided route path must not be a wildcard path.`);
  }
}

/** @internal */
export function assertRoutePathType(
  path: string
): asserts path is RoutePathType {
  if (!path.startsWith("/")) {
    throw new Error("Route paths much begin with a forward slash (/).");
  }
}

/** @internal */
export function normalizeRoutePath<Path extends RoutePathType>(
  pathInput: Path | TemplatePath<Path, any>
): TemplatePath<Path, any> {
  return typeof pathInput == "string"
    ? routePathToTemplatePath(pathInput)
    : pathInput;
}

/** @internal */
export function createPathParser(
  templatePath: TemplatePath<AnyRoutePath, unknown>
) {
  const parserPath = isWildCardPath(templatePath.path)
    ? `${templatePath.path}${PARSER_WILDCARD_PARAM_NAME}`
    : templatePath.path;

  return new ParserPath(parserPath);
}

import type * as ReduxToolkit from "@reduxjs/toolkit";
import type * as Redux from "redux";

import { getBaseURL } from "./env.js";
import type {
  MutableReferenceObject,
  SlicesToReducersMapObject,
} from "./types.js";

/** @internal */
export function createMutableRef<T>(errorMessage?: string, initialValue?: T) {
  const ref: MutableReferenceObject<T> = {
    current: initialValue,
    error() {
      return new ReferenceError(
        errorMessage || "Value has not been initialized.",
      );
    },
    demand() {
      if (ref.current === undefined) {
        throw ref.error();
      }

      return ref.current;
    },
  };

  return ref;
}

/** @internal */
export function demandValue<T>(
  value?: T,
  message = "An expected value was not defined!",
) {
  return createMutableRef<T>(message, value).demand();
}

/** @internal */
export function composeMiddleware(
  ...middleware: Redux.Middleware[]
): Redux.Middleware {
  type InitFn = ReturnType<Redux.Middleware>;

  function identity<T>(val: T): T {
    return val;
  }

  function composeInitFns(funcs: InitFn[], next: Redux.Dispatch) {
    const last = funcs[funcs.length - 1];
    const rest = funcs.slice(0, -1);

    return rest.reduceRight(
      (composed, initFn) => initFn(composed),
      last(next || identity),
    );
  }

  return (middlewareAPI) => {
    const chain = middleware.map((middleware) => middleware(middlewareAPI));
    return (next) => {
      const dispatch = composeInitFns(chain, next);
      return (action) => dispatch(action);
    };
  };
}

/** @internal */
export function resolveAssetPath(assetPath: string) {
  const assetsBase = getBaseURL();

  try {
    return new URL(assetPath, assetsBase).toString();
  } catch (error) {
    return new URL(
      assetPath,
      new URL(assetsBase, "http://example.com/").toString(),
    ).pathname;
  }
}

/** @internal */
export function createReducersMapObject<P extends [...ReduxToolkit.Slice[]]>(
  ...slices: P
): SlicesToReducersMapObject<P> {
  return slices.reduce<any>((result, slice) => {
    return { ...result, [slice.name]: slice.reducer };
  }, {});
}

/** @internal */
export function capitalize<T extends string>(name: T) {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}` as Capitalize<T>;
}

/**
 * CSS-in-JS utility to facilitate in creating responsive design tokens
 *
 * @public
 */
export function responsiveToken(scaling: number[], base: number, unit = "rem") {
  return scaling.map((scale) => `${scale * base}${unit}`);
}

import type * as ReduxToolkit from "@reduxjs/toolkit";

export interface MutableReferenceObject<T> {
  current?: T;
  /**
   * @throws {@link ReferenceError}
   * This exception is thrown if the value is `undefined`.
   */
  demand(): T;
  /**
   * Creates a `ReferenceError` to be handled.
   */
  error(): ReferenceError;
}

export type MutableReferenceObjectValue<T> = T extends MutableReferenceObject<
  infer Value
>
  ? Value
  : never;

type SliceName<T> = T extends ReduxToolkit.Slice ? T["name"] : never;
type SliceReducer<T> = T extends ReduxToolkit.Slice ? T["reducer"] : never;
type IndexKeys<A extends readonly unknown[]> = Exclude<keyof A, keyof []>;

export type SlicesToReducersMapObject<P extends [...ReduxToolkit.Slice[]]> = {
  [K in IndexKeys<P> as SliceName<P[K]>]: SliceReducer<P[K]>;
};

export declare type NoInfer<T> = [T][T extends any ? 0 : never];

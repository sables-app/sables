# @sables/core

## 0.14.0

### Minor Changes

- f27b4c0: Update notable entities to create selectors for selecting entity IDs, e.g. `selectBestBookId()`.

## 0.13.0

### Minor Changes

- bb1f6ca: Add `extendAction` function.
- 775312a: Re-export `AnyAction`, `Dispatch`, and `Middleware` types from Redux for convenience.

### Patch Changes

- bb1f6ca: Copy action dependencies when extending actions in `createSideEffectActions`.

## 0.12.1

### Patch Changes

- 4b468df: Fix incorrect inferred case reducer types when using `builder.addMatcher` without `builder.addDefaultCase`.

## 0.11.0

### Minor Changes

- 3cf28c4: Add `useActionCallback` hook.
- 3cf28c4: Rename `useWithDispatch` to `useAction`.

## 0.10.0

### Minor Changes

- cf721c6: Update `withProps` to accept a transform function.

## 0.9.1

### Patch Changes

- 4bfe027: Add missing reducer types to `EntitySlice`

## 0.9.0

### Minor Changes

- fd33a77: Expose entity adapter on entity slices.

## 0.7.1

### Patch Changes

- 9903795: Export `Selector` from `reselect`

## 0.7.0

### Minor Changes

- 31bdf2c: Add `distinctEntitySelectors` to assign distinctive names to entity adapter selectors. Update `createEntitySlice` to use `distinctEntitySelectors`.

## 0.6.0

### Minor Changes

- 4248daa: Export `Dictionary` from `@reduxjs/toolkit`.

## 0.5.2

### Patch Changes

- 8be70ce: Add `EntitySelectors` type to `EntitySlice`

## 0.5.1

### Patch Changes

- 66c78ca: Widen `Entity` generic to allow entity types to be defined using `interface`.

## 0.5.0

### Minor Changes

- ef12f71: Add `createEntitySlice` function

### Patch Changes

- 76f8a8c: Update `createSideEffect` documentation

## 0.4.0

### Minor Changes

- e93bc6e: Update `useSideEffect` to return an object

## 0.3.0

### Minor Changes

- 197bdac: Refactor `createSideEffect` to accept action creators

## 0.2.0

### Minor Changes

- 058d952: Rewrite `createSlice` to use a fluent interface

## 0.1.2

### Patch Changes

- 8863895: Move React to peer dependencies
- db2f705: Rename internal test export

## 0.1.1

### Patch Changes

- e5d4a08: Fix `Link` component `hash` handling

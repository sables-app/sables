---
"@sables/core": minor
"@sables-app/example-side-effects": patch
"@sables-app/docs": patch
---

Update `useSideEffect` to return an object

- `start` — A function to dispatch the side effect's start action, triggering the side effect.
- `isAwaiting` — A boolean that represents whether the side effect is currently awaiting resolution.
- `latest` — An end action resolved from the latest side effect call.

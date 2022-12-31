import { useSideEffect } from "@sables/framework";

import { FormEventHandler, useCallback } from "react";

import { searchDogs } from "./sideEffects.js";

function submissionToPayload(
  event: React.FormEvent<HTMLFormElement>
): Record<string, unknown> | undefined {
  const formEl = event.nativeEvent.target;

  if (!(formEl instanceof HTMLFormElement)) {
    return undefined;
  }

  return Object.fromEntries(new FormData(formEl).entries());
}

function useSubmitHandler() {
  const [startSearch, isSearching] = useSideEffect(searchDogs);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();

      startSearch(
        // Cast assumes the payload is valid
        submissionToPayload(event) as any
      );
    },
    [startSearch]
  );

  return [handleSubmit, isSearching] as const;
}

export function HomeScreen() {
  const [handleSubmit, isSearching] = useSubmitHandler();

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Dog name <input type="text" name="name" />
      </label>
      <button disabled={isSearching} type="submit">
        Search
      </button>
    </form>
  );
}

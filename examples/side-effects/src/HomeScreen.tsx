import { useSideEffect } from "@sables/framework";

import { FormEventHandler, useCallback } from "react";

import { dogSearch } from "./actions.js";

function submissionToPayload(
  event: React.FormEvent<HTMLFormElement>
): Record<string, unknown> | undefined {
  const formEl = event.nativeEvent.target;

  if (!(formEl instanceof HTMLFormElement)) {
    return undefined;
  }

  return Object.fromEntries(new FormData(formEl).entries());
}

export function HomeScreen() {
  const [startSearch, isAwaiting] = useSideEffect(dogSearch);

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

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Dog name <input type="text" name="name" />
      </label>
      <button disabled={isAwaiting} type="submit">
        Search
      </button>
    </form>
  );
}

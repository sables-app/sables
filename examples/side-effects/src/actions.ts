import { createSideEffect, PayloadAction } from "@sables/framework";

import { Dog, dogsSlice } from "./dogsSlice.js";

async function fetchDogs(action: PayloadAction<Partial<Dog>>) {
  // Delay the response
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (action.payload.name === "error") {
    return new Error("Bad Request");
  }

  return [
    {
      id: 1,
      name: "Fei",
      breed: "Labrador Retriever",
      dob: null,
    },
    {
      id: 2,
      name: "Ekko",
      breed: "Labrador Retriever",
      dob: null,
    },
  ];
}

export const dogSearch = createSideEffect("dogSearch", fetchDogs).dependsUpon(
  dogsSlice
);

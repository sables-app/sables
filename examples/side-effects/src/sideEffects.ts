import { createAction, createSideEffect } from "@sables/framework";

import { Dog, dogsSlice } from "./dogsSlice.js";

export const searchDogs = createSideEffect(
  createAction<Partial<Dog>>("searchDogs/start"),
  createAction<void | Error>("searchDogs/end"),
  async (action, effectAPI) => {
    if (action.payload.name === "error") {
      return new Error("Bad Request");
    }

    effectAPI.dispatch(
      dogsSlice.actions.addDogs([
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
      ]),
    );
  },
);

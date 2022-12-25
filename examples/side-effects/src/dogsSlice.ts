import {
  createEntityAdapter,
  createSlice,
  entityAdapterToReducers,
} from "@sables/framework";

import { dogSearch } from "./actions.js";

export interface Dog {
  id: number;
  name: string;
  breed: string;
  dob: number | null;
}

const dogsEntityAdapter = createEntityAdapter<Dog>({
  selectId: ({ id }) => id,
  sortComparer: (dogA, dogB) => dogA.name.localeCompare(dogB.name),
});

export const dogsSlice = createSlice({
  name: "dogs",
  initialState: dogsEntityAdapter.getInitialState(),
  reducers: entityAdapterToReducers(dogsEntityAdapter, "dog"),
  extraReducers(builder) {
    builder.addCase(dogSearch.actions.end, (state, action) => {
      dogsEntityAdapter.addMany(state, action);
    });
  },
});
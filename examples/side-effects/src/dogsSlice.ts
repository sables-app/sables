import {
  createEntityAdapter,
  createSlice,
  entityAdapterToReducers,
} from "@sables/framework";

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

export const dogsSlice = createSlice(
  "dogs",
  dogsEntityAdapter.getInitialState()
).setReducer((builder) =>
  builder.addCases(entityAdapterToReducers(dogsEntityAdapter, "dog"))
);

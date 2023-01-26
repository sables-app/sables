// import * as ReduxToolkit from "@reduxjs/toolkit/dist/redux-toolkit.modern.js";
// import * as ReduxToolkitMod from "@reduxjs/toolkit/dist/redux-toolkit.cjs.development.js";
import * as ReduxToolkitMod from "@reduxjs/toolkit/dist/redux-toolkit.cjs.production.min.js";

const ReduxToolkit = ReduxToolkitMod.default || ReduxToolkitMod;

const {
  combineReducers,
  configureStore,
  createEntityAdapter,
  createReducer,
  createSelector,
  createSlice,
} = ReduxToolkit;

export {
  combineReducers,
  configureStore,
  createEntityAdapter,
  createReducer,
  createSelector as createSelectorReduxToolkit,
  createSlice as createSliceReduxToolkit,
};

/// <reference lib="dom" />

import { createRouter } from "@sables/router";

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { createRoot } from "react-dom/client";

import App from "./App.js";
import { routes } from "./routes.js";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const container = document.getElementById("root")!;
const router = createRouter({ initialRoutes: routes });
const store = configureStore({
  reducer: combineReducers(router.reducersMap),
  middleware: [router.middleware],
});
const history = router.initialize(store);

createRoot(container).render(<App store={store} />);

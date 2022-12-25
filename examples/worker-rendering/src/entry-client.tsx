/// <reference lib="dom" />

import { shouldHydrate } from "@sables/ssr";

import { createRoot, hydrateRoot } from "react-dom/client";

import App from "./App.js";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const container = document.getElementById("root")!;

if (shouldHydrate()) {
  hydrateRoot(container, <App />);
} else {
  createRoot(container).render(<App />);
}

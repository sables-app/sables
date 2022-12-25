/// <reference lib="dom" />

import { createRoot } from "react-dom/client";

import App from "./App.js";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const container = document.getElementById("root")!;

createRoot(container).render(<App />);

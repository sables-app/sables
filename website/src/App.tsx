import { Provider } from "@sables/ssr";

import { StrictMode } from "react";
import { HelmetProvider } from "react-helmet-async";

import { ThemeProvider } from "./components/mod.js";
import { configureManager } from "./configureManager.js";
import { ScreenSwitch } from "./screens/mod.js";

export default function App() {
  return (
    <StrictMode>
      <Provider configureManager={configureManager}>
        <HelmetProvider>
          <ThemeProvider>
            <ScreenSwitch />
          </ThemeProvider>
        </HelmetProvider>
      </Provider>
    </StrictMode>
  );
}

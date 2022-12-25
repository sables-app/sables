import { createManager, Provider } from "@sables/framework";

import { HomeScreen } from "./HomeScreen.js";
import { initialRoutes } from "./initialRoutes.js";

function configureManager() {
  return createManager({ initialRoutes });
}

export default function App() {
  return (
    <Provider configureManager={configureManager}>
      <HomeScreen />
    </Provider>
  );
}

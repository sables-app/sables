import { createManager, defineConfigureManager } from "@sables/framework";

import { translate } from "./i18n.js";
import routes from "./routes/mod.js";
import { AppEffectAPI } from "./types.js";

export const configureManager = defineConfigureManager(
  ({ initialLocation }) => {
    return createManager({
      effectAPI: (defaults): AppEffectAPI => ({ ...defaults, translate }),
      initialLocation,
      initialRoutes: routes,
      middleware: (getDefaults) => [...getDefaults({ thunk: false })],
    });
  },
);

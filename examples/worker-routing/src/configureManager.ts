import { ConfigureManagerParams, createManager } from "@sables/framework";

import { routes } from "./routes.js";

export function configureManager({ initialLocation }: ConfigureManagerParams) {
  return createManager({
    initialLocation,
    initialRoutes: routes,
  });
}

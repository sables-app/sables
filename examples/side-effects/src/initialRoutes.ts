import { createRouteEffects, createRoutes } from "@sables/framework/router";

import { searchDogs } from "./sideEffects.js";

export const initialRoutes = createRoutes()
  .set("root", "/")
  .setEffects(() =>
    createRouteEffects().append("root", async (_action, effectAPI) => {
      await searchDogs(effectAPI, { name: "Rex" });
    }),
  );

import { createRouteEffects, createRoutes } from "@sables/framework/router";

import { dogSearch } from "./actions.js";

export const initialRoutes = createRoutes()
  .set("root", "/")
  .setEffects(() =>
    createRouteEffects().append("root", async (_action, effectAPI) => {
      await dogSearch(effectAPI, { name: "Rex" });
    })
  );

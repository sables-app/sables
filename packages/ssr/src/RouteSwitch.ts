import { createRouteSwitchCreator } from "@sables/framework/router";

import { lazy } from "./lazy.js";

export const createRouteSwitch = createRouteSwitchCreator(lazy);

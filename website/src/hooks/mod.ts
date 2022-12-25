import { defineEffectAPIHook } from "@sables/framework";

import { AppEffectAPI } from "../types.js";

export const useApp = defineEffectAPIHook<AppEffectAPI>();

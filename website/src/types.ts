import { ExtendEffectAPI } from "@sables/framework";

import type { translate } from "./i18n.js";

export type AppEffectAPI = ExtendEffectAPI<{ translate: typeof translate }>;

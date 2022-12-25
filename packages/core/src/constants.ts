/**
 * A unique symbol used to set references to lazy slices.
 * @internal
 */
export const SYMBOL_LAZY_META = Symbol("@sables/lazyMeta");
/**
 * A unique symbol used to determine whether a value is a lazy selector.
 * @internal
 */
export const SYMBOL_LAZY_SELECTOR = Symbol("@sables/lazySelector");
/**
 * A unique symbol used by route effect creators,
 * to store state on the `effectAPI` object.
 * @internal
 */
// prettier-ignore
export const SYMBOL_EFFECT_API_EFFECT_STATE = Symbol("@sables/EffectAPI/effectsState");
/**
 * A unique symbol to hold route metadata.
 * @internal
 */
export const SYMBOL_ROUTE_EFFECTS_META = Symbol("@sables/routeEffectsMeta");
/**
 * A unique symbol to hold routes metadata.
 * @internal
 */
export const SYMBOL_ROUTES_META = Symbol("@sables/routesMeta");
/**
 * A unique symbol to identify routes collection objects.
 * @internal
 */
// prettier-ignore
export const SYMBOL_ROUTES_COLLECTION_INSTANCE = Symbol("@sables/routesCollection");
/**
 * A unique symbol for routes collection instances on Effect API objects.
 * @internal
 */
// prettier-ignore
export const SYMBOL_EFFECT_API_ROUTES = Symbol("@sables/EffectAPI/routesCollection");
/**
 * A unique symbol for routes collection instances on Store objects.
 * @internal
 */
// prettier-ignore
export const SYMBOL_STORE_ROUTES = Symbol("@sables/Store/routesCollection");
/**
 * A unique symbol for lifecycle instances on Effect API objects.
 * @internal
 */
// prettier-ignore
export const SYMBOL_EFFECT_API_LIFECYCLE = Symbol("@sables/EffectAPI/lifecycleRef");
/**
 * A unique symbol for the effect API reference on Manager objects.
 * @internal
 */
// prettier-ignore
export const SYMBOL_MANAGER_EFFECT_API = Symbol("@sables/Manager/EffectAPI");
/**
 * @internal
 */
// prettier-ignore
export const PROPERTY_EFFECT_ACTIONS_ID = `__sablesEffectActionsID`;
/**
 * @internal
 */
// prettier-ignore
export const PROPERTY_EFFECT_ACTIONS_START_ACTION = `__sablesEffectActionsStartAction`;
/**
 * The attribute used during server-side operations to transport data.
 * @internal
 */
export const SSR_ATTRIBUTE = "data-sables-ssr";
/**
 * Attribute values used by `SSR_ATTRIBUTE`.
 * @internal
 */
export const ssrAttrValues = {
  /**
   * Signifies element containing application data.
   */
  APP_STATE: "appState",
  /**
   * Signifies that the application has been server-side rendered and should be hydrated.
   */
  SHOULD_HYDRATE: "hydrate",
} as const;
/** @internal */
export const LIFECYCLE_REF_MESSAGE = "No lifecycle found in context.";
/** @internal */
// prettier-ignore
export const SERVER_REQUEST_STATE_REF_MESSAGE = "No server request state found in context.";
/** @internal */
// prettier-ignore
export const ROUTES_COLLECTION_REF_MESSAGE = "No routes collection found in effect API.";
/** @internal */
// prettier-ignore
export const EFFECT_API_REF_MESSAGE = "Effect API has not been initialized.";

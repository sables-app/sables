import { createImportTagsPlugin } from "./ImportTagsPlugin.js";

export * from "./types.js";
export * from "./utils.js";

// Cast to `any`, because of conflicts between Rollup and Vite plugin types
const plugin: any = createImportTagsPlugin;

export { plugin as importTags, plugin as default };

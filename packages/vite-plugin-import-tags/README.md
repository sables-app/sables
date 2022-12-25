# `@sables/vite-plugin-import-tags`

> Tags dynamic imports for server-side rendered module preload links.

Tags dynamic imports, and generates a manifest mapping them to source files. The manifest can then be used for preloading chunks for server-side rendering. This functionality is similar to the [Loadable Components](https://loadable-components.com/) Babel Plugin.

The tag used on the dynamic imports is a call to a noop function. A noop function is used to prevent optimizers from removing the tag, as is often the case with comments and string directives.

This plugin is used by the Sables CLI during its `build` command.
Please view [the CLI documentation](https://sables.dev/docs/api#cli) for more information.

### Todo

- [ ] Update pattern to _not_ tag imports in comments.
  - It doesn't break anything, and comments are typically removed from bundles anyway, so this is very low priority.

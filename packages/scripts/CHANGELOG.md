# @sables-app/scripts

## 1.0.3

### Patch Changes

- 7743bfc: Manually specify prettier plugin.

## 1.0.2

### Patch Changes

- c77292e: Allow non-null assertions and unban `{}`

## 1.0.1

### Patch Changes

- c2fd876: Update ESLint config to allow for TypeScript namespaces

## 1.0.0

### Major Changes

- 95bb928: Update module import style

  - Replace `eslint-plugin-simple-import-sort` with `@ianvs/prettier-plugin-sort-imports`
  - Add `.prettierrc.js` to `@sables-app/scripts`
    - Consumers should put `module.exports = require("@sables-app/scripts/prettierrc");` in their `prettierrc.js`

## 0.1.5

### Patch Changes

- 1191f44: chore(deps): Bump prettier from 2.8.3 to 2.8.8

## 0.1.4

### Patch Changes

- 5460928: Publish dev packages to public registry install of GitHub Packages

## 0.1.3

### Patch Changes

- 25b0c64: chore(deps): Bump eslint-plugin-react from 7.32.1 to 7.32.2

## 0.1.2

### Patch Changes

- c3e3981: chore(deps): Bump eslint-plugin-react from 7.31.11 to 7.32.1

## 0.1.1

### Patch Changes

- 4c20bb7: chore(deps): Bump @typescript-eslint/eslint-plugin from 5.47.0 to 5.47.1
- bc75bf2: chore(deps): Bump eslint from 8.30.0 to 8.31.0
- d58e0de: chore(deps): Bump @typescript-eslint/parser from 5.47.0 to 5.47.1

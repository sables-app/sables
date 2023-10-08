---
"@sables-app/scripts": major
---

Update module import style

- Replace `eslint-plugin-simple-import-sort` with `@ianvs/prettier-plugin-sort-imports`
- Add `.prettierrc.js` to `@sables-app/scripts`
  - Consumers should put `module.exports = require("@sables-app/scripts/prettierrc");` in their `prettierrc.js`

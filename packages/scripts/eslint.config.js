module.exports = {
  root: true,
  plugins: ["prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          // Unban `{}`, because it's useful, and I know what I'm doing.
          // `{}` is often used as a generic type with libraries,
          // and using `Record<string, unknown>` would be inappropriate.
          "{}": false,
        },
        extendDefaults: true,
      },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    // Namespaces are be useful for grouping things within a module without exposing private functionality.
    // They can also be used as a more readable alternative to a plain object.
    // Lastly, they allow for static class members without ingheritence.
    // They should NOT be used as a replacement for a module.
    "@typescript-eslint/no-namespace": "off",
    // Allow private declarations in namespaces.
    "no-inner-declarations": "off",
    // Non-null assertions are useful. It's not like `any` where you're saying "I don't know what this is".
    // You're saying "I know what this is, and it's not null or undefined".
    "@typescript-eslint/no-non-null-assertion": "off",
    // TypeScript has built in support for this.
    "@typescript-eslint/no-unused-vars": "off",
    "react-hooks/exhaustive-deps": "error",
    // Not necessary when using JSX pragma
    "react/jsx-uses-react": "off",
    // Not necessary when using JSX pragma
    "react/react-in-jsx-scope": "off",
  },
};

module.exports = {
  root: true,
  plugins: ["prettier", "simple-import-sort"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "react-hooks/exhaustive-deps": "error",
    // Not necessary when using JSX pragma
    "react/jsx-uses-react": "off",
    // Not necessary when using JSX pragma
    "react/react-in-jsx-scope": "off",
    "simple-import-sort/imports": [
      2,
      {
        groups: [
          // Side effect imports
          ["^\\u0000"],
          // Organization packages
          ["^@sables.+$"],
          // Node packages
          ["^node:.+$"],
          // External packages
          ["^@?\\w.+$"],
          // Relative imports
          ["^\\..+$"],
        ],
      },
    ],
  },
};

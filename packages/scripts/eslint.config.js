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
    "@typescript-eslint/no-explicit-any": "off",
    // Namespaces are be useful for grouping things within a module without exposing private functionality.
    // They can also be used as a more readable alternative to a plain object.
    // They should NOT be used as a replacement for a module.
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "react-hooks/exhaustive-deps": "error",
    // Not necessary when using JSX pragma
    "react/jsx-uses-react": "off",
    // Not necessary when using JSX pragma
    "react/react-in-jsx-scope": "off",
  },
};

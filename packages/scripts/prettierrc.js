// eslint-disable-next-line no-undef
module.exports = {
  overrides: [
    {
      files: ["docs/**/*.mdx"],
      options: { printWidth: 60 },
    },
  ],
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
    // Organization packages
    "^@sables",
    "sables",
    "",
    // Node.js built-in modules
    "<BUILTIN_MODULES>",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    // Relative imports
    "^[.]",
  ],
};

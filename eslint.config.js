import eslintPluginAstro from "eslint-plugin-astro";

export default [
  // Astro files - use default recommended config
  ...eslintPluginAstro.configs.recommended,

  // JavaScript files
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        requestAnimationFrame: "readonly",
        performance: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        MutationObserver: "readonly",
        getComputedStyle: "readonly",
        Image: "readonly",
        Math: "readonly",
        Date: "readonly",
        Infinity: "readonly",
        parseInt: "readonly",
        JSON: "readonly",
      },
    },
    rules: {
      // Error prevention
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "no-undef": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Code quality
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-empty-function": "warn",
      "no-duplicate-imports": "error",
      "prefer-const": "warn",
      "no-var": "error",

      // Best practices
      eqeqeq: ["warn", "always", { null: "ignore" }],
      curly: ["warn", "multi-line"],
      "no-else-return": "warn",
    },
  },

  // Ignore patterns
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "node_modules/**",
      "*.config.mjs",
      "*.config.js",
    ],
  },
];

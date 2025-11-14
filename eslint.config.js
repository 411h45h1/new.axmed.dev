import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  // TypeScript files - must come before Astro to avoid conflicts
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts"],
  })),
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["warn", "always", { null: "ignore" }],
    },
  },

  // Astro files
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
    ignores: ["dist/**", ".astro/**", "node_modules/**", "*.config.mjs", "*.config.js"],
  },
];

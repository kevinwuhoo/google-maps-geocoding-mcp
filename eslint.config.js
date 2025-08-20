import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Global configuration
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },

  // Rules configuration
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-console": "off",
      // Allow any in this codebase - error handling and dynamic API objects are reasonable uses
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // File-specific configuration for non-test TypeScript files
  {
    files: ["src/**/*.ts", "!src/**/*.test.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },

  // Configuration for test files (without strict TypeScript project checking)
  {
    files: ["src/**/*.test.ts"],
    languageOptions: {
      parserOptions: {
        project: null, // Don't use TypeScript project for test files
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Allow any in tests for mocking
    },
  },

  // Ignore patterns
  {
    ignores: ["dist/", "*.js", "*.cjs", "*.mjs", "node_modules/"],
  }
);

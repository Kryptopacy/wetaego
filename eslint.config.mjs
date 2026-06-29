import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "launch-video/**",
    "next-env.d.ts",
    // Test output directories:
    "test-results/**",
    "playwright-report/**",
    "trash2/**",
    "trash4/**",
    // Manual testing scripts
    "*.js",
    "test_demo_*.ts",
    "public/**"
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      "no-console": ["error", { allow: ["warn", "error", "info"] }],
      "react/no-unescaped-entities": "off"
    }
  }
]);

export default eslintConfig;

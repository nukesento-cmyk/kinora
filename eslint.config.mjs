import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: { rootDir: ["apps/web/", "apps/admin/"] },
    },
    rules: {
      // Keep domain boundaries: apps talk to the database only through @kinora/core.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@kinora/db", "@kinora/db/*"],
              message: "Apps must not query the database directly. Use a @kinora/core service.",
            },
          ],
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Core is the one layer allowed to use the database package.
    files: ["packages/core/**", "packages/db/**"],
    rules: { "no-restricted-imports": "off" },
  },
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/next-env.d.ts",
    "packages/db/migrations/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

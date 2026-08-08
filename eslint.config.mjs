import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * E02: "No component in any later PR introduces a raw hex value, font size, or
 * spacing literal; enforced by a lint rule."
 *
 * Scoped to UI code. src/design/tokens.ts is the one place hex values may live
 * in TypeScript — it mirrors globals.css for the styleguide and contrast test.
 */
const noRawDesignValues = [
  "error",
  {
    selector: "Literal[value=/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?\\b/]",
    message:
      "Raw hex colour. Use a semantic token utility (bg-surface, text-brand); values live in globals.css and src/design/tokens.ts.",
  },
  {
    selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?\\b/]",
    message: "Raw hex colour in a template literal. Use a semantic token utility instead.",
  },
  {
    selector: "Literal[value=/\\b\\d+(\\.\\d+)?px\\b/]",
    message:
      "Raw px value. Use a spacing, radius, or type token (p-card, rounded-lg, text-caption).",
  },
  {
    selector: "TemplateElement[value.raw=/\\b\\d+(\\.\\d+)?px\\b/]",
    message: "Raw px value in a template literal. Use a token-backed utility instead.",
  },
  {
    // Tailwind arbitrary values would otherwise smuggle raw values past the above.
    selector: "Literal[value=/\\[(#|\\d+(\\.\\d+)?(px|rem))/]",
    message:
      "Tailwind arbitrary value with a raw design value. Add a token rather than inlining one.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": noRawDesignValues },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vitest coverage output. Gitignored, but flat config does not read
    // .gitignore, so it has to be listed here too.
    "coverage/**",
  ]),
]);

export default eslintConfig;

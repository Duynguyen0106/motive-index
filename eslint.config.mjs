import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "src/data/bulkCaseDefs.generated.json",
    "src/data/imported/**",
    "src/data/caseImageCatalog.generated.json",
  ]),
]);

export default eslintConfig;

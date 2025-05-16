// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginJest from "eslint-plugin-jest";

export default tseslint.config(
    {
        ignores: ["dist/*", "node_modules/*", "**/*.js", "src/grammar/parser.ts"],
    },
    {
        plugins: { jest: pluginJest },
        rules: {
            "jest/no-disabled-tests": "warn",
            "jest/no-focused-tests": "error",
            "jest/no-identical-title": "error",
            "jest/prefer-to-have-length": "warn",
            "jest/valid-expect": "error",
        },
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-empty-object-type": "warn",
        },
    }
);

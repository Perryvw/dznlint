import type { DznLintConfiguration } from "./dznlint-configuration";

export const DEFAULT_DZNLINT_CONFIG: DznLintConfiguration = {
    "format": {
        indent: "spaces",
        indentWidth: 4,
        braces:  "next-line"
    },

    "naming-convention": {
        component: ".*",
        enum: ".*",
        interface: ".*",
        system: ".*",
        type: ".*"
    }
};
import type { DznLintConfiguration } from "./dznlint-configuration";

export const DEFAULT_DZNLINT_CONFIG: DznLintConfiguration = {
    format: {
        indent: "spaces",
        indentWidth: 4,
        braces:  "next-line"
    },

    naming_convention: {
        component: "[A-Z][a-zA-Z0-9]*",
        enum: "[A-Z][a-zA-Z0-9]*",
        enum_member: "[A-Z][a-zA-Z0-9]*",
        interface: "I[A-Z][a-zA-Z0-9]*",
        local: "[a-z_][a-zA-Z0-9]*",
        type: "[A-Z][a-zA-Z0-9]*"
    }
};
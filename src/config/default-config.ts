import type { DznLintConfiguration } from "./dznlint-configuration";

export const DEFAULT_DZNLINT_CONFIG_FILE = "dznlint.config.json";

export const DEFAULT_DZNLINT_CONFIG: DznLintConfiguration = {
    // format: {
    //     indent: "spaces",
    //     indentWidth: 4,
    //     braces:  "next-line"
    // },

    dead_code: "error",
    implicit_illegal: "warning",
    inline_temporary_variables: "hint",
    naming_convention: [
        "hint",
        {
            component: "[A-Z][a-zA-Z0-9]*",
            enum: "[A-Z][a-zA-Z0-9]*",
            enum_member: "[A-Z][a-zA-Z0-9]*",
            interface: "I[A-Z][a-zA-Z0-9]*",
            local: "[a-z_][a-zA-Z0-9]*",
            type: "[A-Z][a-zA-Z0-9]*",
        },
    ],
    no_duplicate_parameters: "error",
    no_recursive_system: "error",
    no_shadowing: "error",
    no_unknown_port_binding: "error",
    no_unused_instances: "warning",
    no_unused_parameters: "warning",
    no_unused_ports: "warning",
    no_unused_variables: "warning",
    parameter_direction: "warning",
};

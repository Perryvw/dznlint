import type { DznLintConfiguration, DznLintFormatConfiguration } from "./dznlint-configuration";

export const DEFAULT_DZNLINT_CONFIG_FILE = "dznlint.config.json";

type DefaultDznLintConfig = {
    [K in keyof DznLintConfiguration]: false | DznLintConfiguration[K];
};

export const DEFAULT_DZNLINT_CONFIG: DefaultDznLintConfig = {
    call_arguments_must_match: "error",
    dead_code: "error",
    implicit_illegal: "warning",
    inline_temporary_variables: false,
    invariant_must_be_bool: "error",
    naming_convention: false,
    never_fired_event: "warning",
    never_legal_event: "warning",
    no_bool_out_parameters: "error",
    no_duplicate_parameters: "error",
    no_duplicate_port_binding: "error",
    no_empty_defer_capture: "warning",
    no_mismatching_binding_types: "error",
    no_recursive_system: "error",
    no_shadowing: "warning",
    no_unconnected_ports: "error",
    no_unknown_imports: "error",
    no_unknown_variables: "error",
    no_unused_instances: "warning",
    no_unused_parameters: "warning",
    no_unused_ports: "warning",
    no_unused_variables: "warning",
    on_parameters_must_match: "error",
    parameter_direction: "warning",
    port_missing_redundant_blocking: false,
    port_parameter_direction: "error",
    trailing_assignments: false,
};

export const DEFAULT_DZNLINT_FORMAT_CONFIG: DznLintFormatConfiguration = {
    indent: ["spaces", 4],
    braces: "next-line",
    indent_components_interfaces: true,
    target_width: 80,
};

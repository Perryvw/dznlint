export type ConfigSeverity = "error" | "warning" | "hint";
export type ConfigValue = ConfigSeverity;
export type ConfigValueWithData<T> = [ConfigSeverity, T];

export interface DznLintConfiguration {
    // Format configuration
    // format: {
    //     indent: "tabs" | "spaces",
    //     indentWidth: number,
    //     braces: "same-line" | "next-line"
    // };
    // Rule configuration
    call_arguments_must_match: ConfigValue;
    dead_code: ConfigValue;
    implicit_illegal: ConfigValue;
    inline_temporary_variables: ConfigValue;
    naming_convention: ConfigValueWithData<{
        component: string;
        enum: string;
        enum_member: string;
        interface: string;
        local: string;
        type: string;
    }>;
    never_fired_event: ConfigValue;
    never_legal_event: ConfigValue;
    no_bool_out_parameters: ConfigValue;
    no_duplicate_parameters: ConfigValue;
    no_duplicate_port_binding: ConfigValue;
    no_empty_defer_capture: ConfigValue;
    no_mismatching_binding_types: ConfigValue;
    no_recursive_system: ConfigValue;
    no_shadowing: ConfigValue;
    no_unconnected_ports: ConfigValue;
    no_unknown_imports: ConfigValue;
    no_unknown_variables: ConfigValue;
    no_unused_instances: ConfigValue;
    no_unused_parameters: ConfigValue;
    no_unused_variables: ConfigValue;
    on_parameters_must_match: ConfigValue;
    parameter_direction: ConfigValue;
    port_missing_redundant_blocking: ConfigValue;
}

export type UserRuleConfig<TRule extends keyof DznLintConfiguration> =
    //false
    //| ConfigValue
    DznLintConfiguration[TRule] extends ConfigValueWithData<infer TData>
        ? Partial<TData> | [string, Partial<TData>]
        : ConfigValue;

// Make all items optional, partial, and assignable with 'false' (to disable)
export type DznLintUserConfiguration = {
    [P in keyof DznLintConfiguration]?: false | ConfigSeverity | DznLintConfiguration[P];
};

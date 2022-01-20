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
    dead_code: ConfigValue,
    implicit_illegal: ConfigValueWithData<"always" | "never">,
    naming_convention: ConfigValueWithData<{
        component: string,
        enum: string,
        enum_member: string,
        interface: string,
        local: string,
        type: string
    }>;
}

export type UserRuleConfig<TRule extends keyof DznLintConfiguration> =
    //false
    //| ConfigValue
    DznLintConfiguration[TRule] extends ConfigValueWithData<infer TData>
        ? Partial<TData> | [string, Partial<TData>]
        : ConfigValue;

// Make all items optional, partial, and assignable with 'false' (to disable)
export type DznLintUserConfiguration = {
    [P in keyof DznLintConfiguration]?: false | DznLintConfiguration[P];
};

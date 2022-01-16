export interface DznLintConfiguration {
    // Format configuration
    format: {
        indent: "tabs" | "spaces",
        indentWidth: number,
        braces: "same-line" | "next-line"
    };
    // Rule configuration
    naming_convention: {
        component: string,
        enum: string,
        enum_member: string,
        interface: string,
        local: string,
        type: string
    };
}

// Make all items optional, partial, and assignable with 'false' (to disable)
export type DznLintUserConfiguration = {
    [P in keyof DznLintConfiguration]?: Partial<DznLintConfiguration[P]> | false;
};

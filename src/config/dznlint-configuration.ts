export interface DznLintConfiguration {
    // Format configuration
    "format": {
        indent: "tabs" | "spaces",
        indentWidth: number,
        braces: "same-line" | "next-line"
    };
    // Rule configuration
    "naming-convention": {
        component: string,
        enum: string,
        interface: string,
        system: string,
        type: string
    };
}

// Make all items optional, partial, and assignable with 'false' (to disable)
export type DznLintUserConfiguration = {
    [P in keyof DznLintConfiguration]?: Partial<DznLintConfiguration[P]> | false;
};

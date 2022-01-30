import { DznLintUserConfiguration } from "./dznlint-configuration";

export function validateConfiguration(config: DznLintUserConfiguration): { valid: false, issues: string[] } | { valid: true } {
    void config;
    return { valid: true };
}
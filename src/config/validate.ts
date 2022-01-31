import { DEFAULT_DZNLINT_CONFIG } from "./default-config";
import { DznLintUserConfiguration } from "./dznlint-configuration";

export function validateConfiguration(
    config: DznLintUserConfiguration
): { valid: false; issues: string[] } | { valid: true } {
    const issues = [];

    for (const key in config) {
        if (!(key in DEFAULT_DZNLINT_CONFIG)) {
            issues.push(`Unknown configuration key: '${key}'`);
        }
    }

    return issues.length == 0 ? { valid: true } : { valid: false, issues };
}

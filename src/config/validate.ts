import { DEFAULT_DZNLINT_CONFIG, DEFAULT_DZNLINT_FORMAT_CONFIG } from "./default-config";
import { DznLintFormatUserConfiguration, DznLintUserConfiguration } from "./dznlint-configuration";

export function validateConfiguration(
    config: DznLintUserConfiguration & { format?: DznLintFormatUserConfiguration }
): { valid: false; issues: string[] } | { valid: true } {
    const issues = [];

    for (const key in config) {
        if (!(key in DEFAULT_DZNLINT_CONFIG) && key !== "format") {
            issues.push(`Unknown configuration key: '${key}'`);
        }
    }

    if (config.format) {
        for (const formatKey in config.format) {
            if (!(formatKey in DEFAULT_DZNLINT_FORMAT_CONFIG)) {
                issues.push(`Unknown format configuration key: '${formatKey}'`);
            }
        }
    }

    return issues.length == 0 ? { valid: true } : { valid: false, issues };
}

import { DiagnosticSeverity } from "../diagnostic";
import { DEFAULT_DZNLINT_CONFIG } from "./default-config";
import { ConfigSeverity, DznLintConfiguration, DznLintUserConfiguration } from "./dznlint-configuration";

export function getRuleConfig<TRule extends keyof DznLintConfiguration>(
    name: TRule,
    config: DznLintUserConfiguration
):
    | { isEnabled: false }
    | {
          isEnabled: true;
          severity: DiagnosticSeverity;
          config: DznLintConfiguration[TRule][1];
      } {
    const value = config[name];

    if (value === undefined) {
        const ruleConfig = DEFAULT_DZNLINT_CONFIG[name];
        return {
            isEnabled: true,
            severity: stringToDiagnosticLevel(Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig),
            config: ruleConfig[1],
        };
    }

    if (value === false) {
        return { isEnabled: false };
    }

    if (value === "error") {
        return { isEnabled: true, severity: DiagnosticSeverity.Error, config: DEFAULT_DZNLINT_CONFIG[name][1] };
    }
    if (value === "warning") {
        return { isEnabled: true, severity: DiagnosticSeverity.Warning, config: DEFAULT_DZNLINT_CONFIG[name][1] };
    }
    if (value === "hint") {
        return { isEnabled: true, severity: DiagnosticSeverity.Hint, config: DEFAULT_DZNLINT_CONFIG[name][1] };
    }

    if (Array.isArray(value)) {
        const [severity, config] = value as [ConfigSeverity, DznLintConfiguration[TRule][0]];

        return {
            isEnabled: true,
            severity: stringToDiagnosticLevel(severity),
            config: config,
        };
    } else {
        return {
            isEnabled: true,
            severity: stringToDiagnosticLevel(DEFAULT_DZNLINT_CONFIG[name][0]),
            config: value as DznLintConfiguration[TRule][1],
        };
    }
}

function stringToDiagnosticLevel(str: string): DiagnosticSeverity {
    switch (str) {
        case "error":
            return DiagnosticSeverity.Error;
        case "warning":
            return DiagnosticSeverity.Warning;
        case "hint":
            return DiagnosticSeverity.Hint;
        default:
            return DiagnosticSeverity.Error;
    }
}

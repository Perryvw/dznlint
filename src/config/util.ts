import { DiagnosticLevel } from "../diagnostic";
import { DEFAULT_DZNLINT_CONFIG } from "./default-config";
import { ConfigSeverity, DznLintConfiguration, DznLintUserConfiguration } from "./dznlint-configuration";

export function getRuleConfig<TRule extends keyof DznLintConfiguration>(
    name: TRule,
    config: DznLintUserConfiguration
):
    | { isEnabled: false }
    | {
          isEnabled: true;
          severity: DiagnosticLevel;
          config: DznLintConfiguration[TRule][1];
      } {
    const value = config[name];

    if (value === undefined) {
        return {
            isEnabled: true,
            severity: stringToDiagnosticLevel(DEFAULT_DZNLINT_CONFIG[name][0]),
            config: DEFAULT_DZNLINT_CONFIG[name][1],
        };
    }

    if (value === false) {
        return { isEnabled: false };
    }

    if (value === "error") {
        return { isEnabled: true, severity: DiagnosticLevel.Error, config: DEFAULT_DZNLINT_CONFIG[name][1] };
    }
    if (value === "warning") {
        return { isEnabled: true, severity: DiagnosticLevel.Warning, config: DEFAULT_DZNLINT_CONFIG[name][1] };
    }
    if (value === "hint") {
        return { isEnabled: true, severity: DiagnosticLevel.Hint, config: DEFAULT_DZNLINT_CONFIG[name][1] };
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

function stringToDiagnosticLevel(str: string): DiagnosticLevel {
    switch (str) {
        case "error":
            return DiagnosticLevel.Error;
        case "warning":
            return DiagnosticLevel.Warning;
        case "hint":
            return DiagnosticLevel.Hint;
        default:
            return DiagnosticLevel.Error;
    }
}

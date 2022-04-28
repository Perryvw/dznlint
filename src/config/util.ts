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
          config: DznLintConfiguration[TRule] extends [ConfigSeverity, infer TData] ? TData : undefined;
      } {
    const value = config[name];
    const defaultConfig = DEFAULT_DZNLINT_CONFIG[name];
    const [defaultSeverity, defaultValue] = Array.isArray(defaultConfig)
        ? defaultConfig
        : [defaultConfig === false ? "warning" : defaultConfig, undefined];

    if (value === undefined) {
        if (!defaultConfig) {
            return { isEnabled: false };
        }

        return {
            isEnabled: true,
            severity: stringToDiagnosticLevel(defaultSeverity),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            config: defaultValue,
        };
    }

    if (value === false) {
        return { isEnabled: false };
    }

    if (value === "error") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return { isEnabled: true, severity: DiagnosticSeverity.Error, config: defaultValue };
    }
    if (value === "warning") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return { isEnabled: true, severity: DiagnosticSeverity.Warning, config: defaultValue };
    }
    if (value === "hint") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return { isEnabled: true, severity: DiagnosticSeverity.Hint, config: defaultValue };
    }

    if (Array.isArray(value)) {
        const [severity, config] = value;

        return {
            isEnabled: true,
            severity: stringToDiagnosticLevel(severity),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            config: config,
        };
    } else {
        return {
            isEnabled: true,
            severity: stringToDiagnosticLevel(defaultSeverity),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            config: value,
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

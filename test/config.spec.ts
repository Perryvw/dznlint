import { DEFAULT_DZNLINT_CONFIG } from "../src/config/default-config";
import { ConfigSeverity, DznLintUserConfiguration } from "../src/config/dznlint-configuration";
import { DiagnosticSeverity } from "../src/diagnostic";
import { lintString } from "../src";

const codeWithDiagnostic = `component A { behavior {
    function myFunction(data foo) {}
} }`;

const config: DznLintUserConfiguration = { no_unused_parameters: false };

test("has default severity unless specified otherwise", () => {
    const diagnostics = lintString(codeWithDiagnostic, config);
    expect(diagnostics).toHaveLength(1);
    expect(DiagnosticSeverity[diagnostics[0].severity].toLowerCase()).toEqual(
        DEFAULT_DZNLINT_CONFIG.parameter_direction
    );
});

test.each(["error", "warning", "hint"])("diagnostic severity can be configured (%p)", severity => {
    const diagnostics = lintString(codeWithDiagnostic, { ...config, parameter_direction: severity as ConfigSeverity });
    expect(diagnostics).toHaveLength(1);
    expect(DiagnosticSeverity[diagnostics[0].severity].toLowerCase()).toEqual(severity);
});

test("can be disabled", () => {
    const diagnostics = lintString(codeWithDiagnostic, { ...config, parameter_direction: false });
    expect(diagnostics).toHaveLength(0);
});

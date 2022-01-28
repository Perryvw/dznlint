import { DEFAULT_DZNLINT_CONFIG } from "../src/config/default-config";
import { ConfigSeverity } from "../src/config/dznlint-configuration";
import { DiagnosticSeverity } from "../src/diagnostic";
import { lintString } from "../src/dznlint";

const codeWithDiagnostic = `component A { behavior {
    function myFunction(data foo) {}
} }`;

test("has default severity unless specified otherwise", () => {
    const diagnostics = lintString(codeWithDiagnostic);
    expect(diagnostics).toHaveLength(1);
    expect(DiagnosticSeverity[diagnostics[0].severity].toLowerCase()).toEqual(DEFAULT_DZNLINT_CONFIG.parameter_direction);
});

test.each(["error", "warning", "hint"])("diagnostic severity can be configured (%p)", severity => {
    const diagnostics = lintString(codeWithDiagnostic, { parameter_direction: severity as ConfigSeverity });
    expect(diagnostics).toHaveLength(1);
    expect(DiagnosticSeverity[diagnostics[0].severity].toLowerCase()).toEqual(severity);
});

test("can be disabled", () => {
    const diagnostics = lintString(codeWithDiagnostic, { parameter_direction: false });
    expect(diagnostics).toHaveLength(0);
});

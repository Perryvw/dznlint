import { DznLintUserConfiguration } from "../src/config/dznlint-configuration";
import { Diagnostic, DiagnosticCode, formatDiagnostic,  } from "../src/diagnostic";
import { failedToFullyParseFile, lintString } from "../src/dznlint";

interface LintTest {
    diagnostic: DiagnosticCode,
    pass: string,
    fail: string,
    config?: DznLintUserConfiguration,
}

export function testdznlint(test: LintTest) {

    const passResult = lintString(test.pass, test.config);
    const failResult = lintString(test.fail, test.config);

    expectNoDiagnosticOfType(passResult, failedToFullyParseFile.code);
    expectNoDiagnosticOfType(failResult, failedToFullyParseFile.code);

    expectDiagnosticOfType(failResult, test.diagnostic);
    expectNoDiagnosticOfType(passResult, test.diagnostic);
}

function expectDiagnosticOfType(diagnostics: Diagnostic[], code: DiagnosticCode) {
    const diagnosticsOfType = diagnostics.filter(d => d.code === code);
    if (diagnosticsOfType.length === 0) {
        const formattedDiagnostics = diagnostics.map(formatDiagnostic).join("\n");
        expect("").toEqual(formattedDiagnostics);
    }
}

function expectNoDiagnosticOfType(diagnostics: Diagnostic[], code: DiagnosticCode) {
    const diagnosticsOfType = diagnostics.filter(d => d.code === code);
    if (diagnosticsOfType.length > 0) {
        const formattedDiagnostics = diagnosticsOfType.map(formatDiagnostic).join("\n");
        expect(formattedDiagnostics).toEqual("");
    }
}
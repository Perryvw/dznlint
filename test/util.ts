import { DznLintUserConfiguration } from "../src/config/dznlint-configuration";
import { Diagnostic, DiagnosticCode, formatDiagnostic } from "../src/diagnostic";
import { lintString } from "../src";
import { failedToFullyParseFile } from "../src/parse";

interface LintTest {
    diagnostic: DiagnosticCode;
    pass?: string;
    fail?: string;
    config?: DznLintUserConfiguration;
    debug?: boolean;
}

export function testdznlint(test: LintTest) {
    if (test.pass) {
        const passResult = lintString(test.pass, test.config);

        if (test.debug) {
            for (const d of passResult) {
                console.log("pass.dzn " + formatDiagnostic(d));
            }
        }

        expectNoDiagnosticOfType(passResult, failedToFullyParseFile.code);
        expectNoDiagnosticOfType(passResult, test.diagnostic);
    }

    if (test.fail) {
        const failResult = lintString(test.fail, test.config);

        if (test.debug) {
            for (const d of failResult) {
                console.log("fail.dzn " + formatDiagnostic(d));
            }
        }

        expectNoDiagnosticOfType(failResult, failedToFullyParseFile.code);
        expectDiagnosticOfType(failResult, test.diagnostic);
    }
}

function expectDiagnosticOfType(diagnostics: Diagnostic[], code: DiagnosticCode) {
    const diagnosticsOfType = diagnostics.filter(d => d.code === code);
    if (diagnosticsOfType.length === 0) {
        const formattedDiagnostics = diagnosticsOfType.map(formatDiagnostic).join("\n");
        expect(formattedDiagnostics).not.toEqual("");
    }
}

function expectNoDiagnosticOfType(diagnostics: Diagnostic[], code: DiagnosticCode) {
    const diagnosticsOfType = diagnostics.filter(d => d.code === code);
    if (diagnosticsOfType.length > 0) {
        const formattedDiagnostics = diagnosticsOfType.map(formatDiagnostic).join("\n");
        expect(formattedDiagnostics).toEqual("");
    }
}

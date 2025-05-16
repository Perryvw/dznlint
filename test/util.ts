import { DznLintUserConfiguration } from "../src/config/dznlint-configuration";
import { Diagnostic, DiagnosticCode, formatDiagnostic } from "../src/diagnostic";
import { Program, lint, lintString } from "../src";
import { failedToFullyParseFile } from "../src/parse";
import { dznLintExceptionThrown } from "../src/linting-rule";

interface LintTest {
    diagnostic: DiagnosticCode;
    pass?: string | Record<string, string>;
    fail?: string;
    config?: DznLintUserConfiguration;
    debug?: boolean;
}

export async function testdznlint(test: LintTest) {
    if (test.pass) {
        let passResult: Diagnostic[] = [];

        if (typeof test.pass === "string") {
            passResult = await lintString(test.pass, test.config);
        } else {
            const program = await Program.Init();
            const sourceFiles = Object.entries(test.pass).map(e => program.parseFile(e[0], e[1])!);

            const entryFile = sourceFiles.find(f => f.source.fileName === "main.dzn");
            if (!entryFile) throw `Could not find 'main.dzn' entry in test files: ${Object.keys(test.pass).join(", ")}`;

            passResult = lint([entryFile], test.config, program);
        }

        if (test.debug) {
            for (const d of passResult) {
                console.log("pass.dzn " + formatDiagnostic(d));
            }
        }

        expectNoDiagnosticOfType(passResult, failedToFullyParseFile.code);
        expectNoDiagnosticOfType(passResult, dznLintExceptionThrown.code);
        expectNoDiagnosticOfType(passResult, test.diagnostic);
    }

    if (test.fail) {
        const failResult = await lintString(test.fail, test.config);

        if (test.debug) {
            for (const d of failResult) {
                console.log("fail.dzn " + formatDiagnostic(d));
            }
        }

        expectNoDiagnosticOfType(failResult, failedToFullyParseFile.code);
        expectDiagnosticOfType(failResult, test.diagnostic);
    }
}

export function expectDiagnosticOfType(diagnostics: Diagnostic[], code: DiagnosticCode) {
    const diagnosticsOfType = diagnostics.filter(d => d.code === code);
    if (diagnosticsOfType.length === 0) {
        expect(diagnostics.map(formatDiagnostic).join("\n")).toEqual(`A diagnostic with code ${code}`);
    }
}

export function expectNoDiagnosticOfType(diagnostics: Diagnostic[], code: DiagnosticCode) {
    const diagnosticsOfType = diagnostics.filter(d => d.code === code);
    if (diagnosticsOfType.length > 0) {
        const formattedDiagnostics = diagnosticsOfType.map(formatDiagnostic).join("\n");
        expect(formattedDiagnostics).toEqual("");
    }
}

export function expectNoDiagnostics(diagnostics: Diagnostic[]) {
    const diagnosticsOfType = diagnostics;
    if (diagnosticsOfType.length > 0) {
        const formattedDiagnostics = diagnosticsOfType.map(formatDiagnostic).join("\n");
        expect(formattedDiagnostics).toEqual("");
    }
}

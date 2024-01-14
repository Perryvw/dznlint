import { DznLintUserConfiguration } from "./config/dznlint-configuration";
import { Diagnostic, DiagnosticSeverity, createDiagnosticsFactory } from "./diagnostic";
import { loadLinters } from "./linting-rule";
import { visitFile } from "./visitor";
import { LinterHost, Program, SourceFile } from "./semantics/program";

export { LinterHost };
export { Program };

export function lintString(
    source: string,
    config: DznLintUserConfiguration = {},
    host?: Partial<LinterHost>
): Diagnostic[] {
    const program = new Program(host);

    const diagnostics: Diagnostic[] = [];
    const sourceFile = program.parseFile("", source);
    if (sourceFile) {
        const rules = loadLinters(config);
        diagnostics.push(...sourceFile.parseDiagnostics);

        if (sourceFile.ast) {
            visitFile(
                sourceFile.ast,
                sourceFile.source,
                (node, context) => {
                    for (const linter of rules.get(node.kind) ?? []) {
                        diagnostics.push(...linter(node, context));
                    }
                },
                program
            );
        }
    }

    return diagnostics;
}

const couldNotReadFile = createDiagnosticsFactory();

export function lintFiles(
    fileNames: string[],
    config: DznLintUserConfiguration = {},
    host?: Partial<LinterHost>
): Diagnostic[] {
    const program = new Program(host);

    const diagnostics: Diagnostic[] = [];
    const files: SourceFile[] = [];
    for (var fileName of fileNames) {
        const sourceFile = program.parseFile(fileName);
        if (sourceFile) {
            files.push(sourceFile);
        } else {
            diagnostics.push(
                couldNotReadFile(
                    DiagnosticSeverity.Error,
                    `Failed to read file ${fileName}`,
                    { fileName, fileContent: "" },
                    { from: { index: 0, line: 0, column: 0 }, to: { index: 0, line: 0, column: 0 } }
                )
            );
        }
    }

    diagnostics.push(...lint(files, config, program));

    return diagnostics;
}

export function lint(sourceFiles: SourceFile[], config: DznLintUserConfiguration = {}, program: Program): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const rules = loadLinters(config);

    for (const sourceFile of sourceFiles) {
        diagnostics.push(...sourceFile.parseDiagnostics);

        if (sourceFile.ast) {
            visitFile(
                sourceFile.ast,
                sourceFile.source,
                (node, context) => {
                    for (const linter of rules.get(node.kind) ?? []) {
                        diagnostics.push(...linter(node, context));
                    }
                },
                program
            );
        }
    }
    return diagnostics;
}

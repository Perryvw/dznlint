import * as fs from "fs";
import { DEFAULT_DZNLINT_CONFIG } from "./config/default-config";
import { DznLintUserConfiguration } from "./config/dznlint-configuration";
import { createDiagnosticsFactory, Diagnostic, DiagnosticLevel, formatDiagnostic } from "./diagnostic";
import * as parser from "./grammar/parser";
import { ASTNode, Linter, loadLinters } from "./linting-rule";
import { visit } from "./visitor";


export function lintString(source: string, config?: DznLintUserConfiguration): Diagnostic[] {
    const sources = [{ fileContent: source }];
    return lint(sources, config);
}

export function lintFiles(fileNames: string[], config?: DznLintUserConfiguration): Diagnostic[] {
    const sources = fileNames.map(f => ({ fileName: f, fileContent: fs.readFileSync(f).toString() }));
    return lint(sources, config);
}

export interface InputSource {
    fileName?: string,
    fileContent: string,
}

export function lint(sources: InputSource[], config?: DznLintUserConfiguration): Diagnostic[] {
    const rules = loadLinters(DEFAULT_DZNLINT_CONFIG);
    return sources.flatMap(s => lintSource(s, rules));
}

export const failedToFullyParseFile = createDiagnosticsFactory();

function lintSource(source: InputSource, rules: Map<parser.ASTKinds, Linter<ASTNode>[]>): Diagnostic[] {

    const diagnostics: Diagnostic[] = [];

    const p = new parser.Parser(source.fileContent);
    const { ast, errs } = p.parse();
    if (errs.length > 0) {
        diagnostics.push(failedToFullyParseFile(DiagnosticLevel.Error, `Failed to fully parse file ${source.fileName ?? "string"}`,
            source, { from: { index: 0, line: 0, column: 0 }, to: { index: 0, line: 0, column: 0 } }))
    }

    if (ast) {
        const context =  {
            config: DEFAULT_DZNLINT_CONFIG,
            source
        };

        if (ast) {
            //printAst(ast);
            visit(ast, node => {
                for (const linter of rules.get(node.kind) ?? []) {
                    diagnostics.push(...linter(node, context));
                }
            });
        }
    }

    return diagnostics;
}

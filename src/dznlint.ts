import * as fs from "fs";
import { DznLintUserConfiguration } from "./config/dznlint-configuration";
import { createDiagnosticsFactory, Diagnostic, DiagnosticSeverity } from "./diagnostic";
import * as parser from "./grammar/parser";
import { ASTNode, Linter, loadLinters } from "./linting-rule";
import { visitFile } from "./visitor";

export function lintString(source: string, config?: DznLintUserConfiguration): Diagnostic[] {
    const sources = [{ fileContent: source }];
    return lint(sources, config);
}

export function lintFiles(fileNames: string[], config?: DznLintUserConfiguration): Diagnostic[] {
    const sources = fileNames.map(f => ({ fileName: f, fileContent: fs.readFileSync(f).toString() }));
    return lint(sources, config);
}

export interface InputSource {
    fileName?: string;
    fileContent: string;
}

export function lint(sources: InputSource[], config: DznLintUserConfiguration = {}): Diagnostic[] {
    const rules = loadLinters(config);
    return sources.flatMap(s => lintSource(s, rules));
}

export const failedToFullyParseFile = createDiagnosticsFactory();

function lintSource(source: InputSource, rules: Map<parser.ASTKinds, Linter<ASTNode>[]>): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const p = new parser.Parser(source.fileContent);
    const { ast, errs } = p.parse();
    if (errs.length > 0) {
        for (const err of errs) {
            diagnostics.push(
                failedToFullyParseFile(DiagnosticSeverity.Error, err.toString(), source, {
                    from: { index: err.pos.overallPos, line: err.pos.line, column: err.pos.offset },
                    to: { index: err.pos.overallPos + 1, line: err.pos.line, column: err.pos.offset + 1 },
                })
            );
        }
    }

    if (ast) {
        if (ast) {
            visitFile(ast, source, (node, context) => {
                for (const linter of rules.get(node.kind) ?? []) {
                    diagnostics.push(...linter(node, context));
                }
            });
        }
    }

    return diagnostics;
}

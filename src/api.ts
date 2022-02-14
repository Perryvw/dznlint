import * as fs from "fs";
import { DznLintUserConfiguration } from "./config/dznlint-configuration";
import { Diagnostic } from "./diagnostic";
import { ASTKinds } from "./grammar/parser";
import { ASTNode, Linter, loadLinters } from "./linting-rule";
import { parseDznSource } from "./parse";
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

function lintSource(source: InputSource, rules: Map<ASTKinds, Linter<ASTNode>[]>): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const { ast, diagnostics: parseDiagnostics } = parseDznSource(source);
    diagnostics.push(...parseDiagnostics);

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

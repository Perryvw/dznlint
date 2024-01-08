import * as fs from "fs";
import * as path from "path";
import { DznLintUserConfiguration } from "./config/dznlint-configuration";
import { Diagnostic } from "./diagnostic";
import { ASTKinds } from "./grammar/parser";
import { ASTNode, Linter, loadLinters } from "./linting-rule";
import { visitFile } from "./visitor";
import { LinterHost, Program } from "./semantics/program";

export { LinterHost };

export function lintString(
    source: string,
    config?: DznLintUserConfiguration,
    host?: Partial<LinterHost>
): Diagnostic[] {
    const sources = [{ fileContent: source }];
    return lint(sources, config, host);
}

export function lintFiles(
    fileNames: string[],
    config?: DznLintUserConfiguration,
    host?: Partial<LinterHost>
): Diagnostic[] {
    const sources = fileNames.map(f => ({
        fileName: f,
        fileContent: (host?.readFile ?? defaultLinterHost.readFile!)(f),
    }));
    return lint(sources, config, host);
}

export interface InputSource {
    fileName?: string;
    fileContent: string;
}

export function lint(
    sources: InputSource[],
    config: DznLintUserConfiguration = {},
    host?: Partial<LinterHost>
): Diagnostic[] {
    const rules = loadLinters(config);
    const program = new Program(sources, { ...defaultLinterHost, ...host });
    return sources.flatMap(s => lintSource(s, rules, program));
}

function lintSource(source: InputSource, rules: Map<ASTKinds, Linter<ASTNode>[]>, program: Program): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const sourceFile = program.getSourceFile(source.fileName!);
    if (sourceFile) diagnostics.push(...sourceFile.parseDiagnostics);

    if (sourceFile?.ast) {
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

const defaultLinterHost: LinterHost = {
    includePaths: [],
    fileExists(filePath) {
        return fs.existsSync(filePath);
    },
    readFile(filePath) {
        return fs.readFileSync(filePath).toString();
    },
    resolveImport(importPath, importingFilePath) {
        const requiringBase = importingFilePath ? path.dirname(importingFilePath) : ".";
        const baseImport = path.join(requiringBase, importPath);
        if (this.fileExists?.(baseImport)) {
            return baseImport;
        }

        // oh no we have to see if we can resolve from include dirs instead
        if (this.includePaths) {
            for (const includePath of this.includePaths) {
                const importedFile = path.join(includePath, importPath);
                if (this.fileExists?.(importedFile)) {
                    return importedFile;
                }
            }
        }
    },
};

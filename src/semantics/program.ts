import * as fs from "fs";

import * as ast from "../grammar/ast";

import { Diagnostic } from "../diagnostic";
import { parseDznSource } from "../parse";
import { normalizePath, resolveImport } from "../resolve-imports";
import { setParentVisitor, visitFile } from "../visitor";

export interface LinterHost {
    includePaths: string[];
    fileExists(filePath: string): boolean;
    readFile(filePath: string): string;
    resolveImport(importPath: string, importingFilePath: string, program: Program): string | undefined;
}

const defaultLinterHost: LinterHost = {
    includePaths: [],
    fileExists(filePath) {
        return fs.existsSync(filePath);
    },
    readFile(filePath) {
        return fs.readFileSync(filePath).toString();
    },
    resolveImport(importPath, importingFilePath, program) {
        return resolveImport(importPath, importingFilePath, program);
    },
};

export class Program {
    public host: LinterHost;

    constructor(host?: Partial<LinterHost>) {
        this.host = { ...defaultLinterHost, ...host };
    }

    private parsedFiles = new Map<string, SourceFile>();

    public getSourceFile(path: string): SourceFile | undefined {
        path = normalizePath(path);
        if (this.parsedFiles.has(path)) return this.parsedFiles.get(path)!;

        if (this.host.fileExists(path)) {
            const sf = new SourceFile({ fileName: path, fileContent: this.host.readFile(path) }, this);
            this.parsedFiles.set(path, sf);
            return sf;
        }
    }

    public parseFile(path: string, content?: string): SourceFile | undefined {
        path = normalizePath(path);
        this.parsedFiles.delete(path);

        if (content === undefined) {
            return this.getSourceFile(path);
        } else {
            const sf = new SourceFile({ fileName: path, fileContent: content }, this);
            this.parsedFiles.set(path, sf);
            return sf;
        }
    }

    public getFilePath(file: ast.File): string | undefined {
        for (const [path, sourceFile] of this.parsedFiles) {
            if (sourceFile.ast === file) return path;
        }
    }

    /** @internal */
    public getCachedFile(path: string): SourceFile | undefined {
        path = normalizePath(path);
        return this.parsedFiles.get(path);
    }
}

export interface InputSource {
    fileName?: string;
    fileContent: string;
}

export class SourceFile {
    public parseDiagnostics: Diagnostic[];
    public ast?: ast.File;

    public constructor(
        public source: InputSource,
        program: Program
    ) {
        const { ast, diagnostics } = parseDznSource(source);
        this.parseDiagnostics = diagnostics;
        if (ast) {
            visitFile(ast, source, setParentVisitor, program);
            this.ast = ast;
        }
    }
}

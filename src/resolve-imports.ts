import * as path from "path";
import { Program } from "./semantics/program";

export function resolveImport(importPath: string, importingFilePath: string, program: Program): string | undefined {
    importPath = normalizePath(importPath);
    const baseDir = path.dirname(importingFilePath);
    const resolvedFromCache = resolveFromCache(importPath, baseDir, program);
    if (resolvedFromCache) {
        return resolvedFromCache;
    }

    return resolveFromDisk(importPath, baseDir, program);
}

function resolveFromCache(importPath: string, baseDir: string, program: Program): string | undefined {
    const sourceFile = program.getCachedFile(normalizePath(path.join(baseDir, importPath)));
    if (sourceFile) return sourceFile.source.fileName;

    // Try finding via includes
    for (const include of program.host.includePaths) {
        const sourceFile = program.getCachedFile(normalizePath(path.join(include, importPath)));
        if (sourceFile) return sourceFile.source.fileName;
    }
}

function resolveFromDisk(importPath: string, baseDir: string, program: Program): string | undefined {
    const baseImport = path.join(baseDir, importPath);
    if (program.host.fileExists?.(baseImport)) {
        return baseImport;
    }

    // oh no we have to see if we can resolve from include dirs instead
    if (program.host.includePaths) {
        for (const includePath of program.host.includePaths) {
            const importedFile = path.join(includePath, importPath);
            if (program.host.fileExists?.(importedFile)) {
                return importedFile;
            }
        }
    }
}

export function normalizePath(pathStr: string) {
    return path.normalize(pathStr.trim()).replace(/\\/g, "/");
}

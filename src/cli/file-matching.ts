import * as path from "path";

interface FileSystemHost {
    currentWorkingDirectory(): string;
    exists(path: string): boolean;
    isDirectory(path: string): boolean;
    readDir(path: string): Array<{ name: string; isDirectory(): boolean }>;
}

export function filesFromGlob(pattern: string, host: FileSystemHost): string[] {
    if (!pattern.includes("*")) {
        return [pattern];
    }
    const pathParts = path.normalize(pattern).split(path.sep);
    return findFilesFromPattern(pathParts, host.currentWorkingDirectory(), host);
}

function findFilesFromPattern(pathParts: string[], currentDirectory: string, host: FileSystemHost): string[] {
    if (pathParts.length === 1) {
        if (pathParts[0].includes("*")) {
            return host
                .readDir(currentDirectory)
                .filter(e => !e.isDirectory() && e.name.endsWith(".dzn"))
                .map(f => path.join(currentDirectory, f.name));
        } else {
            return [path.join(currentDirectory, pathParts[0])];
        }
    }

    if (pathParts[0] === "**") {
        return findFilesFromPatternRecursive(pathParts.slice(1), currentDirectory, host);
    } else if (pathParts[0] === "*") {
        return host
            .readDir(currentDirectory)
            .filter(e => e.isDirectory())
            .flatMap(subDir =>
                findFilesFromPattern(pathParts.slice(1), path.join(currentDirectory, subDir.name), host)
            );
    } else {
        return findFilesFromPattern(pathParts.slice(1), path.join(currentDirectory, pathParts[0]), host);
    }
}

function findFilesFromPatternRecursive(pathParts: string[], currentDirectory: string, host: FileSystemHost): string[] {
    if (pathParts.length === 0) {
        return [];
    }

    if (pathParts[0].includes("*")) {
        const directoryContent = host.readDir(currentDirectory);
        const nestedResults = directoryContent
            .filter(e => e.isDirectory())
            .flatMap(subDir => findFilesFromPatternRecursive(pathParts, path.join(currentDirectory, subDir.name), host));
        const directoryFiles = directoryContent.filter(e => e.name.endsWith(".dzn")).map(f => path.join(currentDirectory, f.name));

        return [...directoryFiles, ...nestedResults];
    } else {
        const result = host
            .readDir(currentDirectory)
            .filter(e => e.isDirectory())
            .flatMap(subDir => findFilesFromPatternRecursive(pathParts, path.join(currentDirectory, subDir.name), host));

        const currentPath = path.join(currentDirectory, pathParts[0]);
        if (host.exists(currentPath)) {
            if (host.isDirectory(currentPath)) {
                // Go back to non-recursive search
                result.push(...findFilesFromPattern(pathParts.slice(1), currentPath, host));
            } else {
                result.push(currentPath);
            }
        }
        return result;
    }
}

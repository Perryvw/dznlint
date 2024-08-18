#!/usr/bin/env node

// This file is the CLI entry point

import * as fs from "fs";
import { parseCommandLineArguments } from "./argument-parsing";
import { resolveInputFiles } from "./file-matching";
import { DiagnosticSeverity, formatDiagnostic } from "../diagnostic";
import { validateConfiguration } from "../config/validate";
import { DznLintCombinedUserConfiguration } from "../config/dznlint-configuration";
import { DEFAULT_DZNLINT_CONFIG_FILE } from "../config/default-config";

import * as api from "../api";

const [, , ...args] = process.argv;

// Try to parse provided CLI arguments
const cliArguments = parseCommandLineArguments(args);
if (!cliArguments.success) {
    console.error(cliArguments.message);
    process.exit(1);
}

// If help was requested, display and exit
if (cliArguments.arguments.help) {
    let helpstring = "dznlint - Code analysis for Dezyne files. \n\n";

    helpstring += "Usage: dznlint <options> [...files]\n";
    helpstring += "Multiple files can be supplied at once, glob patterns are supported.\n\n";

    helpstring += "Available options:\n";
    helpstring += "  --config-file <file>       Specify a dznlint configuration file. (Default: dznlint.config.json)\n";
    helpstring += "  --include <directory> (-I) Specify a directory to add as include path\n";
    helpstring += "  --help                     Display this help string.\n";
    console.log(helpstring);
    process.exit(0);
}

// Resolve provided input files on disk
const fsHost = {
    currentWorkingDirectory: process.cwd,
    exists: fs.existsSync,
    isDirectory: (p: string) => fs.lstatSync(p).isDirectory(),
    readDir: (p: string) => fs.readdirSync(p, { withFileTypes: true }),
};
const inputFiles = resolveInputFiles(cliArguments.arguments.files, fsHost);
if (inputFiles.length === 0) {
    console.error(`No files matched input patterns: ${inputFiles}`);
    process.exit(1);
}

// Resolve configuration
let configuration: DznLintCombinedUserConfiguration = {};
if (cliArguments.arguments.configFile) {
    if (fsHost.exists(cliArguments.arguments.configFile)) {
        configuration = JSON.parse(fs.readFileSync(cliArguments.arguments.configFile).toString());
    } else {
        console.error(`Failed to read configuration file: ${cliArguments.arguments.configFile}`);
        process.exit(1);
    }
} else {
    if (fsHost.exists(DEFAULT_DZNLINT_CONFIG_FILE)) {
        configuration = JSON.parse(fs.readFileSync(DEFAULT_DZNLINT_CONFIG_FILE).toString());
    }
}

// Validate configuration
const configValid = validateConfiguration(configuration);
if (!configValid.valid) {
    for (const issue of configValid.issues) {
        console.error(issue);
    }
    process.exit(1);
}

if (cliArguments.arguments.format) {
    // Format instead of linting
    for (const inputFilePath of inputFiles) {
        fs.readFile(inputFilePath, (err, buffer) => {
            api.format(buffer.toString(), configuration.format).then(formatted =>
                fs.writeFile(inputFilePath, formatted, () => console.log(`Formatted ${inputFilePath}`))
            );
        });
    }
} else {
    // Lint resolved files
    const result = api.lintFiles(inputFiles, configuration, { includePaths: cliArguments.arguments.includePaths });
    const counts = {
        [DiagnosticSeverity.Hint]: 0,
        [DiagnosticSeverity.Warning]: 0,
        [DiagnosticSeverity.Error]: 0,
    };
    for (const diagnostic of result) {
        console.log(formatDiagnostic(diagnostic));
        counts[diagnostic.severity]++;
    }

    // Print a nice summary of the results
    const CONSOLE_COLOR_RESET = "\x1b[0m";
    const redText = (text: string) => `\x1b[31m${text}${CONSOLE_COLOR_RESET}`;
    const yellowText = (text: string) => `\x1b[93m${text}${CONSOLE_COLOR_RESET}`;

    const pluralize = (word: string, count: number) => (count === 1 ? word : word + "s");

    let summary = `Processed ${inputFiles.length} ${pluralize("file", inputFiles.length)}:`;
    if (counts[DiagnosticSeverity.Error] > 0)
        summary += ` ${counts[DiagnosticSeverity.Error]} ${redText(
            pluralize("error", counts[DiagnosticSeverity.Error])
        )}`;
    if (counts[DiagnosticSeverity.Warning] > 0)
        summary += ` ${counts[DiagnosticSeverity.Warning]} ${yellowText(
            pluralize("warning", counts[DiagnosticSeverity.Warning])
        )}`;
    if (counts[DiagnosticSeverity.Hint] > 0)
        summary += ` ${counts[DiagnosticSeverity.Hint]} ${pluralize("suggestion", counts[DiagnosticSeverity.Hint])}`;
    if (counts[DiagnosticSeverity.Error] + counts[DiagnosticSeverity.Warning] + counts[DiagnosticSeverity.Hint] === 0)
        summary += " No issues found";
    console.log(`${summary}.`);

    // If we had at least one error, exit with exit code 1
    if (result.some(d => d.severity >= DiagnosticSeverity.Error)) {
        process.exit(1);
    }
}

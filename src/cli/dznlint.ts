#!/usr/bin/env node

// This file is the CLI entry point

import * as fs from "fs";
import { parseCommandLineArguments } from "./argument-parsing";
import { resolveInputFiles } from "./file-matching";
import { DiagnosticSeverity, formatDiagnostic } from "../diagnostic";
import { lintFiles } from "..";
import { validateConfiguration } from "../config/validate";

const [, , ...args] = process.argv;

// Try to parse provided CLI arguments
const cliArguments = parseCommandLineArguments(args);
if (!cliArguments.success) {
    console.error(cliArguments.message);
    process.exit(1);
}

// If help was requested, display and exit
if (cliArguments.arguments.help) {
    console.log("Help!");
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
let configuration = {};
if (cliArguments.arguments.configFile) {
    if (fsHost.exists(cliArguments.arguments.configFile)) {
        configuration = JSON.parse(fs.readFileSync(cliArguments.arguments.configFile).toString());
    } else {
        console.error(`Failed to read configuration file: ${cliArguments.arguments.configFile}`);
        process.exit(1);
    }
} else {
    if (fsHost.exists("dznlint.config.json")) {
        configuration = JSON.parse(fs.readFileSync("dznlint.config.json").toString());
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

// Lint resolved files
const result = lintFiles(inputFiles, configuration);
for (const diagnostic of result) {
    console.log(formatDiagnostic(diagnostic));
}

if (result.some(d => d.severity >= DiagnosticSeverity.Warning)) {
    process.exit(1);
}

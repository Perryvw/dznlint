// This file is the CLI entry point

import { formatDiagnostic } from "./diagnostic";
import { lintFiles } from "./dznlint";

const [,,...files] = process.argv;

const result = lintFiles(files);

for (const diagnostic of result) {
    console.log(formatDiagnostic(diagnostic));
}

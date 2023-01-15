import * as parser from "./grammar/parser";

import { createDiagnosticsFactory, DiagnosticSeverity } from "./diagnostic";
import { Diagnostic } from "./diagnostic";
import { InputSource } from "./api";

export const failedToFullyParseFile = createDiagnosticsFactory();

export function parseDznSource(source: InputSource): { ast?: parser.file; diagnostics: Diagnostic[] } {
    const p = new parser.Parser(source.fileContent);
    const { ast, errs } = p.parse();

    const diagnostics = [];
    for (const err of errs) {
        diagnostics.push(
            failedToFullyParseFile(DiagnosticSeverity.Error, err.toString() + "\n At: " + source.fileContent.substring(err.pos.overallPos, source.fileContent.indexOf("\n", err.pos.overallPos + 1)), source, {
                from: { index: err.pos.overallPos, line: err.pos.line, column: err.pos.offset },
                to: { index: err.pos.overallPos + 1, line: err.pos.line, column: err.pos.offset + 1 },
            })
        );
    }

    return { ast: ast == null ? undefined : ast, diagnostics };
}

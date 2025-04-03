import * as ast from "./grammar/ast";

import { createDiagnosticsFactory, DiagnosticSeverity } from "./diagnostic";
import { Diagnostic } from "./diagnostic";
import { InputSource } from "./semantics/program";

export const failedToFullyParseFile = createDiagnosticsFactory();

export function parseDznSource(source: InputSource): { ast?: ast.File; diagnostics: Diagnostic[] } {
    const p = new parser.Parser(source.fileContent);
    const { ast, errs } = p.parse();

    const diagnostics = [];
    for (const err of errs) {
        diagnostics.push(
            failedToFullyParseFile(DiagnosticSeverity.Error, err.toString(), source, {
                from: { index: err.pos.overallPos, line: err.pos.line, column: err.pos.offset },
                to: { index: err.pos.overallPos + 1, line: err.pos.line, column: err.pos.offset + 1 },
            })
        );
    }

    return { ast: ast == null ? undefined : ast, diagnostics };
}

import * as Parser from "web-tree-sitter";

export type TreeSitterNode = Parser.SyntaxNode;

let treeSitterParser: Parser | undefined;

export async function treeSitterParse(source: InputSource): Promise<Parser.SyntaxNode> {
    if (treeSitterParser === undefined) {
        await Parser.init();
        treeSitterParser = new Parser();
        const language = await Parser.Language.load(`${__dirname}/grammar/tree-sitter-dezyne.wasm`);
        treeSitterParser.setLanguage(language);
    }

    const tree = treeSitterParser.parse(source.fileContent);
    return tree.rootNode;
}

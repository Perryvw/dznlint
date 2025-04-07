import * as ast from "./grammar/ast";
import * as Parser from "web-tree-sitter";

import { createDiagnosticsFactory, DiagnosticSeverity } from "./diagnostic";
import { Diagnostic } from "./diagnostic";
import { InputSource } from "./semantics/program";
import { transformRoot } from "./grammar/tree-parser-transform";

export const failedToFullyParseFile = createDiagnosticsFactory();

export function parseDznSource(source: InputSource, parser: Parser): { ast?: ast.File; diagnostics: Diagnostic[] } {
    const tree = parser.parse(source.fileContent);
    const ast = transformRoot(tree.rootNode as any);

    const diagnostics: Diagnostic[] = [];
    // for (const err of errs) {
    //     diagnostics.push(
    //         failedToFullyParseFile(DiagnosticSeverity.Error, err.toString(), source, {
    //             from: { index: err.pos.overallPos, line: err.pos.line, column: err.pos.offset },
    //             to: { index: err.pos.overallPos + 1, line: err.pos.line, column: err.pos.offset + 1 },
    //         })
    //     );
    // }

    return { ast: ast == null ? undefined : ast, diagnostics };
}

let treeSitterParser: Parser | undefined;
export async function initParser(): Promise<Parser> {
    if (treeSitterParser) return treeSitterParser;

    await Parser.init();

    const language = await Parser.Language.load(`${__dirname}/grammar/tree-sitter-dezyne.wasm`);
    const parser = new Parser();
    parser.setLanguage(language);

    treeSitterParser = parser;

    return parser;
}

export type TreeSitterNode = Parser.SyntaxNode;

export async function treeSitterParse(source: InputSource): Promise<Parser.SyntaxNode> {
    const parser = await initParser();
    const tree = parser.parse(source.fileContent);
    return tree.rootNode;
}

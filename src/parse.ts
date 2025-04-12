import * as ast from "./grammar/ast";
import * as Parser from "web-tree-sitter";

import { createDiagnosticsFactory, DiagnosticSeverity } from "./diagnostic";
import { Diagnostic } from "./diagnostic";
import { InputSource } from "./semantics/program";
import { nodePosition, treeSitterTreeToAst } from "./grammar/tree-parser-transform";

export const failedToFullyParseFile = createDiagnosticsFactory();

export function parseDznSource(source: InputSource, parser: Parser): { ast?: ast.File; diagnostics: Diagnostic[] } {
    const tree = parser.parse(source.fileContent);
    const ast = treeSitterTreeToAst(tree.rootNode as any);

    const diagnostics: Diagnostic[] = [];

    function collectDiagnostics(node: Parser.SyntaxNode) {
        if (node.isError) {
            let errorMessage = `invalid syntax, expecting one of: `;
            const cursor = node.walk();
            while (cursor.gotoFirstChild()) {}
            const it = parser.getLanguage().lookaheadIterator(cursor.currentNode.parseState);
            if (it) {
                const parts = [];
                for (const next of it) {
                    if (next !== "ERROR") {
                        parts.push(next);
                    }
                }
                errorMessage += parts.join(", ");
            }

            diagnostics.push(
                failedToFullyParseFile(DiagnosticSeverity.Error, errorMessage, source, nodePosition(node))
            );
        } else if (node.isMissing) {
            let errorMessage = `missing ${node.type}`;
            const pos = nodePosition(node);
            pos.to.index += 1;
            pos.to.column += 1;

            diagnostics.push(failedToFullyParseFile(DiagnosticSeverity.Error, errorMessage, source, pos));
        }
        for (const c of node.children) {
            collectDiagnostics(c);
        }
    }
    collectDiagnostics(tree.rootNode);

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

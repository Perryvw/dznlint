import * as ast from "./grammar/ast";
import * as Parser from "web-tree-sitter";

import { createDiagnosticsFactory, DiagnosticSeverity } from "./diagnostic";
import { Diagnostic } from "./diagnostic";
import { InputSource, Program } from "./semantics/program";
import { root_Node } from "./grammar/tree-sitter-types";
import { nodePosition, treeSitterTreeToAst } from "./grammar/tree-parser-transform";
import { visitFile } from "./visitor";
import { setParentVisitor } from "./grammar/set-ast-parents";

export const failedToFullyParseFile = createDiagnosticsFactory();

export function parseDznSource(source: InputSource, program: Program): { ast?: ast.File; diagnostics: Diagnostic[] } {
    const tree = program.parser.parse(source.fileContent);
    const ast = treeSitterTreeToAst(tree.rootNode as root_Node, source.fileName);
    visitFile(ast, source, setParentVisitor, program);

    const diagnostics: Diagnostic[] = [];

    function collectDiagnostics(node: Parser.SyntaxNode) {
        if (node.isError) {
            let errorMessage = `invalid syntax, expecting one of: `;
            const cursor = node.walk();
            // eslint-disable-next-line no-empty
            while (cursor.gotoFirstChild()) {}
            const it = program.parser.getLanguage().lookaheadIterator(cursor.currentNode.parseState);
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
            const errorMessage = `missing ${node.type}`;
            const pos = nodePosition(node);
            pos.to.index += 1;
            pos.to.column += 1;

            diagnostics.push(failedToFullyParseFile(DiagnosticSeverity.Error, errorMessage, source, pos));
        } else {
            for (const c of node.children) {
                collectDiagnostics(c);
            }
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

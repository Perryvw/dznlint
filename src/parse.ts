import * as parser from "./grammar/parser";

import { createDiagnosticsFactory, DiagnosticSeverity } from "./diagnostic";
import { Diagnostic } from "./diagnostic";
import { InputSource } from "./semantics/program";

export const failedToFullyParseFile = createDiagnosticsFactory();

export function parseDznSource(source: InputSource): { ast?: parser.file; diagnostics: Diagnostic[] } {
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

let treeSitterParser: Parser | undefined;

export type TreeSitterNode = Parser.SyntaxNode; 
export type TreeSitterCursor = Parser.TreeCursor; 

export async function treeSitterParse(source: InputSource): Promise<TreeSitterNode> {
    if (treeSitterParser === undefined)
    {
        await Parser.init();
        treeSitterParser = new Parser();
        const language = await Parser.Language.load(`${__dirname}/grammar/tree-sitter-dezyne.wasm`);
        treeSitterParser.setLanguage(language);
    }

    const tree = treeSitterParser.parse(source.fileContent);
    return tree.rootNode;
}

function visitFile(n: Parser.SyntaxNode): parser.file {
    console.log(n.toString());
    return {
        kind: parser.ASTKinds.file,
        statements: []
    };
}

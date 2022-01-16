import * as fs from "fs";
import { DEFAULT_DZNLINT_CONFIG } from "./config/default-config.js";
import { Diagnostic, formatDiagnostic } from "./diagnostic.js";
import * as parser from "./grammar/parser.js";
import { ASTNode, loadLinters } from "./linting-rule.js";
import { visit } from "./visitor.js";

const [,,file] = process.argv;

const fileContent = fs.readFileSync(file).toString();

const { ast, errs } = parseString(fileContent);
if (errs.length > 0) {
    console.log(errs);
}

const rules = loadLinters(DEFAULT_DZNLINT_CONFIG);

const diagnostics: Diagnostic[] = [];

const context =  {
    config: DEFAULT_DZNLINT_CONFIG
}

if (ast) {
    //printAst(ast);
    visit(ast, node => {
        for (const linter of rules.get(node.kind) ?? []) {
            diagnostics.push(...linter(node, context));
        }
    });
}

for (const diagnostic of diagnostics) {
    console.log(formatDiagnostic(diagnostic, fileContent));
}

function isNode<TNode extends ASTNode>(node: ASTNode, kind: TNode["kind"]): node is TNode {
    return node.kind === kind;
}

function parseString(content: string) {
    const p = new parser.Parser(content);
    return p.parse();
}

function parseFile(filename: string) {
    const fileContent = fs.readFileSync(file).toString();
    return parseString(fileContent);
}

function printAst(ast: parser.file) {
    console.log(JSON.stringify(ast, undefined, 4));
}
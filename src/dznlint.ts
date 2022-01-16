import * as fs from "fs";
import * as parser from "./grammar/parser.js";
import { ASTNode, loadLinters } from "./linting-rule.js";
import { visit } from "./visitor.js";

const [,,file] = process.argv;

const { ast, errs } = parseFile(file);
console.log(errs);

const rules = loadLinters();

const diagnostics = [];







if (ast) {
    //printAst(ast);
    visit(ast, node => {
        for (const linter of rules.get(node.kind) ?? []) {
            diagnostics.push(...linter(node));
        }
    });
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
import * as fs from "fs";
import * as grammar from "./grammar.json";

const rules = grammar.rules as unknown as Record<string, RuleNode>;
const extras = grammar.extras as RuleNode[];

const result = [];

interface AliasNode {
    type: "ALIAS";
    content: RuleNode;
    named: boolean;
    value: string;
}
interface BlankNode {
    type: "BLANK";
}
interface PatternNode {
    type: "PATTERN";
    value: string;
}
interface FieldNode {
    type: "FIELD";
    name: string;
    content: RuleNode;
}
interface StringNode {
    type: "STRING";
    value: string;
}
interface SymbolReference {
    type: "SYMBOL";
    name: string;
}
interface ChoiceRule {
    type: "CHOICE";
    members: RuleNode[];
}
interface PatternRule {
    type: "PATTERN";
    value: string;
}
interface PrecNode {
    type: "PREC";
    content: RuleNode;
}
interface PrecLeftNode {
    type: "PREC_LEFT";
    content: RuleNode;
}
interface RepeatRule {
    type: "REPEAT" | "REPEAT1";
    content: RuleNode;
}
interface SeqRule {
    type: "SEQ";
    members: RuleNode[];
}

type RuleNode =
    | AliasNode
    | BlankNode
    | ChoiceRule
    | PatternRule
    | PrecNode
    | PrecLeftNode
    | RepeatRule
    | SeqRule
    | PatternNode
    | FieldNode
    | StringNode
    | SymbolReference;

result.push('import type * as Parser from "web-tree-sitter";');

result.push(`interface BaseNode {
    isNamed: boolean;
    isError: boolean;
    text: string;
}`);

result.push(`interface UnnamedNode<T extends string, _Id extends number> extends BaseNode {
    type: T;
    _id: _Id;
    isNamed: false;
}`);

result.push(`interface Pattern extends BaseNode { type: "pattern"; }`);

result.push(`interface ERROR_Node extends BaseNode {
    type: "ERROR";
    _id: -10;
}`);

result.push(`interface whiteline_Node extends BaseNode {
    type: "whiteline";
    _id: -20;
}`);

result.push(`interface TypedCursor<TNodes> {
    readonly currentNode: TNodes;
    readonly nodeType: AllNodes["type"];
    readonly nodeText: string;
    gotoFirstChild(): boolean;
    gotoNextSibling(): boolean;
    gotoParent(): boolean;
}
type WalkerNodes<TNode> = TNode extends { walk(): TypedCursor<infer TNodes> } ? TNodes : {_id: -1};
type NamedNodes<TNodes> = Extract<TNodes, { isNamed: true }>;
type NodeOfId<T> = Extract<AllNodes, { _id: T }>

type CursorRecord<TNode extends { _id: number }> = { [K in TNode["_id"]]: TreeCursorOfType<NodeOfId<K>>}

interface TreeCursorOfType<T extends AllNodes> {
    nodeType: T["type"];
    currentNode: T;
    nodeText: string;
}

type CursorPosition<TNode extends BaseNode> = CursorRecord<WalkerNodes<TNode>>[keyof CursorRecord<WalkerNodes<TNode>>];
`);
const allTypes = new Set<string>();
for (const extra of extras) {
    if (extra.type === "SYMBOL") {
        allTypes.add(typeOfNode(extra));
    }
}

let nodeId = 0;

for (const [type, rule] of Object.entries(rules)) {
    result.push(`interface ${nameOfType(type)} extends BaseNode {`);
    result.push(`    type: "${type}";`);
    result.push(`    _id: ${++nodeId}`);
    result.push(`    isNamed: true;`);
    if (
        rule.type === "REPEAT" ||
        rule.type === "CHOICE" ||
        rule.type === "SEQ" ||
        rule.type === "PREC" ||
        rule.type === "PREC_LEFT"
    ) {
        const childTypes = removeDuplicates(getAllChildNodes(rule, new Map()).map(typeOfNode));
        for (const t of childTypes) allTypes.add(t);
        const extraTypes = extras.filter(e => e.type === "SYMBOL").map(typeOfNode);
        result.push(
            `    walk(): TypedCursor<${[...childTypes, ...extraTypes, "whiteline_Node", "ERROR_Node"].join(" | ")}>`
        );
    }
    result.push("}");
}

result.push(
    `type AllNodes = ${["root_Node", ...allTypes.values()].join(" | ")} | Pattern | whiteline_Node | ERROR_Node;`
);

fs.writeFileSync(`${__dirname}/../src/format/tree-sitter-types-formatter.d.ts`, result.join("\n"));

function removeDuplicates<T>(l: T[]) {
    const m = new Set(l);
    return [...m.values()];
}

function nameOfType(type: string): string {
    return `${type}_Node`;
}

function getAllChildNodes(node: RuleNode, seen: Map<string, RuleNode[]>): RuleNode[] {
    switch (node.type) {
        case "ALIAS":
            return [node];
        case "CHOICE":
            return node.members.flatMap(n => getAllChildNodes(n, seen));
        case "FIELD":
            return [node];
        case "REPEAT":
        case "REPEAT1":
            return getAllChildNodes(node.content, seen);
        case "SEQ":
            return node.members.flatMap(n => getAllChildNodes(n, seen));
        case "STRING":
            return [node];
        case "SYMBOL":
            if (!node.name.startsWith("_")) {
                return [node];
            } else {
                if (!seen.has(node.name)) {
                    seen.set(node.name, []);
                    const ns = getAllChildNodes(rules[node.name], seen);
                    seen.set(node.name, ns);
                    return ns;
                } else {
                    return [];
                }
            }

        case "PREC":
        case "PREC_LEFT":
            return getAllChildNodes(node.content, seen);
        case "PATTERN":
            return [node];
        case "BLANK":
            return [];
        default:
            // @ts-ignore
            throw `Unknown node type ${node.type}`;
    }
}

function typeOfNode(node: RuleNode): string {
    if (node === undefined) {
        console.log("HUH");
    }
    if (node.type === "ALIAS") {
        return getAllChildNodes(node.content, new Map()).map(typeOfNode).join(" | ");
    }
    if (node.type === "FIELD") {
        return getAllChildNodes(node.content, new Map()).map(typeOfNode).join(" | ");
    } else if (node.type === "PATTERN") {
        return "Pattern";
    } else if (node.type === "STRING") {
        return `UnnamedNode<"${node.value}", ${++nodeId}>`;
    } else if (node.type === "SYMBOL") {
        return nameOfType(node.name);
    } else {
        throw `unknown node type ${node.type}`;
    }
}

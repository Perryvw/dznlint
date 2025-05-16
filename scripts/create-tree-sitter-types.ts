import * as fs from "fs";
import * as nodeTypes from "./node-types.json";

interface NodeType {
    named: boolean;
    type: string;
}
interface Field {
    types: Array<NodeType>;
    multiple: boolean;
    required: boolean;
}

const result = [];

result.push("// <declarations file auto-generated from node-types.json>\n");
result.push('import type * as Parser from "web-tree-sitter";');

result.push("export type SyntaxNode = Parser.SyntaxNode;");

result.push(`
export interface UnnamedNode<T extends string> extends Parser.SyntaxNode {
    type: T;
    isNamed: false;
}`);

result.push(`
export interface TypedCursor<TNodes extends { type: string }> extends Parser.TreeCursor
{
    nodeType: TNodes["type"];
}`);

for (const node of nodeTypes.filter(n => n.named)) {
    result.push(
        `export interface ${nameOfTypeNode(
            node
        )} extends Omit<Parser.SyntaxNode, "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"> {`
    );
    result.push(`    type: "${node.type}";`);

    for (const [fieldName, field] of Object.entries(node.fields ?? {}) as Array<[string, Field]>) {
        if (field.multiple) {
            result.push(`    childrenForFieldName(kind: "${fieldName}"): ${fieldType(field)};`);
        } else {
            result.push(`    childForFieldName(kind: "${fieldName}"): ${fieldType(field)};`);
        }
    }

    result.push("}");
}

result.push(
    `export type AllNodes = ${nodeTypes
        .filter(t => t.named)
        .map(nameOfTypeNode)
        .join(" | ")}`
);

function nameOfTypeNode(type: NodeType): string {
    return type.named ? `${type.type}_Node` : `UnnamedNode<"${type.type}">`;
}

function fieldType(field: Field): string {
    const namedTypes = field.types.map(nameOfTypeNode);
    const mainType = namedTypes.join(" | ");
    const fieldOptional = field.required ? "" : " | undefined";
    if (field.multiple) {
        const multipleReturnType = `Array<${mainType}>`;
        return field.required ? multipleReturnType : `${multipleReturnType}${fieldOptional}`;
    } else {
        return field.required ? mainType : `${mainType}${fieldOptional}`;
    }
}

fs.writeFileSync(`${__dirname}/../src/grammar/tree-sitter-types.d.ts`, result.join("\n"));

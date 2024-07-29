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

result.push('import type * as Parser from "web-tree-sitter";');

result.push(`
interface UnnamedType extends Parser.SyntaxNode {
    isNamed: false;
}`);

for (const node of nodeTypes.filter(n => n.named)) {
    result.push(
        `interface ${nameOfTypeNode(
            node.type
        )} extends Omit<Parser.SyntaxNode, "childForFieldName" | "childrenForFieldName" | "child" | "children"> {`
    );
    result.push(`    type: "${node.type}";`);

    for (const [fieldName, field] of Object.entries(node.fields ?? {}) as Array<[string, Field]>) {
        if (field.multiple) {
            result.push(`    childrenForFieldName(kind: "${fieldName}"): ${fieldType(field)};`);
        } else {
            result.push(`    childForFieldName(kind: "${fieldName}"): ${fieldType(field)};`);
        }
    }

    if (node.children) {
        if (node.children.multiple) {
            const namedTypes = node.children.types.filter(t => t.named).map(t => nameOfTypeNode(t.type));
            result.push(`    child(i: number): ${namedTypes.join(" | ")} | undefined;`);
            result.push(`    children: Array<${namedTypes.join(" | ")}>;`);
        } else {
            result.push(`    child(i: 0): ${fieldType(node.children)};`);
        }
    }

    result.push("}");
}

result.push(
    `type AllNodes = ${nodeTypes
        .filter(n => n.named)
        .map(n => nameOfTypeNode(n.type))
        .join(" | ")}`
);

function nameOfTypeNode(type: string): string {
    return `${type}_Node`;
}

function fieldType(field: Field): string {
    const namedTypes = field.types.filter(t => t.named).map(t => nameOfTypeNode(t.type));
    if (field.types.some(t => !t.named)) {
        namedTypes.push("UnnamedType");
    }
    const mainType = namedTypes.join(" | ");
    if (field.multiple) {
        const multipleReturnType = `Array<${mainType}>`;
        return field.required ? multipleReturnType : `${multipleReturnType} | undefined`;
    } else {
        return field.required ? mainType : `${mainType} | undefined`;
    }
}

fs.writeFileSync(`${__dirname}/../src/format/tree-sitter-types.d.ts`, result.join("\n"));

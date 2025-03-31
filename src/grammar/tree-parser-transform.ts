import { assertNever } from "../util";
import * as ast from "./ast";
import * as parser from "./tree-sitter-types";

type ChildTypes<T> = T extends { children: Array<infer S> } ? S : never; 

function transformStatement(node: ChildTypes<parser.root_Node>): ast.Statement {
    switch (node.type) {
        case "function":
            return transformFunction(node);
        case "component":
            return transformComponent(node);
        default:
            assertNever(node.type, "transform should handle all options");
    }
}

export function transformRoot(root: parser.root_Node): ast.File {
    return root.children.map(transformStatement);
}

function transformFunction(node: parser.function_Node): ast.FunctionDefinition {
    return {
        kind: ast.SyntaxKind.FunctionDefinition,
        position: nodePosition(node),
        name: transformName(node.childForFieldName("name")),
    };
}

function transformComponent(component: parser.component_Node): ast.ComponentDefinition {
    return {
        kind: ast.SyntaxKind.ComponentDefinition,
        position: nodePosition(component),
    }
}

function transformName(node: parser.name_Node): ast.Identifier {
    return {
        kind: ast.SyntaxKind.Identifier,
        position: nodePosition(node),
        text: node.text
    };
}


function nodePosition(node: parser.AllNodes): ast.SourceRange {
    return {
        from: {
            index: node.startIndex,
            line: node.startPosition.row,
            column: node.startPosition.column,
        },
        to: {
            index: node.endIndex,
            line: node.endPosition.row,
            column: node.endPosition.column,
        }
    }
}
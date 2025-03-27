import { SourcePosition, SourceRange } from "./diagnostic";
import * as parser from "./grammar/parser";
import * as ast from "./grammar/ast";

export function nodeToSourceRange(node: { start: parser.PosInfo; end: parser.PosInfo }): SourceRange {
    return {
        from: posInfoToSourcePosition(node.start),
        to: posInfoToSourcePosition(node.end),
    };
}

export function posInfoToSourcePosition(pos: parser.PosInfo): SourcePosition {
    return {
        index: pos.overallPos,
        line: pos.line,
        column: pos.offset,
    };
}

export function headTailToList<T>(obj: { head?: T; tail: Array<{ elem: T }> }): Array<NonNullable<T>> {
    const result = [];
    if (obj.head) {
        result.push(obj.head);
    }
    for (const { elem } of obj.tail) {
        if (elem) result.push(elem);
    }
    return result;
}

export function isIdentifier(node: ast.AnyAstNode): node is parser.identifier {
    return node.kind === parser.ASTKinds.identifier;
}

export function isCompoundName(node: ast.AnyAstNode): node is parser.compound_name_$0 {
    return node.kind === parser.ASTKinds.compound_name_$0;
}

export function isCompoundBindingExpression(node: ast.AnyAstNode): node is parser.binding_expression_$0 {
    return node.kind === parser.ASTKinds.binding_expression_$0;
}

export function isCallExpression(node: ast.AnyAstNode): node is parser.call_expression {
    return node.kind === parser.ASTKinds.call_expression;
}

export function isCompound(node: ast.AnyAstNode): node is parser.compound {
    return node.kind === parser.ASTKinds.compound;
}

export function isEvent(node: ast.AnyAstNode): node is ast.EventDeclaration {
    return node.kind === ast.SyntaxKind.Event;
}

export function isFunctionDefinition(statement: ast.AnyAstNode): statement is ast.FunctionDefinition {
    return statement.kind === ast.SyntaxKind.FunctionDefinition;
}

export function isInstance(statement: ast.AnyAstNode): statement is parser.instance {
    return statement.kind === parser.ASTKinds.instance;
}

export function isNamespace(node: ast.AnyAstNode): node is parser.namespace {
    return node.kind === parser.ASTKinds.namespace;
}

export function isSourceFile(node: ast.AnyAstNode): node is parser.file {
    return node.kind === parser.ASTKinds.file;
}

export function isTypeReference(node: ast.AnyAstNode): node is parser.type_reference {
    return node.kind === parser.ASTKinds.type_reference;
}

export function isPort(node: ast.AnyAstNode): node is parser.port {
    return node.kind === parser.ASTKinds.port;
}

export function isInjected(port: parser.port) {
    return port.qualifiers?.some(q => q.qualifier === "injected") === true;
}

export function isExpressionStatement(node: ast.AnyAstNode): node is parser.expression_statement {
    return node.kind === parser.ASTKinds.expression_statement;
}

export function isInterfaceDefinition(node: ast.AnyAstNode): node is parser.interface_definition {
    return node.kind === parser.ASTKinds.interface_definition;
}

export type ScopedBlock = ast.AnyAstNode &
    (
        | parser.behavior
        | parser.behavior_compound
        | parser.component
        | parser.compound
        | parser.function_definition
        | parser.interface_definition
        | parser.namespace
        | parser.on_body
        | parser.system
        | parser.file
    );

export function isScopedBlock(node: ast.AnyAstNode): node is ScopedBlock {
    return (
        node.kind === parser.ASTKinds.behavior ||
        node.kind === parser.ASTKinds.behavior_compound ||
        node.kind === parser.ASTKinds.component ||
        node.kind === parser.ASTKinds.compound ||
        node.kind === parser.ASTKinds.function_definition ||
        node.kind === parser.ASTKinds.interface_definition ||
        node.kind === parser.ASTKinds.namespace ||
        node.kind === parser.ASTKinds.on_body ||
        node.kind === parser.ASTKinds.system ||
        node.kind === parser.ASTKinds.file
    );
}

export function isOnStatement(node: ast.AnyAstNode): node is parser.on {
    return node.kind === parser.ASTKinds.on;
}

export function systemInstances(system: parser.system): parser.instance[] {
    return system.instances_and_bindings
        .map(e => e.instance_or_binding)
        .filter(e => e.kind === parser.ASTKinds.instance) as parser.instance[];
}

export function systemBindings(system: parser.system): parser.binding[] {
    return system.instances_and_bindings
        .map(e => e.instance_or_binding)
        .filter(e => e.kind === parser.ASTKinds.binding) as parser.binding[];
}

export function findFirstParent<T extends ast.AnyAstNode>(
    node: ast.AnyAstNode,
    predicate: (node: ast.AnyAstNode) => node is T
): T | undefined {
    let n = node.parent;
    while (n) {
        if (predicate(n)) return n;
        n = n.parent;
    }
    return undefined;
}

export function nameToString(name: ast.Name): string {
    if (name.kind === ast.SyntaxKind.Identifier) {
        return name.text;
    } else {
        if (name.head) {
            return `${nameToString(name.head)}.${name.tail}`;
        } else {
            return `.${name.tail}`;
        }
    }
}

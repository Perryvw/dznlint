import { SourcePosition, SourceRange } from "./diagnostic";
import {
    ASTKinds,
    binding,
    identifier,
    instance,
    system,
    PosInfo,
    on,
    expression_statement,
    behavior_statement,
    function_definition,
    call_expression,
    compound,
    behavior_compound,
    compound_name_$0,
    binding_expression_$0,
    compound_name,
    interface_definition,
    namespace,
    component,
    behavior,
} from "./grammar/parser";
import { ASTNode } from "./linting-rule";

export function nodeToSourceRange(node: { start: PosInfo; end: PosInfo }): SourceRange {
    return {
        from: posInfoToSourcePosition(node.start),
        to: posInfoToSourcePosition(node.end),
    };
}

export function posInfoToSourcePosition(pos: PosInfo): SourcePosition {
    return {
        index: pos.overallPos,
        line: pos.line,
        column: pos.offset,
    };
}

export function headTailToList<T>(obj: { head?: T; tail: Array<{ elem: T }> }): Array<NonNullable<T>> {
    const result = [];
    if (obj.head) {
        result.push(obj.head as NonNullable<T>);
    }
    for (const { elem } of obj.tail) {
        result.push(elem as NonNullable<T>);
    }
    return result;
}

export function isIdentifier(node: ASTNode): node is identifier {
    return node.kind === ASTKinds.identifier;
}

export function isCompoundName(node: ASTNode): node is compound_name_$0 {
    return node.kind === ASTKinds.compound_name_$0;
}

export function isCompoundBindingExpression(node: ASTNode): node is binding_expression_$0 {
    return node.kind === ASTKinds.binding_expression_$0;
}

export function isCallExpression(node: ASTNode): node is call_expression {
    return node.kind === ASTKinds.call_expression;
}

export function isCompound(node: ASTNode): node is compound {
    return node.kind === ASTKinds.compound;
}

export type ScopedBlock =
    | behavior
    | component
    | compound
    | behavior_compound
    | system
    | namespace
    | interface_definition;

export function isScopedBlock(node: ASTNode): node is ScopedBlock {
    return (
        node.kind === ASTKinds.behavior ||
        node.kind === ASTKinds.behavior_compound ||
        node.kind === ASTKinds.component ||
        node.kind === ASTKinds.compound ||
        node.kind === ASTKinds.namespace ||
        node.kind === ASTKinds.interface_definition ||
        node.kind === ASTKinds.system
    );
}

export function isExpressionStatement(node: ASTNode): node is expression_statement {
    return node.kind === ASTKinds.expression_statement;
}

export function isFunctionDefinition(statement: behavior_statement): statement is function_definition {
    return statement.kind === ASTKinds.function_definition;
}

export function isOnEvent(node: ASTNode): node is on {
    return node.kind === ASTKinds.on;
}

export function systemInstances(system: system): instance[] {
    return system.instances_and_bindings
        .map(e => e.instance_or_binding)
        .filter(e => e.kind === ASTKinds.instance) as instance[];
}

export function systemBindings(system: system): binding[] {
    return system.instances_and_bindings
        .map(e => e.instance_or_binding)
        .filter(e => e.kind === ASTKinds.binding) as binding[];
}

export function findFirstParent<T extends ASTNode>(
    node: ASTNode,
    predicate: (node: ASTNode) => node is T
): T | undefined {
    let n = node.parent;
    while (n) {
        if (predicate(n)) return n;
        n = n.parent;
    }
    return undefined;
}

export function nameToString(name: compound_name): string {
    if (name.kind === ASTKinds.identifier) {
        return name.text;
    } else {
        if (name.compound) {
            return `${nameToString(name.compound)}.${name.name.text}`;
        } else {
            return `.${name.name.text}`;
        }
    }
}

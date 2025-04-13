import * as ast from "./grammar/ast";
import { Program, SourceFile } from "./semantics/program";
import { visitFile, VisitResult } from "./visitor";

export function findLeafAtPosition(
    file: SourceFile,
    line: number,
    column: number,
    program: Program
): ast.AnyAstNode | undefined {
    let leaf: ast.AnyAstNode | undefined;
    if (file.ast) {
        visitFile(
            file.ast,
            file.source,
            node => {
                if (!isPositionInNode(node, line, column)) {
                    return VisitResult.StopVisiting;
                }
                leaf = node;
            },
            program
        );
    }
    return leaf;
}

export function findNameAtPosition(
    file: SourceFile,
    line: number,
    column: number,
    program: Program
): ast.Identifier | undefined {
    let name: ast.Identifier | undefined;
    if (file.ast) {
        visitFile(
            file.ast,
            file.source,
            node => {
                if (!isPositionInNode(node, line, column)) {
                    return VisitResult.StopVisiting;
                }
                if (isIdentifier(node)) {
                    name = node;
                }
            },
            program
        );
    }
    return name;
}

export function isPositionInNode(node: ast.AnyAstNode, line: number, column: number): boolean {
    const left =
        line > node.position.from.line || (line === node.position.from.line && column >= node.position.from.column);
    const right = line < node.position.to.line || (line === node.position.to.line && column <= node.position.to.column);
    return left && right;
}

export function combineSourceRanges(from: ast.SourceRange, to: ast.SourceRange): ast.SourceRange {
    return {
        from: from.from,
        to: to.to,
    };
}

export function isIdentifier(node: ast.AnyAstNode): node is ast.Identifier {
    return node.kind === ast.SyntaxKind.Identifier;
}

export function isCompoundName(node: ast.AnyAstNode): node is ast.CompoundName {
    return node.kind === ast.SyntaxKind.CompoundName;
}

export function isCompoundBindingExpression(node: ast.AnyAstNode): node is ast.BindingCompoundName {
    return node.kind === ast.SyntaxKind.BindingCompoundName;
}

export function isCallExpression(node: ast.AnyAstNode): node is ast.CallExpression {
    return node.kind === ast.SyntaxKind.CallExpression;
}

export function isCompound(node: ast.AnyAstNode): node is ast.Compound {
    return node.kind === ast.SyntaxKind.Compound;
}

export function isEvent(node: ast.AnyAstNode): node is ast.Event {
    return node.kind === ast.SyntaxKind.Event;
}

export function isFunctionDefinition(statement: ast.AnyAstNode): statement is ast.FunctionDefinition {
    return statement.kind === ast.SyntaxKind.FunctionDefinition;
}

export function isAsterisk(node: ast.AnyAstNode): node is ast.Keyword<"*"> {
    return isKeyword(node) && node.text === "*";
}

export function isIllegalKeyword(node: ast.AnyAstNode): node is ast.Keyword<"illegal"> {
    return (
        (isKeyword(node) && node.text === "illegal") ||
        (isExpressionStatement(node) && isIllegalKeyword(node.expression))
    );
}

export function isOptionalKeyword(node: ast.AnyAstNode): node is ast.Keyword<"optional"> {
    return isKeyword(node) && node.text === "optional";
}

export function isInevitableKeyword(node: ast.AnyAstNode): node is ast.Keyword<"inevitable"> {
    return isKeyword(node) && node.text === "inevitable";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isKeyword(node: ast.AnyAstNode): node is ast.Keyword<any> {
    return node.kind === ast.SyntaxKind.Keyword;
}

export function isInstance(statement: ast.AnyAstNode): statement is ast.Instance {
    return statement.kind === ast.SyntaxKind.Instance;
}

export function isNamespace(node: ast.AnyAstNode): node is ast.Namespace {
    return node.kind === ast.SyntaxKind.Namespace;
}

export function isSourceFile(node: ast.AnyAstNode): node is ast.File {
    return node.kind === ast.SyntaxKind.File;
}

export function isTypeReference(node: ast.AnyAstNode): node is ast.TypeReference {
    return node.kind === ast.SyntaxKind.TypeReference;
}

export function isPort(node: ast.AnyAstNode): node is ast.Port {
    return node.kind === ast.SyntaxKind.Port;
}

export function isInjected(port: ast.Port) {
    return port.qualifiers.some(q => q.text === "injected") === true;
}

export function isExpressionStatement(node: ast.AnyAstNode): node is ast.ExpressionStatement {
    return node.kind === ast.SyntaxKind.ExpressionStatement;
}

export function isInterfaceDefinition(node: ast.AnyAstNode): node is ast.InterfaceDefinition {
    return node.kind === ast.SyntaxKind.InterfaceDefinition;
}

export type ScopedBlock = ast.AnyAstNode &
    (
        | ast.Behavior
        | ast.ComponentDefinition
        | ast.Compound
        | ast.FunctionDefinition
        | ast.InterfaceDefinition
        | ast.Namespace
        | ast.OnStatement
        | ast.System
        | ast.File
    );

export function isScopedBlock(node: ast.AnyAstNode): node is ScopedBlock {
    return (
        node.kind === ast.SyntaxKind.Identifier ||
        node.kind === ast.SyntaxKind.Behavior ||
        node.kind === ast.SyntaxKind.ComponentDefinition ||
        node.kind === ast.SyntaxKind.Compound ||
        node.kind === ast.SyntaxKind.FunctionDefinition ||
        node.kind === ast.SyntaxKind.InterfaceDefinition ||
        node.kind === ast.SyntaxKind.Namespace ||
        node.kind === ast.SyntaxKind.OnStatement ||
        node.kind === ast.SyntaxKind.System ||
        node.kind === ast.SyntaxKind.File
    );
}

export function isOnStatement(node: ast.AnyAstNode): node is ast.OnStatement {
    return node.kind === ast.SyntaxKind.OnStatement;
}

export function systemInstances(system: ast.System): ast.Instance[] {
    return system.instancesAndBindings.filter(e => e.kind === ast.SyntaxKind.Instance);
}

export function systemBindings(system: ast.System): ast.Binding[] {
    return system.instancesAndBindings.filter(e => e.kind === ast.SyntaxKind.Binding);
}

export function isChildOf(child: ast.AnyAstNode, parent: ast.AnyAstNode): boolean {
    let p = child.parent;
    while (p) {
        if (p === parent) return true;
        p = p.parent;
    }
    return false;
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
        if (name.compound) {
            return `${nameToString(name.compound)}.${name.name.text}`;
        } else {
            return `.${name.name.text}`;
        }
    }
}

export function assertNever(x: never, message: string): void {
    console.log("assertNever fail", message, x);
    throw message;
}

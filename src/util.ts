import * as ast from "./grammar/ast";
import { Program, SourceFile } from "./semantics/program";
import { SemanticSymbol, TypeChecker } from "./semantics/type-checker";
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
                if (node.errors) {
                    for (const err of node.errors) {
                        if (isPositionInNode(err, line, column)) {
                            leaf = err;
                            return VisitResult.StopVisiting;
                        }
                    }
                }
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

export function findNameAtLocationInErrorNode(
    node: ast.Error,
    line: number,
    column: number,
    typeChecker: TypeChecker
): { scope: ScopedBlock; owningObject?: SemanticSymbol; prefix: string; suffix: string } {
    const scope = findFirstParent(node, isScopedBlock) as ScopedBlock;

    // Skip ahead to the starting index of the search line in the node text
    let lineOffset = 0;
    for (let l = node.position.from.line; l < line; l++) {
        lineOffset = node.text.indexOf("\n", lineOffset) + 1;
    }
    // If node starts on same line as search line, offset the column instead because the node might start
    // at a later column in the line
    const columnOffset = column - (node.position.from.line === line ? node.position.from.column : 0);
    // This is the index in the node text we're looking for
    const cursorIndex = lineOffset + columnOffset;

    // Work backwards while still seeing valid name parts
    const namePattern = /[a-zA-Z0-9\-_.]+/g;
    namePattern.lastIndex = lineOffset; // Start looking at current line only

    let match = namePattern.exec(node.text);
    while (match) {
        const matchText = match[0];
        if (match.index + matchText.length >= cursorIndex) {
            // Calculate how much of the name is after the cursor
            const overrun = match.index + matchText.length - cursorIndex;

            // If dealing with a compound name, look up the owning symbol
            if (matchText.includes(".")) {
                const lastDot = matchText.lastIndexOf(".");
                const owningObjectString = matchText.substring(0, lastDot);
                const prefix = matchText.substring(lastDot + 1, cursorIndex);
                const suffix = matchText.substring(cursorIndex, cursorIndex + overrun);
                return {
                    scope,
                    owningObject: typeChecker.resolveNameInScope(owningObjectString, scope),
                    prefix,
                    suffix,
                };
            } else {
                const prefix = matchText.substring(0, matchText.length - overrun);
                const suffix = matchText.substring(matchText.length - overrun);
                return { scope, prefix, suffix };
            }
        }
        match = namePattern.exec(node.text);
    }

    // If no matches were found fall back on empty string
    return { scope, prefix: "", suffix: "" };
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

export function isEventParameter(node: ast.AnyAstNode): node is ast.EventParameter {
    return node.kind === ast.SyntaxKind.EventParameter;
}

export function isComponentDefinition(statement: ast.AnyAstNode): statement is ast.ComponentDefinition {
    return statement.kind === ast.SyntaxKind.ComponentDefinition;
}

export function isEnumDefinition(statement: ast.AnyAstNode): statement is ast.EnumDefinition {
    return statement.kind === ast.SyntaxKind.EnumDefinition;
}

export function isFunctionDefinition(statement: ast.AnyAstNode): statement is ast.FunctionDefinition {
    return statement.kind === ast.SyntaxKind.FunctionDefinition;
}

export function isFunctionParameter(expression: ast.AnyAstNode): expression is ast.FunctionParameter {
    return expression.kind === ast.SyntaxKind.FunctionParameter;
}

export function isGuardStatement(statement: ast.AnyAstNode): statement is ast.GuardStatement {
    return statement.kind === ast.SyntaxKind.GuardStatement;
}

export function isOnParameter(expression: ast.AnyAstNode): expression is ast.OnParameter {
    return expression.kind === ast.SyntaxKind.OnParameter;
}

export function isVariableDefinition(statement: ast.AnyAstNode): statement is ast.VariableDefinition {
    return statement.kind === ast.SyntaxKind.VariableDefinition;
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

export function isReplyKeyword(node: ast.AnyAstNode): node is ast.Keyword<"reply"> {
    return isKeyword(node) && node.text === "reply";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isKeyword(node: ast.AnyAstNode): node is ast.Keyword<any> {
    return node.kind === ast.SyntaxKind.Keyword;
}

export function isAssignment(statement: ast.AnyAstNode): statement is ast.AssignmentStatement {
    return statement.kind === ast.SyntaxKind.AssignmentStatement;
}

export function isExtern(statement: ast.AnyAstNode): statement is ast.ExternDeclaration {
    return statement.kind === ast.SyntaxKind.ExternDeclaration;
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

export function isReply(node: ast.AnyAstNode): node is ast.Reply {
    return node.kind === ast.SyntaxKind.Reply;
}

export function isInjected(port: ast.Port) {
    return port.qualifiers.some(q => q.text === "injected") === true;
}

export function isExpressionStatement(node: ast.AnyAstNode): node is ast.ExpressionStatement {
    return node.kind === ast.SyntaxKind.ExpressionStatement;
}

export function isIntDefinition(node: ast.AnyAstNode): node is ast.IntDefinition {
    return node.kind === ast.SyntaxKind.IntDefinition;
}

export function isInterfaceDefinition(node: ast.AnyAstNode): node is ast.InterfaceDefinition {
    return node.kind === ast.SyntaxKind.InterfaceDefinition;
}

export function isImportStatement(node: ast.AnyAstNode): node is ast.ImportStatement {
    return node.kind === ast.SyntaxKind.ImportStatement;
}

export function isErrorNode(node: ast.AnyAstNode): node is ast.Error {
    return node.kind === ast.SyntaxKind.ERROR;
}

export type ScopedBlock = ast.AnyAstNode &
    (
        | ast.Behavior
        | ast.ComponentDefinition
        | ast.Compound
        | ast.FunctionDefinition
        | ast.GuardStatement
        | ast.IfStatement
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
        node.kind === ast.SyntaxKind.GuardStatement ||
        node.kind === ast.SyntaxKind.InterfaceDefinition ||
        node.kind === ast.SyntaxKind.Namespace ||
        node.kind === ast.SyntaxKind.OnStatement ||
        node.kind === ast.SyntaxKind.System ||
        node.kind === ast.SyntaxKind.IfStatement ||
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

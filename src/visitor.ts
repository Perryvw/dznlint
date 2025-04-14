import * as ast from "./grammar/ast";
import { InputSource, Program } from "./semantics/program";
import { TypeChecker } from "./semantics/type-checker";
import { isKeyword } from "./util";

const stopVisiting = () => {};

type ScopeRoot =
    | ast.Behavior
    | ast.ComponentDefinition
    | ast.Compound
    | ast.File
    | ast.FunctionDefinition
    | ast.IfStatement
    | ast.InterfaceDefinition
    | ast.Namespace
    | ast.OnStatement
    | ast.System;

interface Scope {
    root: ScopeRoot;
    variable_declarations: Record<string, ast.Identifier>;
}

export class VisitorContext {
    typeChecker: TypeChecker;
    scopeStack: Scope[] = [];

    constructor(
        public source: InputSource,
        public program: Program
    ) {
        this.typeChecker = new TypeChecker(program);
    }

    pushScope(root: ScopeRoot): void {
        this.scopeStack.unshift({ root, variable_declarations: {} });
    }

    currentScope(): Scope {
        return this.scopeStack[0];
    }

    popScope(): void {
        this.scopeStack.shift();
    }

    visit(node: ast.AnyAstNode, callback: VisitorCallback) {
        const result = callback(node, this);

        if (result !== VisitResult.StopVisiting) {
            const visitor = visitors[node.kind];
            if (visitor) {
                visitor(node, this, callback);
            } else {
                console.log(`Unknown visitor kind ${node.kind}`);
            }
        }
    }
}

export enum VisitResult {
    Continue,
    StopVisiting,
}
export type VisitorCallback = (node: ast.AnyAstNode, context: VisitorContext) => VisitResult | void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const visitors: Partial<Record<ast.SyntaxKind, (node: any, context: VisitorContext, cb: VisitorCallback) => void>> = {
    // Root node
    [ast.SyntaxKind.File]: (node: ast.File, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const statement of node.statements) {
            context.visit(statement, cb);
        }
        context.popScope();
    },

    [ast.SyntaxKind.AssignmentStatement]: (
        node: ast.AssignmentStatement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.left, cb);
        context.visit(node.right, cb);
    },
    [ast.SyntaxKind.Behavior]: (node: ast.Behavior, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const statement of node.statements) {
            context.visit(statement, cb);
        }
        context.popScope();
    },
    [ast.SyntaxKind.BinaryExpression]: (node: ast.BinaryExpression, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.left, cb);
        context.visit(node.right, cb);
    },
    [ast.SyntaxKind.Binding]: (node: ast.Binding, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.left, cb);
        context.visit(node.right, cb);
    },
    [ast.SyntaxKind.BindingCompoundName]: (
        node: ast.BindingCompoundName,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.compound, cb);
        context.visit(node.name, cb);
    },
    [ast.SyntaxKind.CallExpression]: (node: ast.CallExpression, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.expression, cb);
        for (const expression of node.arguments.arguments) {
            context.visit(expression, cb);
        }
    },
    [ast.SyntaxKind.ComponentDefinition]: (
        node: ast.ComponentDefinition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.pushScope(node);

        context.visit(node.name, cb);

        for (const port of node.ports) {
            context.visit(port, cb);
        }

        if (node.body) {
            context.visit(node.body, cb);
        }
        context.popScope();
    },
    [ast.SyntaxKind.Compound]: (node: ast.Compound, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const statement of node.statements) {
            context.visit(statement, cb);
        }
        context.popScope();
    },
    [ast.SyntaxKind.CompoundName]: (node: ast.CompoundName, context: VisitorContext, cb: VisitorCallback) => {
        if (node.compound) context.visit(node.compound, cb);
        context.visit(node.name, cb);
    },
    [ast.SyntaxKind.DeferStatement]: (node: ast.DeferStatement, context: VisitorContext, cb: VisitorCallback) => {
        if (node.arguments) {
            for (const argument of node.arguments.arguments) {
                context.visit(argument, cb);
            }
        }

        context.visit(node.statement, cb);
    },
    [ast.SyntaxKind.Event]: (node: ast.Event, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.type, cb);
        context.visit(node.eventName, cb);

        for (const param of node.parameters) {
            context.visit(param.type, cb);
        }
    },
    [ast.SyntaxKind.ExpressionStatement]: (
        node: ast.ExpressionStatement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.expression, cb);
    },
    [ast.SyntaxKind.FunctionDefinition]: (
        node: ast.FunctionDefinition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.returnType, cb);
        context.visit(node.name, cb);
        context.pushScope(node);

        for (const parameter of node.parameters) {
            context.currentScope().variable_declarations[parameter.name.text] = parameter.name;
            context.visit(parameter, cb);
        }
        context.visit(node.body, cb);
        context.popScope();
    },
    [ast.SyntaxKind.FunctionParameter]: (node: ast.FunctionParameter, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.type, cb);
        context.visit(node.name, cb);
    },
    [ast.SyntaxKind.GuardStatement]: (node: ast.GuardStatement, context: VisitorContext, cb: VisitorCallback) => {
        if (node.condition) {
            if (typeof node.condition !== "string") {
                context.visit(node.condition, cb);
            }
        }

        if (node.statement) {
            context.visit(node.statement, cb);
        }
    },
    [ast.SyntaxKind.IfStatement]: (node: ast.IfStatement, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.condition, cb);
        context.pushScope(node);
        context.visit(node.statement, cb);

        if (node.else) {
            return context.visit(node.else, cb);
        }
        context.popScope();
    },
    [ast.SyntaxKind.Instance]: (node: ast.Instance, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.type, cb);
        context.visit(node.name, cb);
    },
    [ast.SyntaxKind.InterfaceDefinition]: (
        node: ast.InterfaceDefinition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.pushScope(node);

        context.visit(node.name, cb);

        for (const type_or_event of node.body) {
            context.visit(type_or_event, cb);
        }

        if (node.behavior) {
            for (const statement of node.behavior.statements) {
                context.visit(statement, cb);
            }
        }
        context.popScope();
    },
    [ast.SyntaxKind.InvariantStatement]: (
        node: ast.InvariantStatement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.expression, cb);
    },
    [ast.SyntaxKind.Namespace]: (node: ast.Namespace, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const statement of node.statements) {
            context.visit(statement, cb);
        }
        context.popScope();
    },
    [ast.SyntaxKind.OnStatement]: (node: ast.OnStatement, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);

        for (const trigger of node.triggers) {
            context.visit(trigger, cb);
        }

        context.visit(node.body, cb);

        context.popScope();
    },
    [ast.SyntaxKind.OnParameter]: (node: ast.OnParameter, context: VisitorContext, cb: VisitorCallback) => {
        context.currentScope().variable_declarations[node.name.text] = node.name;

        context.visit(node.name, cb);

        if (node.assignment) {
            context.visit(node.assignment, cb);
        }
    },
    [ast.SyntaxKind.OnTrigger]: (node: ast.OnTrigger, context: VisitorContext, cb: VisitorCallback) => {
        if (isKeyword(node)) return;

        context.visit(node.name, cb);

        if (node.parameterList?.parameters) {
            for (const parameter of node.parameterList.parameters) {
                context.visit(parameter, cb);
            }
        }
    },
    [ast.SyntaxKind.ParenthesizedExpression]: (
        node: ast.ParenthesizedExpression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.expression, cb);
    },
    [ast.SyntaxKind.Port]: (node: ast.Port, context: VisitorContext, cb: VisitorCallback) => {
        context.currentScope().variable_declarations[node.name.text] = node.name;
        context.visit(node.type, cb);
        context.visit(node.name, cb);
    },
    [ast.SyntaxKind.Reply]: (node: ast.Reply, context: VisitorContext, cb: VisitorCallback) => {
        if (node.port) context.visit(node.port, cb);
        if (node.value) context.visit(node.value, cb);
    },
    [ast.SyntaxKind.ReturnStatement]: (node: ast.ReturnStatement, context: VisitorContext, cb: VisitorCallback) => {
        if (node.returnValue) {
            context.visit(node.returnValue, cb);
        }
    },
    [ast.SyntaxKind.System]: (node: ast.System, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const instance_or_binding of node.instancesAndBindings) {
            context.visit(instance_or_binding, cb);
        }
        context.popScope();
    },
    [ast.SyntaxKind.TypeReference]: (node: ast.TypeReference, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.typeName, cb);
    },
    [ast.SyntaxKind.VariableDefinition]: (
        node: ast.VariableDefinition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.currentScope().variable_declarations[node.name.text] = node.name;
        context.visit(node.type, cb);
        context.visit(node.name, cb);
        if (node.initializer) {
            context.visit(node.initializer, cb);
        }
    },
    [ast.SyntaxKind.UnaryOperatorExpression]: (
        node: ast.UnaryOperatorExpression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.expression, cb);
    },

    // Leaf nodes, no need to visit children of these
    [ast.SyntaxKind.BooleanLiteral]: stopVisiting,
    [ast.SyntaxKind.DollarLiteral]: stopVisiting,
    [ast.SyntaxKind.EnumDefinition]: stopVisiting,
    [ast.SyntaxKind.ExternDeclaration]: stopVisiting,
    [ast.SyntaxKind.Identifier]: stopVisiting,
    [ast.SyntaxKind.Keyword]: stopVisiting,
    [ast.SyntaxKind.ImportStatement]: stopVisiting,
    [ast.SyntaxKind.IntDefinition]: stopVisiting,
    [ast.SyntaxKind.NumericLiteral]: stopVisiting,
};

export function visitFile(file: ast.File, source: InputSource, callback: VisitorCallback, program: Program) {
    const context = new VisitorContext(source, program);
    context.visit(file, callback);
}

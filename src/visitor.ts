import * as ast from "./grammar/ast";
import { ASTNode } from "./linting-rule";
import { InputSource, Program } from "./semantics/program";
import { TypeChecker } from "./semantics/type-checker";
import { headTailToList, isKeyword } from "./util";

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

    visit(node: ASTNode, callback: VisitorCallback) {
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
export type VisitorCallback = (node: ASTNode, context: VisitorContext) => VisitResult | void;

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
        context.popScope();

        if (node.else) {
            return context.visit(node.else, cb);
        }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setParentVisitors: Partial<Record<ast.SyntaxKind, (node: any) => void>> = {
    // Root node
    [ast.SyntaxKind.File]: (node: ast.File) => {
        for (const statement of node.statements) {
            setParent(statement, node);
        }
    },

    [ast.SyntaxKind.AssignmentStatement]: (node: ast.AssignmentStatement) => {
        setParent(node.left, node);
        setParent(node.right, node);
    },
    [ast.SyntaxKind.Behavior]: (node: ast.Behavior) => {
        for (const statement of node.statements) {
            setParent(statement, node);
        }
    },
    [ast.SyntaxKind.BinaryExpression]: (node: ast.BinaryExpression) => {
        setParent(node.left, node);
        setParent(node.right, node);
    },
    [ast.SyntaxKind.Binding]: (node: ast.Binding) => {
        setParent(node.left, node);
        setParent(node.right, node);
    },
    [ast.SyntaxKind.BindingCompoundName]: (node: ast.BindingCompoundName) => {
        setParent(node.compound, node);
        setParent(node.name, node);
    },
    [ast.SyntaxKind.CallExpression]: (node: ast.CallExpression) => {
        setParent(node.expression, node);
        for (const expression of node.arguments.arguments) {
            setParent(expression, node);
        }
    },
    [ast.SyntaxKind.ComponentDefinition]: (node: ast.ComponentDefinition) => {
        for (const port of node.ports) {
            setParent(port, node);
        }

        if (node.body) {
            setParent(node.body, node);
        }
    },
    [ast.SyntaxKind.Compound]: (node: ast.Compound) => {
        for (const statement of node.statements) {
            setParent(statement, node);
        }
    },
    [ast.SyntaxKind.CompoundName]: (node: ast.CompoundName) => {
        if (node.compound) setParent(node.compound, node);
        setParent(node.name, node);
    },
    [ast.SyntaxKind.DeferStatement]: (node: ast.DeferStatement) => {
        if (node.arguments) {
            for (const argument of node.arguments.arguments) {
                setParent(argument, node);
            }
        }
        setParent(node.statement, node);
    },
    [ast.SyntaxKind.EnumDefinition]: (node: ast.EnumDefinition) => {
        setParent(node.name, node);
        for (const member of node.members) {
            setParent(member, node);
        }
    },
    [ast.SyntaxKind.Event]: (node: ast.Event) => {
        setParent(node.eventName, node);
        setParent(node.type, node);

        for (const param of node.parameters) {
            setParent(param, node);
            setParent(param.name, param);
            setParent(param.type, param);
        }
    },
    [ast.SyntaxKind.ExpressionStatement]: (node: ast.ExpressionStatement) => {
        setParent(node.expression, node);
    },
    [ast.SyntaxKind.FunctionDefinition]: (node: ast.FunctionDefinition) => {
        setParent(node.body, node);
        setParent(node.returnType, node);
        setParent(node.name, node);

        for (const parameter of node.parameters) {
            setParent(parameter, node);
        }
    },
    [ast.SyntaxKind.FunctionParameter]: (node: ast.FunctionParameter) => {
        setParent(node.type, node);
        setParent(node.name, node);
    },
    [ast.SyntaxKind.GuardStatement]: (node: ast.GuardStatement) => {
        if (node.condition) {
            setParent(node.condition, node);
        }

        setParent(node.statement, node);
    },
    [ast.SyntaxKind.IfStatement]: (node: ast.IfStatement) => {
        setParent(node.condition, node);
        setParent(node.statement, node);

        if (node.else) {
            setParent(node.else, node);
        }
    },
    [ast.SyntaxKind.Instance]: (node: ast.Instance) => {
        setParent(node.name, node);
        setParent(node.type, node);
    },
    [ast.SyntaxKind.InterfaceDefinition]: (node: ast.InterfaceDefinition) => {
        for (const type_or_event of node.body) {
            setParent(type_or_event, node);
        }

        if (node.behavior) {
            setParent(node.behavior, node);
            for (const statement of node.behavior.statements) {
                setParent(statement, node.behavior);
            }
        }
    },
    [ast.SyntaxKind.InvariantStatement]: (node: ast.InvariantStatement) => {
        setParent(node.expression, node);
    },
    [ast.SyntaxKind.Namespace]: (node: ast.Namespace) => {
        setParent(node.name, node);
        for (const statement of node.statements) {
            setParent(statement, node);
        }
    },
    [ast.SyntaxKind.OnStatement]: (node: ast.OnStatement) => {
        for (const trigger of node.triggers) {
            if (trigger) setParent(trigger, node);
        }

        setParent(node.body, node);
    },
    [ast.SyntaxKind.OnParameter]: (node: ast.OnParameter) => {
        setParent(node.name, node);

        if (node.assignment) {
            setParent(node.assignment, node);
        }
    },
    [ast.SyntaxKind.OnTrigger]: (node: ast.OnTrigger) => {
        if (isKeyword(node)) return;
        setParent(node.name, node);

        if (node.parameterList?.parameters) {
            for (const parameter of node.parameterList.parameters) {
                setParent(parameter, node);
            }
        }
    },
    [ast.SyntaxKind.ParenthesizedExpression]: (node: ast.ParenthesizedExpression) => {
        setParent(node.expression, node);
    },
    [ast.SyntaxKind.Port]: (node: ast.Port) => {
        setParent(node.name, node);
        setParent(node.type, node);
    },
    [ast.SyntaxKind.Reply]: (node: ast.Reply) => {
        if (node.port) setParent(node.port, node);
        if (node.value) setParent(node.value, node);
    },
    [ast.SyntaxKind.ReturnStatement]: (node: ast.ReturnStatement) => {
        if (node.returnValue) {
            setParent(node.returnValue, node);
        }
    },
    [ast.SyntaxKind.System]: (node: ast.System) => {
        for (const instance_or_binding of node.instancesAndBindings) {
            setParent(instance_or_binding, node);
        }
    },
    [ast.SyntaxKind.TypeReference]: (node: ast.TypeReference) => {
        setParent(node.typeName, node);
    },
    [ast.SyntaxKind.VariableDefinition]: (node: ast.VariableDefinition) => {
        setParent(node.type, node);
        if (node.initializer) {
            setParent(node.initializer, node);
        }
    },
    [ast.SyntaxKind.UnaryOperatorExpression]: (node: ast.UnaryOperatorExpression) => {
        setParent(node.expression, node);
    },
};

export function visitFile(file: ast.File, source: InputSource, callback: VisitorCallback, program: Program) {
    const context = new VisitorContext(source, program);
    context.visit(file, callback);
}

export const setParentVisitor: VisitorCallback = (node, context) =>
    context.visit(node, n => setParentVisitors[n.kind]?.(n));

function setParent(node: ASTNode, parent: ASTNode) {
    node.parent = parent;
}

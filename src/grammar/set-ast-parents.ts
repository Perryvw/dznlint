import * as ast from "./ast";
import { VisitorCallback } from "../visitor";
import { isKeyword } from "../util";

export const setParentVisitor: VisitorCallback = node => {
    setParentVisitors[node.kind]?.(node);
    if (node.errors) {
        for (const err of node.errors) {
            setParent(err, node);
        }
    }
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
        setParent(node.name, node);
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

function setParent(node: ast.AnyAstNode, parent: ast.AnyAstNode) {
    node.parent = parent;
}

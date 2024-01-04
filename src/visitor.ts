import { InputSource } from "./api";
import * as parser from "./grammar/parser";
import { ASTNode } from "./linting-rule";
import { TypeChecker } from "./semantics/program";
import { headTailToList } from "./util";

const stopVisiting = () => {};

type ScopeRoot =
    | parser.behavior
    | parser.component
    | parser.compound
    | parser.file
    | parser.function_definition
    | parser.if_statement
    | parser.else_statement
    | parser.interface_definition
    | parser.namespace
    | parser.on
    | parser.system;

interface Scope {
    root: ScopeRoot;
    variable_declarations: Record<string, parser.identifier>;
}

export class VisitorContext {
    typeChecker: TypeChecker = new TypeChecker();
    scopeStack: Scope[] = [];

    constructor(public source: InputSource) {}

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
const visitors: Partial<Record<parser.ASTKinds, (node: any, context: VisitorContext, cb: VisitorCallback) => void>> = {
    // Root node
    [parser.ASTKinds.file]: (node: parser.file, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { statement } of node.statements) {
            setParent(statement, node);
            context.visit(statement, cb);
        }
        context.popScope();
    },

    [parser.ASTKinds.assignment]: (node: parser.assignment, context: VisitorContext, cb: VisitorCallback) => {
        setParent(node.left, node);
        setParent(node.right, node);

        context.visit(node.left, cb);
        context.visit(node.right, cb);
    },
    [parser.ASTKinds.behavior]: (node: parser.behavior, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { statement } of node.block.statements) {
            setParent(statement, node);
            context.visit(statement, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.binary_expression]: (
        node: parser.binary_expression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        setParent(node.left, node);
        setParent(node.right, node);

        context.visit(node.left, cb);
        context.visit(node.right, cb);
    },
    [parser.ASTKinds.binding]: (node: parser.binding, context: VisitorContext, cb: VisitorCallback) => {
        setParent(node.left, node);
        setParent(node.right, node);

        context.visit(node.left, cb);
        context.visit(node.right, cb);
    },
    [parser.ASTKinds.binding_expression_$0]: (
        node: parser.binding_expression_$0,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        setParent(node.compound, node);
        setParent(node.name, node);

        context.visit(node.compound, cb);
        context.visit(node.name, cb);
    },
    [parser.ASTKinds.call_expression]: (node: parser.call_expression, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.expression, cb);
        for (const { expression } of node.arguments) {
            setParent(expression, node);
            context.visit(expression, cb);
        }
    },
    [parser.ASTKinds.component]: (node: parser.component, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { port } of node.ports) {
            setParent(port, node);
            context.visit(port, cb);
        }

        if (node.body) {
            setParent(node.body, node);
            context.visit(node.body, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.compound]: (node: parser.compound, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { statement } of node.statements) {
            setParent(statement, node);
            context.visit(statement, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.defer_statement]: (node: parser.defer_statement, context: VisitorContext, cb: VisitorCallback) => {
        if (node.header.arguments) {
            for (const argument of node.header.arguments.arguments) {
                setParent(argument.expression, node);
                context.visit(argument.expression, cb);
            }
        }
        setParent(node.statement, node);
        context.visit(node.statement, cb);
    },
    [parser.ASTKinds.dollar_statement]: (
        node: parser.dollar_statement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        setParent(node.expression, node);
        context.visit(node.expression, cb);
    },
    [parser.ASTKinds.expression_statement]: (
        node: parser.expression_statement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        setParent(node.expression, node);
        context.visit(node.expression, cb);
    },
    [parser.ASTKinds.function_definition]: (
        node: parser.function_definition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        setParent(node.body, node);
        setParent(node.name, node);

        context.visit(node.name, cb);
        context.pushScope(node);
        if (node.parameters.formals) {
            for (const parameter of headTailToList(node.parameters.formals)) {
                setParent(parameter, node);
                context.currentScope().variable_declarations[parameter.name.text] = parameter.name;
                context.visit(parameter, cb);
            }
        }
        context.visit(node.body, cb);
        context.popScope();
    },
    [parser.ASTKinds.guard]: (node: parser.guard, context: VisitorContext, cb: VisitorCallback) => {
        if (node.condition) {
            if (typeof node.condition !== "string") {
                setParent(node.condition, node);
                context.visit(node.condition, cb);
            }
        }

        if (node.statement) {
            setParent(node.statement, node);
            context.visit(node.statement, cb);
        }
    },
    [parser.ASTKinds.if_statement]: (node: parser.if_statement, context: VisitorContext, cb: VisitorCallback) => {
        setParent(node.expression, node);
        setParent(node.statement, node);

        context.visit(node.expression, cb);
        context.pushScope(node);
        context.visit(node.statement, cb);
        context.popScope();

        for (const elseStatement of node.else_statements) {
            setParent(elseStatement, node);
            const { elseif, statement } = elseStatement;
            if (elseif) {
                setParent(elseif.expression, elseStatement);
                context.visit(elseif.expression, cb);
            }

            setParent(statement, elseStatement);
            context.pushScope(elseStatement);
            context.visit(statement, cb);
            context.popScope();
        }
    },
    [parser.ASTKinds.interface_definition]: (
        node: parser.interface_definition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.pushScope(node);
        for (const { type_or_event } of node.body) {
            setParent(type_or_event, node);
            context.visit(type_or_event, cb);
        }

        if (node.behavior) {
            for (const { statement } of node.behavior.block.statements) {
                setParent(statement, node);
                context.visit(statement, cb);
            }
        }
        context.popScope();
    },
    [parser.ASTKinds.namespace]: (node: parser.namespace, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { statement } of node.root.statements) {
            setParent(statement, node);
            context.visit(statement, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.on]: (node: parser.on, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);

        for (const trigger of headTailToList(node.on_trigger_list)) {
            setParent(trigger, node);
            context.visit(trigger, cb);
        }

        setParent(node.statement, node);
        context.visit(node.statement, cb);

        context.popScope();
    },
    [parser.ASTKinds.on_formal]: (node: parser.on_formal, context: VisitorContext, cb: VisitorCallback) => {
        context.currentScope().variable_declarations[node.name.text] = node.name;
        setParent(node.name, node);
        context.visit(node.name, cb);

        if (node.assignment) {
            setParent(node.assignment.name, node);
            context.visit(node.assignment.name, cb);
        }
    },
    [parser.ASTKinds.on_trigger]: (node: parser.on_trigger, context: VisitorContext, cb: VisitorCallback) => {
        setParent(node.name, node);
        context.visit(node.name, cb);

        if (node.parameters?.formals) {
            for (const parameter of headTailToList(node.parameters.formals)) {
                setParent(parameter, node);
                context.visit(parameter, cb);
            }
        }
    },
    [parser.ASTKinds.parenthesized_expression]: (
        node: parser.parenthesized_expression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        setParent(node.expression, node);
        context.visit(node.expression, cb);
    },
    [parser.ASTKinds.port]: (node: parser.port, context: VisitorContext) => {
        context.currentScope().variable_declarations[node.name.text] = node.name;
    },
    [parser.ASTKinds.property_expression]: (
        node: parser.property_expression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        if (node.expression) {
            setParent(node.expression, node);
            context.visit(node.expression, cb);
        }
    },
    [parser.ASTKinds.return_statement]: (
        node: parser.return_statement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        if (node.expression) {
            setParent(node.expression, node);
            context.visit(node.expression, cb);
        }
    },
    [parser.ASTKinds.system]: (node: parser.system, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { instance_or_binding } of node.instances_and_bindings) {
            setParent(instance_or_binding, node);
            context.visit(instance_or_binding, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.variable_definition]: (
        node: parser.variable_definition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.currentScope().variable_declarations[node.name.text] = node.name;
        if (node.initializer) {
            setParent(node.initializer.expression, node);
            context.visit(node.initializer.expression, cb);
        }
    },
    [parser.ASTKinds.unary_operator_expression]: (
        node: parser.unary_operator_expression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        setParent(node.expression, node);
        context.visit(node.expression, cb);
    },

    // Leaf nodes, no need to visit children of these
    [parser.ASTKinds.compound_name_$0]: stopVisiting,
    [parser.ASTKinds.dollars]: stopVisiting,
    [parser.ASTKinds.enum_definition]: stopVisiting,
    [parser.ASTKinds.extern_definition]: stopVisiting,
    [parser.ASTKinds.event]: stopVisiting,
    [parser.ASTKinds.formal]: stopVisiting,
    [parser.ASTKinds.identifier]: stopVisiting,
    [parser.ASTKinds.ILLEGAL]: stopVisiting,
    [parser.ASTKinds.import_statement]: stopVisiting,
    [parser.ASTKinds.instance]: stopVisiting,
    [parser.ASTKinds.int]: stopVisiting,
    [parser.ASTKinds.member_identifier]: stopVisiting,
    [parser.ASTKinds.numeric_literal]: stopVisiting,
    [parser.ASTKinds.sl_comment]: stopVisiting,
};

export function visitFile(file: parser.file, source: InputSource, callback: VisitorCallback) {
    const context = new VisitorContext(source);
    context.visit(file, callback);
}

function setParent(node: ASTNode, parent: ASTNode) {
    node.parent = parent;
}

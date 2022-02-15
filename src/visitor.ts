import { InputSource } from "./api";
import * as parser from "./grammar/parser";
import { ASTNode } from "./linting-rule";
import { headTailToList } from "./util";

const stopVisiting = () => {};

type ScopeRoot =
    | parser.behavior
    | parser.component
    | parser.compound
    | parser.file
    | parser.function_definition
    | parser.interface_definition
    | parser.namespace
    | parser.on
    | parser.system;

interface Scope {
    root: ScopeRoot;
    variable_declarations: Record<string, parser.identifier>;
}

export class VisitorContext {
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
            context.visit(statement, cb);
        }
        context.popScope();
    },

    [parser.ASTKinds.assignment]: (node: parser.assignment, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.left, cb);
        context.visit(node.right, cb);
    },
    [parser.ASTKinds.behavior]: (node: parser.behavior, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { statement } of node.block.statements) {
            context.visit(statement, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.binary_expression]: (
        node: parser.binary_expression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.left, cb);
        context.visit(node.right, cb);
    },
    [parser.ASTKinds.binding]: (node: parser.binding, context: VisitorContext, cb: VisitorCallback) => {
        if (typeof node.left !== "string") {
            context.visit(node.left.name, cb);
        }
        if (typeof node.right !== "string") {
            context.visit(node.right.name, cb);
        }
    },
    [parser.ASTKinds.call_expression]: (node: parser.call_expression, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.expression, cb);
        for (const { expression } of node.arguments) {
            context.visit(expression, cb);
        }
    },
    [parser.ASTKinds.component]: (node: parser.component, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { port } of node.ports) {
            context.visit(port, cb);
        }

        if (node.body) {
            context.visit(node.body, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.compound]: (node: parser.compound, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { statement } of node.statements) {
            context.visit(statement, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.expression_statement]: (
        node: parser.expression_statement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.expression, cb);
    },
    [parser.ASTKinds.function_definition]: (
        node: parser.function_definition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.name, cb);
        if (node.parameters.formals) {
            for (const parameter of headTailToList(node.parameters.formals)) {
                context.currentScope().variable_declarations[parameter.name.text] = parameter.name;
                context.visit(parameter, cb);
            }
        }
        context.pushScope(node);
        context.visit(node.body, cb);
        context.popScope();
    },
    [parser.ASTKinds.guard]: (node: parser.guard, context: VisitorContext, cb: VisitorCallback) => {
        if (node.condition) {
            if (typeof node.condition !== "string") {
                context.visit(node.condition, cb);
            }
        }

        if (node.statement) {
            context.visit(node.statement, cb);
        }
    },
    [parser.ASTKinds.if_statement]: (node: parser.if_statement, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.expression, cb);
        context.visit(node.block, cb);

        for (const { elseif, block } of node.else_statements) {
            if (elseif) {
                context.visit(elseif.expression, cb);
            }
            context.visit(block, cb);
        }
    },
    [parser.ASTKinds.interface_definition]: (
        node: parser.interface_definition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.pushScope(node);
        for (const { type_or_event } of node.body) {
            context.visit(type_or_event, cb);
        }

        if (node.behavior) {
            for (const { statement } of node.behavior.block.statements) {
                context.visit(statement, cb);
            }
        }
        context.popScope();
    },
    [parser.ASTKinds.namespace]: (node: parser.namespace, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { statement } of node.root.statements) {
            context.visit(statement, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.on]: (node: parser.on, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);

        for (const trigger of headTailToList(node.on_trigger_list)) {
            context.visit(trigger.name, cb);

            if (trigger.parameters?.formals) {
                for (const parameter of headTailToList(trigger.parameters.formals)) {
                    context.currentScope().variable_declarations[parameter.name.text] = parameter.name;
                }
            }
        }

        context.visit(node.statement, cb);

        context.popScope();
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
            context.visit(node.expression, cb);
        }
    },
    [parser.ASTKinds.return_statement]: (
        node: parser.return_statement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        if (node.expression) {
            context.visit(node.expression, cb);
        }
    },
    [parser.ASTKinds.system]: (node: parser.system, context: VisitorContext, cb: VisitorCallback) => {
        context.pushScope(node);
        for (const { instance_or_binding } of node.instances_and_bindings) {
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
            context.visit(node.initializer.expression, cb);
        }
    },
    [parser.ASTKinds.unary_expression]: (
        node: parser.unary_expression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
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

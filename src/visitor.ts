import { InputSource } from ".";
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
}

type Callback = (node: ASTNode, context: VisitorContext) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const visitors: Partial<Record<parser.ASTKinds, (node: any, context: VisitorContext, cb: Callback) => void>> = {
    // Root node
    [parser.ASTKinds.file]: (node: parser.file, context: VisitorContext, cb: Callback) => {
        context.pushScope(node);
        for (const { statement } of node.statements) {
            visit(statement, context, cb);
        }
        context.popScope();
    },

    [parser.ASTKinds.assignment]: (node: parser.assignment, context: VisitorContext, cb: Callback) => {
        visit(node.left, context, cb);
        visit(node.right, context, cb);
    },
    [parser.ASTKinds.behavior]: (node: parser.behavior, context: VisitorContext, cb: Callback) => {
        context.pushScope(node);
        for (const { statement } of node.block.statements) {
            visit(statement, context, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.binary_expression]: (node: parser.binary_expression, context: VisitorContext, cb: Callback) => {
        visit(node.left, context, cb);
        visit(node.right, context, cb);
    },
    [parser.ASTKinds.binding]: (node: parser.binding, context: VisitorContext, cb: Callback) => {
        if (typeof node.left !== "string") {
            visit(node.left.name, context, cb);
        }
        if (typeof node.right !== "string") {
            visit(node.right.name, context, cb);
        }
    },
    [parser.ASTKinds.call_expression]: (node: parser.call_expression, context: VisitorContext, cb: Callback) => {
        visit(node.expression, context, cb);
        for (const { expression } of node.arguments) {
            visit(expression, context, cb);
        }
    },
    [parser.ASTKinds.component]: (node: parser.component, context: VisitorContext, cb: Callback) => {
        context.pushScope(node);
        for (const { port } of node.ports) {
            visit(port, context, cb);
        }

        if (node.body) {
            visit(node.body, context, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.compound]: (node: parser.compound, context: VisitorContext, cb: Callback) => {
        context.pushScope(node);
        for (const { statement } of node.statements) {
            visit(statement, context, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.expression_statement]: (
        node: parser.expression_statement,
        context: VisitorContext,
        cb: Callback
    ) => {
        visit(node.expression, context, cb);
    },
    [parser.ASTKinds.function_definition]: (
        node: parser.function_definition,
        context: VisitorContext,
        cb: Callback
    ) => {
        visit(node.name, context, cb);
        if (node.parameters.formals) {
            for (const parameter of headTailToList(node.parameters.formals)) {
                context.currentScope().variable_declarations[parameter.name.text] = parameter.name;
                visit(parameter, context, cb);
            }
        }
        context.pushScope(node);
        visit(node.body, context, cb);
        context.popScope();
    },
    [parser.ASTKinds.guard]: (node: parser.guard, context: VisitorContext, cb: Callback) => {
        if (node.condition) {
            if (typeof node.condition !== "string") {
                visit(node.condition, context, cb);
            }
        }

        if (node.statement) {
            visit(node.statement, context, cb);
        }
    },
    [parser.ASTKinds.interface_definition]: (
        node: parser.interface_definition,
        context: VisitorContext,
        cb: Callback
    ) => {
        context.pushScope(node);
        for (const { type_or_event } of node.body) {
            visit(type_or_event, context, cb);
        }

        if (node.behavior) {
            for (const { statement } of node.behavior.block.statements) {
                visit(statement, context, cb);
            }
        }
        context.popScope();
    },
    [parser.ASTKinds.namespace]: (node: parser.namespace, context: VisitorContext, cb: Callback) => {
        context.pushScope(node);
        for (const { statement } of node.root.statements) {
            visit(statement, context, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.on]: (node: parser.on, context: VisitorContext, cb: Callback) => {
        for (const trigger of headTailToList(node.on_trigger_list)) {
            visit(trigger.name, context, cb);

            if (trigger.parameters?.formals) {
                for (const parameter of headTailToList(trigger.parameters.formals)) {
                    context.currentScope().variable_declarations[parameter.name.text] = parameter.name;
                }
            }
        }

        visit(node.statement, context, cb);
    },
    [parser.ASTKinds.property_expression]: (
        node: parser.property_expression,
        context: VisitorContext,
        cb: Callback
    ) => {
        if (node.expression) {
            visit(node.expression, context, cb);
        }
    },
    [parser.ASTKinds.return_statement]: (node: parser.return_statement, context: VisitorContext, cb: Callback) => {
        if (node.expression) {
            visit(node.expression, context, cb);
        }
    },
    [parser.ASTKinds.system]: (node: parser.system, context: VisitorContext, cb: Callback) => {
        context.pushScope(node);
        for (const { instance_or_binding } of node.instances_and_bindings) {
            visit(instance_or_binding, context, cb);
        }
        context.popScope();
    },
    [parser.ASTKinds.variable_definition]: (
        node: parser.variable_definition,
        context: VisitorContext,
        cb: Callback
    ) => {
        context.currentScope().variable_declarations[node.name.text] = node.name;
        if (node.initializer) {
            visit(node.initializer.expression, context, cb);
        }
    },
    [parser.ASTKinds.unary_expression]: (node: parser.unary_expression, context: VisitorContext, cb: Callback) => {
        visit(node.expression, context, cb);
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
    [parser.ASTKinds.port]: stopVisiting,
    [parser.ASTKinds.sl_comment]: stopVisiting,
};

function visit(node: ASTNode, context: VisitorContext, callback: Callback) {
    callback(node, context);

    const visitor = visitors[node.kind];
    if (visitor) {
        visitor(node, context, callback);
    } else {
        console.log(`Unknown visitor kind ${node.kind}`);
    }
}

export function visitFile(file: parser.file, source: InputSource, callback: Callback) {
    const context = new VisitorContext(source);
    visit(file, context, callback);
}

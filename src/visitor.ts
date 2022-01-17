import * as parser from "./grammar/parser";
import { ASTNode } from "./linting-rule";

const stopVisiting = () => {};

type Callback = (node: ASTNode) => void;

const visitors: Partial<Record<parser.ASTKinds, (node: any, cb: Callback) => void>> = {
    // Root node
    [parser.ASTKinds.file]: (node: parser.file, cb: Callback) => {
        for (const { statement } of node.statements) {
            visit(statement, cb);
        }
    },

    [parser.ASTKinds.assignment]: (node: parser.assignment, cb: Callback) => {
        visit(node.left, cb);
        visit(node.right, cb);
    },
    [parser.ASTKinds.behavior]: (node: parser.behavior, cb: Callback) => {
        for (const { statement } of node.block.statements) {
            visit(statement, cb);
        }
    },
    [parser.ASTKinds.binary_expression]: (node: parser.binary_expression, cb: Callback) => {
        visit(node.left, cb);
        visit(node.right, cb);
    },
    [parser.ASTKinds.binding]: (node: parser.binding, cb: Callback) => {
        if (typeof node.left !== "string") {
            visit(node.left.name, cb);
        }
        if (typeof node.right !== "string") {
            visit(node.right.name, cb);
        }
    },
    [parser.ASTKinds.call_expression]: (node: parser.call_expression, cb: Callback) => {
        visit(node.expression, cb);
        for (const { expression } of node.arguments) {
            visit(expression, cb);
        }
    },
    [parser.ASTKinds.component]: (node: parser.component, cb: Callback) => {
        for (const { port } of node.ports) {
            visit(port, cb);
        }

        visit(node.body, cb);
    },
    [parser.ASTKinds.compound]: (node: parser.compound, cb: Callback) => {
        for (const { statement } of node.statements) {
            visit(statement, cb);
        }
    },
    [parser.ASTKinds.expression_statement]: (node: parser.expression_statement, cb: Callback) => {
        visit(node.expression, cb);
    },
    [parser.ASTKinds.guard]: (node: parser.guard, cb: Callback) => {
        if (node.condition) {
            if (typeof node.condition !== "string") {
                visit(node.condition, cb);
            }
        }

        if (node.statement) {
            visit(node.statement, cb);
        }
    },
    [parser.ASTKinds.interface_definition]: (node: parser.interface_definition, cb: Callback) => {
        for (const { type_or_event } of node.body) {
            visit(type_or_event, cb);
        }

        if (node.behavior) {
            for (const { statement } of node.behavior.block.statements) {
                visit(statement, cb);
            }
        }
    },
    [parser.ASTKinds.on]: (node: parser.on, cb: Callback) => {
        visit(node.expression, cb);
        visit(node.statement, cb);
    },
    [parser.ASTKinds.property_expression]: (node: parser.property_expression, cb: Callback) => {
        visit(node.expression, cb);
    },
    [parser.ASTKinds.system]: (node: parser.system, cb: Callback) => {
        for (const { instance_or_binding } of node.instances_and_bindings) {
            visit(instance_or_binding, cb);
        }
    },
    [parser.ASTKinds.variable_definition]: (node: parser.variable_definition, cb: Callback) => {
        if (node.initializer) {
            visit(node.initializer.expression, cb);
        }
    },
    [parser.ASTKinds.unary_expression]: (node: parser.unary_expression, cb: Callback) => {
        visit(node.expression, cb);
    },

    // Ignore
    [parser.ASTKinds.enum_definition]: stopVisiting,
    [parser.ASTKinds.event]: stopVisiting,
    [parser.ASTKinds.identifier]: stopVisiting,
    [parser.ASTKinds.instance]: stopVisiting,
    [parser.ASTKinds.port]: stopVisiting,
    [parser.ASTKinds.sl_comment]: stopVisiting,
};

export function visit(node: ASTNode, callback: Callback) {
    callback(node);

    const visitor = visitors[node.kind];
    if (visitor) {
        visitor(node, callback);
    } else {
        console.log(`Unknown visitor kind ${node.kind}`);
    }
}
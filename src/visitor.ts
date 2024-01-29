import * as parser from "./grammar/parser";
import { ASTNode } from "./linting-rule";
import { InputSource, Program } from "./semantics/program";
import { TypeChecker } from "./semantics/type-checker";
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
        context.visit(node.left, cb);
        context.visit(node.right, cb);
    },
    [parser.ASTKinds.binding_expression_$0]: (
        node: parser.binding_expression_$0,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.compound, cb);
        context.visit(node.name, cb);
    },
    [parser.ASTKinds.call_expression]: (node: parser.call_expression, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.expression, cb);
        for (const { expression } of node.arguments.arguments) {
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
    [parser.ASTKinds.compound_name_$0]: (
        node: parser.compound_name_$0,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        if (node.compound) context.visit(node.compound, cb);
        context.visit(node.name, cb);
    },
    [parser.ASTKinds.defer_statement]: (node: parser.defer_statement, context: VisitorContext, cb: VisitorCallback) => {
        if (node.header.arguments) {
            for (const argument of node.header.arguments.arguments) {
                context.visit(argument.expression, cb);
            }
        }

        context.visit(node.statement, cb);
    },
    [parser.ASTKinds.dollar_statement]: (
        node: parser.dollar_statement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.expression, cb);
    },
    [parser.ASTKinds.event]: (node: parser.event, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.type_name, cb);
        context.visit(node.event_name, cb);

        if (node.event_params) {
            for (const param of headTailToList(node.event_params)) {
                context.visit(param.type, cb);
            }
        }
    },
    [parser.ASTKinds.expression_statement]: (
        node: parser.expression_statement,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.expression, cb);
    },
    [parser.ASTKinds.function_body]: (node: parser.function_body, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.compound, cb);
    },
    [parser.ASTKinds.function_definition]: (
        node: parser.function_definition,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.return_type, cb);
        context.visit(node.name, cb);
        context.pushScope(node);
        if (node.parameters.parameters) {
            for (const parameter of headTailToList(node.parameters.parameters)) {
                context.currentScope().variable_declarations[parameter.name.text] = parameter.name;
                context.visit(parameter, cb);
            }
        }
        context.visit(node.body.compound, cb);
        context.popScope();
    },
    [parser.ASTKinds.function_parameter]: (
        node: parser.function_parameter,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.type_name, cb);
        context.visit(node.name, cb);
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
        context.pushScope(node);
        context.visit(node.statement, cb);
        context.popScope();

        for (const elseStatement of node.else_statements) {
            const { elseif, statement } = elseStatement;
            if (elseif) {
                context.visit(elseif.expression, cb);
            }

            context.pushScope(elseStatement);
            context.visit(statement, cb);
            context.popScope();
        }
    },
    [parser.ASTKinds.instance]: (node: parser.instance, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.type, cb);
        context.visit(node.name, cb);
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
            if (trigger) context.visit(trigger, cb);
        }

        context.visit(node.body.statement, cb);

        context.popScope();
    },
    [parser.ASTKinds.on_body]: (node: parser.on_body, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.statement, cb);
    },
    [parser.ASTKinds.on_parameter]: (node: parser.on_parameter, context: VisitorContext, cb: VisitorCallback) => {
        context.currentScope().variable_declarations[node.name.text] = node.name;

        context.visit(node.name, cb);

        if (node.assignment) {
            context.visit(node.assignment.name, cb);
        }
    },
    [parser.ASTKinds.on_trigger]: (node: parser.on_trigger, context: VisitorContext, cb: VisitorCallback) => {
        context.visit(node.name, cb);

        if (node.parameters?.parameters) {
            for (const parameter of headTailToList(node.parameters.parameters)) {
                context.visit(parameter, cb);
            }
        }
    },
    [parser.ASTKinds.parenthesized_expression]: (
        node: parser.parenthesized_expression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.expression, cb);
    },
    [parser.ASTKinds.port]: (node: parser.port, context: VisitorContext, cb: VisitorCallback) => {
        context.currentScope().variable_declarations[node.name.text] = node.name;
        context.visit(node.type, cb);
        context.visit(node.name, cb);
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
        context.visit(node.type_name, cb);
        context.visit(node.name, cb);
        if (node.initializer) {
            context.visit(node.initializer.expression, cb);
        }
    },
    [parser.ASTKinds.unary_operator_expression]: (
        node: parser.unary_operator_expression,
        context: VisitorContext,
        cb: VisitorCallback
    ) => {
        context.visit(node.expression, cb);
    },

    // Leaf nodes, no need to visit children of these
    [parser.ASTKinds.asterisk_binding]: stopVisiting,
    [parser.ASTKinds.dollars]: stopVisiting,
    [parser.ASTKinds.enum_definition]: stopVisiting,
    [parser.ASTKinds.extern_definition]: stopVisiting,
    [parser.ASTKinds.identifier]: stopVisiting,
    [parser.ASTKinds.ILLEGAL]: stopVisiting,
    [parser.ASTKinds.import_statement]: stopVisiting,
    [parser.ASTKinds.int]: stopVisiting,
    [parser.ASTKinds.member_identifier]: stopVisiting,
    [parser.ASTKinds.numeric_literal]: stopVisiting,
    [parser.ASTKinds.sl_comment]: stopVisiting,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setParentVisitor: Partial<Record<parser.ASTKinds, (node: any) => void>> = {
    // Root node
    [parser.ASTKinds.file]: (node: parser.file) => {
        for (const { statement } of node.statements) {
            setParent(statement, node);
        }
    },

    [parser.ASTKinds.assignment]: (node: parser.assignment) => {
        setParent(node.left, node);
        setParent(node.right, node);
    },
    [parser.ASTKinds.behavior]: (node: parser.behavior) => {
        for (const { statement } of node.block.statements) {
            setParent(statement, node);
        }
    },
    [parser.ASTKinds.binary_expression]: (node: parser.binary_expression) => {
        setParent(node.left, node);
        setParent(node.right, node);
    },
    [parser.ASTKinds.binding]: (node: parser.binding) => {
        setParent(node.left, node);
        setParent(node.right, node);
    },
    [parser.ASTKinds.binding_expression_$0]: (node: parser.binding_expression_$0) => {
        setParent(node.compound, node);
        setParent(node.name, node);
    },
    [parser.ASTKinds.call_expression]: (node: parser.call_expression) => {
        setParent(node.expression, node);
        for (const { expression } of node.arguments.arguments) {
            setParent(expression, node);
        }
    },
    [parser.ASTKinds.component]: (node: parser.component) => {
        for (const { port } of node.ports) {
            setParent(port, node);
        }

        if (node.body) {
            setParent(node.body, node);
        }
    },
    [parser.ASTKinds.compound]: (node: parser.compound) => {
        for (const { statement } of node.statements) {
            setParent(statement, node);
        }
    },
    [parser.ASTKinds.compound_name_$0]: (node: parser.compound_name_$0) => {
        if (node.compound) setParent(node.compound, node);
        setParent(node.name, node);
    },
    [parser.ASTKinds.defer_statement]: (node: parser.defer_statement) => {
        if (node.header.arguments) {
            for (const argument of node.header.arguments.arguments) {
                setParent(argument.expression, node);
            }
        }
        setParent(node.statement, node);
    },
    [parser.ASTKinds.dollar_statement]: (node: parser.dollar_statement) => {
        setParent(node.expression, node);
    },
    [parser.ASTKinds.enum_definition]: (node: parser.enum_definition) => {
        setParent(node.name, node);
        for (const member of headTailToList(node.fields)) {
            setParent(member, node);
        }
    },
    [parser.ASTKinds.event]: (node: parser.event) => {
        setParent(node.event_name, node);
        setParent(node.type_name, node);
        if (node.event_params) {
            for (const param of headTailToList(node.event_params)) {
                setParent(param, node);
                setParent(param.name, param);
                setParent(param.type, param);
            }
        }
    },
    [parser.ASTKinds.expression_statement]: (node: parser.expression_statement) => {
        setParent(node.expression, node);
    },
    [parser.ASTKinds.function_definition]: (node: parser.function_definition) => {
        setParent(node.body, node);
        setParent(node.body.compound, node.body);
        setParent(node.return_type, node);
        setParent(node.name, node);

        if (node.parameters.parameters) {
            for (const parameter of headTailToList(node.parameters.parameters)) {
                setParent(parameter, node);
            }
        }
    },
    [parser.ASTKinds.function_parameter]: (node: parser.function_parameter) => {
        setParent(node.type_name, node);
        setParent(node.name, node);
    },
    [parser.ASTKinds.guard]: (node: parser.guard) => {
        if (node.condition) {
            if (typeof node.condition !== "string") {
                setParent(node.condition, node);
            }
        }

        if (node.statement) {
            setParent(node.statement, node);
        }
    },
    [parser.ASTKinds.if_statement]: (node: parser.if_statement) => {
        setParent(node.expression, node);
        setParent(node.statement, node);

        for (const elseStatement of node.else_statements) {
            setParent(elseStatement, node);
            const { elseif, statement } = elseStatement;
            if (elseif) {
                setParent(elseif.expression, elseStatement);
            }

            setParent(statement, elseStatement);
        }
    },
    [parser.ASTKinds.instance]: (node: parser.instance) => {
        setParent(node.name, node);
        setParent(node.type, node);
    },
    [parser.ASTKinds.interface_definition]: (node: parser.interface_definition) => {
        for (const { type_or_event } of node.body) {
            setParent(type_or_event, node);
        }

        if (node.behavior) {
            setParent(node.behavior, node);
            for (const { statement } of node.behavior.block.statements) {
                setParent(statement, node.behavior);
            }
        }
    },
    [parser.ASTKinds.namespace]: (node: parser.namespace) => {
        while (node.name.kind !== parser.ASTKinds.identifier && node.name.compound) {
            // De-sugar
            const newNs = {
                kind: parser.ASTKinds.namespace,
                name: { ...node.name.name, kind: parser.ASTKinds.identifier },
                root: { kind: parser.ASTKinds.namespace_root, statements: node.root.statements },
            } satisfies parser.namespace;
            node.name = node.name.compound;
            node.root.statements = [{ kind: parser.ASTKinds.namespace_root_$0, statement: newNs }];
        }
        setParent(node.name, node);
        for (const { statement } of node.root.statements) {
            setParent(statement, node);
        }
    },
    [parser.ASTKinds.on]: (node: parser.on) => {
        for (const trigger of headTailToList(node.on_trigger_list)) {
            if (trigger) setParent(trigger, node);
        }

        setParent(node.body, node);
        setParent(node.body.statement, node.body);
    },
    [parser.ASTKinds.on_parameter]: (node: parser.on_parameter) => {
        setParent(node.name, node);

        if (node.assignment) {
            setParent(node.assignment.name, node);
        }
    },
    [parser.ASTKinds.on_trigger]: (node: parser.on_trigger) => {
        setParent(node.name, node);

        if (node.parameters?.parameters) {
            for (const parameter of headTailToList(node.parameters.parameters)) {
                setParent(parameter, node);
            }
        }
    },
    [parser.ASTKinds.parenthesized_expression]: (node: parser.parenthesized_expression) => {
        setParent(node.expression, node);
    },
    [parser.ASTKinds.port]: (node: parser.port) => {
        setParent(node.name, node);
        setParent(node.type, node);
    },
    [parser.ASTKinds.return_statement]: (node: parser.return_statement) => {
        if (node.expression) {
            setParent(node.expression, node);
        }
    },
    [parser.ASTKinds.system]: (node: parser.system) => {
        for (const { instance_or_binding } of node.instances_and_bindings) {
            setParent(instance_or_binding, node);
        }
    },
    [parser.ASTKinds.variable_definition]: (node: parser.variable_definition) => {
        setParent(node.type_name, node);
        if (node.initializer) {
            setParent(node.initializer.expression, node);
        }
    },
    [parser.ASTKinds.unary_operator_expression]: (node: parser.unary_operator_expression) => {
        setParent(node.expression, node);
    },
};

export function visitFile(file: parser.file, source: InputSource, callback: VisitorCallback, program: Program) {
    const context = new VisitorContext(source, program);
    context.visit(file, n => setParentVisitor[n.kind]?.(n));
    context.visit(file, callback);
}

function setParent(node: ASTNode, parent: ASTNode) {
    node.parent = parent;
}

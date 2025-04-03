import { assertNever } from "../util";
import * as ast from "./ast";
import * as parser from "./tree-sitter-types";

type ChildTypes<T> = T extends { children: Array<infer S> } ? S : never;

export function transformRoot(root: parser.root_Node): ast.File {
    return {
        kind: ast.SyntaxKind.File,
        position: nodePosition(root),
        statements: root.children.map(transformRootStatement) as ast.Statement[],
    };
}

function transformRootStatement(node: ChildTypes<parser.root_Node>): ast.RootStatement {
    switch (node.type) {
        case "component":
            return transformComponent(node);
        case "dollars":
            return wrapExpressionStatement(node, transformDollars(node));
        case "enum":
            return transformEnumDefinition(node);
        case "extern":
            return transformExtern(node);
        case "function":
            return transformFunction(node);
        case "import":
            return transformImportStatement(node);
        case "int":
            return transformIntDefinition(node);
        case "interface":
            return transformInterfaceDefinition(node);
        case "namespace":
            return transformNamespace(node);
        default:
            throw assertNever(node, "transform should handle all options");
    }
}

function transformComponent(component: parser.component_Node): ast.ComponentDefinition {
    const body = component.childForFieldName("body");
    const transformedBody = body && transformComponentBody(body.child(0));

    return {
        kind: ast.SyntaxKind.ComponentDefinition,
        position: nodePosition(component),
        name: transformName(component.childForFieldName("name")),
        ports: component.childrenForFieldName("port")!.map(transformPort),
        body: transformedBody,
    };
}

function transformComponentBody(node: parser.behavior_Node | parser.system_Node): ast.Behavior | ast.System {
    if (node.type === "behavior") {
        return transformBehavior(node);
    } else {
        function transformBindingExpression(bindingExpression: parser.end_point_Node): ast.BindingExpression {
            const asterisk = bindingExpression.childForFieldName("asterisk");
            if (asterisk) {
                return {
                    kind: ast.SyntaxKind.Keyword,
                    position: nodePosition(asterisk),
                    text: "*",
                };
            }

            return;
        }

        function transformBinding(binding: parser.binding_Node): ast.Binding {
            return {
                kind: ast.SyntaxKind.Binding,
                position: nodePosition(binding),
                left: transformBindingExpression(binding.childForFieldName("left")),
                right: transformBindingExpression(binding.childForFieldName("right")),
            };
        }

        function transformInstance(system: parser.instance_Node): ast.Instance {
            return {
                kind: ast.SyntaxKind.Instance,
                position: nodePosition(system),
                type: transformTypeReference(system.childForFieldName("type")),
                name: transformIdentifier(system.childForFieldName("name")),
            };
        }

        return {
            kind: ast.SyntaxKind.System,
            position: nodePosition(node),
            instancesAndBindings: node.childForFieldName("body").children.map(c => {
                if (c.type === "binding") {
                    return transformBinding(c);
                } else {
                    return transformInstance(c);
                }
            }),
        };
    }
}

function transformPort(port: parser.port_Node): ast.Port {
    return {
        kind: ast.SyntaxKind.Port,
        position: nodePosition(port),
        direction: transformDirection(port.childForFieldName("direction")),
        qualifiers: port.childForFieldName("direction"),
        type: transformTypeReference(port.childForFieldName("type")),
        name: transformIdentifier(port.childForFieldName("name")),
    };
}

function transformExtern(node: parser.extern_Node): ast.ExternDeclaration {
    return {
        kind: ast.SyntaxKind.ExternDeclaration,
        position: nodePosition(node),
        name: transformName(node.childForFieldName("name")),
        value: transformDollars(node.childForFieldName("value")),
    };
}

function transformDollars(node: parser.dollars_Node): ast.DollarsLiteral {
    const dollars = node.childForFieldName("value");
    return {
        kind: ast.SyntaxKind.DollarLiteral,
        position: nodePosition(dollars),
        text: dollars.text,
    };
}

function transformImportStatement(node: parser.import_Node): ast.ImportStatement {
    return {
        kind: ast.SyntaxKind.ImportStatement,
        position: nodePosition(node),
        fileName: node.childForFieldName("file_name").text,
    };
}

function transformFunction(node: parser.function_Node): ast.FunctionDefinition {
    return {
        kind: ast.SyntaxKind.FunctionDefinition,
        position: nodePosition(node),
        returnType: transformTypeReference(node.childForFieldName("return_type")),
        name: transformIdentifier(node.childForFieldName("name")),
        parameters: undefined,
        body: undefined,
    };
}

function transformNamespace(node: parser.namespace_Node): ast.Namespace {
    return {
        kind: ast.SyntaxKind.Namespace,
        position: nodePosition(node),
        name: transformName(node.childForFieldName("name")),
        statements: node.children.map(transformNamespaceStatement),
    };
}

function transformNamespaceStatement(node: ChildTypes<parser.namespace_Node>): ast.NamespaceStatement {
    switch (node.type) {
        case "function":
            return transformFunction(node);
        case "component":
            return transformComponent(node);
        case "enum":
            return transformEnumDefinition(node);
        case "extern":
            return transformExtern(node);
        case "int":
            return transformIntDefinition(node);
        case "interface":
            return transformInterfaceDefinition(node);
        case "namespace":
            return transformNamespace(node);
        default:
            throw assertNever(node, "transform should handle all options");
    }
}

function transformEnumDefinition(node: parser.enum_Node): ast.EnumDefinition {
    return {
        kind: ast.SyntaxKind.EnumDefinition,
        position: nodePosition(node),
        name: transformName(node.childForFieldName("name")),
        members: node
            .childForFieldName("fields")
            .childrenForFieldName("name")
            .map(fn => {
                return {
                    kind: ast.SyntaxKind.Identifier,
                    position: nodePosition(fn),
                    text: fn.text,
                };
            }),
    };
}

function transformIntDefinition(node: parser.int_Node): ast.IntDefinition {
    return {
        kind: ast.SyntaxKind.IntDefinition,
        position: nodePosition(node),
        name: transformName(node.childForFieldName("name")),
        from: Number(node.childForFieldName("from").text),
        to: Number(node.childForFieldName("to").text),
    };
}

function transformInterfaceDefinition(node: parser.interface_Node): ast.InterfaceDefinition {
    const body = node.childForFieldName("body");
    const behavior = body.childForFieldName("behavior");

    return {
        kind: ast.SyntaxKind.InterfaceDefinition,
        position: nodePosition(node),
        name: transformName(node.childForFieldName("name")),
        body: body.children.map(c => {
            switch (c.type) {
                case "enum":
                    return transformEnumDefinition(c);
                case "event":
                    return transformEvent(c);
                case "extern":
                    return transformExtern(c);
                case "int":
                    return transformIntDefinition(c);
                default:
                    throw assertNever(c, "transform should handle all options");
            }
        }),
        behavior: behavior && transformBehavior(behavior),
    };
}

function transformEvent(node: parser.event_Node): ast.Event {
    const parameters = node.childForFieldName("formals");
    const direction = node.childForFieldName("direction");

    return {
        kind: ast.SyntaxKind.Event,
        position: nodePosition(node),
        direction: transformDirection<ast.EventDirection>(direction),
        type: transformTypeReference(node.childForFieldName("type_name")),
        eventName: transformIdentifier(node.childForFieldName("event_name")),
        parameters: parameters.childrenForFieldName("formal")?.map(transformEventParameter) ?? [],
    };
}

function transformEventParameter(node: parser.formal_Node): ast.EventParameter {
    const direction = node.childForFieldName("direction");

    return {
        kind: ast.SyntaxKind.EventParameter,
        position: nodePosition(node),
        direction: direction && transformDirection<ast.ParameterDirection>(direction),
        type: transformTypeReference(node.childForFieldName("type")),
        name: transformIdentifier(node.childForFieldName("name")),
    };
}

function transformDirection<T extends ast.EventDirection | ast.ParameterDirection | ast.PortDirection>(
    node: parser.direction_Node | parser.formal_direction_Node | parser.port_direction_Node
): T {
    return {
        kind: ast.SyntaxKind.Keyword,
        position: nodePosition(node),
        text: node.text as T["text"],
    } as T;
}

function transformBehavior(node: parser.behavior_Node): ast.Behavior {
    const name = node.childForFieldName("name");
    const body = node.childForFieldName("body");
    return {
        kind: ast.SyntaxKind.Behavior,
        position: nodePosition(node),
        name: name && transformName(name),
        statements: body.children.map(transformBehaviorStatement),
    };
}

function transformBehaviorStatement(node: ChildTypes<parser.behavior_body_Node>): ast.BehaviorStatement {
    switch (node.type) {
        case "function":
            return transformFunction(node);
        case "enum":
            return transformEnumDefinition(node);
        case "extern":
            return transformExtern(node);
        case "int":
            return transformIntDefinition(node);
        case "blocking":
            return undefined;
        case "compound":
            return transformCompound(node);
        case "guard":
            return transformGuardStatement(node);
        case "invariant":
            return transformInvariantStatement(node);
        case "on":
            return transformOnStatement(node);
        case "variable":
            return transformVariableDefinition(node);
        default:
            throw assertNever(node, "transform should handle all options");
    }
}

function transformCompound(node: parser.compound_Node): ast.Compound {
    //const blocking = node.childForFieldName("blocking");

    return {
        kind: ast.SyntaxKind.Compound,
        position: nodePosition(node),
        blocking: undefined,
        statements: node.childrenForFieldName("statement")?.map(transformCompoundStatement) ?? [],
    };
}

type CompoundStatements =
    | parser.UnnamedNode<";">
    | parser.action_Node
    | parser.assign_Node
    | parser.blocking_Node
    | parser.call_Node
    | parser.compound_Node
    | parser.defer_Node
    | parser.guard_Node
    | parser.if_statement_Node
    | parser.illegal_Node
    | parser.interface_action_Node
    | parser.invariant_Node
    | parser.on_Node
    | parser.reply_Node
    | parser.return_Node
    | parser.skip_statement_Node
    | parser.variable_Node;

function transformCompoundStatement(node: CompoundStatements): ast.Statement {
    switch (node.type) {
        case "blocking":
            return undefined;
        case "compound":
            return transformCompound(node);
        case "guard":
            return transformGuardStatement(node);
        case "invariant":
            return transformInvariantStatement(node);
        case "on":
            return transformOnStatement(node);
        case "variable":
            return transformVariableDefinition(node);
        case "action":
            return undefined;
        case "assign":
            return transformAssignmentStatement(node);
        case "call":
            return undefined;
        case "defer":
            return transformDeferStatement(node);
        case "if_statement":
            return transformIfStatement(node);
        case "illegal":
            return wrapExpressionStatement(node, transformKeyword(node, "illegal"));
        case "interface_action":
            return undefined;
        case "reply":
            return undefined;
        case "return":
            return transformReturnStatement(node);
        case "skip_statement":
        case ";":
            throw "unexpected symbol";
        default:
            throw assertNever(node, "transform should handle all options");
    }
}

function transformGuardStatement(node: parser.guard_Node): ast.GuardStatement {
    return {
        kind: ast.SyntaxKind.GuardStatement,
        position: nodePosition(node),
        blocking: undefined,
        condition: transformExpression(node.childForFieldName("condition")),
        statement: node.childrenForFieldName("body"),
    };
}

function transformInvariantStatement(node: parser.invariant_Node): ast.InvariantStatement {
    return {
        kind: ast.SyntaxKind.InvariantStatement,
        position: nodePosition(node),
        expression: transformExpression(node.childForFieldName("expression")),
    };
}

function transformOnStatement(node: parser.on_Node): ast.OnStatement {
    function transformTrigger(triggerParent: parser.trigger_Node): ast.OnTrigger {
        const trigger = triggerParent.child(0);
        switch (trigger.type) {
            case "event_name":
            case "port_event":
            case "inevitable":
            case "optional":
            default:
                throw assertNever(trigger, "transform should handle all options");
        }
    }

    return {
        kind: ast.SyntaxKind.OnStatement,
        position: nodePosition(node),
        blocking: never,
        triggers: node.childForFieldName("triggers").childrenForFieldName("trigger").map(transformTrigger),
        body: transformStatement(node.childForFieldName("statement")),
    };
}

function transformVariableDefinition(node: parser.variable_Node): ast.VariableDefinition {
    const initializer = node.childForFieldName("expression");

    return {
        kind: ast.SyntaxKind.VariableDefinition,
        position: nodePosition(node),
        type: transformTypeReference(node.childForFieldName("type_name")),
        name: transformIdentifier(node.childForFieldName("name")),
        initializer: initializer && transformExpression(initializer),
    };
}

function transformAssignmentStatement(node: parser.assign_Node): ast.AssignmentStatement {
    return {
        kind: ast.SyntaxKind.AssignmentStatement,
        position: nodePosition(node),
        left: transformName(node.childForFieldName("left")),
        right: transformExpression(node.childForFieldName("right")),
    };
}

function transformDeferStatement(node: parser.defer_Node): ast.DeferStatement {
    const deferArgs = node.childForFieldName("arguments");

    function transformDeferArguments(args: parser.arguments_Node): ast.DeferArguments {
        return {
            kind: ast.SyntaxKind.DeferArguments,
            position: nodePosition(args),
            arguments: args.childrenForFieldName("expression")?.map(transformExpression) ?? [],
        };
    }

    return {
        kind: ast.SyntaxKind.DeferStatement,
        position: nodePosition(node),
        arguments: deferArgs && transformDeferArguments(deferArgs),
        statement: transformStatement(node.childForFieldName("statement")),
    };
}

function transformIfStatement(node: parser.if_statement_Node): ast.IfStatement {
    return {
        kind: ast.SyntaxKind.IfStatement,
        position: nodePosition(node),
        condition: transformExpression(node.childForFieldName("expression")),
        statement: transformStatement(node.childForFieldName("statement")),
        else: never,
    };
}

function transformReturnStatement(node: parser.return_Node): ast.ReturnStatement {
    const returnValue = node.childForFieldName("expression");
    return {
        kind: ast.SyntaxKind.ReturnStatement,
        position: nodePosition(node),
        returnValue: returnValue && transformExpression(returnValue),
    };
}

type ExpressionsTypes =
    | parser.action_Node
    | parser.binary_expression_Node
    | parser.call_Node
    | parser.compound_name_Node
    | parser.dollars_Node
    | parser.group_Node
    | parser.literal_Node
    | parser.otherwise_Node
    | parser.unary_expression_Node;

function transformExpression(node: ExpressionsTypes): ast.Expression {
    switch (node.type) {
        case "action":
        case "binary_expression":
        case "call":
        case "compound_name":
            return undefined;
        case "dollars":
            return transformDollars(node);
        case "group":
        case "literal":
        case "otherwise":
            return transformKeyword(node, "otherwise");
        case "unary_expression":
            return undefined;
        default:
            throw assertNever(node, "transform should handle all options");
    }
}

function transformKeyword<T extends string>(node: parser.AllNodes, name: T): ast.Keyword<T> {
    return {
        kind: ast.SyntaxKind.Keyword,
        position: nodePosition(node),
        text: name
    };
}

function transformIdentifier(
    node:
        | parser.name_Node
        | parser.event_name_Node
        | parser.port_name_Node
        | parser.type_name_Node
        | parser.var_name_Node
): ast.Identifier {
    return {
        kind: ast.SyntaxKind.Identifier,
        position: nodePosition(node),
        text: node.text,
    };
}

function transformName(node: parser.compound_name_Node | parser.name_Node | parser.scoped_name_Node | parser.type_name_Node | parser.var_Node): ast.Identifier {
    return {
        kind: ast.SyntaxKind.Identifier,
        position: nodePosition(node),
        text: node.text,
    };
}

function transformTypeReference(node: parser.compound_name_Node | parser.type_name_Node): ast.TypeReference {
    return {
        kind: ast.SyntaxKind.TypeReference,
        position: nodePosition(node),
        typeName: transformName(node),
    };
}

function wrapExpressionStatement(node: parser.AllNodes, expression: ast.Expression): ast.ExpressionStatement {
    return {
        kind: ast.SyntaxKind.ExpressionStatement,
        position: nodePosition(node),
        expression: expression,
    };
}

function nodePosition(node: parser.AllNodes): ast.SourceRange {
    return {
        from: {
            index: node.startIndex,
            line: node.startPosition.row,
            column: node.startPosition.column,
        },
        to: {
            index: node.endIndex,
            line: node.endPosition.row,
            column: node.endPosition.column,
        },
    };
}

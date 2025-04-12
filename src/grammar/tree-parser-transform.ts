import { assertNever, combineSourceRanges } from "../util";
import * as ast from "./ast";
import * as parser from "./tree-sitter-types";

type ElementOfArray<T extends unknown[]> = T extends Array<infer S> ? S : never;
type ChildrenTypes<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends { childrenForFieldName: (kind: any) => unknown },
    name extends string,
> = T["childrenForFieldName"] extends { (kind: name): infer R } ? (R extends Array<infer S> ? S : never) : never;

export function treeSitterTreeToAst(root: parser.root_Node): ast.File {
    return {
        kind: ast.SyntaxKind.File,
        position: nodePosition(root),
        statements: root.namedChildren
            .filter(c => c.type !== "comment" && c.type !== "ERROR")
            .map(transformRootStatement) as ast.Statement[],
    };
}

function transformRootStatement(node: ElementOfArray<parser.root_Node["namedChildren"]>): ast.RootStatement {
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
            throw assertNever(node, "unknown root statement kind");
    }
}

function transformComponent(component: parser.component_Node): ast.ComponentDefinition {
    const body = component.childForFieldName("body");

    return {
        kind: ast.SyntaxKind.ComponentDefinition,
        position: nodePosition(component),
        name: transformIdentifier(component.childForFieldName("name")),
        ports: component.childrenForFieldName("port")!.map(transformPort),
        body: body && transformComponentBody(body.firstNamedChild),
    };
}

function transformComponentBody(node: parser.behavior_Node | parser.system_Node): ast.Behavior | ast.System {
    if (node.type === "behavior") {
        return transformBehavior(node);
    } else {
        function transformBindingExpression(bindingExpression: parser.end_point_Node): ast.BindingExpression {
            const name = bindingExpression.childForFieldName("name");
            const asterisk = bindingExpression.childForFieldName("asterisk");

            if (name) {
                const compoundName = transformName(name);

                function toBindingCompound(
                    name: ast.Identifier | ast.CompoundName
                ): ast.Identifier | ast.BindingCompoundName {
                    if (name.kind === ast.SyntaxKind.Identifier) return name;

                    return {
                        kind: ast.SyntaxKind.BindingCompoundName,
                        position: name.position,
                        compound: toBindingCompound(name.compound!),
                        name: name.name,
                    };
                }

                if (asterisk) {
                    return {
                        kind: ast.SyntaxKind.BindingCompoundName,
                        position: nodePosition(name),
                        compound: toBindingCompound(compoundName),
                        name: {
                            kind: ast.SyntaxKind.Keyword,
                            position: nodePosition(asterisk),
                            text: "*",
                        },
                    };
                } else {
                    return toBindingCompound(compoundName);
                }
            } else if (asterisk) {
                return {
                    kind: ast.SyntaxKind.Keyword,
                    position: nodePosition(asterisk),
                    text: "*",
                };
            } else {
                throw "invalid binding expression";
            }
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
            instancesAndBindings: (
                node.childForFieldName("body").childrenForFieldName("instance_or_binding") ?? []
            ).map(c => {
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
    function transformPortQualifier(qualifier: parser.port_qualifier_Node): ElementOfArray<ast.Port["qualifiers"]> {
        switch (qualifier.text) {
            case "blocking":
            case "external":
            case "injected":
                return {
                    kind: ast.SyntaxKind.Keyword,
                    position: nodePosition(qualifier),
                    text: qualifier.text,
                };
            default:
                throw `unknown qualifier type '${qualifier.text}'`;
        }
    }

    return {
        kind: ast.SyntaxKind.Port,
        position: nodePosition(port),
        direction: transformDirection(port.childForFieldName("direction")),
        qualifiers:
            port.childForFieldName("qualifiers")?.childrenForFieldName("qualifier").map(transformPortQualifier) ?? [],
        type: transformTypeReference(port.childForFieldName("type")),
        name: transformIdentifier(port.childForFieldName("name")),
    };
}

function transformExtern(node: parser.extern_Node): ast.ExternDeclaration {
    const value = node.childForFieldName("value");
    return {
        kind: ast.SyntaxKind.ExternDeclaration,
        position: nodePosition(node),
        name: transformIdentifier(node.childForFieldName("name")),
        value: {
            kind: ast.SyntaxKind.DollarLiteral,
            position: nodePosition(value),
            text: value.text,
        },
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
    function transformFunctionParameters(formals: parser.formals_Node): ast.FunctionParameter[] {
        return (
            formals.childrenForFieldName("formal")?.map(formal => {
                const direction = formal.childForFieldName("direction");
                return {
                    kind: ast.SyntaxKind.FunctionParameter,
                    position: nodePosition(formal),
                    direction: direction && transformDirection<ast.ParameterDirection>(direction),
                    type: transformTypeReference(formal.childForFieldName("type")),
                    name: transformIdentifier(formal.childForFieldName("name")),
                };
            }) ?? []
        );
    }

    const compound = node.childForFieldName("compound");
    const expressionBody = node.childForFieldName("expression");

    const body =
        (compound && transformCompound(compound)) ??
        (expressionBody && transformExpression(expressionBody.childForFieldName("expression")));

    if (body === undefined) throw "unexpected missing body";

    return {
        kind: ast.SyntaxKind.FunctionDefinition,
        position: nodePosition(node),
        returnType: transformTypeReference(node.childForFieldName("return_type")),
        name: transformIdentifier(node.childForFieldName("name")),
        parameters: transformFunctionParameters(node.childForFieldName("formals")),
        body,
    };
}

function transformNamespace(node: parser.namespace_Node): ast.Namespace {
    return {
        kind: ast.SyntaxKind.Namespace,
        position: nodePosition(node),
        name: transformName(node.childForFieldName("name")),
        statements: (node.childrenForFieldName("body_statement") ?? []).map(transformNamespaceStatement),
    };
}

type NamespaceStatements = ChildrenTypes<parser.namespace_Node, "body_statement">;

function transformNamespaceStatement(node: NamespaceStatements): ast.NamespaceStatement {
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
            throw assertNever(node, "unknown namespace statement kind");
    }
}

function transformEnumDefinition(node: parser.enum_Node): ast.EnumDefinition {
    return {
        kind: ast.SyntaxKind.EnumDefinition,
        position: nodePosition(node),
        name: transformIdentifier(node.childForFieldName("name")),
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
        name: transformIdentifier(node.childForFieldName("name")),
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
        name: transformIdentifier(node.childForFieldName("name")),
        body: (body.childrenForFieldName("interface_statement") ?? []).map(c => {
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
                    throw assertNever(c, "unknown interface body member");
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
        name: name && transformIdentifier(name),
        statements: (body.childrenForFieldName("statement") ?? []).map(transformBehaviorStatement),
    };
}

type BehaviorStatements = ChildrenTypes<parser.behavior_body_Node, "statement">;

function transformBehaviorStatement(node: BehaviorStatements): ast.BehaviorStatement {
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
            return transformBlocking(node) as ast.BehaviorStatement;
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
            throw assertNever(node, "unknown behavior statement kind");
    }
}

function transformBlocking(node: parser.blocking_Node): ast.Statement {
    const blockingKeyword = transformKeyword(node.firstChild!, "blocking");
    const statement = transformCompoundStatement(node.childForFieldName("statement"));
    if (statement.kind === ast.SyntaxKind.Compound || statement.kind === ast.SyntaxKind.OnStatement) {
        statement.blocking = blockingKeyword;
    }
    return statement;
}

function transformCompound(node: parser.compound_Node): ast.Compound {
    return {
        kind: ast.SyntaxKind.Compound,
        position: nodePosition(node),
        blocking: undefined,
        statements: node.childrenForFieldName("statement")?.map(transformCompoundStatement) ?? [],
    };
}

type CompoundStatements = ChildrenTypes<parser.compound_Node, "statement">;

function transformCompoundStatement(node: CompoundStatements): ast.Statement {
    switch (node.type) {
        case "call_statement":
            return wrapExpressionStatement(node, transformCallExpression(node.childForFieldName("call")));
        case "blocking":
            return transformBlocking(node);
        case "compound":
            return transformCompound(node);
        case "guard":
            return transformGuardStatement(node);
        case "interface_action_statement":
            return wrapExpressionStatement(node, transformName(node.childForFieldName("name")));
        case "invariant":
            return transformInvariantStatement(node);
        case "on":
            return transformOnStatement(node);
        case "variable":
            return transformVariableDefinition(node);
        case "assign":
            return transformAssignmentStatement(node);
        case "defer":
            return transformDeferStatement(node);
        case "if_statement":
            return transformIfStatement(node);
        case "illegal":
            return wrapExpressionStatement(node, transformKeyword(node, "illegal"));
        case "reply":
            return wrapExpressionStatement(node, transformReply(node));
        case "return":
            return transformReturnStatement(node);
        case "skip_statement":
            return transformEmptyStatement(node);
        default:
            throw assertNever(node, "unknown statement kind");
    }
}

function transformGuardStatement(node: parser.guard_Node): ast.GuardStatement {
    return {
        kind: ast.SyntaxKind.GuardStatement,
        position: nodePosition(node),
        blocking: undefined,
        condition: transformExpression(node.childForFieldName("condition")),
        statement: transformCompoundStatement(node.childForFieldName("body")),
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
    function transformTriggerFormal(node: parser.trigger_formal_Node): ast.OnParameter {
        const assignName = node.childForFieldName("assign_name");
        return {
            kind: ast.SyntaxKind.OnParameter,
            position: nodePosition(node),
            name: transformIdentifier(node.childForFieldName("name")),
            assignment: assignName && transformIdentifier(assignName),
        };
    }

    function transformTrigger(trigger: parser.trigger_Node): ast.OnTrigger {
        const name = trigger.childForFieldName("name");
        const parameterList = trigger.childForFieldName("formals");

        if (name) {
            return {
                kind: ast.SyntaxKind.OnTrigger,
                position: nodePosition(trigger),
                name: transformName(name),
                parameterList: parameterList && {
                    kind: ast.SyntaxKind.OnTriggerParameters,
                    position: nodePosition(parameterList),
                    parameters: parameterList.childrenForFieldName("trigger_formal")?.map(transformTriggerFormal) ?? [],
                },
            };
        } else {
            const keyword = trigger.firstNamedChild!;
            if (keyword?.type === "optional") {
                return transformKeyword(keyword, "optional");
            } else {
                return transformKeyword(keyword, "inevitable");
            }
        }
    }

    return {
        kind: ast.SyntaxKind.OnStatement,
        position: nodePosition(node),
        blocking: undefined,
        triggers: node.childForFieldName("triggers").childrenForFieldName("trigger").map(transformTrigger),
        body: transformCompoundStatement(node.childForFieldName("body")),
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
        statement: transformCompoundStatement(node.childForFieldName("statement")) as ast.ImperativeStatement,
    };
}

function transformIfStatement(node: parser.if_statement_Node): ast.IfStatement {
    const elseStatement = node.childForFieldName("else_statement");
    return {
        kind: ast.SyntaxKind.IfStatement,
        position: nodePosition(node),
        condition: transformExpression(node.childForFieldName("expression")),
        statement: transformCompoundStatement(node.childForFieldName("statement")) as ast.ImperativeStatement,
        else: elseStatement && (transformCompoundStatement(elseStatement) as ast.ImperativeStatement),
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

function transformEmptyStatement(node: parser.skip_statement_Node): ast.EmptyStatement {
    return {
        kind: ast.SyntaxKind.EmptyStatement,
        position: nodePosition(node),
    };
}

type ExpressionsTypes =
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
        case "binary_expression":
            return transformBinaryExpression(node);
        case "call":
            return transformCallExpression(node);
        case "compound_name":
            return transformName(node);
        case "dollars":
            return transformDollars(node);
        case "group":
            return transformParenthesizedExpression(node);
        case "literal":
            return transformLiteral(node);
        case "otherwise":
            return transformKeyword(node, "otherwise");
        case "unary_expression":
            return transformUnaryExpression(node);
        default:
            throw assertNever(node, "unknown expression kind");
    }
}

function transformCallExpression(node: parser.call_Node): ast.CallExpression {
    return {
        kind: ast.SyntaxKind.CallExpression,
        position: nodePosition(node),
        expression: transformName(node.childForFieldName("name")),
        arguments: transformArguments(node.childForFieldName("arguments")),
    };
}

type BinaryOperator = parser.binary_expression_Node["childForFieldName"] extends {
    (kind: "operator"): infer R;
    (kind: "right"): unknown;
}
    ? R
    : never;

function transformBinaryExpression(node: parser.binary_expression_Node): ast.BinaryExpression {
    function transformBinaryOperator(operator: BinaryOperator): ast.BinaryOperator {
        switch (operator.type) {
            case "!=":
            case "==":
            case "&&":
            case "||":
            case "+":
            case "-":
            case "<":
            case "<=":
            case ">":
            case ">=":
            case "=>":
                return {
                    kind: ast.SyntaxKind.Keyword,
                    position: nodePosition(operator),
                    text: operator.text as ast.BinaryOperator["text"],
                };
            default:
                throw assertNever(operator, `Unknown binary operator`);
        }
    }

    return {
        kind: ast.SyntaxKind.BinaryExpression,
        position: nodePosition(node),
        left: transformExpression(node.childForFieldName("left")),
        operator: transformBinaryOperator(node.childForFieldName("operator")),
        right: transformExpression(node.childForFieldName("right")),
    };
}

type UnaryOperator = parser.unary_expression_Node["childForFieldName"] extends { (kind: "operator"): infer R }
    ? R
    : never;

function transformUnaryExpression(node: parser.unary_expression_Node): ast.UnaryOperatorExpression {
    function transformUnaryOperator(operator: UnaryOperator): ast.UnaryOperator {
        switch (operator.type) {
            case "-":
            case "!":
                return {
                    kind: ast.SyntaxKind.Keyword,
                    position: nodePosition(operator),
                    text: operator.text as ast.UnaryOperator["text"],
                };
            default:
                throw assertNever(operator, `Unknown binary operator`);
        }
    }

    return {
        kind: ast.SyntaxKind.UnaryOperatorExpression,
        position: nodePosition(node),
        operator: transformUnaryOperator(node.childForFieldName("operator")),
        expression: transformExpression(node.childForFieldName("expression")),
    };
}

function transformArguments(node: parser.arguments_Node): ast.CallArguments {
    return {
        kind: ast.SyntaxKind.CallArguments,
        position: nodePosition(node),
        arguments: node.childrenForFieldName("expression")?.map(transformExpression) ?? [],
    };
}

function transformLiteral(node: parser.literal_Node): ast.BooleanLiteral | ast.NumericLiteral {
    if (node.text === "true" || node.text === "false") {
        return {
            kind: ast.SyntaxKind.BooleanLiteral,
            position: nodePosition(node),
            value: node.text === "true",
        };
    } else {
        return {
            kind: ast.SyntaxKind.NumericLiteral,
            position: nodePosition(node),
            value: Number(node.text),
        };
    }
}

function transformParenthesizedExpression(node: parser.group_Node): ast.ParenthesizedExpression {
    return {
        kind: ast.SyntaxKind.ParenthesizedExpression,
        position: nodePosition(node),
        expression: transformExpression(node.childForFieldName("expression")),
    };
}

function transformReply(node: parser.reply_Node): ast.Reply {
    const port = node.childForFieldName("port");
    const expression = node.childForFieldName("expression");
    return {
        kind: ast.SyntaxKind.Reply,
        position: nodePosition(node),
        port: port && transformIdentifier(port),
        value: expression && transformExpression(expression),
    };
}

function transformKeyword<T extends string>(node: parser.AllNodes | parser.SyntaxNode, name: T): ast.Keyword<T> {
    return {
        kind: ast.SyntaxKind.Keyword,
        position: nodePosition(node),
        text: name,
    };
}

function transformIdentifier(
    node:
        | parser.event_name_Node
        | parser.identifier_Node
        | parser.interface_action_Node
        | parser.name_Node
        | parser.scoped_name_Node
        | parser.type_name_Node
        | parser.var_name_Node
): ast.Identifier {
    return {
        kind: ast.SyntaxKind.Identifier,
        position: nodePosition(node),
        text: node.text,
    };
}

function transformName(
    node:
        | parser.compound_name_Node
        | parser.name_Node
        | parser.scoped_name_Node
        | parser.type_name_Node
        | parser.interface_action_Node
): ast.Name {
    if (node.type === "type_name") {
        const name = node.childForFieldName("name");
        if (name) {
            return transformName(name);
        }

        return {
            kind: ast.SyntaxKind.Identifier,
            position: nodePosition(node),
            text: node.text,
        };
    } else if (node.type === "compound_name") {
        const global = node.childForFieldName("global");
        const parts = node.childrenForFieldName("part").filter(p => p.type === "identifier");

        const firstIdentifier = transformIdentifier(parts[0]);
        let name: ast.Name = global
            ? {
                  kind: ast.SyntaxKind.CompoundName,
                  position: combineSourceRanges(nodePosition(global), firstIdentifier.position),
                  compound: undefined, // global
                  name: firstIdentifier,
              }
            : firstIdentifier;

        for (let i = 1; i < parts.length; i++) {
            name = {
                kind: ast.SyntaxKind.CompoundName,
                position: combineSourceRanges(name.position, nodePosition(parts[i])),
                compound: name,
                name: transformIdentifier(parts[i]),
            } satisfies ast.CompoundName;
        }

        return name;
    } else {
        return transformIdentifier(node);
    }
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

export function nodePosition(node: parser.AllNodes | parser.SyntaxNode): ast.SourceRange {
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

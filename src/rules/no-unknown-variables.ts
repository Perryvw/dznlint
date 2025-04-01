// no identifiers used for variables that are unknown

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { Diagnostic, createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { headTailToList, isAsterisk, isIdentifier, isIllegalKeyword, nameToString, nodeToSourceRange } from "../util";
import { VisitorContext } from "../visitor";

export const unknownVariable = createDiagnosticsFactory();

export const no_unknown_variables: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unknown_variables", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.Binding>(ast.SyntaxKind.Binding, (node, context) => {
            const diagnostics: Diagnostic[] = [];
            const checkBinding = (bindingExpression: ast.BindingExpression) => {
                const symbol = context.typeChecker.symbolOfNode(bindingExpression);
                if (symbol === undefined) {
                    diagnostics.push(
                        createUnknownCompoundNameDiagnostic(bindingExpression, "port or instance", context)
                    );
                }
            };

            checkBinding(node.left);
            checkBinding(node.right);

            return diagnostics;
        });

        factoryContext.registerRule<ast.Instance>(ast.SyntaxKind.Instance, (node, context) => {
            if (context.typeChecker.symbolOfNode(node.type) === undefined) {
                return [createUnknownCompoundNameDiagnostic(node.type.typeName, "type", context)];
            } else return [];
        });

        factoryContext.registerRule<ast.Event>(ast.SyntaxKind.Event, (node, context) => {
            const diagnostics = [];

            // Check return type
            if (context.typeChecker.symbolOfNode(node.type) === undefined) {
                diagnostics.push(createUnknownCompoundNameDiagnostic(node.type.typeName, "type", context));
            }

            // Check parameter types
            for (const param of node.parameters) {
                const typeSymbol = context.typeChecker.symbolOfNode(param.type);
                if (typeSymbol === undefined) {
                    diagnostics.push(createUnknownCompoundNameDiagnostic(param.type.typeName, "type", context));
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.OnStatement>(ast.SyntaxKind.OnStatement, (node, context) => {
            const diagnostics: Diagnostic[] = [];

            for (const trigger of node.triggers) {
                if (context.typeChecker.symbolOfNode(trigger.name) === undefined) {
                    diagnostics.push(createUnknownCompoundNameDiagnostic(trigger.name, "port or event", context));
                }
            }

            // Find used parameters that are not present in each on trigger:

            // First get all parameters not escaped with _ that are not shared by all triggers
            const occurrences: Record<string, ast.OnTrigger[]> = {};
            for (const trigger of node.triggers) {
                if (trigger.parameterList) {
                    for (const param of trigger.parameterList.parameters) {
                        if (param.name.text.startsWith("_")) continue;

                        if (!occurrences[param.name.text]) {
                            occurrences[param.name.text] = [trigger];
                        } else {
                            occurrences[param.name.text].push(trigger);
                        }
                    }
                }
            }
            // Get all parameters not escaped with _ that do not show up in all triggers:
            const triggerCount = node.triggers.length;
            const parametersAtRisk = Object.entries(occurrences).filter(
                ([, triggers]) => triggers.length < triggerCount
            );

            // For each parameter at risk, check if it is actually used or not
            for (const [parameterName, triggers] of parametersAtRisk) {
                // Check if parameter occurs in on body
                const parameterReferences: ast.Identifier[] = [];
                context.visit(node.body, subNode => {
                    if (isIdentifier(subNode) && subNode.text === parameterName) {
                        parameterReferences.push(subNode);
                    }
                });

                // If parameter is used, generate diagnostics on all uses of that parameter
                if (parameterReferences.length > 0) {
                    const missingTriggers = node.triggers.filter(t => !triggers.includes(t));
                    const missingTriggersString = missingTriggers.map(stringifyTrigger).join("\n");
                    for (const reference of parameterReferences) {
                        diagnostics.push(
                            unknownVariable(
                                config.severity,
                                `Parameter ${parameterName} is undefined in some of the events in the event list! Parameter missing in: \n${missingTriggersString}`,
                                context.source,
                                reference.position
                            )
                        );
                    }
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.FunctionDefinition>(ast.SyntaxKind.FunctionDefinition, (node, context) => {
            const diagnostics = [];

            if (context.typeChecker.symbolOfNode(node.returnType) === undefined) {
                diagnostics.push(createUnknownCompoundNameDiagnostic(node.returnType.typeName, "type", context));
            }

            for (const parameter of node.parameters) {
                if (context.typeChecker.symbolOfNode(parameter.type) === undefined) {
                    diagnostics.push(createUnknownCompoundNameDiagnostic(parameter.type.typeName, "type", context));
                }
            }
            return diagnostics;
        });

        factoryContext.registerRule<ast.CallExpression>(ast.SyntaxKind.CallExpression, (node, context) => {
            const diagnostics = [];

            if (context.typeChecker.symbolOfNode(node.expression) === undefined) {
                diagnostics.push(...checkExpressionNames(node.expression, "function", context));
            }

            for (const argument of node.arguments.arguments) {
                diagnostics.push(...checkExpressionNames(argument, "variable", context));
            }
            return diagnostics;
        });

        factoryContext.registerRule<ast.VariableDefinition>(ast.SyntaxKind.VariableDefinition, (node, context) => {
            const diagnostics = [];

            if (context.typeChecker.symbolOfNode(node.type) === undefined) {
                diagnostics.push(createUnknownCompoundNameDiagnostic(node.type.typeName, "type", context));
            }

            if (node.initializer) {
                diagnostics.push(...checkExpressionNames(node.initializer, "variable", context));
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.ExpressionStatement>(ast.SyntaxKind.ExpressionStatement, (node, context) => {
            return checkExpressionNames(node.expression, "name", context);
        });

        factoryContext.registerRule<ast.ComponentDefinition>(ast.SyntaxKind.ComponentDefinition, (node, context) => {
            const diagnostics = [];

            for (const port of node.ports) {
                if (context.typeChecker.symbolOfNode(port.type) === undefined) {
                    diagnostics.push(createUnknownCompoundNameDiagnostic(port.type.typeName, "interface", context));
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.GuardStatement>(ast.SyntaxKind.GuardStatement, (node, context) => {
            if (!node.condition || typeof node.condition === "string" /* otherwise */) {
                return [];
            }
            return node.condition ? checkExpressionNames(node.condition, "variable", context) : [];
        });

        factoryContext.registerRule<ast.AssignmentStatement>(ast.SyntaxKind.AssignmentStatement, (node, context) => {
            return [
                ...checkExpressionNames(node.left, "variable", context),
                ...checkExpressionNames(node.right, "variable", context),
            ];
        });

        factoryContext.registerRule<ast.IfStatement>(ast.SyntaxKind.IfStatement, (node, context) => {
            // Check condition
            const diagnostics = checkExpressionNames(node.condition, "if condition", context);
            // Body and else handled in the other rules
            return diagnostics;
        });

        factoryContext.registerRule<ast.ReturnStatement>(ast.SyntaxKind.ReturnStatement, (node, context) => {
            return node.returnValue ? checkExpressionNames(node.returnValue, "variable", context) : [];
        });

        factoryContext.registerRule<ast.InvariantStatement>(ast.SyntaxKind.InvariantStatement, (node, context) => {
            return checkExpressionNames(node.expression, "name", context);
        });

        const createUnknownCompoundNameDiagnostic = (
            compoundName: ast.CompoundName | ast.BindingExpression,
            typeForMessage: string,
            context: VisitorContext
        ): Diagnostic => {
            if (isIdentifier(compoundName)) {
                return unknownVariable(
                    config.severity,
                    `Undefined ${typeForMessage} ${compoundName.text}`,
                    context.source,
                    compoundName.position
                );
            }

            if (isAsterisk(compoundName)) {
                throw "Was not expecting this to happen";
            }

            const memberName = compoundName.name.text;

            if (!compoundName.compound) {
                return unknownVariable(
                    config.severity,
                    `Undefined ${typeForMessage} .${memberName}`,
                    context.source,
                    compoundName.position
                );
            }

            if (context.typeChecker.symbolOfNode(compoundName.compound) !== undefined) {
                const ownerType = context.typeChecker.typeOfNode(compoundName.compound);

                return unknownVariable(
                    config.severity,
                    `${ownerType.name} does not contain a member ${memberName}`,
                    context.source,
                    compoundName.name.position
                );
            } else {
                return createUnknownCompoundNameDiagnostic(compoundName.compound, "variable", context);
            }
        };

        const checkExpressionNames = (
            expression: ast.Expression,
            nameForMessage: string,
            context: VisitorContext
        ): Diagnostic[] => {
            const diagnostics = [];
            for (const name of findUsedNames(expression)) {
                if (context.typeChecker.symbolOfNode(name) === undefined) {
                    diagnostics.push(createUnknownCompoundNameDiagnostic(name, nameForMessage, context));
                }
            }
            return diagnostics;
        };

        const findUsedNames = (expr: ast.Expression): ast.Name[] => {
            if (
                expr.kind === ast.SyntaxKind.DollarLiteral ||
                expr.kind === ast.SyntaxKind.NumericLiteral ||
                isIllegalKeyword(expr)
            ) {
                return [];
            }

            if (expr.kind === ast.SyntaxKind.ParenthesizedExpression) {
                return findUsedNames(expr.expression);
            } else if (expr.kind === ast.SyntaxKind.UnaryOperatorExpression) {
                return findUsedNames(expr.expression);
            } else if (expr.kind === ast.SyntaxKind.CallExpression) {
                // Ignore, already covered by its own call_expression rule (in this file)
                return [];
            }

            const result: ast.Name[] = [];
            if (isIdentifier(expr)) {
                result.push(expr);
            } else if (expr.kind === ast.SyntaxKind.BinaryExpression) {
                result.push(...findUsedNames(expr.left));
                result.push(...findUsedNames(expr.right));
            } else if (expr.kind === ast.SyntaxKind.CompoundName) {
                result.push(expr);
            }
            return result;
        };

        const stringifyTrigger = (trigger: ast.OnTrigger): string => {
            let params = "";
            if (trigger.parameterList) {
                params = trigger.parameterList.parameters.map(p => p.name.text).join(", ");
            }
            return `${nameToString(trigger.name)}(${params})`;
        };
    }
};

export default no_unknown_variables;

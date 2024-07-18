// no identifiers used for variables that are unknown

import { getRuleConfig } from "../config/util";
import { Diagnostic, createDiagnosticsFactory } from "../diagnostic";
import * as parser from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { headTailToList, isIdentifier, nameToString, nodeToSourceRange } from "../util";
import { VisitorContext } from "../visitor";

export const unknownVariable = createDiagnosticsFactory();

export const no_unknown_variables: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unknown_variables", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<parser.binding>(parser.ASTKinds.binding, (node: parser.binding, context) => {
            const diagnostics: Diagnostic[] = [];
            const checkBinding = (bindingExpression: parser.binding_expression) => {
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

        factoryContext.registerRule<parser.instance>(parser.ASTKinds.instance, (node: parser.instance, context) => {
            if (context.typeChecker.symbolOfNode(node.type) === undefined) {
                return [createUnknownCompoundNameDiagnostic(node.type, "type", context)];
            } else return [];
        });

        factoryContext.registerRule<parser.event>(parser.ASTKinds.event, (node: parser.event, context) => {
            const diagnostics = [];

            // Check return type
            if (context.typeChecker.symbolOfNode(node.type_name) === undefined) {
                diagnostics.push(createUnknownCompoundNameDiagnostic(node.type_name, "type", context));
            }

            // Check parameter types
            if (node.event_params) {
                for (const param of headTailToList(node.event_params)) {
                    const typeSymbol = context.typeChecker.symbolOfNode(param.type);
                    if (typeSymbol === undefined) {
                        diagnostics.push(createUnknownCompoundNameDiagnostic(param.type, "type", context));
                    }
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<parser.on>(parser.ASTKinds.on, (node: parser.on, context) => {
            const diagnostics: Diagnostic[] = [];
            const triggerList = headTailToList(node.on_trigger_list);
            for (const trigger of triggerList) {
                if (context.typeChecker.symbolOfNode(trigger.name) === undefined) {
                    diagnostics.push(createUnknownCompoundNameDiagnostic(trigger.name, "port or event", context));
                }
            }

            // Find used parameters that are not present in each on trigger:

            // First get all parameters not escaped with _ that are not shared by all triggers
            const occurrences: Record<string, parser.on_trigger[]> = {};
            for (const trigger of triggerList) {
                if (trigger.parameters?.parameters) {
                    for (const param of headTailToList(trigger.parameters.parameters)) {
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
            const triggerCount = triggerList.length;
            const parametersAtRisk = Object.entries(occurrences).filter(
                ([, triggers]) => triggers.length < triggerCount
            );

            // For each parameter at risk, check if it is actually used or not
            for (const [parameterName, triggers] of parametersAtRisk) {
                // Check if parameter occurs in on body
                const parameterReferences: parser.identifier[] = [];
                context.visit(node.body, subNode => {
                    if (isIdentifier(subNode) && subNode.text === parameterName) {
                        parameterReferences.push(subNode);
                    }
                });

                // If parameter is used, generate diagnostics on all uses of that parameter
                if (parameterReferences.length > 0) {
                    const missingTriggers = triggerList.filter(t => !triggers.includes(t));
                    const missingTriggersString = missingTriggers.map(stringifyTrigger).join("\n");
                    for (const reference of parameterReferences) {
                        diagnostics.push(
                            unknownVariable(
                                config.severity,
                                `Parameter ${parameterName} is undefined in some of the events in the event list! Parameter missing in: \n${missingTriggersString}`,
                                context.source,
                                nodeToSourceRange(reference)
                            )
                        );
                    }
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<parser.function_definition>(
            parser.ASTKinds.function_definition,
            (node: parser.function_definition, context) => {
                const diagnostics = [];

                if (context.typeChecker.symbolOfNode(node.return_type) === undefined) {
                    diagnostics.push(createUnknownCompoundNameDiagnostic(node.return_type, "type", context));
                }

                if (node.parameters.parameters) {
                    for (const parameter of headTailToList(node.parameters.parameters)) {
                        if (context.typeChecker.symbolOfNode(parameter.type_name) === undefined) {
                            diagnostics.push(createUnknownCompoundNameDiagnostic(parameter.type_name, "type", context));
                        }
                    }
                }
                return diagnostics;
            }
        );

        factoryContext.registerRule<parser.call_expression>(
            parser.ASTKinds.call_expression,
            (node: parser.call_expression, context) => {
                const diagnostics = [];

                if (context.typeChecker.symbolOfNode(node.expression) === undefined) {
                    diagnostics.push(...checkExpressionNames(node.expression, "function", context));
                }

                for (const argument of node.arguments.arguments) {
                    diagnostics.push(...checkExpressionNames(argument.expression, "variable", context));
                }
                return diagnostics;
            }
        );

        factoryContext.registerRule<parser.variable_definition>(
            parser.ASTKinds.variable_definition,
            (node: parser.variable_definition, context) => {
                const diagnostics = [];

                if (context.typeChecker.symbolOfNode(node.type_name) === undefined) {
                    diagnostics.push(createUnknownCompoundNameDiagnostic(node.type_name, "type", context));
                }

                if (node.initializer) {
                    diagnostics.push(...checkExpressionNames(node.initializer.expression, "variable", context));
                }

                return diagnostics;
            }
        );

        factoryContext.registerRule<parser.expression_statement>(
            parser.ASTKinds.expression_statement,
            (node: parser.expression_statement, context) => {
                return checkExpressionNames(node.expression, "name", context);
            }
        );

        factoryContext.registerRule<parser.component>(parser.ASTKinds.component, (node: parser.component, context) => {
            const diagnostics = [];

            for (const { port } of node.ports) {
                if (context.typeChecker.symbolOfNode(port.type) === undefined) {
                    diagnostics.push(createUnknownCompoundNameDiagnostic(port.type, "interface", context));
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<parser.guard>(parser.ASTKinds.guard, (node: parser.guard, context) => {
            if (!node.condition || typeof node.condition === "string" /* otherwise */) {
                return [];
            }
            return node.condition ? checkExpressionNames(node.condition, "variable", context) : [];
        });

        factoryContext.registerRule<parser.assignment>(
            parser.ASTKinds.assignment,
            (node: parser.assignment, context) => {
                return [
                    ...checkExpressionNames(node.left, "variable", context),
                    ...checkExpressionNames(node.right, "variable", context),
                ];
            }
        );

        factoryContext.registerRule<parser.if_statement>(
            parser.ASTKinds.if_statement,
            (node: parser.if_statement, context) => {
                // Check main condition
                const diagnostics = checkExpressionNames(node.expression, "if condition", context);

                // Check conditions of all following else clauses
                for (const elseStatement of node.else_statements) {
                    if (elseStatement.elseif) {
                        diagnostics.push(
                            ...checkExpressionNames(elseStatement.elseif.expression, "if condition", context)
                        );
                    }
                }

                return diagnostics;
            }
        );

        factoryContext.registerRule<parser.return_statement>(
            parser.ASTKinds.return_statement,
            (node: parser.return_statement, context) => {
                return node.expression ? checkExpressionNames(node.expression, "variable", context) : [];
            }
        );

        const createUnknownCompoundNameDiagnostic = (
            compoundName: parser.compound_name | parser.binding_expression,
            typeForMessage: string,
            context: VisitorContext
        ): Diagnostic => {
            if (isIdentifier(compoundName)) {
                return unknownVariable(
                    config.severity,
                    `Undefined ${typeForMessage} ${compoundName.text}`,
                    context.source,
                    nodeToSourceRange(compoundName)
                );
            }

            if (compoundName.kind === parser.ASTKinds.asterisk_binding) {
                throw "Was not expecting this to happen";
            }

            const memberName =
                compoundName.name.kind === parser.ASTKinds.asterisk_binding ? "." : compoundName.name.text;

            if (compoundName.compound === null) {
                return unknownVariable(
                    config.severity,
                    `Undefined ${typeForMessage} .${memberName}`,
                    context.source,
                    nodeToSourceRange(compoundName)
                );
            }

            if (context.typeChecker.symbolOfNode(compoundName.compound) !== undefined) {
                const ownerType = context.typeChecker.typeOfNode(compoundName.compound);

                return unknownVariable(
                    config.severity,
                    `${ownerType.name} does not contain a member ${memberName}`,
                    context.source,
                    nodeToSourceRange(compoundName.name)
                );
            } else {
                return createUnknownCompoundNameDiagnostic(compoundName.compound, "variable", context);
            }
        };

        const checkExpressionNames = (
            expression: parser.expression,
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

        const findUsedNames = (expr: parser.expression): parser.compound_name[] => {
            if (
                expr.kind === parser.ASTKinds.dollars ||
                expr.kind === parser.ASTKinds.numeric_literal ||
                expr.kind === parser.ASTKinds.ILLEGAL
            ) {
                return [];
            }

            if (expr.kind === parser.ASTKinds.parenthesized_expression) {
                return findUsedNames(expr.expression);
            } else if (expr.kind === parser.ASTKinds.unary_operator_expression) {
                return findUsedNames(expr.expression);
            } else if (expr.kind === parser.ASTKinds.call_expression) {
                return findUsedNames(expr.expression);
            }

            const result: parser.compound_name[] = [];
            if (expr.kind === parser.ASTKinds.identifier || expr.kind === parser.ASTKinds.compound_name_$0) {
                result.push(expr);
            } else if (expr.kind === parser.ASTKinds.binary_expression) {
                result.push(...findUsedNames(expr.left));
                result.push(...findUsedNames(expr.right));
            } else {
                result.push(expr);
            }
            return result;
        };

        const stringifyTrigger = (trigger: parser.on_trigger): string => {
            let params = "";
            if (trigger.parameters?.parameters) {
                params = headTailToList(trigger.parameters.parameters)
                    .map(p => p.name.text)
                    .join(", ");
            }
            return `${nameToString(trigger.name)}(${params})`;
        };
    }
};

export default no_unknown_variables;

// Events in interface behavior should not mention parameters, not in on triggers, and not in behavior compounds

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isCallExpression, isCompound, isExpressionStatement, isKeyword, isOnStatement } from "../util";
import { TypeKind } from "../semantics";

export const invalidInterfaceOnTrigger = createDiagnosticsFactory();
export const invalidInterfaceEventCall = createDiagnosticsFactory();

export const no_interface_event_parameters: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_interface_event_parameters", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.InterfaceDefinition>(ast.SyntaxKind.InterfaceDefinition, (node, context) => {
            const diagnostics: Diagnostic[] = [];

            if (node.behavior) {
                context.visit(node.behavior, subNode => {
                    if (isOnStatement(subNode)) {
                        // Check on triggers
                        for (const trigger of subNode.triggers) {
                            if (!isKeyword(trigger) && trigger.parameterList) {
                                diagnostics.push(
                                    invalidInterfaceOnTrigger(
                                        config.severity,
                                        `Events in interface behavior should not mention their parameters, only the event occurrence matters and not the data. Remove this parameter list.`,
                                        context.source,
                                        trigger.parameterList.position
                                    )
                                );
                            }
                        }

                        // Check on body
                        if (isCompound(subNode.body)) {
                            // Check all statements in compound body
                            for (const statement of subNode.body.statements) {
                                if (isExpressionStatement(statement) && isCallExpression(statement.expression)) {
                                    const calledExpression = statement.expression.expression;
                                    const type = context.typeChecker.typeOfNode(calledExpression);
                                    if (type.kind === TypeKind.Event) {
                                        diagnostics.push(
                                            invalidInterfaceEventCall(
                                                config.severity,
                                                `Events in interface behavior should not mention their arguments, only the event occurrence matters and not the data. Remove this argument list.`,
                                                context.source,
                                                statement.expression.arguments.position
                                            )
                                        );
                                    }
                                }
                            }
                        } else if (isExpressionStatement(subNode.body) && isCallExpression(subNode.body.expression)) {
                            // If body is a single call expression, also check that
                            const calledExpression = subNode.body.expression.expression;
                            const type = context.typeChecker.typeOfNode(calledExpression);
                            if (type.kind === TypeKind.Event) {
                                diagnostics.push(
                                    invalidInterfaceEventCall(
                                        config.severity,
                                        `Events in interface behavior should not mention their arguments, only the event occurrence matters and not the data. Remove this argument list.`,
                                        context.source,
                                        subNode.body.expression.arguments.position
                                    )
                                );
                            }
                        }
                    }
                });
            }

            return diagnostics;
        });
    }
};

export default no_interface_event_parameters;

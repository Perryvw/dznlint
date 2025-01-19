// The number of call arguments must match the number of function parameters

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, call_expression } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { TypeKind } from "../semantics/type-checker";
import { headTailToList, isEvent, isFunctionDefinition, nameToString, nodeToSourceRange } from "../util";

export const incorrectArgumentCount = createDiagnosticsFactory();

export const call_arguments_must_match: RuleFactory = factoryContext => {
    const config = getRuleConfig("call_arguments_must_match", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<call_expression>(ASTKinds.call_expression, (node, context) => {
            const diagnostics = [];

            const functionType = context.typeChecker.typeOfNode(node.expression);

            if (
                functionType.kind === TypeKind.Function &&
                functionType.declaration &&
                isFunctionDefinition(functionType.declaration)
            ) {
                const functionParameters = functionType.declaration.parameters.parameters
                    ? headTailToList(functionType.declaration.parameters.parameters)
                    : [];

                const argumentCount = node.arguments.arguments.length;
                const expectedCount = functionParameters.length;

                if (argumentCount !== expectedCount) {
                    let errorMessage = `Incorrect argument count. Expected ${expectedCount} argument(s) but got ${argumentCount}.`;
                    if (expectedCount > 0) {
                        errorMessage +=
                            "\nExpected parameters: " +
                            functionParameters
                                .map(p => `${nameToString(p.type.type_name)} ${nameToString(p.name)}`)
                                .join(", ");
                    }
                    diagnostics.push(
                        incorrectArgumentCount(
                            config.severity,
                            errorMessage,
                            context.source,
                            nodeToSourceRange(node.arguments)
                        )
                    );
                }
            } else if (
                functionType.kind === TypeKind.Function &&
                functionType.declaration &&
                isEvent(functionType.declaration)
            ) {
                const functionParameters = functionType.declaration.event_params
                    ? headTailToList(functionType.declaration.event_params)
                    : [];

                const argumentCount = node.arguments.arguments.length;
                const expectedCount = functionParameters.length;

                if (argumentCount !== expectedCount) {
                    let errorMessage = `Incorrect argument count. Expected ${expectedCount} arguments but got ${argumentCount}.`;
                    if (expectedCount > 0) {
                        errorMessage +=
                            "\nExpected parameters: " +
                            functionParameters
                                .map(p => `${nameToString(p.type.type_name)} ${nameToString(p.name)}`)
                                .join(", ");
                    }
                    diagnostics.push(
                        incorrectArgumentCount(
                            config.severity,
                            errorMessage,
                            context.source,
                            nodeToSourceRange(node.arguments)
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default call_arguments_must_match;

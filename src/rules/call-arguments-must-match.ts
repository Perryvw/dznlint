// The number of call arguments must match the number of function parameters

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { CallExpression, SyntaxKind } from "../grammar/ast";
import { RuleFactory } from "../linting-rule";
import { TypeKind } from "../semantics/type-checker";
import { isEvent, isFunctionDefinition, nameToString } from "../util";

export const incorrectArgumentCount = createDiagnosticsFactory();

export const call_arguments_must_match: RuleFactory = factoryContext => {
    const config = getRuleConfig("call_arguments_must_match", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<CallExpression>(SyntaxKind.CallExpression, (node, context) => {
            const diagnostics = [];

            const functionType = context.typeChecker.typeOfNode(node.expression);

            if (
                functionType.kind === TypeKind.Function &&
                functionType.declaration &&
                isFunctionDefinition(functionType.declaration)
            ) {
                const functionParameters = functionType.declaration.parameters;
                const argumentCount = node.arguments.arguments.length;
                const expectedCount = functionParameters.length;

                if (argumentCount !== expectedCount) {
                    let errorMessage = `Incorrect argument count. Expected ${expectedCount} argument(s) but got ${argumentCount}.`;
                    if (expectedCount > 0) {
                        errorMessage +=
                            "\nExpected parameters: " +
                            functionParameters
                                .map(p => `${nameToString(p.type)} ${nameToString(p.name)}`)
                                .join(", ");
                    }
                    diagnostics.push(
                        incorrectArgumentCount(
                            config.severity,
                            errorMessage,
                            context.source,
                            node.arguments.position
                        )
                    );
                }
            } else if (
                functionType.kind === TypeKind.Function &&
                functionType.declaration &&
                isEvent(functionType.declaration)
            ) {
                const functionParameters = functionType.declaration.parameters;
                const argumentCount = node.arguments.arguments.length;
                const expectedCount = functionParameters.parameters.length;

                if (argumentCount !== expectedCount) {
                    let errorMessage = `Incorrect argument count. Expected ${expectedCount} arguments but got ${argumentCount}.`;
                    if (expectedCount > 0) {
                        errorMessage +=
                            "\nExpected parameters: " +
                            functionParameters.parameters
                                .map(p => `${nameToString(p.type)} ${nameToString(p.name)}`)
                                .join(", ");
                    }
                    diagnostics.push(
                        incorrectArgumentCount(
                            config.severity,
                            errorMessage,
                            context.source,
                            node.arguments.position
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default call_arguments_must_match;

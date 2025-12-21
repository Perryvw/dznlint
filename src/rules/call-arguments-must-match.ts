// The number of call arguments must match the number of function parameters

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { TypeKind } from "../semantics/type-checker";
import { isEvent, isForeignFunctionDeclaration, isFunctionDefinition, nameToString } from "../util";

export const incorrectArgumentCount = createDiagnosticsFactory();

export const call_arguments_must_match: RuleFactory = factoryContext => {
    const config = getRuleConfig("call_arguments_must_match", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.CallExpression>(ast.SyntaxKind.CallExpression, (node, context) => {
            const diagnostics = [];

            const functionType = context.typeChecker.typeOfNode(node.expression);

            if (
                functionType.kind === TypeKind.Function &&
                functionType.declaration &&
                (isFunctionDefinition(functionType.declaration) ||
                    isForeignFunctionDeclaration(functionType.declaration))
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
                                .map(p => `${nameToString(p.type.typeName)} ${nameToString(p.name)}`)
                                .join(", ");
                    }
                    diagnostics.push(
                        incorrectArgumentCount(config.severity, errorMessage, context.source, node.arguments.position)
                    );
                }
            } else if (
                functionType.kind === TypeKind.Event &&
                functionType.declaration &&
                isEvent(functionType.declaration)
            ) {
                const functionParameters = functionType.declaration.parameters;
                const argumentCount = node.arguments.arguments.length;
                const expectedCount = functionParameters.length;

                if (argumentCount !== expectedCount) {
                    let errorMessage = `Incorrect argument count. Expected ${expectedCount} arguments but got ${argumentCount}.`;
                    if (expectedCount > 0) {
                        errorMessage +=
                            "\nExpected parameters: " +
                            functionParameters
                                .map(p => `${nameToString(p.type.typeName)} ${nameToString(p.name)}`)
                                .join(", ");
                    }
                    diagnostics.push(
                        incorrectArgumentCount(config.severity, errorMessage, context.source, node.arguments.position)
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default call_arguments_must_match;

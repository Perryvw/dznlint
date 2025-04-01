// The number of call parameters in an on statement must match the parameters specified by the event definition

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { TypeKind } from "../semantics/type-checker";
import { isEvent, nameToString } from "../util";

export const incorrectOnParameterCount = createDiagnosticsFactory();

export const on_parameters_must_match: RuleFactory = factoryContext => {
    const config = getRuleConfig("on_parameters_must_match", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.OnStatement>(ast.SyntaxKind.OnStatement, (node, context) => {
            const diagnostics = [];

            for (const trigger of node.triggers) {
                if (trigger.parameterList === null) continue; // Don't check this on triggers without parameter specified

                const triggerType = context.typeChecker.typeOfNode(trigger.name);

                if (
                    triggerType.kind === TypeKind.Function &&
                    triggerType.declaration &&
                    isEvent(triggerType.declaration)
                ) {
                    const triggerParameters = trigger.parameterList?.parameters ?? [];
                    const eventParameters = triggerType.declaration.parameters;

                    const parameterCount = triggerParameters.length;
                    const expectedParameterCount = eventParameters.length;

                    if (parameterCount !== expectedParameterCount) {
                        let errorMessage = `Incorrect parameter count. Expected ${expectedParameterCount} parameter(s) but got ${parameterCount}.`;
                        if (expectedParameterCount > 0) {
                            errorMessage +=
                                "\nExpected event parameters: " +
                                eventParameters
                                    .map(p => `${nameToString(p.type.typeName)} ${nameToString(p.name)}`)
                                    .join(", ");
                        }
                        diagnostics.push(
                            incorrectOnParameterCount(
                                config.severity,
                                errorMessage,
                                context.source,
                                trigger.parameterList ? trigger.parameterList.position : trigger.name.position
                            )
                        );
                    }
                }
            }

            return diagnostics;
        });
    }
};

export default on_parameters_must_match;
